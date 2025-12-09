import { redirect } from "next/navigation";
import { AdminActionCard, AdminInfoCard, AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { getCurrentProfile } from "@/lib/getCurrentProfile";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AdminHistoryPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/adminlogin");
  }

  if (!profile) {
    return (
      <AdminSectionShell title="History Sections" description="Edit ASU history and milestone highlights." role="viewer">
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
      <AdminSectionShell title="History Sections" description="Edit ASU history and milestone highlights." role={profile.role}>
        <AdminInfoCard
          variant="warning"
          title="Pending approval"
          body="Your account is logged in but not approved yet. Please contact the ASU president or web admin."
        />
      </AdminSectionShell>
    );
  }

  return (
    <AdminSectionShell title="History Sections" description="Edit ASU history and milestone highlights." role={profile.role}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AdminActionCard
          title="Edit timeline"
          description="Add or reorder milestone entries with dates, copy, and imagery."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Feature highlights"
          description="Choose which milestones to spotlight on the public history page."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Media & captions"
          description="Attach photos or videos to milestones with captions and credits."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Copy review"
          description="Draft updates and save for review before publishing live."
          badge="Coming soon"
        />
      </div>
    </AdminSectionShell>
  );
}
