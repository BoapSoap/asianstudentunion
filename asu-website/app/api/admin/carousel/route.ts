import { NextResponse } from "next/server";
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

  if (body.id) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("home_carousel_images")
      .select("id")
      .eq("id", body.id)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to load slide for update", existingError);
      return NextResponse.json({ error: "Slide lookup failed" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

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

  const { error: deleteError } = await supabaseAdmin.from("home_carousel_images").delete().eq("id", id);
  if (deleteError) {
    console.error("Failed to delete slide", deleteError);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
