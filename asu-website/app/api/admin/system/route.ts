import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import type { ProfileRole } from "@/lib/getCurrentProfile";

type ActionBody =
  | { action: "reset_officers" }
  | { action: "transfer_admin"; targetUserId?: string; targetEmail?: string }
  | { action?: string; [key: string]: unknown };

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
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action === "reset_officers") {
    if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, role");

    if (profilesError) {
      console.error("Failed to fetch profiles for reset", profilesError);
      return NextResponse.json({ error: "Profile fetch failed" }, { status: 500 });
    }

    const toDelete = (profiles ?? []).filter((p) => p.role !== "owner").map((p) => p.id);

    if (toDelete.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    const { error: deleteProfilesError } = await supabaseAdmin.from("profiles").delete().in("id", toDelete);
    if (deleteProfilesError) {
      console.error("Failed to delete profiles during reset", deleteProfilesError);
      return NextResponse.json({ error: "Profile deletion failed" }, { status: 500 });
    }

    // Best-effort deletion of auth users; ignore failures so reset still completes.
    for (const id of toDelete) {
      try {
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (deleteUserError) {
          console.error("Failed to delete auth user during reset", deleteUserError);
        }
      } catch (err) {
        console.error("Exception deleting auth user during reset", err);
      }
    }

    return NextResponse.json({ success: true, deleted: toDelete.length });
  }

  if (body.action === "transfer_admin") {
    if (!["owner", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetEmail = body.targetEmail?.trim().toLowerCase() || null;
    let targetUserId = body.targetUserId?.trim() || null;

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ error: "targetUserId or targetEmail is required" }, { status: 400 });
    }

    if (!targetUserId && targetEmail) {
      const { data: usersList, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (usersError) {
        console.error("Failed to list users for transfer", usersError);
        return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
      }
      const match = usersList?.users?.find((u) => u.email?.toLowerCase() === targetEmail) || null;
      if (!match?.id) {
        return NextResponse.json({ error: "No auth user found for that email" }, { status: 404 });
      }
      targetUserId = match.id;
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
      return NextResponse.json({ error: "Cannot make an owner the admin" }, { status: 400 });
    }

    const { data: toRemove } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .in("role", ["admin", "editor"])
      .neq("id", targetUserId);

    const idsToRemove = (toRemove ?? []).map((p) => p.id);
    if (idsToRemove.length > 0) {
      const { error: deleteProfilesError } = await supabaseAdmin.from("profiles").delete().in("id", idsToRemove);
      if (deleteProfilesError) {
        console.error("Failed to delete existing admins/editors", deleteProfilesError);
        return NextResponse.json({ error: "Failed to clear admins/editors" }, { status: 500 });
      }

      for (const id of idsToRemove) {
        try {
          const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(id);
          if (deleteUserError) console.error("Failed to delete auth user during admin transfer", deleteUserError);
        } catch (err) {
          console.error("Exception deleting auth user during admin transfer", err);
        }
      }
    }

    const { error: promoteError } = await supabaseAdmin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", targetUserId);

    if (promoteError) {
      console.error("Failed to promote target to admin", promoteError);
      return NextResponse.json({ error: "Failed to assign admin" }, { status: 500 });
    }

    return NextResponse.json({ success: true, admin: targetUserId, removed: idsToRemove });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
