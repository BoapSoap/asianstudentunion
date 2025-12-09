"use client";

import { useState, useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import { SocialIcon } from "react-social-icons";

export default function SocialBar() {
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [open, setOpen] = useState(false);

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

    // 🚫 Don't render ANYTHING until mounted (fixes hydration mismatch)
    if (!mounted) return null;

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
                {[
                    "https://www.instagram.com/asianstudentunion/",
                    "https://www.tiktok.com/@sfsuasianstudentunion",
                    "https://discord.com/invite/m485CGmEWr",
                ].map((url, i) => (
                    <Box
                        key={i}
                        sx={{
                            transition: "transform 0.25s ease",
                            "&:hover": {
                                transform: "scale(1.15)",
                            },
                        }}
                    >
                        <SocialIcon
                            url={url}
                            target="_blank"
                            bgColor="var(--accent-color)"
                            fgColor="var(--primary-color)"
                            style={{ width: 40, height: 40 }}
                        />
                    </Box>
                ))}
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
                    {[
                        "https://www.instagram.com/asianstudentunion/",
                        "https://www.tiktok.com/@sfsuasianstudentunion",
                        "https://discord.com/invite/m485CGmEWr",
                    ].map((url, i) => (
                        <Box
                            key={i}
                            sx={{
                                transition: "transform 0.25s ease",
                                "&:hover": {
                                    transform: "scale(1.18)",
                                },
                            }}
                        >
                            <SocialIcon
                                url={url}
                                target="_blank"
                                bgColor="var(--accent-color)"
                                fgColor="var(--primary-color)"
                                style={{ width: 40, height: 40 }}
                            />
                        </Box>
                    ))}
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
