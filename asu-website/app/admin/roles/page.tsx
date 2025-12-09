import Link from "next/link";
import { redirect } from "next/navigation";
import RoleTable from "@/components/admin/RoleTable";
import { getCurrentProfile, type ProfileRole } from "@/lib/getCurrentProfile";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  role: ProfileRole;
  created_at: string;
  email?: string;
};

export default async function RolesPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/adminlogin");
  }

  if (!profile) {
    return (
      <div className="px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-red-900/30 px-6 py-5 text-white shadow-lg">
          <h1 className="text-xl font-bold">Profile not found</h1>
          <p className="mt-2 text-white/80">Could not load your profile. Please try again later.</p>
        </div>
      </div>
    );
  }

  const canManageRoles = profile.role === "admin" || profile.role === "owner";

  if (!canManageRoles) {
    return (
      <div className="px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-white shadow-xl backdrop-blur">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-white/70">You do not have permission to manage roles.</p>
          <p className="mt-1 text-white/60">Please return to the dashboard or contact the site admin.</p>
        </div>
      </div>
    );
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load profiles for role management", error);
  }

  const { data: usersList, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    console.error("Failed to load auth users for emails", usersError);
  }

  const emailById =
    usersList?.users?.reduce<Record<string, string | undefined>>((acc, u) => {
      if (u.id) acc[u.id] = u.email ?? undefined;
      return acc;
    }, {}) ?? {};

  const validRoles: ProfileRole[] = ["viewer", "editor", "admin", "owner"];
  const profiles: ProfileRow[] =
    data
      ?.filter(
        (row): row is ProfileRow =>
          typeof row.id === "string" &&
          typeof row.created_at === "string" &&
          validRoles.includes(row.role as ProfileRole)
      )
      .map((row) => ({
        id: row.id,
        role: row.role,
        created_at: row.created_at,
        email: emailById[row.id],
      })) ?? [];

  return (
    <main
      className="flex min-h-screen w-full justify-center pb-24 md:pb-32"
      style={{ paddingTop: "clamp(12rem, 18vh, 20rem)" }}
    >
      <div className="w-full max-w-6xl px-4 flex flex-col gap-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">Admin</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
              >
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-extrabold text-white">Role Management</h1>
                <p className="text-sm text-white/70">View officer roles and update permissions.</p>
              </div>
            </div>
            <div className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
              {profile.role}
            </div>
          </div>
          <p className="mt-2 text-xs text-white/60">
            Owner can assign admins, editors, or viewers. Admin can only promote viewers to editors or demote editors to viewers. Owner and admin rows are protected.
          </p>
          <p className="mt-1 text-xs text-white/60">
            Role legend: viewer = pending approval, editor = approved officer, admin = president, owner = site maintainer.
          </p>
        </div>

        <RoleTable profiles={profiles} viewerRole={profile.role} currentUserId={user.id} />
      </div>
    </main>
  );
}
