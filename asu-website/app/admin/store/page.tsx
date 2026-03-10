import { redirect } from "next/navigation";
import { AdminInfoCard, AdminSectionShell } from "@/components/admin/AdminSectionShell";
import StoreAdminPanel from "@/components/admin/StoreAdminPanel";
import { getCurrentProfile } from "@/lib/getCurrentProfile";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type StoreSettings = {
  id: string;
  is_enabled: boolean;
  store_banner_message: string | null;
  pickup_instructions: string | null;
  venmo_username: string | null;
  venmo_qr_image_url: string | null;
  zelle_handle: string | null;
  zelle_display_name: string | null;
  updated_at: string;
};

type StoreContact = {
  id: string;
  role: string;
  name: string;
  email: string;
  is_active: boolean;
  updated_at: string;
};

type StoreProduct = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  stripe_price_id: string;
  image_url: string | null;
  images: StoreProductImage[];
  colors: StoreProductColor[];
  is_active: boolean;
  created_at: string;
};

type StoreProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number | null;
  is_thumbnail: boolean | null;
  created_at: string;
};

type StoreProductColor = {
  id: string;
  product_id: string;
  name: string;
  hex_color: string;
  preview_image_url: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
};

type OrderWithProduct = {
  id: string;
  stripe_session_id: string;
  customer_name: string | null;
  customer_email: string;
  product_id: string | null;
  size: string | null;
  quantity: number;
  total_cents: number;
  payment_method: "venmo" | "zelle";
  payment_reference: string | null;
  color_id: string | null;
  color_name: string | null;
  color_hex: string | null;
  status: "paid" | "in_progress" | "ready_for_pickup" | "picked_up";
  created_at: string;
  status_updated_at: string | null;
  last_internal_paid_reminder_at: string | null;
  internal_paid_reminder_count: number | null;
  product_name: string | null;
};

type ProductRelation = { id: string; name: string } | { id: string; name: string }[] | null;

