// app/page.tsx

import { Box, Typography, Button, CardMedia, Chip } from "@mui/material";
import { client } from "../sanity/lib/client";
import {
    allEventsQuery,
    featuredEventQuery,
    homeCarouselImagesQuery,
} from "../sanity/lib/queries";
import HomeCarousel from "../components/HomeCarousel";
import UpcomingEventsSection from "../components/UpcomingEventsSection";
import { Inter, Roboto_Mono } from "next/font/google";
import Link from "next/link";
import HeroHeader from "../components/HeroHeader";

// make this page always dynamic / non-cached
export const revalidate = 0;
export const dynamic = "force-dynamic";

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

function getFeaturedSummary(description?: any[]) {
    const text =
        description?.[0]?.children
            ?.map((c: any) => c?.text || "")
            .join("")
            .trim() || "";
    if (!text) return "Join us for this special event.";
    const limit = 240;
    return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

type Event = {
    _id: string;
    title: string;
    date?: string;
    time?: string;
    location?: string;
    featured?: boolean;
    link?: string;
    imageUrl?: string;
    slug?: string;
    description?: any[];
};

type CarouselImage = {
    _id: string;
    imageUrl: string;
    alt?: string;
};

function formatEventDate(dateStr?: string) {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);

    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default async function HomePage() {
    const [events, featured, carouselEntries] = await Promise.all([
        client.fetch<Event[]>(allEventsQuery, {}, { cache: "no-store" }),
        client.fetch<Event | null>(featuredEventQuery, {}, { cache: "no-store" }),
        client.fetch<CarouselImage[]>(homeCarouselImagesQuery, {}, {
            cache: "no-store",
        }),
    ]);

    const upcomingEvents: Event[] = featured
        ? events.filter((e) => e._id !== featured._id)
        : events;

    const carouselImages = (carouselEntries || []).map((img) => img.imageUrl);

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
                        <CardMedia
                            component="img"
                            image={featured.imageUrl || "/mainpagephotos/bonfiremain.jpg"}
                            alt={featured.title}
                            sx={{
                                width: { xs: "100%", md: "48%" },
                                objectFit: "cover",
                                minHeight: { xs: 220, md: "100%" },
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
