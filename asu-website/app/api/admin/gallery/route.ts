import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import type { ProfileRole } from "@/lib/getCurrentProfile";

type AlbumPayload = {
  id?: string;
  title?: string;
  date?: string | null;
  googlePhotosUrl?: string | null;
  coverImageUrl?: string | null;
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

  let body: AlbumPayload;
  try {
    body = (await request.json()) as AlbumPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = body.title?.trim();
  const date = body.date?.trim() || null;
  const googlePhotosUrl = body.googlePhotosUrl?.trim() || null;
  const coverImageUrl = body.coverImageUrl?.trim() || null;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!googlePhotosUrl) {
    return NextResponse.json({ error: "Google Photos link is required" }, { status: 400 });
  }

  const payload = {
    title,
    date,
    google_photos_url: googlePhotosUrl,
    cover_image_url: coverImageUrl,
    description: null,
  };

  let savedId: string | null = null;

  if (body.id) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("gallery_albums")
      .select("id")
      .eq("id", body.id)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to load album for update", existingError);
      return NextResponse.json({ error: "Album lookup failed" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("gallery_albums")
      .update(payload)
      .eq("id", body.id)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Failed to update album", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    savedId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("gallery_albums")
      .insert(payload)
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to create album", insertError);
      return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }

    savedId = inserted.id;
  }

  return NextResponse.json({ success: true, album: { id: savedId } });
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
    return NextResponse.json({ error: "Album id is required" }, { status: 400 });
  }

  const { error: deleteError } = await supabaseAdmin.from("gallery_albums").delete().eq("id", id);
  if (deleteError) {
    console.error("Failed to delete album", deleteError);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
