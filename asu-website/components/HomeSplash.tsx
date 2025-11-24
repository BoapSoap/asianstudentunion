"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";

const SPLASH_DURATION = 1200; // match your asuSplash 1.2s

export default function HomeSplash() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const alreadyShown = sessionStorage.getItem("asuSplashShown");

        if (alreadyShown === "true") {
            // already saw it in this tab, never show again
            return;
        }

        // first time in this tab: show it
        setShow(true);

        const t = setTimeout(() => {
            setShow(false);
            sessionStorage.setItem("asuSplashShown", "true");
        }, SPLASH_DURATION);

        return () => clearTimeout(t);
    }, []);

    if (!show) return null;

    return (
        <Box
            sx={{
                position: "fixed",
                inset: 0,
                backgroundColor: "black",
                color: "#FFD600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                zIndex: 9999,
                animation: "asuSplash 1.2s ease-out forwards",
            }}
        >
            ASIAN STUDENT UNION
        </Box>
    );
}
