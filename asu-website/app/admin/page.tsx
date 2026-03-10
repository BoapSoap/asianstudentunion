import Link from "next/link";
import { redirect } from "next/navigation";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import ControlCenterPanels from "@/components/admin/ControlCenterPanels";
import AdminLogsPanel from "@/components/admin/AdminLogsPanel";
import { getCurrentProfile, type ProfileRole } from "@/lib/getCurrentProfile";
import SignOutButton from "@/components/admin/SignOutButton";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OwnerActions from "@/components/admin/OwnerActions";
import AdminTransferPanel from "@/components/admin/AdminTransferPanel";
import type { AdminActivityLogRecord } from "@/lib/adminActivity";

type PortableTextChild = { text?: string };
type PortableTextBlock = { _key?: string; children?: PortableTextChild[] };

export const revalidate = 0;
export const dynamic = "force-dynamic";

function RoleBadge({ role }: { role: ProfileRole }) {
  const color = role === "owner" ? "error" : role === "admin" ? "warning" : role === "editor" ? "success" : "default";

  return (
    <Chip
      color={color}
      label={role}
      size="small"
      sx={{
        textTransform: "uppercase",
        fontWeight: 700,
        letterSpacing: "0.05em",
      }}
    />
  );
}

function PendingApproval() {
  return (
    <Paper
      variant="outlined"
      sx={{
        mx: "auto",
        maxWidth: 780,
        p: 4,
        borderRadius: 3,
        borderColor: "rgba(255,255,255,0.15)",
        bgcolor: "rgba(255,255,255,0.06)",
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <RoleBadge role="viewer" />
        </Box>
        <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800 }}>
          Pending approval
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.72)" }}>
          Your account is logged in but not approved for officer access yet. If you believe this is a mistake, please contact the ASU president or web admin.
        </Typography>
      </Stack>
    </Paper>
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
    <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2.2}>
      <Box>
        <Typography variant="overline" sx={{ color: "rgba(253, 230, 138, 0.84)", fontWeight: 700, letterSpacing: "0.22em" }}>
          Admin Dashboard
        </Typography>
        <Typography variant="h4" sx={{ color: "#fff", fontWeight: 900, lineHeight: 1.15 }}>
          ASU Control Center
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.74)", mt: 0.6 }}>
          {subtitle[role]}
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ xs: "flex-start", sm: "center" }}>
        <Link href="/admin/store" style={{ textDecoration: "none" }}>
          <Button
            size="small"
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              color: "#d1fae5",
              borderColor: "rgba(52, 211, 153, 0.58)",
              bgcolor: "rgba(16, 185, 129, 0.16)",
              "&:hover": { bgcolor: "rgba(16, 185, 129, 0.24)", borderColor: "rgba(110, 231, 183, 0.74)" },
            }}
          >
            Store Management
          </Button>
        </Link>

        <SignOutButton />

        <Stack direction="row" spacing={1} alignItems="center">
          <RoleBadge role={role} />
          {role === "owner" && (
            <Chip
              label="Owner mode"
              size="small"
              color="error"
              sx={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

export default async function AdminPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/adminlogin");
  }

  if (!profile) {
    return (
      <Box sx={{ mx: "auto", maxWidth: 960, px: 2, py: 12 }}>
        <Paper
          variant="outlined"
          sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.15)", bgcolor: "rgba(127, 29, 29, 0.35)", p: 3 }}
        >
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
            Profile not found
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,0.82)" }}>
            We could not locate your profile record. Please try signing out and back in, or contact the site admin.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (profile.role === "viewer") {
    return (
      <Box sx={{ px: 2, py: 12 }}>
        <PendingApproval />
      </Box>
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
    display_until: string | null;
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
    { data: activityLogsData, error: activityLogsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("id,title,date,time,display_until,location,link,featured,slug,description,image_url")
      .or("display_until.is.null,display_until.gt.now()")
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
    isAdmin
      ? supabaseAdmin
          .from("admin_activity_logs")
          .select("id,actor_email,actor_role,action,entity_type,entity_id,summary,details,created_at")
          .order("created_at", { ascending: false })
          .limit(25)
      : Promise.resolve({ data: [] as AdminActivityLogRecord[], error: null }),
  ]);

  if (eventsError) console.error("Failed to load events for admin", eventsError);
  if (officersError) console.error("Failed to load officers for admin", officersError);
  if (albumsError) console.error("Failed to load gallery albums for admin", albumsError);
  if (carouselError) console.error("Failed to load carousel images for admin", carouselError);
  if (activityLogsError) console.error("Failed to load admin activity logs", activityLogsError);

  const events: AdminEvent[] = eventsData ?? [];
  const officers: AdminOfficer[] = officersData ?? [];
  const albums: AdminAlbum[] = albumsData ?? [];
  const carousel: AdminCarousel[] = carouselData ?? [];
  const activityLogs: AdminActivityLogRecord[] = (activityLogsData as AdminActivityLogRecord[] | null) ?? [];

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", pb: { xs: 12, md: 16 }, pt: "clamp(12rem, 18vh, 20rem)" }}>
      <Stack spacing={5} sx={{ width: "100%", maxWidth: 1200, px: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: "rgba(255,255,255,0.15)",
            bgcolor: "rgba(255,255,255,0.06)",
            p: 3,
            boxShadow: "0 24px 42px rgba(0,0,0,0.24)",
          }}
        >
          <DashboardHeader role={profile.role} />
        </Paper>

        <ControlCenterPanels events={events} officers={officers} albums={albums} carousel={carousel} />

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: "rgba(16, 185, 129, 0.34)",
            bgcolor: "rgba(16, 185, 129, 0.14)",
            p: 3,
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ color: "rgba(167, 243, 208, 0.95)", fontWeight: 700, letterSpacing: "0.08em" }}>
                Store
              </Typography>
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800 }}>
                ASU Merch Store
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", mt: 0.5 }}>
                Manage store visibility, products, treasurer contact, and preorder fulfillment statuses.
              </Typography>
            </Box>
            <Link href="/admin/store" style={{ textDecoration: "none" }}>
              <Button
                variant="contained"
                sx={{
                  alignSelf: { xs: "flex-start", md: "center" },
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                  bgcolor: "#a7f3d0",
                  color: "#064e3b",
                  "&:hover": { bgcolor: "#6ee7b7" },
                }}
              >
                Open Store Management
              </Button>
            </Link>
          </Stack>
        </Paper>

        {isAdmin && (
          <AdminLogsPanel logs={activityLogs} />
        )}

        {isAdmin && (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: "rgba(245, 158, 11, 0.4)",
              bgcolor: "rgba(245, 158, 11, 0.12)",
              p: 3,
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="overline" sx={{ color: "rgba(253, 230, 138, 0.94)", fontWeight: 700, letterSpacing: "0.08em" }}>
                  Permissions
                </Typography>
                <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800 }}>
                  Role Management
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", mt: 0.5 }}>
                  Manage officer access levels and approvals.
                </Typography>
              </Box>
              <Link href="/admin/roles" style={{ textDecoration: "none" }}>
                <Button
                  variant="contained"
                  sx={{
                    alignSelf: { xs: "flex-start", md: "center" },
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#f59e0b",
                    color: "#111827",
                    "&:hover": { bgcolor: "#fbbf24" },
                  }}
                >
                  Go to Role Management
                </Button>
              </Link>
            </Stack>
          </Paper>
        )}

        {isAdminOnly && <AdminTransferPanel />}

        {isOwner && (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: "rgba(239, 68, 68, 0.35)",
              bgcolor: "rgba(185, 28, 28, 0.2)",
              p: 3,
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="overline" sx={{ color: "rgba(254, 202, 202, 0.9)", fontWeight: 700, letterSpacing: "0.08em" }}>
                  System Controls
                </Typography>
                <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800 }}>
                  Owner Actions
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", mt: 0.5 }}>
                  Reserved for the site maintainer. These actions are immediate and irreversible.
                </Typography>
              </Box>
              <OwnerActions />
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
