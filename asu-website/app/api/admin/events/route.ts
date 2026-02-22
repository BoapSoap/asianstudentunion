import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import type { ProfileRole } from "@/lib/getCurrentProfile";
import { slugifyTitle } from "@/lib/slugify";
import { pacificDateTimeInputToUtcIso } from "@/lib/pacificTime";

type EventPayload = {
  id?: string;
  title?: string;
  date?: string | null;
  time?: string | null;
  displayUntil?: string | null;
  location?: string | null;
  link?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  featured?: boolean;
};

const EDIT_ROLES: ProfileRole[] = ["editor", "admin", "owner"];

function buildDescriptionBlocks(raw?: string | null) {
  const text = raw?.trim();
  if (!text) return null;

  const paragraphs = text
    .split(/\n+/)
    .map((para) => para.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return paragraphs.map((para, idx) => ({
    _type: "block",
    _key: `p-${idx}`,
    children: [{ _type: "span", _key: `p-${idx}-c`, text: para }],
  }));
}

async function generateUniqueSlug(title: string, existingId?: string) {
  const base = slugifyTitle(title);

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id, slug")
    .ilike("slug", `${base}%`);

  if (error) {
    console.error("Failed to check slug uniqueness", error);
    throw error;
  }

  const taken = new Set(
    (data ?? [])
      .filter((row) => row.id !== existingId && typeof row.slug === "string")
      .map((row) => row.slug as string)
  );

  let candidate = base;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

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

  let body: EventPayload;
  try {
    body = (await request.json()) as EventPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const date = body.date?.trim() || null;
  const time = body.time?.trim() || null;
  const { value: displayUntilIso, error: displayUntilError } = pacificDateTimeInputToUtcIso(body.displayUntil);
  if (displayUntilError) {
    return NextResponse.json({ error: displayUntilError }, { status: 400 });
  }
  const location = body.location?.trim() || null;
  const link = body.link?.trim() || null;
  const featured = !!body.featured;
  const description = buildDescriptionBlocks(body.description);
  const imageUrl = body.imageUrl?.trim() || null;

  let existing: { id: string; slug: string | null; title: string | null } | null = null;

  if (body.id) {
    const { data: eventRow, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, slug, title")
      .eq("id", body.id)
      .maybeSingle();

    if (eventError) {
      console.error("Failed to load event for update", eventError);
      return NextResponse.json({ error: "Event lookup failed" }, { status: 500 });
    }

    if (!eventRow) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    existing = eventRow;
  }

  let slug = existing?.slug?.trim() || null;
  const titleChanged = existing?.title?.trim() !== title;

  if (!slug || titleChanged) {
    try {
      slug = await generateUniqueSlug(title, existing?.id);
    } catch {
      return NextResponse.json({ error: "Failed to generate slug" }, { status: 500 });
    }
  }

  const payload = {
    title,
    date,
    time,
    display_until: displayUntilIso,
    location,
    link,
    description,
    image_url: imageUrl,
    featured,
    slug,
  };

  let savedId: string | null = existing?.id ?? null;
  let savedSlug: string | null = slug;

  if (existing) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("events")
      .update(payload)
      .eq("id", existing.id)
      .select("id, slug")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Failed to update event", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    savedId = updated.id;
    savedSlug = updated.slug ?? slug;
  } else {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("events")
      .insert(payload)
      .select("id, slug")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to create event", insertError);
      return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }

    savedId = inserted.id;
    savedSlug = inserted.slug ?? slug;
  }

  if (featured && savedId) {
    const { error: unfeatureError } = await supabaseAdmin
      .from("events")
      .update({ featured: false })
      .neq("id", savedId);

    if (unfeatureError) {
      console.error("Failed to unfeature other events", unfeatureError);
    }
  }

  return NextResponse.json({ success: true, event: { id: savedId, slug: savedSlug } });
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
    return NextResponse.json({ error: "Event id is required" }, { status: 400 });
  }

  const { error: deleteError } = await supabaseAdmin.from("events").delete().eq("id", id);
  if (deleteError) {
    console.error("Failed to delete event", deleteError);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
