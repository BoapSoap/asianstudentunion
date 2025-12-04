"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Collapse,
    Divider,
} from "@mui/material";

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

export default function UpcomingEventsSection({ events }: { events: Event[] }) {
    const [openId, setOpenId] = useState<string | null>(null);
    const router = useRouter();

    const toggleOpen = (id: string) => {
        setOpenId((current) => (current === id ? null : id));
    };

    return (
        <>
            {events.map((event) => {
                const isFeatured = !!event.featured;
                const hasSlug = !!event.slug;

                // Featured -> go to dedicated page
                const href =
                    isFeatured && hasSlug
                        ? `/events/${event.slug}`
                        : undefined;

                const handleClick = () => {
                    if (href) {
                        router.push(href);
                        return;
                    }
                    toggleOpen(event._id);
                };

                const isOpen = openId === event._id;

                return (
                    <Card
                        key={event._id}
                        sx={{
                            mb: 3,
                            borderRadius: "16px",
                            background: "rgba(255,255,255,0.18)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.22)",
                            boxShadow: "0 6px 22px rgba(0,0,0,0.28)",
                            color: "white",
                        }}
                    >
                        <CardContent>
                            <Typography
                                variant="h5"
                                sx={{ fontWeight: 700, color: "var(--accent-color)" }}
                            >
                                {event.title}
                            </Typography>

                            <Typography sx={{ mb: 2, fontSize: "1.05rem", color: "white" }}>
                                {formatEventDate(event.date)}
                                {event.time ? ` • ${event.time}` : ""}
                                {event.location ? ` • ${event.location}` : ""}
                            </Typography>

                            <Button
                                onClick={handleClick}
                                sx={{
                                    backgroundColor: "var(--primary-color)",
                                    color: "var(--accent-color)",
                                    fontWeight: 700,
                                    "&:hover": { backgroundColor: "#8d1515" },
                                }}
                            >
                                {href ? "Learn More" : isOpen ? "Hide Details" : "Learn More"}
                            </Button>

                            {/* Dropdown details for NON-featured events */}
                            {!href && (
                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <Divider
                                        sx={{
                                            mt: 2,
                                            mb: 2,
                                            borderColor: "rgba(255,255,255,0.25)",
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            background: "rgba(0,0,0,0.35)",
                                            borderRadius: "12px",
                                            padding: 2,
                                        }}
                                    >
                                        {event.description && event.description.length > 0 ? (
                                            event.description.map((block: any) => (
                                                <Typography
                                                    key={block._key}
                                                    sx={{ mb: 1, color: "white" }}
                                                >
                                                    {block.children
                                                        ?.map((child: any) => child.text)
                                                        .join("")}
                                                </Typography>
                                            ))
                                        ) : (
                                            <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>
                                                More details coming soon.
                                            </Typography>
                                        )}

                                        {event.link && event.link.trim() !== "" && (
                                            <Box sx={{ mt: 2 }}>
                                                <Button
                                                    href={event.link}
                                                    sx={{
                                                        backgroundColor: "var(--accent-color)",
                                                        color: "var(--primary-color)",
                                                        fontWeight: 700,
                                                        "&:hover": { backgroundColor: "#ffdc55" },
                                                    }}
                                                >
                                                    Open Signup / Tickets
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                </Collapse>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </>
    );
}
