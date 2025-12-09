// app/events/[slug]/page.tsx
import {
    Box,
    Typography,
    Button,
    Card,
    CardMedia,
    CardContent,
    Chip,
    Stack,
} from "@mui/material";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type PortableTextChild = { text?: string };
type PortableTextBlock = { _key: string; children?: PortableTextChild[] };

type EventRow = {
    id: string;
    title: string;
    slug: string;
    date: string | null;
    time: string | null;
    location: string | null;
    link: string | null;
    featured: boolean;
    image_url: string | null;
    description: PortableTextBlock[] | null;
};

type Event = {
    id: string;
    title: string;
    slug?: string;
    date?: string;
    time?: string;
    location?: string;
    link?: string;
    featured?: boolean;
    imageUrl?: string;
    description?: PortableTextBlock[];
};

function formatEventDate(dateStr?: string) {
    if (!dateStr) return "";

    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;

    const [year, month, day] = parts.map(Number);
    const d = new Date(year, month - 1, day);

    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function Description({ blocks }: { blocks?: PortableTextBlock[] }) {
    if (!blocks || !blocks.length) return null;

    return (
        <Box sx={{ mt: 2 }}>
            {blocks.map((block) => (
                <Typography key={block._key} sx={{ mb: 1, color: "white" }}>
                    {block.children?.map((child: PortableTextChild) => child?.text ?? "").join("")}
                </Typography>
            ))}
        </Box>
    );
}

// NOTE: in Next 16, params is a Promise and must be awaited
export default async function EventPage({
                                            params,
                                        }: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Simple safety check
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                }}
            >
                <Typography>Invalid event slug.</Typography>
            </Box>
        );
    }

    // Fetch the single event by slug PLUS all events for debug
    const [{ data: eventRow, error: eventError }, { data: allEvents, error: allEventsError }] =
        await Promise.all([
            supabase
                .from<EventRow>("events")
                .select("*")
                .eq("slug", slug)
                .maybeSingle(),
            supabase
                .from<EventRow>("events")
                .select("slug")
                .order("slug", { ascending: true }),
        ]);

    if (eventError) {
        console.error("Failed to load event", eventError);
    }
    if (allEventsError) {
        console.error("Failed to load events list", allEventsError);
    }

    const event: Event | null = eventRow
        ? {
            id: eventRow.id,
            title: eventRow.title,
            slug: eventRow.slug,
            date: eventRow.date ?? undefined,
            time: eventRow.time ?? undefined,
            location: eventRow.location ?? undefined,
            link: eventRow.link ?? undefined,
            featured: eventRow.featured,
            imageUrl: eventRow.image_url ?? undefined,
            description: eventRow.description ?? undefined,
        }
        : null;

    if (!event) {
        // Debug view so we can see what slugs exist in Supabase
        const availableSlugs = (allEvents ?? []).map((e) => e.slug);
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    p: 4,
                }}
            >
                <Box sx={{ maxWidth: 800 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        No event found for slug: <code>{slug}</code>
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                        Available event slugs from Supabase:
                    </Typography>
                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: 12,
                        }}
                    >
                        {JSON.stringify(availableSlugs, null, 2)}
                    </pre>
                </Box>
            </Box>
        );
    }

    const hasExternalLink =
        typeof event.link === "string" && event.link.trim() !== "";

    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                pt: 10,
                pb: 10,
            }}
        >
            <Card
                sx={{
                    width: "90%",
                    maxWidth: "1000px",
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(14px)",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.25)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
                    color: "white",
                }}
            >
                {event.imageUrl && (
                    <CardMedia
                        component="img"
                        image={event.imageUrl}
                        alt={event.title}
                        sx={{ maxHeight: 460, objectFit: "cover" }}
                    />
                )}

                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={2}
                        sx={{ mb: 2 }}
                    >
                        <Box>
                            {event.featured && (
                                <Chip
                                    label="Featured Event"
                                    sx={{
                                        mb: 1.5,
                                        backgroundColor: "var(--accent-color)",
                                        color: "var(--primary-color)",
                                        fontWeight: 700,
                                    }}
                                />
                            )}

                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    color: "var(--accent-color)",
                                    mb: 1,
                                }}
                            >
                                {event.title}
                            </Typography>

                            <Typography sx={{ opacity: 0.9 }}>
                                {formatEventDate(event.date)}
                                {event.time ? ` • ${event.time}` : ""}
                            </Typography>

                            {event.location && (
                                <Typography sx={{ opacity: 0.9 }}>
                                    {event.location}
                                </Typography>
                            )}
                        </Box>

                        {/* Back to Events (top-right) */}
                        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
                            <Link href="/#events" style={{ textDecoration: "none" }}>
                                <Button
                                    sx={{
                                        color: "white",
                                        borderColor: "rgba(255,255,255,0.5)",
                                        borderWidth: 1,
                                        borderStyle: "solid",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        "&:hover": {
                                            backgroundColor: "rgba(255,255,255,0.08)",
                                        },
                                    }}
                                >
                                    Back to Events
                                </Button>
                            </Link>
                        </Box>
                    </Stack>

                    <Description blocks={event.description} />

                    <Box
                        sx={{
                            mt: 4,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        {hasExternalLink && (
                            <Button
                                href={event.link as string}
                                sx={{
                                    backgroundColor: "var(--accent-color)",
                                    color: "var(--primary-color)",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    px: 3,
                                    "&:hover": { backgroundColor: "#ffdc55" },
                                }}
                            >
                                Sign Up
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
