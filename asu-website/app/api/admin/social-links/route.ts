import { NextResponse } from "next/server";
import { compactChanges, diffFieldChanges, logAdminActivity } from "@/lib/adminActivity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import type { ProfileRole } from "@/lib/getCurrentProfile";

type SocialLinkPayload = {
  id?: string;
  label?: string;
  url?: string;
  iconUrl?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
};

const EDIT_ROLES: ProfileRole[] = ["editor", "admin", "owner"];

async function requireEditor() {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load actor profile", profileError);
    return { error: NextResponse.json({ error: "Profile lookup failed" }, { status: 500 }) };
  }

  const role = profile?.role as ProfileRole | undefined;
  if (!role || !EDIT_ROLES.includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, role };
}

function normalizeHttpUrl(raw: string | null | undefined, fieldName: string, required: true): { value: string; error?: string };
function normalizeHttpUrl(raw: string | null | undefined, fieldName: string, required?: false): { value: string | null; error?: string };
function normalizeHttpUrl(raw: string | null | undefined, fieldName: string, required = false) {
  const trimmed = raw?.trim() || "";
  if (!trimmed) {
    return required ? { value: "", error: `${fieldName} is required` } : { value: null };
  }

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { value: required ? "" : null, error: `${fieldName} must be an http or https URL` };
    }
    return { value: parsed.toString() };
  } catch {
    return { value: required ? "" : null, error: `${fieldName} must be a valid URL` };
  }
}

export async function POST(request: Request) {
  const auth = await requireEditor();
  if ("error" in auth) return auth.error;

  let body: SocialLinkPayload;
  try {
    body = (await request.json()) as SocialLinkPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const label = body.label?.trim();
  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const url = normalizeHttpUrl(body.url, "Link URL", true);
  if (url.error) {
    return NextResponse.json({ error: url.error }, { status: 400 });
  }

  const iconUrl = normalizeHttpUrl(body.iconUrl, "Icon thumbnail URL");
  if (iconUrl.error) {
    return NextResponse.json({ error: iconUrl.error }, { status: 400 });
  }

  const payload = {
    label,
    url: url.value,
    icon_url: iconUrl.value,
    sort_order:
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder) ? body.sortOrder : null,
    is_active: body.isActive !== false,
  };

  let savedId: string | null = null;
  let existingLink:
    | {
        id: string;
        label: string | null;
        url: string | null;
        icon_url: string | null;
        sort_order: number | null;
        is_active: boolean | null;
      }
    | null = null;

  if (body.id) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("social_links")
      .select("id,label,url,icon_url,sort_order,is_active")
      .eq("id", body.id)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to load social link for update", existingError);
      return NextResponse.json({ error: "Social link lookup failed" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Social link not found" }, { status: 404 });
    }

    existingLink = existing;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("social_links")
      .update(payload)
      .eq("id", body.id)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Failed to update social link", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    savedId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("social_links")
      .insert(payload)
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to create social link", insertError);
      return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }

    savedId = inserted.id;
  }

  await logAdminActivity({
    actorUserId: auth.user.id,
    actorEmail: auth.user.email ?? null,
    actorRole: auth.role,
    action: existingLink ? "update" : "create",
    entityType: "social_link",
    entityId: savedId,
    summary: `${existingLink ? "updated" : "created"} social link ${label}`,
    details: {
      changes: compactChanges(
        diffFieldChanges([
          { label: "Label", before: existingLink?.label ?? null, after: payload.label },
          { label: "URL", before: existingLink?.url ?? null, after: payload.url },
          { label: "Thumbnail", before: existingLink?.icon_url ?? null, after: payload.icon_url, format: (value) => (value ? "configured" : "not configured") },
          { label: "Sort order", before: existingLink?.sort_order ?? null, after: payload.sort_order },
          { label: "Active", before: existingLink?.is_active ?? null, after: payload.is_active },
        ]),
        `${existingLink ? "Updated" : "Created"} social link`
      ),
    },
  });

  return NextResponse.json({ success: true, link: { id: savedId } });
}

export async function DELETE(request: Request) {
  const auth = await requireEditor();
  if ("error" in auth) return auth.error;

  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "Social link id is required" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("social_links")
    .select("id,label")
    .eq("id", id)
    .maybeSingle();

  const { error: deleteError } = await supabaseAdmin.from("social_links").delete().eq("id", id);
  if (deleteError) {
    console.error("Failed to delete social link", deleteError);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  await logAdminActivity({
    actorUserId: auth.user.id,
    actorEmail: auth.user.email ?? null,
    actorRole: auth.role,
    action: "delete",
    entityType: "social_link",
    entityId: id,
    summary: `deleted social link ${existing?.label ?? id.slice(0, 8)}`,
    details: {
      changes: compactChanges(existing?.label ? [`Deleted social link "${existing.label}"`] : [], "Deleted social link"),
    },
  });

  return NextResponse.json({ success: true });
}
