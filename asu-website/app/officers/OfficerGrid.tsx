"use client";

import { useMemo, useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CardMedia,
} from "@mui/material";
import { SocialIcon } from "react-social-icons";
import ChromaGrid from "./ChromaGrid";

type Officer = {
    _id: string;
    name: string;
    role: string;
    major?: string;
    year?: string;
    bio?: string;
    sortOrder?: number;
    imageUrl?: string;
    email?: string;
    instagram?: string;
    linkedin?: string;
};

export default function OfficerGrid({ officers }: { officers: Officer[] }) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const officerMap = useMemo(
        () => new Map(officers.map((o) => [o._id, o])),
        [officers]
    );

    const selectedOfficer = selectedId ? officerMap.get(selectedId) || null : null;
    const selectedInstagramUrl =
        selectedOfficer?.instagram && selectedOfficer.instagram.trim() !== ""
            ? selectedOfficer.instagram.startsWith("http")
                ? selectedOfficer.instagram
                : `https://instagram.com/${selectedOfficer.instagram.replace(/^@/, "")}`
            : undefined;
    const selectedLinkedinUrl =
        selectedOfficer?.linkedin && selectedOfficer.linkedin.trim() !== ""
            ? selectedOfficer.linkedin.startsWith("http")
                ? selectedOfficer.linkedin
                : `https://www.linkedin.com/in/${selectedOfficer.linkedin.replace(/^@/, "")}`
            : undefined;

    const items = useMemo(() => {
        return officers.map((officer, idx) => {
            const metaParts: string[] = [];
            if (officer.major) metaParts.push(officer.major);
            if (officer.year) metaParts.push(officer.year);
            const metaLine = metaParts.join(" · ");

            const instagramHandle = officer.instagram
                ? officer.instagram.replace(/^@/, "")
                : undefined;

            const palette = [
                "#b71c1c",
                "#d6341f",
                "#a02020",
                "#c0451f",
                "#8b1c1c",
            ];
            const accent = palette[idx % palette.length];

            return {
                id: officer._id,
                image: officer.imageUrl,
                title: officer.name,
                subtitle: officer.role,
                handle: metaLine || undefined,
                gradient: `linear-gradient(150deg, ${accent}, #120303)`,
                borderColor: "rgba(255,215,0,0.9)",
            };
        });
    }, [officers]);

    return (
        <>
            <ChromaGrid
                items={items}
                radius={260}
                onSelect={(id) => setSelectedId(id)}
                selectedId={selectedId}
            />

            <Dialog
                open={!!selectedOfficer}
                onClose={() => setSelectedId(null)}
                fullWidth={false}
                maxWidth={false}
                PaperProps={{
                    sx: {
                        width: { xs: "92%", sm: "720px" },
                        maxWidth: "720px",
                        background: "linear-gradient(145deg, #240303 0%, #320505 45%, #0f0f0f 100%)",
                        color: "white",
                        border: "1px solid rgba(255,215,0,0.35)",
                        boxShadow: "0 18px 48px rgba(0,0,0,0.65)",
                        borderRadius: 3,
                        overflow: "hidden",
                        animation: "popIn 0.26s ease",
                        "@keyframes popIn": {
                            from: { opacity: 0, transform: "scale(0.96) translateY(12px)" },
                            to: { opacity: 1, transform: "scale(1) translateY(0)" },
                        },
                    },
                }}
            >
                {selectedOfficer && (
                    <>
                        <DialogTitle
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                gap: 1,
                                alignItems: { xs: "flex-start", sm: "center" },
                                color: "var(--accent-color)",
                                fontWeight: 800,
                                textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                {selectedOfficer.name}
                                <Typography
                                    component="div"
                                    sx={{ fontSize: "1rem", color: "#ffd75e", mt: 0.4 }}
                                >
                                    {selectedOfficer.role}
                                </Typography>
                                {(selectedOfficer.major || selectedOfficer.year) && (
                                    <Typography sx={{ color: "#f0e6c0", fontSize: "0.95rem" }}>
                                        {[selectedOfficer.major, selectedOfficer.year]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </Typography>
                                )}
                            </Box>
                        </DialogTitle>

                        {selectedOfficer.imageUrl && (
                            <CardMedia
                                component="img"
                                image={selectedOfficer.imageUrl}
                                alt={selectedOfficer.name}
                                sx={{
                                    width: "100%",
                                    maxHeight: 360,
                                    objectFit: "contain",
                                    backgroundColor: "#120303",
                                    display: "block",
                                    borderBottom: "1px solid rgba(255,215,0,0.25)",
                                }}
                            />
                        )}

                        <DialogContent dividers sx={{ borderColor: "rgba(255,215,0,0.15)" }}>
                            <Stack spacing={2}>
                                {selectedOfficer.bio && (
                                    <Typography sx={{ color: "#f4f1e5", lineHeight: 1.65 }}>
                                        {selectedOfficer.bio}
                                    </Typography>
                                )}

                                {(selectedOfficer.email ||
                                    selectedInstagramUrl ||
                                    selectedLinkedinUrl) && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.4,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {selectedInstagramUrl && (
                                            <SocialIcon
                                                network="instagram"
                                                url={selectedInstagramUrl}
                                                style={{ height: 32, width: 32 }}
                                                bgColor="var(--accent-color)"
                                                fgColor="#1a1a1a"
                                            />
                                        )}
                                        {selectedLinkedinUrl && (
                                            <SocialIcon
                                                network="linkedin"
                                                url={selectedLinkedinUrl}
                                                style={{ height: 32, width: 32 }}
                                                bgColor="var(--accent-color)"
                                                fgColor="#1a1a1a"
                                            />
                                        )}
                                        {selectedOfficer.email && (
                                            <SocialIcon
                                                network="email"
                                                url={`mailto:${selectedOfficer.email}`}
                                                style={{ height: 32, width: 32 }}
                                                bgColor="var(--accent-color)"
                                                fgColor="#1a1a1a"
                                            />
                                        )}
                                        {selectedOfficer.email && (
                                            <Typography sx={{ color: "#e6ddbf", fontSize: "0.95rem" }}>
                                                {selectedOfficer.email}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>

                        <DialogActions>
                            <Button
                                onClick={() => setSelectedId(null)}
                                sx={{
                                    color: "var(--accent-color)",
                                    borderColor: "rgba(255,215,0,0.55)",
                                    borderWidth: 1,
                                    borderStyle: "solid",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderRadius: 999,
                                    px: 2.4,
                                    "&:hover": {
                                        backgroundColor: "rgba(255,215,0,0.12)",
                                    },
                                }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
}
