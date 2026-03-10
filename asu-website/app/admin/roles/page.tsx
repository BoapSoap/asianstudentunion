import { redirect } from "next/navigation";
import { Paper, Stack, Typography } from "@mui/material";
import { AdminInfoCard, AdminSectionShell } from "@/components/admin/AdminSectionShell";
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
      <AdminSectionShell
        title="Role Management"
        description="View officer roles and update permissions."
        role="viewer"
      >
        <AdminInfoCard
          variant="error"
          title="Profile not found"
          body="Could not load your profile. Please try again later."
        />
      </AdminSectionShell>
    );
  }

  const canManageRoles = profile.role === "admin" || profile.role === "owner";

  if (!canManageRoles) {
    return (
      <AdminSectionShell
        title="Role Management"
        description="View officer roles and update permissions."
        role={profile.role}
      >
        <AdminInfoCard
          variant="warning"
          title="Access denied"
          body="You do not have permission to manage roles. Please return to the dashboard or contact the site admin."
        />
      </AdminSectionShell>
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
    <AdminSectionShell
      title="Role Management"
      description="View officer roles and update permissions."
      role={profile.role}
      backHref="/admin"
      backLabel="Back to Dashboard"
      eyebrow="Admin"
    >
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          p: 2,
          borderColor: "rgba(255,255,255,0.15)",
          bgcolor: "rgba(255,255,255,0.06)",
        }}
      >
        <Stack spacing={0.8}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.66)" }}>
            Owner can assign admins, editors, or viewers. Admin can only promote viewers to editors or demote editors to viewers. Owner and admin rows are protected.
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.66)" }}>
            Role legend: viewer = pending approval, editor = approved officer, admin = president, owner = site maintainer.
          </Typography>
        </Stack>
      </Paper>

      <RoleTable profiles={profiles} viewerRole={profile.role} currentUserId={user.id} />
    </AdminSectionShell>
  );
}
