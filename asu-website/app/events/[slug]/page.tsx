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
import { groq } from "next-sanity";
import { client } from "../../../sanity/lib/client";

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

// INLINE query: no $slug param
const eventBySlugQuery = (slug: string) => groq`
  *[_type == "event" && slug.current == "${slug}"][0]{
    _id,
    title,
    "slug": slug.current,
    date,
    time,
    location,
    link,
    featured,
    "imageUrl": image.asset->url,
    description
  }
`;

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

// NOTE: params is a Promise in your Next version, so we must await it
export default async function EventPage({
                                            params,
                                        }: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const event = await client.fetch<Event | null>(eventBySlugQuery(slug));

    if (!event) {
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
                <Typography>No event found for this slug.</Typography>
            </Box>
        );
    }

    const primaryCtaHref =
        event.link && event.link.trim() !== ""
            ? event.link
            : "/#events";

    const primaryCtaLabel =
        event.link && event.link.trim() !== "" ? "Sign Up" : "Back to Events";

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
                        sx={{
                            maxHeight: 460,
                            objectFit: "cover",
                        }}
                    />
                )}

                <CardContent
                    sx={{
                        p: { xs: 3, md: 4 },
                    }}
                >
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

                        {/* Top-right Back to Events */}
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

                    {/* Bottom CTA row – single yellow button */}
                    <Box
                        sx={{
                            mt: 4,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        <Button
                            href={primaryCtaHref}
                            sx={{
                                backgroundColor: "var(--accent-color)",
                                color: "var(--primary-color)",
                                fontWeight: 700,
                                textTransform: "none",
                                px: 3,
                                "&:hover": { backgroundColor: "#ffdc55" },
                            }}
                        >
                            {primaryCtaLabel}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
