"use client";

import { useRef } from "react";
import { Box, Typography } from "@mui/material";
import clsx from "clsx";
import VariableProximity from "./VariableProximity";

type HeroHeaderProps = {
    titleClassName?: string;
    subtitleClassName?: string;
};

const HeroHeader = ({ titleClassName = "", subtitleClassName = "" }: HeroHeaderProps) => {
    const containerRef = useRef<HTMLElement>(null!);

    return (
        <Box
            ref={containerRef}
            sx={{
                textAlign: "center",
                mt: { xs: 2.5, md: 4 },
                mb: { xs: 1.5, md: 2.5 },
                px: 2,
            }}
        >
            <Typography
                component="h1"
                className={clsx("hero-title-letters", titleClassName)}
                sx={{
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: { xs: "0.04em", md: "0.08em" },
                    fontSize: { xs: "1.65rem", sm: "2.3rem", md: "3.4rem", lg: "3.9rem" },
                    lineHeight: { xs: 1.05, md: 1.06 },
                    color: "var(--accent-color)",
                    textShadow: "0 4px 14px rgba(0,0,0,0.45)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: { xs: "0.08em", md: "0.12em" },
                }}
            >
                <VariableProximity
                    label="ASIAN STUDENT UNION"
                    fromFontVariationSettings="'wght' 520, 'opsz' 18"
                    toFontVariationSettings="'wght' 1000, 'opsz' 54"
                    containerRef={containerRef}
                    radius={180}
                    falloff="gaussian"
                />
            </Typography>

            <Typography
                variant="h6"
                className={subtitleClassName}
                sx={{
                    color: "var(--accent-color)",
                    mt: 1,
                    opacity: 0.95,
                    fontSize: { xs: "1rem", sm: "1.15rem" },
                    fontStyle: "normal",
                    letterSpacing: "0.05em",
                    textShadow: "0 2px 6px rgba(0,0,0,0.35)",
                }}
            >
                Celebrating Culture & Community at SFSU
            </Typography>
        </Box>
    );
};

export default HeroHeader;
