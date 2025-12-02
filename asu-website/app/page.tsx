// app/page.tsx

import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    CardMedia,
    Chip,
} from "@mui/material";
import { client } from "../sanity/lib/client";
import {
    allEventsQuery,
    featuredEventQuery,
    homeCarouselImagesQuery,
} from "../sanity/lib/queries";
import HomeCarousel from "../components/HomeCarousel";
import UpcomingEventsSection from "../components/UpcomingEventsSection";
import { Inter, Roboto_Mono } from "next/font/google";

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
            }}
        >
            {/* ---------------------- HERO SECTION ---------------------- */}
            <Box
                sx={{
                    textAlign: "center",
                    mt: { xs: 2.5, md: 4 },
                    mb: { xs: 1.5, md: 2.5 },
                    px: 2,
                }}
            >
                <Typography
                    component="h1"
                    className="hero-title-letters"
                    sx={{
                        fontFamily: heroTitleFont.style.fontFamily,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: { xs: "0.0025em", md: "0.08em" },
                        fontSize: { xs: "1.45rem", sm: "2.2rem", md: "3.3rem", lg: "3.8rem" },
                        lineHeight: { xs: 1.04, md: 1.05 },
                        color: "var(--accent-color)",
                        textShadow: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        rowGap: "0.1em",
                    }}
                >
                    {["Asian", "Student", "Union"].map((word, wi) => (
                        <Box
                            key={word}
                            sx={{
                                display: "inline-flex",
                                flexWrap: "nowrap",
                                mr: wi === 2 ? 0 : { xs: "0.15em", md: "0.35em" },
                            }}
                        >
                            {Array.from(word).map((char, idx) => (
                                <Box
                                    key={`${word}-${idx}`}
                                    component="span"
                                    className="hero-char"
                                    sx={{
                                        display: "inline-block",
                                        px: { xs: "0.01em", md: "0.04em" },
                                        transition:
                                            "letter-spacing .2s ease, transform .2s ease, color .2s ease",
                                        letterSpacing: "0em",
                                    }}
                                >
                                    {char}
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Typography>

                <Typography
                    variant="h6"
                    sx={{
                        color: "var(--accent-color)",
                        mt: 1,
                        opacity: 0.95,
                        fontSize: { xs: "1rem", sm: "1.15rem" },
                        fontStyle: "normal",
                        fontFamily: heroSubFont.style.fontFamily,
                        letterSpacing: "0.05em",
                        textShadow: "0 2px 6px rgba(0,0,0,0.35)",
                    }}
                >
                    Celebrating Culture & Community at SFSU
                </Typography>
            </Box>

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

                    <Card
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            background: "rgba(255,255,255,0.15)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "18px",
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.25)",
                            boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
                        }}
                    >
                        <CardMedia
                            component="img"
                            image={
                                featured.imageUrl || "/mainpagephotos/bonfiremain.jpg"
                            }
                            alt={featured.title}
                            sx={{
                                width: { xs: "100%", md: "50%" },
                                objectFit: "cover",
                            }}
                        />

                        <CardContent sx={{ flex: 1, color: "white" }}>
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
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: "var(--accent-color)",
                                }}
                            >
                                {featured.title}
                            </Typography>

                            <Typography sx={{ mt: 1 }}>
                                {formatEventDate(featured.date)}
                                {featured.time ? ` • ${featured.time}` : ""}
                            </Typography>
                            <Typography sx={{ mb: 2 }}>{featured.location}</Typography>

                            {/* Learn More should ALWAYS go to the detail page if slug exists */}
                            {typeof featured.slug === "string" &&
                                featured.slug.trim() !== "" && (
                                    <Button
                                        href={`/events/${featured.slug}`}
                                        sx={{
                                            backgroundColor: "var(--accent-color)",
                                            color: "var(--primary-color)",
                                            fontWeight: 700,
                                            textTransform: "none",
                                            "&:hover": { backgroundColor: "#ffdc55" },
                                        }}
                                    >
                                        Learn More
                                    </Button>
                                )}
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* ---------------------- UPCOMING EVENTS ---------------------- */}
            <Box id="events" sx={{ width: "90%", maxWidth: "800px", mb: 10 }}>
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
