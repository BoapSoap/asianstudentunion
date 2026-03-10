import { NextResponse } from "next/server";
import { compactChanges, diffFieldChanges, logAdminActivity } from "@/lib/adminActivity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireEditorAccess } from "@/lib/adminAccess";

type SettingsPayload = {
  is_enabled?: boolean;
  store_banner_message?: string | null;
  pickup_instructions?: string | null;
  venmo_username?: string | null;
  venmo_qr_image_url?: string | null;
  zelle_handle?: string | null;
  zelle_display_name?: string | null;
};
const DEFAULT_PICKUP_INSTRUCTIONS = "Pickup in ASU room.";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select(
      "id,is_enabled,store_banner_message,pickup_instructions,venmo_username,venmo_qr_image_url,zelle_handle,zelle_display_name,updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch admin store settings", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }

  return NextResponse.json({
    settings: {
      id: data?.id ?? null,
      is_enabled: data?.is_enabled ?? false,
      store_banner_message: data?.store_banner_message ?? "",
      pickup_instructions: data?.pickup_instructions?.trim() || DEFAULT_PICKUP_INSTRUCTIONS,
      venmo_username: data?.venmo_username ?? "",
      venmo_qr_image_url: data?.venmo_qr_image_url ?? "",
      zelle_handle: data?.zelle_handle ?? "",
      zelle_display_name: data?.zelle_display_name ?? "",
      updated_at: data?.updated_at ?? null,
    },
  });
}

export async function POST(request: Request) {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  let body: SettingsPayload;
  try {
    body = (await request.json()) as SettingsPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("store_settings")
    .select(
      "id,is_enabled,store_banner_message,pickup_instructions,venmo_username,venmo_qr_image_url,zelle_handle,zelle_display_name"
    )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to lookup existing store settings", existingError);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }

  const payload = {
    is_enabled: typeof body.is_enabled === "boolean" ? body.is_enabled : existing?.is_enabled ?? false,
    store_banner_message:
      typeof body.store_banner_message === "string"
        ? body.store_banner_message.trim() || null
        : existing?.store_banner_message ?? null,
    pickup_instructions:
      typeof body.pickup_instructions === "string"
        ? body.pickup_instructions.trim() || DEFAULT_PICKUP_INSTRUCTIONS
        : existing?.pickup_instructions?.trim() || DEFAULT_PICKUP_INSTRUCTIONS,
    venmo_username:
      typeof body.venmo_username === "string"
        ? body.venmo_username.trim() || null
        : existing?.venmo_username ?? null,
    venmo_qr_image_url:
      typeof body.venmo_qr_image_url === "string"
        ? normalizeImageUrl(body.venmo_qr_image_url)
        : existing?.venmo_qr_image_url ?? null,
    zelle_handle:
      typeof body.zelle_handle === "string"
        ? body.zelle_handle.trim() || null
        : existing?.zelle_handle ?? null,
    zelle_display_name:
      typeof body.zelle_display_name === "string"
        ? body.zelle_display_name.trim() || null
        : existing?.zelle_display_name ?? null,
  };

  if (existing?.id) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("store_settings")
      .update(payload)
      .eq("id", existing.id)
      .select(
        "id,is_enabled,store_banner_message,pickup_instructions,venmo_username,venmo_qr_image_url,zelle_handle,zelle_display_name,updated_at"
      )
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Failed to update store settings", updateError);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    await logAdminActivity({
      actorUserId: access.userId,
      actorEmail: access.email,
      actorRole: access.role,
      action: "update",
      entityType: "store_settings",
      entityId: updated.id,
      summary: "updated store settings",
      details: {
        changes: compactChanges(
          diffFieldChanges([
            { label: "Store enabled", before: existing.is_enabled, after: payload.is_enabled },
            { label: "Pickup instructions", before: existing.pickup_instructions, after: payload.pickup_instructions },
            { label: "Venmo username", before: existing.venmo_username, after: payload.venmo_username },
            { label: "Venmo QR", before: existing.venmo_qr_image_url, after: payload.venmo_qr_image_url, format: (value) => (value ? "configured" : "not configured") },
            { label: "Zelle handle", before: existing.zelle_handle, after: payload.zelle_handle },
            { label: "Zelle recipient", before: existing.zelle_display_name, after: payload.zelle_display_name },
          ]),
          "Saved store settings"
        ),
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("store_settings")
    .insert(payload)
    .select(
      "id,is_enabled,store_banner_message,pickup_instructions,venmo_username,venmo_qr_image_url,zelle_handle,zelle_display_name,updated_at"
    )
    .single();

  if (insertError || !inserted) {
    console.error("Failed to insert store settings", insertError);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: "create",
    entityType: "store_settings",
    entityId: inserted.id,
    summary: "created store settings",
    details: {
      changes: compactChanges(
        diffFieldChanges([
          { label: "Store enabled", before: null, after: payload.is_enabled },
          { label: "Pickup instructions", before: null, after: payload.pickup_instructions },
          { label: "Venmo username", before: null, after: payload.venmo_username },
          { label: "Zelle handle", before: null, after: payload.zelle_handle },
          { label: "Zelle recipient", before: null, after: payload.zelle_display_name },
        ]),
        "Created store settings"
      ),
    },
  });

  return NextResponse.json({ success: true, settings: inserted });
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
