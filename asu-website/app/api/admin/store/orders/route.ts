import { NextResponse } from "next/server";
import { compactChanges, logAdminActivity } from "@/lib/adminActivity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireEditorAccess } from "@/lib/adminAccess";
import type { OrderStatus } from "@/lib/store";
import {
  sendCustomerOrderInProgressEmail,
  sendCustomerOrderPickedUpEmail,
  sendCustomerOrderReadyForPickupEmail,
} from "@/lib/storeEmail";

const ORDER_STATUSES: OrderStatus[] = ["paid", "in_progress", "ready_for_pickup", "picked_up"];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  paid: ["in_progress"],
  in_progress: ["ready_for_pickup"],
  ready_for_pickup: ["picked_up"],
  picked_up: [],
};

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id,stripe_session_id,customer_name,customer_email,product_id,size,quantity,total_cents,payment_method,payment_reference,color_id,color_name,color_hex,status,created_at,status_updated_at,last_internal_paid_reminder_at,internal_paid_reminder_count,product:products(id,name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load orders", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}

export async function PATCH(request: Request) {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  let body: { id?: string; status?: OrderStatus };
  try {
    body = (await request.json()) as { id?: string; status?: OrderStatus };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = body.id?.trim();
  const nextStatus = body.status;

  if (!id) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  if (!nextStatus || !ORDER_STATUSES.includes(nextStatus)) {
    return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("orders")
    .select("id,status,customer_name,customer_email,quantity,total_cents,product_id,color_name,status_updated_at")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to fetch order for status update", existingError);
    return NextResponse.json({ error: "Order lookup failed" }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const currentStatus = existing.status as OrderStatus;

  if (currentStatus === nextStatus) {
    return NextResponse.json({ success: true, order: existing });
  }

  if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Invalid status transition from ${currentStatus} to ${nextStatus}` },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ status: nextStatus, status_updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,status,status_updated_at")
    .maybeSingle();

  if (updateError || !updated) {
    console.error("Failed to update order status", updateError);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }

  const [productResult, settingsResult] = await Promise.all([
    existing.product_id
      ? supabaseAdmin.from("products").select("name").eq("id", existing.product_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabaseAdmin
      .from("store_settings")
      .select("pickup_instructions")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (productResult.error) {
    console.error("Failed to load product name for order status email", productResult.error);
  }
  if (settingsResult.error) {
    console.error("Failed to load store settings for order status email", settingsResult.error);
  }

  const productName = productResult.data?.name || "ASU Store Item";
  const labeledProductName = existing.color_name
    ? `${productName} (${existing.color_name})`
    : productName;

  if (nextStatus === "in_progress") {
    await sendCustomerOrderInProgressEmail({
      to: existing.customer_email,
      orderId: existing.id,
      customerName: existing.customer_name,
      productName: labeledProductName,
      quantity: existing.quantity,
      totalCents: existing.total_cents,
    });
  }

  if (nextStatus === "ready_for_pickup") {
    await sendCustomerOrderReadyForPickupEmail({
      to: existing.customer_email,
      orderId: existing.id,
      customerName: existing.customer_name,
      productName: labeledProductName,
      quantity: existing.quantity,
      totalCents: existing.total_cents,
      pickupInstructions: settingsResult.data?.pickup_instructions ?? "Pickup in ASU room.",
    });
  }

  if (nextStatus === "picked_up") {
    await sendCustomerOrderPickedUpEmail({
      to: existing.customer_email,
      orderId: existing.id,
      customerName: existing.customer_name,
      productName: labeledProductName,
      quantity: existing.quantity,
      totalCents: existing.total_cents,
    });
  }

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: "update_status",
    entityType: "store_order",
    entityId: updated.id,
    summary: `updated store order ${updated.id.slice(0, 8)} from ${currentStatus} to ${nextStatus} for ${existing.customer_email}`,
    details: {
      changes: compactChanges(
        [`Status: ${currentStatus} -> ${nextStatus}`],
        "Store order status updated"
      ),
      customer_email: existing.customer_email,
      previous_status: currentStatus,
      next_status: nextStatus,
      status_updated_at: updated.status_updated_at,
    },
  });

  return NextResponse.json({ success: true, order: updated });
}

export async function DELETE(request: Request) {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  let body: { id?: string; confirm_delete?: boolean };
  try {
    body = (await request.json()) as { id?: string; confirm_delete?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  if (body.confirm_delete !== true) {
    return NextResponse.json(
      { error: "Delete confirmation is required" },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("orders")
    .select("id,customer_email,status")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to load order before delete", existingError);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from("orders").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete order", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: "delete",
    entityType: "store_order",
    entityId: id,
    summary: `deleted store order ${id.slice(0, 8)}${existing?.customer_email ? ` for ${existing.customer_email}` : ""}`,
    details: {
      changes: compactChanges(
        existing ? [`Deleted order in ${existing.status} status`] : [],
        "Deleted store order"
      ),
      customer_email: existing?.customer_email ?? null,
      status: existing?.status ?? null,
    },
  });

  return NextResponse.json({ success: true, id });
}
