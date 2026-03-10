import { NextResponse } from "next/server";
import { compactChanges, diffFieldChanges, logAdminActivity } from "@/lib/adminActivity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireEditorAccess } from "@/lib/adminAccess";

type TreasurerPayload = {
  id?: string;
  name?: string;
  email?: string;
  is_active?: boolean;
};

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  const { data, error } = await supabaseAdmin
    .from("store_contacts")
    .select("id,role,name,email,is_active,updated_at")
    .eq("role", "treasurer")
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch treasurer contacts", error);
    return NextResponse.json({ error: "Failed to load treasurer" }, { status: 500 });
  }

  const contacts = data ?? [];
  const active = contacts.find((contact) => contact.is_active) ?? contacts[0] ?? null;

  return NextResponse.json({ active, contacts });
}

export async function POST(request: Request) {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  let body: TreasurerPayload;
  try {
    body = (await request.json()) as TreasurerPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const desiredActive = typeof body.is_active === "boolean" ? body.is_active : true;

  let targetId = body.id?.trim() || null;
  if (!targetId) {
    const { data: existing } = await supabaseAdmin
      .from("store_contacts")
      .select("id")
      .eq("role", "treasurer")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    targetId = existing?.id ?? null;
  }

  if (targetId) {
    const { data: beforeContact } = await supabaseAdmin
      .from("store_contacts")
      .select("id,name,email,is_active")
      .eq("id", targetId)
      .maybeSingle();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("store_contacts")
      .update({
        role: "treasurer",
        name,
        email,
        is_active: desiredActive,
      })
      .eq("id", targetId)
      .select("id,role,name,email,is_active,updated_at")
      .maybeSingle();

    if (updateError || !updated) {
      console.error("Failed to update treasurer contact", updateError);
      return NextResponse.json({ error: "Failed to save treasurer" }, { status: 500 });
    }

    if (updated.is_active) {
      const { error: deactivateError } = await supabaseAdmin
        .from("store_contacts")
        .update({ is_active: false })
        .eq("role", "treasurer")
        .neq("id", updated.id);

      if (deactivateError) {
        console.error("Failed to deactivate other treasurer contacts", deactivateError);
      }
    }

    await logAdminActivity({
      actorUserId: access.userId,
      actorEmail: access.email,
      actorRole: access.role,
      action: "update",
      entityType: "store_treasurer",
      entityId: updated.id,
      summary: `updated treasurer contact ${updated.name}`,
      details: {
        changes: compactChanges(
          diffFieldChanges([
            { label: "Name", before: beforeContact?.name ?? null, after: updated.name },
            { label: "Email", before: beforeContact?.email ?? null, after: updated.email },
            { label: "Active", before: beforeContact?.is_active ?? null, after: updated.is_active },
          ]),
          "Updated treasurer contact"
        ),
      },
    });

    return NextResponse.json({ success: true, contact: updated });
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("store_contacts")
    .insert({
      role: "treasurer",
      name,
      email,
      is_active: desiredActive,
    })
    .select("id,role,name,email,is_active,updated_at")
    .single();

  if (insertError || !inserted) {
    console.error("Failed to insert treasurer contact", insertError);
    return NextResponse.json({ error: "Failed to save treasurer" }, { status: 500 });
  }

  if (inserted.is_active) {
    const { error: deactivateError } = await supabaseAdmin
      .from("store_contacts")
      .update({ is_active: false })
      .eq("role", "treasurer")
      .neq("id", inserted.id);

    if (deactivateError) {
      console.error("Failed to deactivate other treasurer contacts", deactivateError);
    }
  }

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: "create",
    entityType: "store_treasurer",
    entityId: inserted.id,
    summary: `created treasurer contact ${inserted.name}`,
    details: {
      changes: compactChanges(
        diffFieldChanges([
          { label: "Name", before: null, after: inserted.name },
          { label: "Email", before: null, after: inserted.email },
          { label: "Active", before: null, after: inserted.is_active },
        ]),
        "Created treasurer contact"
      ),
    },
  });

  return NextResponse.json({ success: true, contact: inserted });
}
