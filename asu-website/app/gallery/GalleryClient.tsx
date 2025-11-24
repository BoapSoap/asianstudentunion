// app/gallery/GalleryClient.tsx
"use client";

import { useMemo, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Button,
    TextField,
    MenuItem,
} from "@mui/material";

type Album = {
    _id: string;
    title: string;
    date?: string;
    description?: string;
    googlePhotosUrl: string;
    coverImageUrl?: string;
};

type SortOption = "newest" | "oldest" | "title";

function formatAlbumDate(dateStr?: string) {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);

    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function extractYear(dateStr?: string): string | null {
    if (!dateStr) return null;
    const [year] = dateStr.split("-");
    return year || null;
}

type GalleryClientProps = {
    albums: Album[];
};

export default function GalleryClient({ albums }: GalleryClientProps) {
    const [sortOption, setSortOption] = useState<SortOption>("newest");
    const [yearFilter, setYearFilter] = useState<string>("all");

    const yearOptions = useMemo(() => {
        const years = new Set<string>();
        albums.forEach((album) => {
            const y = extractYear(album.date);
            if (y) years.add(y);
        });
        return Array.from(years).sort((a, b) => Number(b) - Number(a));
    }, [albums]);

    const visibleAlbums = useMemo(() => {
        let list = [...albums];

        if (yearFilter !== "all") {
            list = list.filter((album) => extractYear(album.date) === yearFilter);
        }

        list.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;

            switch (sortOption) {
                case "newest":
                    return dateB - dateA;
                case "oldest":
                    return dateA - dateB;
                case "title":
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        return list;
    }, [albums, sortOption, yearFilter]);

    return (
        <Box
            component="main"
            sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                mt: 6,
                mb: 10,
            }}
        >
            <Box
                sx={{
                    width: "90%",
                    maxWidth: "1100px",
                }}
            >
                <Typography
                    variant="h3"
                    sx={{
                        mb: 2,
                        fontWeight: 700,
                        color: "var(--accent-color)",
                        textShadow: "0 2px 4px rgba(0,0,0,0.4)",
                        textAlign: "center",
                    }}
                >
                    Gallery
                </Typography>

                <Typography
                    sx={{
                        mb: 4,
                        fontSize: "1.05rem",
                        color: "white",
                        opacity: 0.85,
                        maxWidth: "720px",
                        mx: "auto",
                        textAlign: "center",
                    }}
                >
                    A look back at our events, retreats, and late-night hangouts. Click an
                    album to open the full photos in Google Photos.
                </Typography>

                {/* Frosted controls bar */}
                {albums.length > 0 && (
                    <Box
                        sx={{
                            mb: 4,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            justifyContent: "center",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 2,
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.16)",
                                borderRadius: "999px",
                                border: "1px solid rgba(255,255,255,0.4)",
                                backdropFilter: "blur(12px)",
                                boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                                px: { xs: 2, sm: 3 },
                                py: 1.2,
                                maxWidth: "100%",
                            }}
                        >
                            <TextField
                                select
                                size="small"
                                label="Sort by"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                variant="outlined"
                                sx={{
                                    mt: 0.3,
                                    minWidth: 160,
                                    "& .MuiOutlinedInput-root": {
                                        backgroundColor: "transparent",
                                        color: "white",
                                        "& fieldset": {
                                            borderColor: "transparent",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "rgba(255,255,255,0.85)",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "var(--accent-color)",
                                        },
                                        "& .MuiSelect-select": {
                                            paddingTop: "10px",
                                            paddingBottom: "4px",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "rgba(255,255,255,0.9)",
                                    },
                                    "& .MuiInputLabel-root.Mui-focused": {
                                        color: "var(--accent-color)",
                                    },
                                    "& .MuiSelect-icon": {
                                        color: "var(--accent-color)",
                                    },
                                }}
                            >
                                <MenuItem value="newest">Newest first</MenuItem>
                                <MenuItem value="oldest">Oldest first</MenuItem>
                                <MenuItem value="title">Title A–Z</MenuItem>
                            </TextField>

                            <TextField
                                select
                                size="small"
                                label="Year"
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                variant="outlined"
                                sx={{
                                    mt: 0.3,
                                    minWidth: 140,
                                    "& .MuiOutlinedInput-root": {
                                        backgroundColor: "transparent",
                                        color: "white",
                                        "& fieldset": {
                                            borderColor: "transparent",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "rgba(255,255,255,0.85)",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "var(--accent-color)",
                                        },
                                        "& .MuiSelect-select": {
                                            paddingTop: "10px",
                                            paddingBottom: "4px",
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "rgba(255,255,255,0.9)",
                                    },
                                    "& .MuiInputLabel-root.Mui-focused": {
                                        color: "var(--accent-color)",
                                    },
                                    "& .MuiSelect-icon": {
                                        color: "var(--accent-color)",
                                    },
                                }}
                            >
                                <MenuItem value="all">All years</MenuItem>
                                {yearOptions.map((year) => (
                                    <MenuItem key={year} value={year}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Box>
                )}

                {visibleAlbums.length === 0 ? (
                    <Typography sx={{ color: "#ddd", textAlign: "center" }}>
                        {albums.length === 0
                            ? 'No albums added yet. Create some "Gallery Album" documents in Sanity Studio to show them here.'
                            : "No albums match the selected filters."}
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            display: "grid",
                            justifyContent: "center",
                            gridTemplateColumns: {
                                xs: "minmax(0, 320px)",
                                sm: "repeat(2, minmax(0, 320px))",
                                md: "repeat(3, minmax(0, 320px))",
                            },
                            gap: 3,
                            mx: "auto",
                        }}
                    >
                        {visibleAlbums.map((album) => (
                            <Card
                                key={album._id}
                                sx={{
                                    width: "100%",
                                    background: "rgba(255,255,255,0.16)",
                                    backdropFilter: "blur(12px)",
                                    borderRadius: "20px",
                                    overflow: "hidden",
                                    border: "1px solid rgba(255,255,255,0.35)",
                                    boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                                    color: "white",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {album.coverImageUrl && (
                                    <CardMedia
                                        component="img"
                                        image={album.coverImageUrl}
                                        alt={album.title}
                                        sx={{
                                            height: 210,
                                            objectFit: "cover",
                                            objectPosition: "center center",
                                        }}
                                    />
                                )}

                                <CardContent
                                    sx={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        pt: 2.2,
                                        pb: 2.6,
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 700,
                                            color: "var(--accent-color)",
                                            mb: 0.6,
                                        }}
                                    >
                                        {album.title}
                                    </Typography>

                                    {album.date && (
                                        <Typography
                                            sx={{
                                                fontSize: "0.9rem",
                                                opacity: 0.85,
                                                mb: 1,
                                            }}
                                        >
                                            {formatAlbumDate(album.date)}
                                        </Typography>
                                    )}

                                    {album.description && (
                                        <Typography
                                            sx={{
                                                fontSize: "0.95rem",
                                                opacity: 0.9,
                                                mb: 2,
                                            }}
                                        >
                                            {album.description}
                                        </Typography>
                                    )}

                                    <Box
                                        sx={{
                                            mt: "auto",
                                            display: "flex",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Button
                                            href={album.googlePhotosUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                mt: 1,
                                                backgroundColor: "var(--accent-color)",
                                                color: "var(--primary-color)",
                                                fontWeight: 700,
                                                px: 3,
                                                "&:hover": { backgroundColor: "#ffdc55" },
                                            }}
                                        >
                                            View Photos
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
