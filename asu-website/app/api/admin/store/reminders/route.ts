import { NextResponse } from "next/server";
import { compactChanges, logAdminActivity } from "@/lib/adminActivity";
import { requireEditorAccess } from "@/lib/adminAccess";
import { getPaidReminderHours, isReminderDue } from "@/lib/storeReminders";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendTreasurerPaidReminderEmail } from "@/lib/storeEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductRelation = { name?: string | null } | { name?: string | null }[] | null;

type ReminderOrder = {
  id: string;
  status: "paid" | "in_progress" | "ready_for_pickup" | "picked_up";
  status_updated_at: string | null;
  created_at: string;
  customer_name: string | null;
  customer_email: string;
  product_id: string | null;
  quantity: number;
  total_cents: number;
  size: string | null;
  color_name: string | null;
  payment_method: "venmo" | "zelle";
  payment_reference: string | null;
  last_internal_paid_reminder_at: string | null;
  internal_paid_reminder_count: number | null;
  product: ProductRelation;
};

export async function GET(request: Request) {
  const authorized = isAuthorizedCron(request);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processStoreReminders();
  return NextResponse.json(result);
}

export async function POST() {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  const result = await processStoreReminders();

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: "run_reminders",
    entityType: "store_reminders",
    summary: `ran store reminder sweep (${result.internalRemindersSent} paid reminders sent)`,
    details: {
      changes: compactChanges(
        [
          `Paid reminders sent: ${result.internalRemindersSent}`,
          `Paid orders currently due: ${result.paidOrdersDue}`,
        ],
        "Ran store reminder sweep"
      ),
      warnings: result.warnings,
    },
  });

  return NextResponse.json(result);
}

async function processStoreReminders() {
  const now = new Date();
  const paidThresholdHours = getPaidReminderHours();
  const warnings: string[] = [];

  const [{ data: settings, error: settingsError }, { data: treasurer, error: treasurerError }, { data: orders, error: ordersError }] =
    await Promise.all([
      supabaseAdmin
        .from("store_settings")
        .select("pickup_instructions")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("store_contacts")
        .select("email")
        .eq("role", "treasurer")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("orders")
        .select(
          "id,status,status_updated_at,created_at,customer_name,customer_email,product_id,quantity,total_cents,size,color_name,payment_method,payment_reference,last_internal_paid_reminder_at,internal_paid_reminder_count,product:products(name)"
        )
        .eq("status", "paid")
        .order("created_at", { ascending: true }),
    ]);

  if (settingsError) {
    console.error("Failed to load store settings for reminders", settingsError);
  }
  if (treasurerError) {
    console.error("Failed to load treasurer for reminders", treasurerError);
  }
  if (ordersError) {
    console.error("Failed to load reminder candidates", ordersError);
    return {
      internalRemindersSent: 0,
      paidOrdersDue: 0,
      warnings: ["Failed to load orders for reminders."],
    };
  }

  const pickupInstructions = settings?.pickup_instructions ?? "Pickup in ASU room.";
  const treasurerEmail = treasurer?.email?.trim() || null;
  const reminderOrders = (orders ?? []) as ReminderOrder[];

  const paidDue = reminderOrders.filter(
    (order) =>
      order.status === "paid" &&
      !order.last_internal_paid_reminder_at &&
      isReminderDue(order.status_updated_at ?? order.created_at, paidThresholdHours, now)
  );
  let internalRemindersSent = 0;
  const internalReminderOrderIds: string[] = [];

  if (!treasurerEmail && paidDue.length > 0) {
    warnings.push("Treasurer reminder email is not configured, so paid-order reminders were skipped.");
  }

  for (const order of paidDue) {
    if (!treasurerEmail) {
      break;
    }

    const productName = getProductName(order.product, order.color_name);
    const sent = await sendTreasurerPaidReminderEmail({
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
      staleHours: paidThresholdHours,
    });

    if (!sent) {
      warnings.push(`Failed to send paid reminder for order ${order.id.slice(0, 8)}.`);
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        last_internal_paid_reminder_at: now.toISOString(),
        internal_paid_reminder_count: (order.internal_paid_reminder_count ?? 0) + 1,
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to persist paid reminder metadata", updateError);
      warnings.push(`Sent paid reminder for order ${order.id.slice(0, 8)}, but reminder metadata did not save.`);
      continue;
    }

    internalRemindersSent += 1;
    internalReminderOrderIds.push(order.id);
  }

  return {
    internalRemindersSent,
    internalReminderOrderIds,
    paidOrdersDue: paidDue.length,
    warnings,
    paidThresholdHours,
  };
}

function getProductName(relation: ProductRelation, colorName: string | null) {
  const base = Array.isArray(relation) ? relation[0]?.name ?? null : relation?.name ?? null;
  const productName = base || "ASU Store Item";
  return colorName ? `${productName} (${colorName})` : productName;
}

function isAuthorizedCron(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization") || "";
  return authHeader === `Bearer ${cronSecret}`;
}
