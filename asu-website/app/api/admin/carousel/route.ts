import { NextResponse } from "next/server";
import { compactChanges, diffFieldChanges, logAdminActivity } from "@/lib/adminActivity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import type { ProfileRole } from "@/lib/getCurrentProfile";

type SlidePayload = {
  id?: string;
  alt?: string;
  sortOrder?: number | null;
  imageUrl?: string | null;
};

const EDIT_ROLES: ProfileRole[] = ["editor", "admin", "owner"];

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load actor profile", profileError);
    return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });
  }

  const role = profile?.role as ProfileRole | undefined;
  if (!role || !EDIT_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: SlidePayload;
  try {
    body = (await request.json()) as SlidePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const alt = body.alt?.trim();
  const imageUrl = body.imageUrl?.trim() || null;
  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder) ? body.sortOrder : null;

  if (!alt) {
    return NextResponse.json({ error: "Alt text is required" }, { status: 400 });
  }

  if (!imageUrl) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  const payload = {
    alt,
    sort_order: sortOrder,
    image_url: imageUrl,
  };

  let savedId: string | null = null;
  let existingSlide:
    | {
        id: string;
        alt: string | null;
        sort_order: number | null;
        image_url: string | null;
      }
    | null = null;

  if (body.id) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("home_carousel_images")
      .select("id,alt,sort_order,image_url")
      .eq("id", body.id)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to load slide for update", existingError);
      return NextResponse.json({ error: "Slide lookup failed" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    existingSlide = existing;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("home_carousel_images")
      .update(payload)
      .eq("id", body.id)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Failed to update slide", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    savedId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("home_carousel_images")
      .insert(payload)
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to create slide", insertError);
      return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }

    savedId = inserted.id;
  }

  await logAdminActivity({
    actorUserId: user.id,
    actorEmail: user.email ?? null,
    actorRole: role,
    action: existingSlide ? "update" : "create",
    entityType: "carousel_slide",
    entityId: savedId,
    summary: `${existingSlide ? "updated" : "created"} home carousel slide ${alt}`,
    details: {
      changes: compactChanges(
        diffFieldChanges([
          { label: "Alt text", before: existingSlide?.alt ?? null, after: payload.alt },
          { label: "Sort order", before: existingSlide?.sort_order ?? null, after: payload.sort_order },
          { label: "Image", before: existingSlide?.image_url ?? null, after: payload.image_url, format: (value) => (value ? "configured" : "not configured") },
        ]),
        `${existingSlide ? "Updated" : "Created"} carousel slide`
      ),
    },
  });

  return NextResponse.json({ success: true, slide: { id: savedId } });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load actor profile", profileError);
    return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });
  }

  const role = profile?.role as ProfileRole | undefined;
  if (!role || !EDIT_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "Slide id is required" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("home_carousel_images")
    .select("id,alt")
    .eq("id", id)
    .maybeSingle();

  const { error: deleteError } = await supabaseAdmin.from("home_carousel_images").delete().eq("id", id);
  if (deleteError) {
    console.error("Failed to delete slide", deleteError);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  await logAdminActivity({
    actorUserId: user.id,
    actorEmail: user.email ?? null,
    actorRole: role,
    action: "delete",
    entityType: "carousel_slide",
    entityId: id,
    summary: `deleted home carousel slide ${existing?.alt ?? id.slice(0, 8)}`,
    details: {
      changes: compactChanges(existing?.alt ? [`Deleted slide "${existing.alt}"`] : [], "Deleted carousel slide"),
    },
  });

  return NextResponse.json({ success: true });
}
