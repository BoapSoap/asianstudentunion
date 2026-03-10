import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeQuantity, type StorePaymentMethod } from "@/lib/store";
import { sendCustomerOrderPaidEmail, sendTreasurerOrderEmail } from "@/lib/storeEmail";
const DEFAULT_PICKUP_INSTRUCTIONS = "Pickup in ASU room.";

type CheckoutItemPayload = {
  product_id?: string;
  quantity?: number;
  size?: string | null;
  color_id?: string | null;
};

type CreateOrderPayload = {
  customer_name?: string;
  customer_email?: string;
  payment_method?: StorePaymentMethod;
  payment_reference?: string | null;
  items?: CheckoutItemPayload[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: CreateOrderPayload;
  try {
    body = (await request.json()) as CreateOrderPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const customerName = normalizeCustomerName(body.customer_name);
  const customerEmail = normalizeEmail(body.customer_email);
  const paymentReference = normalizePaymentMessage(body.payment_reference);
  const paymentMethod = body.payment_method;

  if (!customerName) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  if (!customerEmail) {
    return NextResponse.json({ error: "Personal email is required" }, { status: 400 });
  }

  if (paymentMethod !== "venmo" && paymentMethod !== "zelle") {
    return NextResponse.json({ error: "Valid payment method is required" }, { status: 400 });
  }

  if (!paymentReference) {
    return NextResponse.json(
      {
        error:
          "Payment message is required. Example: First Last - Purchase reason (for example Jane Doe - Spring Gala Ticket).",
      },
      { status: 400 }
    );
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  if (rawItems.length > 50) {
    return NextResponse.json({ error: "Too many cart items" }, { status: 400 });
  }

  const parsedItems = rawItems
    .map((item) => {
      const productId = typeof item.product_id === "string" ? item.product_id.trim() : "";
      const quantity = sanitizeQuantity(item.quantity);
      const size = normalizeSize(item.size);
      const colorId = typeof item.color_id === "string" ? item.color_id.trim() : null;

      if (!productId || !quantity) {
        return null;
      }

      return {
        productId,
        quantity,
        size,
        colorId: colorId || null,
      };
    })
    .filter(
      (item): item is { productId: string; quantity: number; size: string | null; colorId: string | null } =>
        Boolean(item)
    );

  if (parsedItems.length === 0) {
    return NextResponse.json({ error: "Cart items are invalid" }, { status: 400 });
  }

  const mergedByKey = new Map<
    string,
    { productId: string; quantity: number; size: string | null; colorId: string | null }
  >();
  for (const item of parsedItems) {
    const key = `${item.productId}::${item.size || ""}::${item.colorId || ""}`;
    const existing = mergedByKey.get(key);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + item.quantity);
      continue;
    }
    mergedByKey.set(key, { ...item });
  }

  const items = Array.from(mergedByKey.values());

  for (const item of items) {
    if (item.colorId && !isUuid(item.colorId)) {
      return NextResponse.json({ error: "Invalid color selection" }, { status: 400 });
    }
  }

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("store_settings")
    .select("is_enabled,pickup_instructions,venmo_username,zelle_handle")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (settingsError) {
    console.error("Failed to load store settings for manual checkout", settingsError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  if (!settings?.is_enabled) {
    return NextResponse.json({ error: "Store is currently closed" }, { status: 403 });
  }

  if (paymentMethod === "venmo" && !settings.venmo_username?.trim()) {
    return NextResponse.json({ error: "Venmo is currently unavailable" }, { status: 400 });
  }

  if (paymentMethod === "zelle" && !settings.zelle_handle?.trim()) {
    return NextResponse.json({ error: "Zelle is currently unavailable" }, { status: 400 });
  }

  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const colorIds = Array.from(
    new Set(items.map((item) => item.colorId).filter((value): value is string => Boolean(value)))
  );

  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id,name,price_cents,is_active")
    .in("id", productIds);

  if (productsError) {
    console.error("Failed to load products for manual checkout", productsError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const productById = new Map((products ?? []).map((product) => [product.id, product]));

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || !product.is_active) {
      return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 });
    }
  }

  const { data: colorRows, error: colorsError } =
    colorIds.length === 0
      ? { data: [], error: null }
      : await supabaseAdmin
          .from("product_colors")
          .select("id,product_id,name,hex_color,is_active")
          .in("id", colorIds);

  if (colorsError) {
    console.error("Failed to load product colors for manual checkout", colorsError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const colorById = new Map((colorRows ?? []).map((color) => [color.id, color]));

  for (const item of items) {
    if (!item.colorId) continue;
    const color = colorById.get(item.colorId);
    if (!color || color.product_id !== item.productId || color.is_active !== true) {
      return NextResponse.json({ error: "Selected color is unavailable for one or more items" }, { status: 400 });
    }
  }

  const ordersToInsert = items.map((item) => {
    const product = productById.get(item.productId)!;
    const color = item.colorId ? colorById.get(item.colorId) : null;

    return {
      stripe_session_id: `manual_${randomUUID()}`,
      customer_name: customerName,
      customer_email: customerEmail,
      product_id: item.productId,
      size: item.size,
      color_id: color?.id ?? null,
      color_name: color?.name ?? null,
      color_hex: color?.hex_color ?? null,
      quantity: item.quantity,
      total_cents: product.price_cents * item.quantity,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      status: "paid" as const,
    };
  });

  const { data: insertedOrders, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert(ordersToInsert)
    .select(
      "id,product_id,size,color_id,color_name,color_hex,quantity,total_cents,customer_name,customer_email,payment_method,payment_reference"
    );

  if (insertError || !insertedOrders) {
    console.error("Failed to insert manual store orders", insertError);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }

  const { data: treasurerResult, error: treasurerError } = await supabaseAdmin
    .from("store_contacts")
    .select("email")
    .eq("role", "treasurer")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (treasurerError) {
    console.error("Failed to load treasurer contact for manual checkout", treasurerError);
  }

  const pickupInstructions = settings.pickup_instructions?.trim() || DEFAULT_PICKUP_INSTRUCTIONS;
  const treasurerEmail = treasurerResult?.email ?? null;

  await Promise.all(
    insertedOrders.map(async (order) => {
      const productName = productById.get(order.product_id || "")?.name || "ASU Store Item";
      const labeledProductName = order.color_name ? `${productName} (${order.color_name})` : productName;

      try {
        const sentCustomerEmail = await sendCustomerOrderPaidEmail({
          to: order.customer_email,
          orderId: order.id,
          productName: labeledProductName,
          quantity: order.quantity,
          customerName: order.customer_name,
          totalCents: order.total_cents,
        });
        if (!sentCustomerEmail) {
          console.warn("Customer order received email was not sent", { orderId: order.id, customerEmail: order.customer_email });
        }
      } catch (error) {
        console.error("Failed sending customer order received email", { orderId: order.id, error });
      }

      if (treasurerEmail) {
        try {
          const sentTreasurerEmail = await sendTreasurerOrderEmail({
            to: treasurerEmail,
            orderId: order.id,
            productName,
            size: order.size,
            colorName: order.color_name,
            quantity: order.quantity,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            totalCents: order.total_cents,
            paymentMethod: order.payment_method,
            paymentReference: order.payment_reference,
            pickupInstructions,
          });
          if (!sentTreasurerEmail) {
            console.warn("Treasurer order email was not sent", { orderId: order.id, treasurerEmail });
          }
        } catch (error) {
          console.error("Failed sending treasurer order email", { orderId: order.id, error });
        }
      }
    })
  );

  return NextResponse.json({
    success: true,
    orders: insertedOrders,
  });
}

function normalizeCustomerName(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (trimmed.length < 3) return null;
  return trimmed.slice(0, 120);
}

function normalizePaymentMessage(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (trimmed.length < 6) return null;
  return trimmed.slice(0, 180);
}

function normalizeEmail(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function normalizeSize(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 24);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
