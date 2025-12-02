"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Box, IconButton } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

type HomeCarouselProps = {
    images: string[];
};

export default function HomeCarousel({ images }: HomeCarouselProps) {
    const [index, setIndex] = useState(0);

    if (!images || images.length === 0) {
        return null;
    }

    const nextSlide = () => {
        setIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(id);
    }, [images.length]);

    return (
        <Box
            sx={{
                width: "90%",
                maxWidth: "900px",
                position: "relative",
                overflow: "hidden",
                borderRadius: { xs: "14px", md: "18px" },
                mb: 6,
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
                height: { xs: 240, sm: 360, md: 500 },
                "&:hover .carousel-btn": {
                    opacity: 1,
                },
            }}
        >
            {/* Stacked images for smooth crossfade */}
            {images.map((src, i) => (
                <Image
                    key={src}
                    src={src}
                    alt="ASU Photo"
                    fill
                    style={{
                        objectFit: "cover",
                        transition: "opacity 0.8s ease",
                        opacity: i === index ? 1 : 0,
                    }}
                />
            ))}

            {/* Prev */}
            <IconButton
                className="carousel-btn"
                onClick={prevSlide}
                aria-label="Previous slide"
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: 16,
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(0,0,0,0.55)",
                    color: "var(--accent-color)",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.4)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
                    opacity: 0,
                    transition: "opacity .25s ease-in-out, transform .15s ease-out",
                    zIndex: 2,
                    "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.75)",
                        transform: "translateY(-50%) scale(1.03)",
                    },
                }}
            >
                <ChevronLeftRoundedIcon />
            </IconButton>

            {/* Next */}
            <IconButton
                className="carousel-btn"
                onClick={nextSlide}
                aria-label="Next slide"
                sx={{
                    position: "absolute",
                    top: "50%",
                    right: 16,
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(0,0,0,0.55)",
                    color: "var(--accent-color)",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.4)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
                    opacity: 0,
                    transition: "opacity .25s ease-in-out, transform .15s ease-out",
                    zIndex: 2,
                    "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.75)",
                        transform: "translateY(-50%) scale(1.03)",
                    },
                }}
            >
                <ChevronRightRoundedIcon />
            </IconButton>
        </Box>
    );
}
