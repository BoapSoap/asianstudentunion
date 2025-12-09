// app/page.tsx

import { Box, Typography, Button, Chip } from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import HomeCarousel from "../components/HomeCarousel";
import UpcomingEventsSection from "../components/UpcomingEventsSection";
import { Inter, Roboto_Mono } from "next/font/google";
import Link from "next/link";
import HeroHeader from "../components/HeroHeader";

// make this page always dynamic / non-cached
export const revalidate = 0;
export const dynamic = "force-dynamic";

type PortableTextChild = { text?: string };
type PortableTextBlock = { _key?: string; children?: PortableTextChild[] };

// Inter for big hero headline
const heroTitleFont = Inter({
    subsets: ["latin"],
    weight: ["800"],
});

// Roboto Mono for the subline
const heroSubFont = Roboto_Mono({
    subsets: ["latin"],
    weight: ["400"],
});

function getFeaturedSummary(description?: PortableTextBlock[]) {
    const text =
        description?.[0]?.children
            ?.map((c: PortableTextChild) => c?.text || "")
            .join("")
            .trim() || "";
    if (!text) return "Join us for this special event.";
    const limit = 240;
    return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

type EventRow = {
    id: string;
    title: string;
    date: string | null;
    time: string | null;
    location: string | null;
    featured: boolean;
    link: string | null;
    image_url: string | null;
    slug: string;
    description: PortableTextBlock[] | null;
};

type Event = {
    _id: string;
    id?: string;
    title: string;
    date?: string;
    time?: string;
    location?: string;
    featured?: boolean;
    link?: string;
    imageUrl?: string;
    slug?: string;
    description?: PortableTextBlock[];
};

type CarouselImageRow = {
    id: string;
    image_url: string;
    alt: string | null;
};

function formatEventDate(dateStr?: string) {
    if (!dateStr) return "";

    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;

    const [year, month, day] = parts.map(Number);
    const d = new Date(year, month - 1, day);
    if (Number.isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default async function HomePage() {
    const [{ data: eventsData, error: eventsError }, { data: carouselData, error: carouselError }] =
        await Promise.all([
            supabase
                .from("events")
                .select("*")
                .order("date", { ascending: true }),
            supabase
                .from("home_carousel_images")
                .select("*")
                .order("sort_order", { ascending: true, nullsFirst: true })
                .order("created_at", { ascending: true }),
        ]);

    if (eventsError) {
        console.error("Failed to load events from Supabase", eventsError);
    }
    if (carouselError) {
        console.error("Failed to load home carousel images from Supabase", carouselError);
    }

    const events: Event[] = (eventsData ?? []).map((row: EventRow) => ({
        _id: row.id,
        id: row.id,
        title: row.title,
        date: row.date ?? undefined,
        time: row.time ?? undefined,
        location: row.location ?? undefined,
        featured: row.featured,
        link: row.link ?? undefined,
        imageUrl: row.image_url ?? undefined,
        slug: row.slug,
        description: row.description ?? undefined,
    }));

    const featured = events.find((e) => e.featured) || null;
    const upcomingEvents: Event[] = featured
        ? events.filter((e) => e._id !== featured._id)
        : events;

    const carouselImages = (carouselData ?? [])
        .map((img: CarouselImageRow) => img.image_url)
        .filter(Boolean);

    return (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pb: { xs: 6, md: 8 },
            }}
        >
            {/* ---------------------- HERO SECTION ---------------------- */}
            <HeroHeader
                titleClassName={heroTitleFont.className}
                subtitleClassName={heroSubFont.className}
            />

            {/* ---------------------- CAROUSEL ---------------------- */}
            <HomeCarousel images={carouselImages} />

            {/* ---------------------- FEATURED EVENT ---------------------- */}
            {featured && (
                <Box sx={{ width: "90%", maxWidth: "900px", mb: 6, mt: 4 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            mb: 2,
                            fontWeight: 700,
                            color: "white",
                            textShadow: "0 2px 4px rgba(0,0,0,0.4)",
                        }}
                    >
                        Featured Event
                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            width: "100%",
                            borderRadius: "24px",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.14)",
                            border: "1px solid rgba(255,255,255,0.22)",
                            boxShadow: "0 12px 38px rgba(0,0,0,0.28)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                        }}
                    >
                        <img
                            src={featured.imageUrl || "/mainpagephotos/bonfiremain.jpg"}
                            alt={featured.title}
                            style={{
                                width: "100%",
                                maxWidth: "48%",
                                objectFit: "cover",
                                minHeight: 220,
                            }}
                        />

                        <Box
                            sx={{
                                flex: 1,
                                color: "white",
                                p: { xs: 2.5, md: 3.25 },
                                position: "relative",
                                background:
                                    "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.08), transparent 35%), rgba(0,0,0,0.35)",
                            }}
                        >
                            <Chip
                                label="Featured"
                                sx={{
                                    backgroundColor: "var(--accent-color)",
                                    color: "var(--primary-color)",
                                    fontWeight: 700,
                                    mb: 1,
                                }}
                            />

                            <Typography
                                component="h2"
                                sx={{
                                    fontWeight: 800,
                                    fontSize: { xs: "1.5rem", md: "1.85rem" },
                                    mb: 1,
                                    color: "var(--accent-color)",
                                    textShadow: "0 1px 8px rgba(0,0,0,0.35)",
                                }}
                            >
                                {featured.title}
                            </Typography>

                            <Typography
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    alignItems: "center",
                                    color: "rgba(255,255,255,0.95)",
                                    mb: 0.5,
                                    fontWeight: 500,
                                    fontSize: { xs: "1rem", md: "1.05rem" },
                                }}
                            >
                                {featured.date && <span>{formatEventDate(featured.date)}</span>}
                                {featured.time && (
                                    <>
                                        <span>•</span>
                                        <span>{featured.time}</span>
                                    </>
                                )}
                            </Typography>

                            {featured.location && (
                                <Typography
                                    sx={{
                                        color: "rgba(255,255,255,0.95)",
                                        mb: 1.5,
                                        fontWeight: 500,
                                        fontSize: { xs: "1rem", md: "1.05rem" },
                                    }}
                                >
                                    {featured.location}
                                </Typography>
                            )}

                            {typeof featured.slug === "string" && featured.slug.trim() !== "" && (
                                <Link href={`/events/${featured.slug}`} style={{ textDecoration: "none" }}>
                                    <Button
                                        sx={{
                                            backgroundColor: "var(--accent-color)",
                                            color: "var(--primary-color)",
                                            fontWeight: 800,
                                            textTransform: "none",
                                            px: 2.5,
                                            py: 1,
                                            borderRadius: 999,
                                            "&:hover": { backgroundColor: "#ffdc55" },
                                        }}
                                    >
                                        Learn More
                                    </Button>
                                </Link>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ---------------------- UPCOMING EVENTS ---------------------- */}
            <Box
                id="events"
                sx={{
                    width: "90%",
                    maxWidth: "800px",
                    mb: 10,
                    scrollMarginTop: { xs: 110, md: 140 },
                }}
            >
                <Typography
                    variant="h4"
                    sx={{ mb: 2, fontWeight: 700, color: "white" }}
                >
                    Upcoming Events
                </Typography>

                {upcomingEvents.length === 0 ? (
                    <Typography sx={{ color: "#ddd" }}>
                        No upcoming events yet. Stay posted on our Instagram for updates.
                    </Typography>
                ) : (
                    <UpcomingEventsSection events={upcomingEvents} />
                )}
            </Box>
        </Box>
    );
}
