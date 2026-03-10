import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
const DEFAULT_PICKUP_INSTRUCTIONS = "Pickup in ASU room.";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("store_settings")
    .select(
      "id,is_enabled,pickup_instructions,store_banner_message,venmo_username,venmo_qr_image_url,zelle_handle,zelle_display_name,updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load store settings", error);
    return NextResponse.json({ error: "Failed to load store settings" }, { status: 500 });
  }

  return NextResponse.json({
    settings: {
      id: data?.id ?? null,
      is_enabled: data?.is_enabled ?? false,
      pickup_instructions: data?.pickup_instructions?.trim() || DEFAULT_PICKUP_INSTRUCTIONS,
      store_banner_message: data?.store_banner_message ?? null,
      venmo_username: data?.venmo_username ?? null,
      venmo_qr_image_url: data?.venmo_qr_image_url ?? null,
      zelle_handle: data?.zelle_handle ?? null,
      zelle_display_name: data?.zelle_display_name ?? null,
      updated_at: data?.updated_at ?? null,
    },
  });
}
