import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { compactChanges, diffFieldChanges, logAdminActivity } from "@/lib/adminActivity";
import { formatUsdFromCents } from "@/lib/store";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireEditorAccess } from "@/lib/adminAccess";

type ProductColorPayload = {
  name?: string;
  hex_color?: string;
  preview_image_url?: string | null;
  is_active?: boolean;
};

type ProductPayload = {
  id?: string;
  name?: string;
  description?: string | null;
  price_cents?: number;
  image_url?: string | null;
  image_urls?: string[];
  thumbnail_index?: number;
  colors?: ProductColorPayload[];
  is_active?: boolean;
};

type ProductRecord = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  stripe_price_id: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

type ProductImageRecord = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number | null;
  is_thumbnail: boolean | null;
  created_at: string;
};

type ProductColorRecord = {
  id: string;
  product_id: string;
  name: string;
  hex_color: string;
  preview_image_url: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
};

type NormalizedColor = {
  name: string;
  hex_color: string;
  preview_image_url: string | null;
  is_active: boolean;
};

type ProductWithDetails = ProductRecord & {
  images: ProductImageRecord[];
  colors: ProductColorRecord[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id,name,description,price_cents,stripe_price_id,image_url,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load products", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  const baseProducts = (data ?? []) as ProductRecord[];
  const products = await hydrateProductsWithDetails(baseProducts);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  let body: ProductPayload;
  try {
    body = (await request.json()) as ProductPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const description = normalizeOptionalText(body.description);
  const priceCents = Number(body.price_cents);
  const isActive = typeof body.is_active === "boolean" ? body.is_active : true;

  if (!name) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }
  if (!Number.isInteger(priceCents) || priceCents < 1) {
    return NextResponse.json({ error: "price_cents must be a positive integer" }, { status: 400 });
  }

  const { imageUrls, thumbnailIndex } = normalizeIncomingImages(body);
  const colors = normalizeIncomingColors(body.colors);
  const thumbnailUrl = imageUrls.length > 0 ? imageUrls[thumbnailIndex] ?? imageUrls[0] : null;

  let product: ProductRecord | null = null;
  let existingProductForLog: ProductRecord | null = null;

  if (body.id) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("products")
      .select("id,name,description,price_cents,stripe_price_id,image_url,is_active,created_at")
      .eq("id", body.id)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to find product for update", existingError);
      return NextResponse.json({ error: "Product lookup failed" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    existingProductForLog = existing as ProductRecord;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        name,
        description,
        price_cents: priceCents,
        stripe_price_id: existing.stripe_price_id || `manual_price_${randomUUID()}`,
        image_url: thumbnailUrl,
        is_active: isActive,
      })
      .eq("id", body.id)
      .select("id,name,description,price_cents,stripe_price_id,image_url,is_active,created_at")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Failed to update product", updateError);
      return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
    }

    product = updated as ProductRecord;
  } else {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        description,
        price_cents: priceCents,
        stripe_price_id: `manual_price_${randomUUID()}`,
        image_url: thumbnailUrl,
        is_active: isActive,
      })
      .select("id,name,description,price_cents,stripe_price_id,image_url,is_active,created_at")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to create product", insertError);
      return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
    }

    product = inserted as ProductRecord;
  }

  const imageSyncResult = await syncProductImages(product.id, imageUrls, thumbnailIndex);
  if (imageSyncResult.error) {
    return NextResponse.json({ error: imageSyncResult.error }, { status: 500 });
  }

  const colorSyncResult = await syncProductColors(product.id, colors);
  if (colorSyncResult.error) {
    return NextResponse.json({ error: colorSyncResult.error }, { status: 500 });
  }

  const hydrated = await hydrateProductsWithDetails([product]);
  const responseProduct = hydrated[0] ?? withLegacyFallback(product);

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: body.id ? "update" : "create",
    entityType: "store_product",
    entityId: responseProduct.id,
    summary: `${body.id ? "updated" : "created"} store product ${responseProduct.name}`,
    details: {
      changes: compactChanges(
        diffFieldChanges([
          { label: "Name", before: existingProductForLog?.name ?? null, after: responseProduct.name },
          { label: "Description", before: existingProductForLog?.description ?? null, after: responseProduct.description },
          {
            label: "Price",
            before: existingProductForLog?.price_cents ?? null,
            after: responseProduct.price_cents,
            format: (value) => (typeof value === "number" ? formatUsdFromCents(value) : "none"),
          },
          { label: "Active", before: existingProductForLog?.is_active ?? null, after: responseProduct.is_active },
          {
            label: "Images",
            before: existingProductForLog?.image_url ? "configured" : "none",
            after: responseProduct.images.length > 0 ? `${responseProduct.images.length} configured` : "none",
          },
          {
            label: "Colors",
            before: null,
            after: responseProduct.colors.length > 0 ? `${responseProduct.colors.length} configured` : "none",
          },
        ]),
        `${body.id ? "Updated" : "Created"} store product`
      ),
    },
  });

  return NextResponse.json({ success: true, product: responseProduct });
}

