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
import { client } from "../../../sanity/lib/client";
import { singleEventQuery, allEventsQuery } from "../../../sanity/lib/queries";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type Event = {
    _id: string;
    title: string;
    slug?: string;
    date?: string;
    time?: string;
    location?: string;
    link?: string;
    featured?: boolean;
    imageUrl?: string;
    description?: any[];
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

function Description({ blocks }: { blocks?: any[] }) {
    if (!blocks || !blocks.length) return null;

    return (
        <Box sx={{ mt: 2 }}>
            {blocks.map((block) => (
                <Typography key={block._key} sx={{ mb: 1, color: "white" }}>
                    {block.children?.map((child: any) => child.text).join("")}
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
    const [event, allEvents] = await Promise.all([
        client.fetch<Event | null>(singleEventQuery, { slug }),
        client.fetch<Event[]>(allEventsQuery, {}, { cache: "no-store" }),
    ]);

    if (!event) {
        // Debug view so we can see what slugs exist in Sanity
        const availableSlugs = allEvents.map((e) => e.slug);
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
                        Available event slugs from Sanity:
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
                            <Button
                                href="/#events"
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
