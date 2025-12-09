import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import type { ProfileRole } from "@/lib/getCurrentProfile";

type RoleUpdateBody = {
  userId?: string;
  role?: ProfileRole;
};

const allowedRoles: ProfileRole[] = ["viewer", "editor", "admin", "owner"];

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: actorProfile, error: actorError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (actorError) {
    console.error("Failed to load actor profile", actorError);
    return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });
  }

  if (!actorProfile || !["admin", "owner"].includes(actorProfile.role as ProfileRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as RoleUpdateBody;
  const targetUserId = body.userId;
  const targetRole = body.role;

  if (!targetUserId || !targetRole || !allowedRoles.includes(targetRole)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetError) {
    console.error("Failed to load target profile", targetError);
    return NextResponse.json({ error: "Target lookup failed" }, { status: 500 });
  }

  if (!targetProfile) {
    return NextResponse.json({ error: "Target profile not found" }, { status: 404 });
  }

  if (targetProfile.role === "owner") {
    return NextResponse.json({ error: "Cannot modify owner" }, { status: 403 });
  }

  const actorRole = actorProfile.role as ProfileRole;
  const targetCurrentRole = targetProfile.role as ProfileRole;

  if (actorRole === "admin") {
    const allowed =
      (targetCurrentRole === "viewer" && targetRole === "editor") ||
      (targetCurrentRole === "editor" && targetRole === "viewer");

    if (!allowed) {
      return NextResponse.json({ error: "Admins can only promote viewers to editors or demote editors to viewers." }, { status: 403 });
    }
  }

  if (actorRole === "owner") {
    if (targetRole === "owner") {
      return NextResponse.json({ error: "Cannot assign owner via UI" }, { status: 403 });
    }
  }

  if (targetRole === "admin" && actorRole !== "owner") {
    return NextResponse.json({ error: "Only owner can assign admin" }, { status: 403 });
  }

  if (targetRole === "admin" && targetCurrentRole !== "admin") {
    const { data: existingAdmin } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .maybeSingle();

    if (existingAdmin && existingAdmin.id !== targetUserId) {
      return NextResponse.json({ error: "There is already an admin. Demote them first." }, { status: 400 });
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ role: targetRole })
    .eq("id", targetUserId);

  if (updateError) {
    console.error("Failed to update role", updateError);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: actorProfile, error: actorError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (actorError) {
    console.error("Failed to load actor profile", actorError);
    return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });
  }

  const actorRole = actorProfile?.role as ProfileRole | undefined;

  if (!actorRole || !["admin", "owner"].includes(actorRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as RoleUpdateBody;
  const targetUserId = body.userId;

  if (!targetUserId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetError) {
    console.error("Failed to load target profile", targetError);
    return NextResponse.json({ error: "Target lookup failed" }, { status: 500 });
  }

  if (!targetProfile) {
    return NextResponse.json({ error: "Target profile not found" }, { status: 404 });
  }

  const targetRole = targetProfile.role as ProfileRole;

  if (targetRole === "owner") {
    return NextResponse.json({ error: "Cannot remove owner" }, { status: 403 });
  }

  if (actorRole === "admin" && targetRole === "admin") {
    return NextResponse.json({ error: "Admins cannot remove other admins" }, { status: 403 });
  }

  if (actorRole === "admin" && !["viewer", "editor"].includes(targetRole)) {
    return NextResponse.json({ error: "Admins can only remove viewers or editors" }, { status: 403 });
  }

  const { error: deleteProfileError } = await supabaseAdmin.from("profiles").delete().eq("id", targetUserId);
  if (deleteProfileError) {
    console.error("Failed to delete profile", deleteProfileError);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }

  const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
  if (deleteUserError) {
    console.error("Failed to delete auth user", deleteUserError);
    // Not fatal for profile removal; still return success
  }

  return NextResponse.json({ success: true });
}
