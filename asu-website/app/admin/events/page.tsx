import { redirect } from "next/navigation";
import { AdminActionCard, AdminInfoCard, AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { getCurrentProfile } from "@/lib/getCurrentProfile";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/adminlogin");
  }

  if (!profile) {
    return (
      <AdminSectionShell title="Manage Events" description="Create, edit, and feature upcoming events." role="viewer">
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
      <AdminSectionShell title="Manage Events" description="Create, edit, and feature upcoming events." role={profile.role}>
        <AdminInfoCard
          variant="warning"
          title="Pending approval"
          body="Your account is logged in but not approved yet. Please contact the ASU president or web admin."
        />
      </AdminSectionShell>
    );
  }

  return (
    <AdminSectionShell title="Manage Events" description="Create, edit, and feature upcoming events." role={profile.role}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AdminActionCard
          title="Create new event"
          description="Add title, date, location, flyer/hero image, and optional RSVP link."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Edit existing events"
          description="Update details, publish/unpublish, or duplicate a past event as a template."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Feature on homepage"
          description="Select which upcoming events appear in the home spotlight."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Media & accessibility"
          description="Upload flyer images, add alt text, and set color-safe button options."
          badge="Coming soon"
        />
      </div>
    </AdminSectionShell>
  );
}
