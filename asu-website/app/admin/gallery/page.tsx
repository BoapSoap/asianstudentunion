import { redirect } from "next/navigation";
import { AdminActionCard, AdminInfoCard, AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { getCurrentProfile } from "@/lib/getCurrentProfile";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/adminlogin");
  }

  if (!profile) {
    return (
      <AdminSectionShell title="Gallery" description="Add Google Photos links and curate album covers." role="viewer">
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
      <AdminSectionShell title="Gallery" description="Add Google Photos links and curate album covers." role={profile.role}>
        <AdminInfoCard
          variant="warning"
          title="Pending approval"
          body="Your account is logged in but not approved yet. Please contact the ASU president or web admin."
        />
      </AdminSectionShell>
    );
  }

  return (
    <AdminSectionShell title="Gallery" description="Add Google Photos links and curate album covers." role={profile.role}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AdminActionCard
          title="Add new album"
          description="Create an album with cover image, title, and Google Photos share link."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Edit album metadata"
          description="Update album titles, dates, and cover art for existing collections."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Feature albums"
          description="Choose which albums are highlighted on the gallery page."
          badge="Coming soon"
        />
        <AdminActionCard
          title="Link health checks"
          description="Verify Google Photos links stay valid and permissions are correct."
          badge="Coming soon"
        />
      </div>
    </AdminSectionShell>
  );
}
