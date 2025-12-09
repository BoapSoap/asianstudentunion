import Link from "next/link";
import { redirect } from "next/navigation";
import ControlCenterPanels from "@/components/admin/ControlCenterPanels";
import { getCurrentProfile, type ProfileRole } from "@/lib/getCurrentProfile";
import SignOutButton from "@/components/admin/SignOutButton";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OwnerActions from "@/components/admin/OwnerActions";
import AdminTransferPanel from "@/components/admin/AdminTransferPanel";

type PortableTextChild = { text?: string };
type PortableTextBlock = { _key?: string; children?: PortableTextChild[] };

export const revalidate = 0;
export const dynamic = "force-dynamic";

function RoleBadge({ role }: { role: ProfileRole }) {
  const palette: Record<ProfileRole, string> = {
    viewer: "bg-white/10 text-white",
    editor: "bg-emerald-500/20 text-emerald-200 border-emerald-400/60",
    admin: "bg-amber-500/20 text-amber-100 border-amber-400/70",
    owner: "bg-red-600/25 text-red-100 border-red-500/70",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${palette[role]}`}
    >
      {role}
    </span>
  );
}

function PendingApproval() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-8 py-10 text-white shadow-2xl backdrop-blur">
      <RoleBadge role="viewer" />
      <h1 className="text-2xl font-bold">Pending approval</h1>
      <p className="text-white/70">
        Your account is logged in but not approved for officer access yet. If you believe this is a mistake, please
        contact the ASU president or web admin.
      </p>
    </div>
  );
}

function DashboardHeader({ role }: { role: ProfileRole }) {
  const subtitle: Record<ProfileRole, string> = {
    viewer: "Pending approval",
    editor: "Full CMS editing access",
    admin: "Site admin access",
    owner: "Owner access with system controls",
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-amber-200/80">Admin Dashboard</p>
        <h1 className="text-3xl font-extrabold text-white">ASU Control Center</h1>
        <p className="text-sm text-white/70">{subtitle[role]}</p>
      </div>
      <div className="flex items-center gap-3">
        <SignOutButton />
        <div className="flex items-center gap-2">
          <RoleBadge role={role} />
          {role === "owner" && (
            <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-100">
              Owner mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/adminlogin");
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-white">
        <div className="rounded-2xl border border-white/10 bg-red-900/30 px-6 py-5 shadow-lg">
          <h1 className="text-xl font-bold">Profile not found</h1>
          <p className="mt-2 text-white/80">
            We could not locate your profile record. Please try signing out and back in, or contact the site admin.
          </p>
        </div>
      </div>
    );
  }

  if (profile.role === "viewer") {
    return (
      <div className="px-4 py-12">
        <PendingApproval />
      </div>
    );
  }

  const isAdmin = profile.role === "admin" || profile.role === "owner";
  const isOwner = profile.role === "owner";
  const isAdminOnly = profile.role === "admin";

  type AdminEvent = {
    id: string;
    title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  link: string | null;
  slug: string | null;
  description: PortableTextBlock[] | null;
  image_url: string | null;
  featured: boolean;
};

  type AdminOfficer = {
    id: string;
    name: string;
    role: string;
    sort_order: number | null;
    bio: string | null;
    image_url: string | null;
    email: string | null;
    instagram: string | null;
    linkedin: string | null;
    major?: string | null;
    year?: string | null;
  };

  type AdminAlbum = {
    id: string;
    title: string;
    date: string | null;
    google_photos_url: string | null;
    cover_image_url: string | null;
    description: string | null;
  };

  type AdminCarousel = {
    id: string;
    alt: string | null;
    sort_order: number | null;
    image_url: string | null;
  };

  const [
    { data: eventsData, error: eventsError },
    { data: officersData, error: officersError },
    { data: albumsData, error: albumsError },
    { data: carouselData, error: carouselError },
  ] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("id,title,date,time,location,link,featured,slug,description,image_url")
      .order("date", { ascending: true }),
    supabaseAdmin
      .from("officers")
      .select("id,name,role,sort_order,bio,image_url,email,instagram,linkedin,major,year")
      .order("sort_order", { ascending: true, nullsFirst: true })
      .order("role", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("gallery_albums")
      .select("id,title,date,google_photos_url,cover_image_url,description")
      .order("date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("home_carousel_images")
      .select("id,alt,sort_order,image_url")
      .order("sort_order", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true }),
  ]);

  if (eventsError) console.error("Failed to load events for admin", eventsError);
  if (officersError) console.error("Failed to load officers for admin", officersError);
  if (albumsError) console.error("Failed to load gallery albums for admin", albumsError);
  if (carouselError) console.error("Failed to load carousel images for admin", carouselError);

  const events: AdminEvent[] = eventsData ?? [];
  const officers: AdminOfficer[] = officersData ?? [];
  const albums: AdminAlbum[] = albumsData ?? [];
  const carousel: AdminCarousel[] = carouselData ?? [];

  return (
    <main
      className="flex min-h-screen w-full justify-center pb-24 md:pb-32"
      style={{ paddingTop: "clamp(12rem, 18vh, 20rem)" }}
    >
      <div className="w-full max-w-6xl px-4 flex flex-col gap-12">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-2xl backdrop-blur">
          <DashboardHeader role={profile.role} />
        </div>

        <ControlCenterPanels events={events} officers={officers} albums={albums} carousel={carousel} />

        {isAdmin && (
          <section className="w-full rounded-2xl border border-amber-400/30 bg-amber-400/10 px-6 py-5 shadow-xl backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Permissions</p>
                <h2 className="text-xl font-bold text-white">Role Management</h2>
                <p className="text-sm text-white/70">Manage officer access levels and approvals.</p>
              </div>
              <Link
                href="/admin/roles"
                className="inline-flex items-center rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
              >
                Go to Role Management
              </Link>
            </div>
          </section>
        )}

        {isAdminOnly && (
          <section className="w-full rounded-2xl border border-amber-400/40 bg-amber-400/10 px-6 py-5 shadow-xl backdrop-blur">
            <AdminTransferPanel />
          </section>
        )}

        {isOwner && (
          <section className="w-full rounded-2xl border border-red-500/30 bg-red-600/10 px-6 py-5 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-200/80">System Controls</p>
                <h2 className="text-xl font-bold text-white">Owner Actions</h2>
                <p className="text-sm text-white/70">
                  Reserved for the site maintainer. These actions are immediate and irreversible.
                </p>
              </div>
              <OwnerActions />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
