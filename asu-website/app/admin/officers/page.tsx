import { redirect } from "next/navigation";
import { AdminActionCard, AdminInfoCard, AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { getCurrentProfile } from "@/lib/getCurrentProfile";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AdminOfficersPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/adminlogin");
  }

  if (!profile) {
    return (
      <AdminSectionShell title="Manage Officers" description="Update officer bios, roles, and headshots." role="viewer">
        <AdminInfoCard
          variant="error"
          title="Profile not found"
          body="Could not load your profile. Please sign out and back in, or contact the site admin."
        />
      </AdminSectionShell>
    );
  }

  if (profile.role === "viewer") {
    return (
      <AdminSectionShell title="Manage Officers" description="Update officer bios, roles, and headshots." role={profile.role}>
        <AdminInfoCard
          variant="warning"
          title="Pending approval"
          body="Your account is logged in but not approved yet. Please contact the ASU president or web admin."
        />
      </AdminSectionShell>
    );
  }

  return (
    <AdminSectionShell title="Manage Officers" description="Update officer bios, roles, and headshots." role={profile.role}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AdminActionCard
          title="Update officer roster"
          description="Add new officers, update roles, and set term start/end dates."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Edit bios & links"
          description="Manage bios, majors, socials, and highlights for each officer."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Headshots & ordering"
          description="Upload headshots, set alt text, and reorder the team grid."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Term handoff helper"
          description="Reset officers for a new term and archive previous rosters."
          badge="Coming soon"
        />
      </div>
    </AdminSectionShell>
  );
}
