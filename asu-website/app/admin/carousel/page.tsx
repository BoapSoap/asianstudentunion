import { redirect } from "next/navigation";
import { AdminActionCard, AdminInfoCard, AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { getCurrentProfile } from "@/lib/getCurrentProfile";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AdminCarouselPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/adminlogin");
  }

  if (!profile) {
    return (
      <AdminSectionShell title="Home Carousel" description="Refresh the homepage hero carousel images." role="viewer">
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
      <AdminSectionShell title="Home Carousel" description="Refresh the homepage hero carousel images." role={profile.role}>
        <AdminInfoCard
          variant="warning"
          title="Pending approval"
          body="Your account is logged in but not approved yet. Please contact the ASU president or web admin."
        />
      </AdminSectionShell>
    );
  }

  return (
    <AdminSectionShell title="Home Carousel" description="Refresh the homepage hero carousel images." role={profile.role}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AdminActionCard
          title="Manage slides"
          description="Add, edit, or reorder hero slides with headline, copy, and link."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Upload media"
          description="Upload optimized images, set focal points, and add alt text for accessibility."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Scheduling"
          description="Schedule slides to run for specific dates (e.g., event promos)."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Preview mode"
          description="Preview carousel changes before publishing to the homepage."
          badge="Coming soon"
        />
      </div>
    </AdminSectionShell>
  );
}
