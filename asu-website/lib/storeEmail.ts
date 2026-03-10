import { formatUsdFromCents } from "@/lib/store";

type StoreOrderEmailInput = {
  to: string;
  orderId: string;
  productName: string;
  size?: string | null;
  colorName?: string | null;
  quantity: number;
  customerName: string | null;
  customerEmail: string;
  totalCents: number;
  paymentMethod?: "venmo" | "zelle";
  paymentReference?: string | null;
  pickupInstructions: string | null;
};

type CustomerOrderEmailInput = {
  to: string;
  orderId: string;
  productName: string;
  quantity: number;
  customerName: string | null;
  totalCents: number;
  pickupInstructions?: string | null;
};

export async function sendTreasurerOrderEmail(input: StoreOrderEmailInput) {
  const customerName = input.customerName?.trim() || "N/A";
  const total = formatUsdFromCents(input.totalCents);
  const pickup = input.pickupInstructions?.trim() || "No pickup instructions configured.";
  const paymentMethod = input.paymentMethod === "zelle" ? "Zelle" : "Venmo";
  const paymentReference = input.paymentReference?.trim() || "No reference provided";
  const size = input.size?.trim() || "N/A";
  const colorName = input.colorName?.trim() || "N/A";

  const subject = `New ASU Store Order ${input.orderId.slice(0, 8)}`;
  const text = [
    "A new ASU order has been submitted and is awaiting payment verification.",
    "",
    `Order ID: ${input.orderId}`,
    `Product: ${input.productName}`,
    `Size: ${size}`,
    `Color: ${colorName}`,
    `Quantity: ${input.quantity}`,
    `Total: ${total}`,
    `Payment Method: ${paymentMethod}`,
    `Payment Reference: ${paymentReference}`,
    `Customer Name: ${customerName}`,
    `Customer Email: ${input.customerEmail}`,
    "",
    "Pickup Instructions:",
    pickup,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">New ASU store order awaiting verification</h2>
      <p style="margin:0 0 12px"><strong>Order ID:</strong> ${escapeHtml(input.orderId)}</p>
      <ul style="padding-left:18px;margin:0 0 14px">
        <li><strong>Product:</strong> ${escapeHtml(input.productName)}</li>
        <li><strong>Size:</strong> ${escapeHtml(size)}</li>
        <li><strong>Color:</strong> ${escapeHtml(colorName)}</li>
        <li><strong>Quantity:</strong> ${input.quantity}</li>
        <li><strong>Total:</strong> ${escapeHtml(total)}</li>
        <li><strong>Payment Method:</strong> ${escapeHtml(paymentMethod)}</li>
        <li><strong>Payment Reference:</strong> ${escapeHtml(paymentReference)}</li>
        <li><strong>Customer Name:</strong> ${escapeHtml(customerName)}</li>
        <li><strong>Customer Email:</strong> ${escapeHtml(input.customerEmail)}</li>
      </ul>
      <p style="margin:0 0 6px"><strong>Pickup Instructions:</strong></p>
      <p style="margin:0">${escapeHtml(pickup).replace(/\n/g, "<br />")}</p>
    </div>
  `;

  return sendResendEmail({ to: input.to, subject, text, html, tag: "treasurer_paid" });
}

export async function sendCustomerOrderPaidEmail(input: CustomerOrderEmailInput) {
  const customerName = input.customerName?.trim() || "there";
  const total = formatUsdFromCents(input.totalCents);

  const subject = "ASU Store order received (payment pending verification)";
  const text = [
    `Hi ${customerName},`,
    "",
    "Thanks for your ASU Store order. We received your order request.",
    "Your payment will be verified by the treasurer shortly.",
    "",
    `Order ID: ${input.orderId}`,
    `Product: ${input.productName}`,
    `Quantity: ${input.quantity}`,
    `Total: ${total}`,
    "",
    "We will email you again when your order is being prepared and when it is ready for pickup.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <p>Hi ${escapeHtml(customerName)},</p>
      <p>Thanks for your ASU Store order. We received your order request and your payment will be verified by the treasurer.</p>
      <ul style="padding-left:18px;margin:0 0 14px">
        <li><strong>Order ID:</strong> ${escapeHtml(input.orderId)}</li>
        <li><strong>Product:</strong> ${escapeHtml(input.productName)}</li>
        <li><strong>Quantity:</strong> ${input.quantity}</li>
        <li><strong>Total:</strong> ${escapeHtml(total)}</li>
      </ul>
      <p>We will email you again when your order is being prepared and when it is ready for pickup.</p>
    </div>
  `;

  return sendResendEmail({ to: input.to, subject, text, html, tag: "customer_paid" });
}

export async function sendCustomerOrderInProgressEmail(input: CustomerOrderEmailInput) {
  const customerName = input.customerName?.trim() || "there";

  const subject = "ASU Store order update: payment verified";
  const text = [
    `Hi ${customerName},`,
    "",
    "Your payment has been verified.",
    "Your ASU Store order is now in progress.",
    "",
    `Order ID: ${input.orderId}`,
    `Product: ${input.productName}`,
    `Quantity: ${input.quantity}`,
    "",
    "We will send one more email when your order is ready for pickup in the ASU room.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <p>Hi ${escapeHtml(customerName)},</p>
      <p>Your payment has been verified and your ASU Store order is now <strong>in progress</strong>.</p>
      <ul style="padding-left:18px;margin:0 0 14px">
        <li><strong>Order ID:</strong> ${escapeHtml(input.orderId)}</li>
        <li><strong>Product:</strong> ${escapeHtml(input.productName)}</li>
        <li><strong>Quantity:</strong> ${input.quantity}</li>
      </ul>
      <p>We will send one more email when your order is ready for pickup in the ASU room.</p>
    </div>
  `;

  return sendResendEmail({ to: input.to, subject, text, html, tag: "customer_in_progress" });
}

export async function sendCustomerOrderReadyForPickupEmail(input: CustomerOrderEmailInput) {
  const customerName = input.customerName?.trim() || "there";
  const pickupText = input.pickupInstructions?.trim() || "Your order is ready for pickup in the ASU room.";

  const subject = "ASU Store order ready for pickup";
  const text = [
    `Hi ${customerName},`,
    "",
    "Your ASU Store order is ready for pickup.",
    "",
    `Order ID: ${input.orderId}`,
    `Product: ${input.productName}`,
    `Quantity: ${input.quantity}`,
    "",
    "Pickup details:",
    pickupText,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <p>Hi ${escapeHtml(customerName)},</p>
      <p>Your ASU Store order is now <strong>ready for pickup</strong>.</p>
      <ul style="padding-left:18px;margin:0 0 14px">
        <li><strong>Order ID:</strong> ${escapeHtml(input.orderId)}</li>
        <li><strong>Product:</strong> ${escapeHtml(input.productName)}</li>
        <li><strong>Quantity:</strong> ${input.quantity}</li>
      </ul>
      <p><strong>Pickup details:</strong><br/>${escapeHtml(pickupText).replace(/\n/g, "<br />")}</p>
    </div>
  `;

  return sendResendEmail({ to: input.to, subject, text, html, tag: "customer_ready_for_pickup" });
}

export async function sendCustomerOrderPickedUpEmail(input: CustomerOrderEmailInput) {
  const customerName = input.customerName?.trim() || "there";

  const subject = "ASU Store order pickup confirmed";
  const text = [
    `Hi ${customerName},`,
    "",
    "Your ASU Store order has been marked as picked up.",
    "",
    `Order ID: ${input.orderId}`,
    `Product: ${input.productName}`,
    `Quantity: ${input.quantity}`,
    "",
    "Thank you for supporting ASU.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <p>Hi ${escapeHtml(customerName)},</p>
      <p>Your ASU Store order has been marked as <strong>picked up</strong>.</p>
      <ul style="padding-left:18px;margin:0 0 14px">
        <li><strong>Order ID:</strong> ${escapeHtml(input.orderId)}</li>
        <li><strong>Product:</strong> ${escapeHtml(input.productName)}</li>
        <li><strong>Quantity:</strong> ${input.quantity}</li>
      </ul>
      <p>Thank you for supporting ASU.</p>
    </div>
  `;

  return sendResendEmail({ to: input.to, subject, text, html, tag: "customer_picked_up" });
}

export async function sendTreasurerPaidReminderEmail(
  input: StoreOrderEmailInput & { staleHours: number }
) {
  const customerName = input.customerName?.trim() || "N/A";
  const total = formatUsdFromCents(input.totalCents);
  const paymentMethod = input.paymentMethod === "zelle" ? "Zelle" : "Venmo";
  const paymentReference = input.paymentReference?.trim() || "No reference provided";
  const size = input.size?.trim() || "N/A";
  const colorName = input.colorName?.trim() || "N/A";

  const subject = `Reminder: ASU store order still marked paid (${input.orderId.slice(0, 8)})`;
  const text = [
    "Reminder: an ASU store order has been sitting in paid status and still needs fulfillment review.",
    "",
    `Order ID: ${input.orderId}`,
    `Product: ${input.productName}`,
    `Size: ${size}`,
    `Color: ${colorName}`,
    `Quantity: ${input.quantity}`,
    `Total: ${total}`,
    `Payment Method: ${paymentMethod}`,
    `Payment Reference: ${paymentReference}`,
    `Customer Name: ${customerName}`,
    `Customer Email: ${input.customerEmail}`,
    `Paid age: ${input.staleHours} hours`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">Store reminder: order still marked paid</h2>
      <p style="margin:0 0 12px">This order has been sitting in <strong>paid</strong> for ${input.staleHours} hours.</p>
      <ul style="padding-left:18px;margin:0">
        <li><strong>Order ID:</strong> ${escapeHtml(input.orderId)}</li>
        <li><strong>Product:</strong> ${escapeHtml(input.productName)}</li>
        <li><strong>Size:</strong> ${escapeHtml(size)}</li>
        <li><strong>Color:</strong> ${escapeHtml(colorName)}</li>
        <li><strong>Quantity:</strong> ${input.quantity}</li>
        <li><strong>Total:</strong> ${escapeHtml(total)}</li>
        <li><strong>Payment Method:</strong> ${escapeHtml(paymentMethod)}</li>
        <li><strong>Payment Reference:</strong> ${escapeHtml(paymentReference)}</li>
        <li><strong>Customer Name:</strong> ${escapeHtml(customerName)}</li>
        <li><strong>Customer Email:</strong> ${escapeHtml(input.customerEmail)}</li>
      </ul>
    </div>
  `;

  return sendResendEmail({ to: input.to, subject, text, html, tag: "treasurer_paid_reminder" });
}

export async function sendCustomerOrderReadyReminderEmail(
  input: CustomerOrderEmailInput & { staleHours: number }
) {
  const customerName = input.customerName?.trim() || "there";
  const pickupText = input.pickupInstructions?.trim() || "Your order is ready for pickup in the ASU room.";

  const subject = "Reminder: ASU Store order still ready for pickup";
  const text = [
    `Hi ${customerName},`,
    "",
    "This is a reminder that your ASU Store order is still ready for pickup.",
    "",
    `Order ID: ${input.orderId}`,
    `Product: ${input.productName}`,
    `Quantity: ${input.quantity}`,
    `Ready for pickup for: ${input.staleHours} hours`,
    "",
    "Pickup details:",
    pickupText,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <p>Hi ${escapeHtml(customerName)},</p>
      <p>This is a reminder that your ASU Store order is still <strong>ready for pickup</strong>.</p>
      <ul style="padding-left:18px;margin:0 0 14px">
        <li><strong>Order ID:</strong> ${escapeHtml(input.orderId)}</li>
        <li><strong>Product:</strong> ${escapeHtml(input.productName)}</li>
        <li><strong>Quantity:</strong> ${input.quantity}</li>
        <li><strong>Ready for pickup for:</strong> ${input.staleHours} hours</li>
      </ul>
      <p><strong>Pickup details:</strong><br/>${escapeHtml(pickupText).replace(/\n/g, "<br />")}</p>
    </div>
  `;

  return sendResendEmail({ to: input.to, subject, text, html, tag: "customer_ready_reminder" });
}

async function sendResendEmail({
  to,
  subject,
  text,
  html,
  tag,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  tag?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set; skipping email");
    return false;
  }

  const from = process.env.STORE_EMAIL_FROM || "store@asianstudentunion.org";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
      tags: tag ? [{ name: "flow", value: tag }] : undefined,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Failed to send email via Resend", { to, subject, body });
    return false;
  }

  return true;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