export async function DELETE(request: Request) {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Product id is required" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("id,name,is_active")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete product", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: "delete",
    entityType: "store_product",
    entityId: id,
    summary: `deleted store product ${existing?.name ?? id.slice(0, 8)}`,
    details: {
      changes: compactChanges(
        existing ? [`Deleted product "${existing.name}"`] : [],
        "Deleted store product"
      ),
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  let body: { id?: string; is_active?: boolean };
  try {
    body = (await request.json()) as { id?: string; is_active?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Product id is required" }, { status: 400 });
  }

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("products")
    .update({ is_active: body.is_active })
    .eq("id", id)
    .select("id,name,description,price_cents,stripe_price_id,image_url,is_active,created_at")
    .maybeSingle();

  if (error || !updated) {
    console.error("Failed to update product status", error);
    return NextResponse.json({ error: "Failed to update product status" }, { status: 500 });
  }

  const hydrated = await hydrateProductsWithDetails([updated as ProductRecord]);
  const responseProduct = hydrated[0] ?? withLegacyFallback(updated as ProductRecord);

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: body.is_active ? "restore" : "archive",
    entityType: "store_product",
    entityId: responseProduct.id,
    summary: `${body.is_active ? "restored" : "archived"} store product ${responseProduct.name}`,
    details: {
      changes: compactChanges([`Active: ${body.is_active ? "no -> yes" : "yes -> no"}`], "Updated product active status"),
    },
  });

  return NextResponse.json({ success: true, product: responseProduct });
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeHexColor(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}

function normalizeIncomingImages(body: ProductPayload) {
  const imageUrls = Array.isArray(body.image_urls)
    ? body.image_urls
        .map((value) => normalizeImageUrl(value))
        .filter((value): value is string => Boolean(value))
    : [];

  if (imageUrls.length === 0) {
    const legacy = normalizeImageUrl(body.image_url);
    if (legacy) imageUrls.push(legacy);
  }

  const uniqueUrls: string[] = [];
  const seen = new Set<string>();
  for (const value of imageUrls) {
    if (seen.has(value)) continue;
    seen.add(value);
    uniqueUrls.push(value);
  }

  const requestedThumb = Number(body.thumbnail_index);
  const thumbnailIndex =
    Number.isInteger(requestedThumb) && requestedThumb >= 0 && requestedThumb < uniqueUrls.length
      ? requestedThumb
      : 0;

  return { imageUrls: uniqueUrls, thumbnailIndex };
}

function normalizeIncomingColors(payload: ProductColorPayload[] | undefined): NormalizedColor[] {
  if (!Array.isArray(payload) || payload.length === 0) {
    return [];
  }

  const next: NormalizedColor[] = [];
  const seen = new Set<string>();

  for (const color of payload) {
    const name = color.name?.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    const hex = normalizeHexColor(color.hex_color) ?? "#FFFFFF";
    const preview = normalizeImageUrl(color.preview_image_url);

    seen.add(key);
    next.push({
      name: name.slice(0, 40),
      hex_color: hex,
      preview_image_url: preview,
      is_active: color.is_active !== false,
    });
  }

  return next;
}

function isMissingTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === "42P01" || candidate.message?.toLowerCase().includes(tableName.toLowerCase()) === true;
}