export default async function AdminStorePage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/adminlogin");
  }

  if (!profile) {
    return (
      <AdminSectionShell title="Store Management" description="Configure ASU merch preorders and fulfillment workflow." role="viewer">
        <AdminInfoCard
          variant="error"
          title="Profile not found"
          body="Could not load your profile. Please sign out and back in, or contact the site admin."
        />
      </AdminSectionShell>
    );
  }

  if (profile.role === "viewer") {
    return (
      <AdminSectionShell title="Store Management" description="Configure ASU merch preorders and fulfillment workflow." role={profile.role}>
        <AdminInfoCard
          variant="warning"
          title="Pending approval"
          body="Your account is logged in but not approved yet. Please contact the ASU president or web admin."
        />
      </AdminSectionShell>
    );
  }

  const canManageOrders = profile.role === "admin" || profile.role === "owner";

  const [settingsResult, contactsResult, productsResult, ordersResult] = await Promise.all([
    supabaseAdmin
      .from("store_settings")
      .select(
        "id,is_enabled,store_banner_message,pickup_instructions,venmo_username,venmo_qr_image_url,zelle_handle,zelle_display_name,updated_at"
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("store_contacts")
      .select("id,role,name,email,is_active,updated_at")
      .eq("role", "treasurer")
      .order("is_active", { ascending: false })
      .order("updated_at", { ascending: false }),
    supabaseAdmin
      .from("products")
      .select("id,name,description,price_cents,stripe_price_id,image_url,is_active,created_at")
      .order("created_at", { ascending: false }),
    canManageOrders
      ? supabaseAdmin
          .from("orders")
          .select(
            "id,stripe_session_id,customer_name,customer_email,product_id,size,quantity,total_cents,payment_method,payment_reference,color_id,color_name,color_hex,status,created_at,status_updated_at,last_internal_paid_reminder_at,internal_paid_reminder_count,product:products(id,name)"
          )
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as OrderWithProduct[], error: null }),
  ]);

  if (settingsResult.error) console.error("Failed to load store settings", settingsResult.error);
  if (contactsResult.error) console.error("Failed to load store contacts", contactsResult.error);
  if (productsResult.error) console.error("Failed to load store products", productsResult.error);
  if (ordersResult.error) console.error("Failed to load store orders", ordersResult.error);

  const settings = (settingsResult.data as StoreSettings | null) ?? null;
  const contacts = (contactsResult.data as StoreContact[] | null) ?? [];
  const baseProducts = ((productsResult.data as Omit<StoreProduct, "images" | "colors">[] | null) ?? []);
  const productIds = baseProducts.map((product) => product.id);

  const [{ data: productImagesData, error: productImagesError }, { data: productColorsData, error: productColorsError }] =
    await Promise.all([
      productIds.length === 0
        ? Promise.resolve({ data: [] as StoreProductImage[], error: null })
        : supabaseAdmin
            .from("store_product_images")
            .select("id,product_id,image_url,sort_order,is_thumbnail,created_at")
            .in("product_id", productIds)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
      productIds.length === 0
        ? Promise.resolve({ data: [] as StoreProductColor[], error: null })
        : supabaseAdmin
            .from("product_colors")
            .select("id,product_id,name,hex_color,preview_image_url,is_active,sort_order,created_at")
            .in("product_id", productIds)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
    ]);

  const missingImagesTable =
    productImagesError?.code === "42P01" ||
    String(productImagesError?.message || "").toLowerCase().includes("store_product_images");

  if (productImagesError && !missingImagesTable) {
    console.error("Failed to load store product images", productImagesError);
  }

  const missingColorsTable =
    productColorsError?.code === "42P01" ||
    String(productColorsError?.message || "").toLowerCase().includes("product_colors");

  if (productColorsError && !missingColorsTable) {
    console.error("Failed to load store product colors", productColorsError);
  }

  const imagesByProduct = new Map<string, StoreProductImage[]>();
  for (const image of (productImagesData ?? []) as StoreProductImage[]) {
    const existing = imagesByProduct.get(image.product_id) ?? [];
    existing.push(image);
    imagesByProduct.set(image.product_id, existing);
  }

  const colorsByProduct = new Map<string, StoreProductColor[]>();
  for (const color of (productColorsData ?? []) as StoreProductColor[]) {
    const existing = colorsByProduct.get(color.product_id) ?? [];
    existing.push(color);
    colorsByProduct.set(color.product_id, existing);
  }

  const products: StoreProduct[] = baseProducts.map((product) => {
    const images = imagesByProduct.get(product.id) ?? [];
    const colors = colorsByProduct.get(product.id) ?? [];
    if (images.length > 0) {
      return { ...product, images, colors };
    }

    if (!product.image_url) {
      return { ...product, images: [], colors };
    }

    return {
      ...product,
      colors,
      images: [
        {
          id: `legacy-${product.id}`,
          product_id: product.id,
          image_url: product.image_url,
          sort_order: 0,
          is_thumbnail: true,
          created_at: product.created_at,
        },
      ],
    };
  });

  const orders: OrderWithProduct[] = ((ordersResult.data ?? []) as Array<
    Omit<OrderWithProduct, "product_name"> & { product: ProductRelation }
  >).map((order) => {
    const relation = order.product;
    const productName = Array.isArray(relation) ? relation[0]?.name ?? null : relation?.name ?? null;

    return {
      id: order.id,
      stripe_session_id: order.stripe_session_id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      product_id: order.product_id,
      size: order.size,
      quantity: order.quantity,
      total_cents: order.total_cents,
      payment_method: order.payment_method,
      payment_reference: order.payment_reference,
      color_id: order.color_id,
      color_name: order.color_name,
      color_hex: order.color_hex,
      status: order.status,
      created_at: order.created_at,
      status_updated_at: order.status_updated_at,
      last_internal_paid_reminder_at: order.last_internal_paid_reminder_at,
      internal_paid_reminder_count: order.internal_paid_reminder_count,
      product_name: productName,
    };
  });

  return (
    <AdminSectionShell
      title="Store Management"
      description="Control storefront visibility, products, contacts, and preorder fulfillment statuses."
      role={profile.role}
      eyebrow="Admin"
      backHref="/admin"
      backLabel="Back to Dashboard"
    >
      <StoreAdminPanel
        settings={settings}
        contacts={contacts}
        products={products}
        orders={orders}
        viewerRole={profile.role}
      />
    </AdminSectionShell>
  );
}
