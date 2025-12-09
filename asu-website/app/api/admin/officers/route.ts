import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import type { ProfileRole } from "@/lib/getCurrentProfile";

type OfficerPayload = {
  id?: string;
  name?: string;
  role?: string;
  bio?: string | null;
  email?: string;
  instagram?: string | null;
  linkedin?: string | null;
  major?: string | null;
  year?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
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

  let body: OfficerPayload;
  try {
    body = (await request.json()) as OfficerPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const officerRole = body.role?.trim();
  const email = body.email?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!officerRole) {
    return NextResponse.json({ error: "Role is required" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "ASU email is required" }, { status: 400 });
  }

  const payload = {
    name,
    role: officerRole,
    bio: body.bio?.trim() || null,
    email,
    instagram: body.instagram?.trim() || null,
    linkedin: body.linkedin?.trim() || null,
    major: body.major?.trim() || null,
    year: body.year?.trim() || null,
    image_url: body.imageUrl?.trim() || null,
    sort_order:
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder) ? body.sortOrder : null,
  };

  let savedId: string | null = null;

  if (body.id) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("officers")
      .select("id")
      .eq("id", body.id)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to load officer for update", existingError);
      return NextResponse.json({ error: "Officer lookup failed" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("officers")
      .update(payload)
      .eq("id", body.id)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Failed to update officer", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    savedId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("officers")
      .insert(payload)
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to create officer", insertError);
      return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }

    savedId = inserted.id;
  }

  return NextResponse.json({ success: true, officer: { id: savedId } });
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
    return NextResponse.json({ error: "Officer id is required" }, { status: 400 });
  }

  const { error: deleteError } = await supabaseAdmin.from("officers").delete().eq("id", id);
  if (deleteError) {
    console.error("Failed to delete officer", deleteError);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