function withLegacyFallback(product: ProductRecord): ProductWithDetails {
  const fallbackImages: ProductImageRecord[] = product.image_url
    ? [
        {
          id: `legacy-${product.id}`,
          product_id: product.id,
          image_url: product.image_url,
          sort_order: 0,
          is_thumbnail: true,
          created_at: product.created_at,
        },
      ]
    : [];

  return {
    ...product,
    images: fallbackImages,
    colors: [],
  };
}

async function hydrateProductsWithDetails(products: ProductRecord[]): Promise<ProductWithDetails[]> {
  if (products.length === 0) return [];

  const productIds = products.map((product) => product.id);

  const [imagesResult, colorsResult] = await Promise.all([
    supabaseAdmin
      .from("store_product_images")
      .select("id,product_id,image_url,sort_order,is_thumbnail,created_at")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("product_colors")
      .select("id,product_id,name,hex_color,preview_image_url,is_active,sort_order,created_at")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const imagesByProductId = new Map<string, ProductImageRecord[]>();
  if (imagesResult.error) {
    if (!isMissingTableError(imagesResult.error, "store_product_images")) {
      console.error("Failed to load product images", imagesResult.error);
    }
  } else {
    for (const row of (imagesResult.data ?? []) as ProductImageRecord[]) {
      const existing = imagesByProductId.get(row.product_id) ?? [];
      existing.push(row);
      imagesByProductId.set(row.product_id, existing);
    }
  }

  const colorsByProductId = new Map<string, ProductColorRecord[]>();
  if (colorsResult.error) {
    if (!isMissingTableError(colorsResult.error, "product_colors")) {
      console.error("Failed to load product colors", colorsResult.error);
    }
  } else {
    for (const row of (colorsResult.data ?? []) as ProductColorRecord[]) {
      const existing = colorsByProductId.get(row.product_id) ?? [];
      existing.push(row);
      colorsByProductId.set(row.product_id, existing);
    }
  }

  return products.map((product) => {
    const fallback = withLegacyFallback(product);
    const images = imagesByProductId.get(product.id) ?? fallback.images;
    const colors = colorsByProductId.get(product.id) ?? [];

    return {
      ...product,
      images,
      colors,
    };
  });
}

async function syncProductImages(productId: string, imageUrls: string[], thumbnailIndex: number) {
  const { error: deleteError } = await supabaseAdmin
    .from("store_product_images")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    if (isMissingTableError(deleteError, "store_product_images")) {
      return { ok: true };
    }
    console.error("Failed to clear product images", deleteError);
    return { ok: false, error: "Failed to update product images" };
  }

  if (imageUrls.length === 0) {
    return { ok: true };
  }

  const rows = imageUrls.map((imageUrl, index) => ({
    product_id: productId,
    image_url: imageUrl,
    sort_order: index,
    is_thumbnail: index === thumbnailIndex,
  }));

  const { error: insertError } = await supabaseAdmin.from("store_product_images").insert(rows);
  if (insertError) {
    if (isMissingTableError(insertError, "store_product_images")) {
      return { ok: true };
    }
    console.error("Failed to insert product images", insertError);
    return { ok: false, error: "Failed to update product images" };
  }

  return { ok: true };
}

async function syncProductColors(productId: string, colors: NormalizedColor[]) {
  const { error: deleteError } = await supabaseAdmin
    .from("product_colors")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    if (isMissingTableError(deleteError, "product_colors")) {
      return { ok: true };
    }
    console.error("Failed to clear product colors", deleteError);
    return { ok: false, error: "Failed to update product colors" };
  }

  if (colors.length === 0) {
    return { ok: true };
  }

  const rows = colors.map((color, index) => ({
    product_id: productId,
    name: color.name,
    hex_color: color.hex_color,
    preview_image_url: color.preview_image_url,
    is_active: color.is_active,
    sort_order: index,
  }));

  const { error: insertError } = await supabaseAdmin.from("product_colors").insert(rows);
  if (insertError) {
    if (isMissingTableError(insertError, "product_colors")) {
      return { ok: true };
    }
    console.error("Failed to insert product colors", insertError);
    return { ok: false, error: "Failed to update product colors" };
  }

  return { ok: true };
}
