"use client";

import { useState, useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import { SocialIcon } from "react-social-icons";
import { DEFAULT_SOCIAL_LINKS, type SocialLink, type SocialLinksResponse } from "@/lib/socialLinks";

export default function SocialBar() {
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [open, setOpen] = useState(false);
    const [links, setLinks] = useState<SocialLink[] | null>(null);

    // Prevent hydration mismatch
    useEffect(() => {
        const id = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(id);
    }, []);

    // Run mobile check only AFTER mount
    useEffect(() => {
        if (!mounted) return;

        const checkMobile = () => setIsMobile(window.innerWidth < 600);
        checkMobile();

        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;

        let cancelled = false;

        const loadSocialLinks = async () => {
            try {
                const response = await fetch("/api/social-links", { cache: "no-store" });
                const payload = (await response.json()) as SocialLinksResponse;

                if (!cancelled && response.ok && Array.isArray(payload.links)) {
                    setLinks(payload.links);
                }
            } catch (error) {
                console.error("Failed to load social links", error);
                if (!cancelled) {
                    setLinks(DEFAULT_SOCIAL_LINKS);
                }
            }
        };

        loadSocialLinks();

        return () => {
            cancelled = true;
        };
    }, [mounted]);

    // 🚫 Don't render ANYTHING until mounted (fixes hydration mismatch)
    if (!mounted) return null;
    if (!links || links.length === 0) return null;

    const renderSocialLink = (link: SocialLink) => (
        <Box
            key={link.id}
            sx={{
                transition: "transform 0.25s ease",
                "&:hover": {
                    transform: isMobile ? "scale(1.18)" : "scale(1.15)",
                },
            }}
        >
            {link.icon_url ? (
                <Box
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    sx={{
                        width: 40,
                        height: 40,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        overflow: "hidden",
                        bgcolor: "var(--accent-color)",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
                    }}
                >
                    <Box
                        component="img"
                        src={link.icon_url}
                        alt=""
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </Box>
            ) : (
                <SocialIcon
                    url={link.url}
                    label={link.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    bgColor="var(--accent-color)"
                    fgColor="var(--primary-color)"
                    style={{ width: 40, height: 40 }}
                />
            )}
        </Box>
    );

    // -----------------------
    // Desktop Social Bar
    // -----------------------
    if (!isMobile) {
        return (
            <Box
                sx={{
                    position: "fixed",
                    bottom: 20,
                    right: 20,
                    display: "flex",
                    gap: 2,
                    padding: "10px 18px",
                    borderRadius: "18px",
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.35)",
                    zIndex: 2000,
                }}
            >
                {links.map(renderSocialLink)}
            </Box>
        );
    }

    // -----------------------
    // Mobile Collapsible Bar
    // -----------------------
    return (
        <Box
            sx={{
                position: "fixed",
                bottom: 20,
                right: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.2,
                zIndex: 3000,
            }}
        >
            {/* Expanding block */}
            {open && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.2,
                        padding: "12px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.35)",
                        transition: "all 0.25s ease",
                    }}
                >
                    {links.map(renderSocialLink)}
                </Box>
            )}

            {/* Toggle button */}
            <IconButton
                onClick={() => setOpen((prev) => !prev)}
                sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "var(--accent-color)",
                    color: "var(--primary-color)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                    "&:hover": { background: "#ffdb4d" },
                    transition: "0.25s ease",
                }}
            >
                {open ? "✕" : "☰"}
            </IconButton>
        </Box>
    );
}
