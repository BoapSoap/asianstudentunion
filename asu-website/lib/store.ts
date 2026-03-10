export type StoreSettingsRow = {
  id: string;
  is_enabled: boolean;
  pickup_instructions: string | null;
  store_banner_message: string | null;
  venmo_username: string | null;
  venmo_qr_image_url: string | null;
  zelle_handle: string | null;
  zelle_display_name: string | null;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number | null;
  is_thumbnail: boolean | null;
  created_at: string;
};

export type ProductColorRow = {
  id: string;
  product_id: string;
  name: string;
  hex_color: string;
  preview_image_url: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
};

export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  stripe_price_id: string;
  image_url: string | null;
  images?: ProductImageRow[];
  colors?: ProductColorRow[];
  is_active: boolean;
  created_at: string;
};

export type StoreContactRow = {
  id: string;
  role: string;
  name: string;
  email: string;
  is_active: boolean;
  updated_at: string;
};

export type OrderStatus = "paid" | "in_progress" | "ready_for_pickup" | "picked_up";
export type StorePaymentMethod = "venmo" | "zelle";

export type OrderRow = {
  id: string;
  stripe_session_id: string;
  customer_name: string | null;
  customer_email: string;
  product_id: string | null;
  size: string | null;
  quantity: number;
  total_cents: number;
  payment_method: StorePaymentMethod;
  payment_reference: string | null;
  color_id: string | null;
  color_name: string | null;
  color_hex: string | null;
  status: OrderStatus;
  created_at: string;
};

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatUsdFromCents(cents: number) {
  return usdFormatter.format(cents / 100);
}

export function sanitizeQuantity(input: unknown): number | null {
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) {
    return null;
  }

  return parsed;
}

export function getBaseSiteUrl(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (!request) {
    return "http://localhost:3000";
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
