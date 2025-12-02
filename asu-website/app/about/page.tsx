"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
} from "@mui/material";

const timeline = [
    {
        year: "1968",
        title: "Third World Liberation Strike",
        highlight: "It was the longest student strike in history — 167 days",
        bullets: [
            "This strike was started by the Third World Liberation Front to create an Ethnic Studies building.",
            "The TWLF is composed of: the Black Student Union, the Mexican American Student Confederation, the Philippine American Collegiate Endeavor (PACE), the Intercollegiate Chinese for Social Action (ICSA), the Latin American Students Organization (LASO), an American Indian student organization, and the Asian American Political Alliance.",
        ],
        images: ["/history/twlf-1968-1.jpg", "/history/twlf-1968-2.jpg"],
    },
    {
        year: "1969",
        title: "Cesar Chavez Student Center & Ethnic Studies / Psychology Building",
        bullets: [
            "We got the Cesar Chavez Student Center and the Ethnic Studies and Psychology Building.",
            "We got the ASU Room (M100-E, located on the Mezzanine level) by staging a sit-in and refusing to leave until we got the room.",
        ],
        images: ["/history/cesar-1969-1.jpg"],
    },
    {
        year: "1974",
        title: "Asian Student Union Established",
        bullets: [
            "ASU has three founders, who were all active in leadership roles and within the Asian American community:",
            "1. Warren Mar — SF Chinatown",
            "2. Cecil (seh-seal) Yoshida — SF Japantown",
            "3. Victor Huey — Oakland Chinatown",
            "They had the same ideals as AAPA so they started Asian Student Union in 1974.",
            "AAPA (Asian American Political Alliance) and ASU are NOT the same thing. ASU did NOT form as a result of AAPA. However, ASU members did come from AAPA.",
        ],
        images: ["/history/asu-1974-1.jpg"],
    },
    {
        year: "Present",
        title: "ASU Today",
        bullets: [
            "Moving forward, ASU will continue to support cultural awareness and educate our members about the issues that are going on within the community.",
            "We strive to provide our members with the tools and knowledge to enact positive change.",
            "Although ASU functions as social gatherings where students are encouraged to fraternize with one another, we are first and foremost an organization that values creating a safe space for our members and the greater Asian American community at SFSU.",
            "Through social, educational, cultural, and political activities and events, Asian Student Union hopes to provide members with a better understanding and awareness of the conditions and issues which face our communities.",
        ],
        images: [],
    },
];

export default function AboutPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    return (
        <Box
            sx={{
                width: "100%",
                minHeight: "100dvh",
                display: "flex",
                justifyContent: "center",
                px: { xs: 2, md: 4 },
                pb: 10,
            }}
        >
            <Box sx={{ width: "100%", maxWidth: 1100 }}>
                <Box
                    sx={{
                        mt: { xs: 2.5, md: 3 },
                        mb: { xs: 5, md: 7 },
                        p: { xs: 3, md: 5 },
                        borderRadius: "22px",
                        background: "rgba(255,255,255,0.10)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        boxShadow: "0 16px 44px rgba(0,0,0,0.40)",
                        position: "relative",
                        overflow: "hidden",
                        transform: mounted ? "translateY(0px)" : "translateY(18px)",
                        opacity: mounted ? 1 : 0,
                        transition: "all .8s ease",
                    }}
                >
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 800,
                            color: "var(--accent-color)",
                            textTransform: "uppercase",
                            letterSpacing: "3px",
                            textShadow: "0 3px 8px rgba(0,0,0,0.45)",
                        }}
                    >
                        Our History
                    </Typography>
                    <Typography
                        sx={{
                            mt: 1.5,
                            color: "white",
                            fontSize: { xs: "1.05rem", md: "1.15rem" },
                            maxWidth: 780,
                            opacity: 0.95,
                        }}
                    >
                        The Asian Student Union at SFSU has always been rooted in community,
                        activism, and cultural pride. Here’s a quick timeline of the moments
                        that shaped who we are today.
                    </Typography>
                    <Box
                        sx={{
                            position: "absolute",
                            right: -40,
                            top: -40,
                            width: 220,
                            height: 220,
                            borderRadius: "50%",
                            background:
                                "radial-gradient(circle, rgba(255,215,0,0.25) 0%, rgba(255,215,0,0.0) 70%)",
                            pointerEvents: "none",
                        }}
                    />
                </Box>

                <Box sx={{ position: "relative", pl: { xs: 2, md: 0 } }}>
                    <Box
                        sx={{
                            position: "absolute",
                            left: { xs: 10, md: "50%" },
                            top: 0,
                            bottom: 0,
                            width: "2px",
                            background:
                                "linear-gradient(to bottom, rgba(255,215,0,0.9), rgba(255,215,0,0.1))",
                            transform: { md: "translateX(-1px)" },
                            opacity: 0.9,
                        }}
                    />

                    <Stack spacing={5}>
                        {timeline.map((item, i) => {
                            const isLeft = i % 2 === 0;
                            return (
                                <Box
                                    key={item.year}
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            md: "1fr 60px 1fr",
                                        },
                                        alignItems: "stretch",
                                        gap: { xs: 2, md: 0 },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            order: { xs: 2, md: isLeft ? 1 : 3 },
                                            display: "flex",
                                            justifyContent: { md: isLeft ? "flex-end" : "flex-start" },
                                        }}
                                    >
                                        <Card
                                            sx={{
                                                width: "100%",
                                                maxWidth: 500,
                                                borderRadius: "18px",
                                                background: "rgba(255,255,255,0.14)",
                                                backdropFilter: "blur(9px)",
                                                border: "1px solid rgba(255,255,255,0.2)",
                                                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                                                color: "white",
                                                transform: mounted
                                                    ? "translateY(0px)"
                                                    : "translateY(14px)",
                                                opacity: mounted ? 1 : 0,
                                                transition: `all .8s ease ${0.1 + i * 0.08}s`,
                                            }}
                                        >
                                            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.5,
                                                        mb: 1,
                                                    }}
                                                >
                                                    <Chip
                                                        label={item.year}
                                                        sx={{
                                                            height: 30,
                                                            fontWeight: 800,
                                                            backgroundColor: "var(--accent-color)",
                                                            color: "var(--primary-color)",
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="h5"
                                                        sx={{
                                                            fontWeight: 800,
                                                            color: "var(--accent-color)",
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        {item.title}
                                                    </Typography>
                                                </Box>

                                                {item.highlight && (
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: "white",
                                                            opacity: 0.95,
                                                            mb: 1.5,
                                                        }}
                                                    >
                                                        {item.highlight}
                                                    </Typography>
                                                )}

                                                <Stack spacing={1.1} sx={{ mt: 0.5 }}>
                                                    {item.bullets.map((b, bi) => (
                                                        <Typography
                                                            key={bi}
                                                            sx={{
                                                                fontSize: "1.02rem",
                                                                lineHeight: 1.7,
                                                                color: "white",
                                                                opacity: 0.95,
                                                            }}
                                                        >
                                                            • {b}
                                                        </Typography>
                                                    ))}
                                                </Stack>

                                                {item.images.length > 0 && (
                                                    <>
                                                        <Divider
                                                            sx={{
                                                                my: 2.2,
                                                                borderColor: "rgba(255,255,255,0.25)",
                                                            }}
                                                        />
                                                        <Box
                                                            sx={{
                                                                display: "grid",
                                                                gridTemplateColumns:
                                                                    item.images.length > 1
                                                                        ? { xs: "1fr", sm: "1fr 1fr" }
                                                                        : "1fr",
                                                                gap: 1.5,
                                                            }}
                                                        >
                                                            {item.images.map((src, ii) => (
                                                                <Box
                                                                    key={src}
                                                                    sx={{
                                                                        position: "relative",
                                                                        width: "100%",
                                                                        height: 220,
                                                                        borderRadius: "14px",
                                                                        overflow: "hidden",
                                                                        border:
                                                                            "1px solid rgba(255,255,255,0.18)",
                                                                        boxShadow:
                                                                            "0 8px 20px rgba(0,0,0,0.35)",
                                                                    }}
                                                                >
                                                                    <Image
                                                                        src={src}
                                                                        alt={`${item.year} history photo ${ii + 1}`}
                                                                        fill
                                                                        style={{ objectFit: "cover" }}
                                                                    />
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Box>

                                    <Box
                                        sx={{
                                            order: { xs: 1, md: 2 },
                                            display: "flex",
                                            justifyContent: "center",
                                            position: "relative",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: "50%",
                                                backgroundColor: "var(--accent-color)",
                                                boxShadow:
                                                    "0 0 0 6px rgba(255,215,0,0.18), 0 6px 16px rgba(0,0,0,0.35)",
                                                mt: { xs: 0.5, md: 3 },
                                            }}
                                        />
                                    </Box>

                                    <Box
                                        sx={{
                                            order: { xs: 3, md: isLeft ? 3 : 1 },
                                            display: { xs: "none", md: "block" },
                                        }}
                                    />
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>

                <Box
                    sx={{
                        mt: 7,
                        p: { xs: 3, md: 4 },
                        borderRadius: "20px",
                        background: "rgba(255,255,255,0.14)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        boxShadow: "0 12px 36px rgba(0,0,0,0.40)",
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
                        gap: 3,
                        alignItems: "center",
                        color: "white",
                        transform: mounted ? "translateY(0px)" : "translateY(14px)",
                        opacity: mounted ? 1 : 0,
                        transition: "all .9s ease .4s",
                    }}
                >
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: { xs: 220, md: 260 },
                            borderRadius: "16px",
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.18)",
                            boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
                        }}
                    >
                        <Image
                            src="/history/pabu.jpg"
                            alt="Pabu the red panda mascot"
                            fill
                            style={{ objectFit: "cover" }}
                        />
                    </Box>

                    <Box>
                        <Chip
                            label="Mascot"
                            sx={{
                                height: 30,
                                fontWeight: 800,
                                backgroundColor: "var(--accent-color)",
                                color: "var(--primary-color)",
                                mb: 1.2,
                            }}
                        />
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 900,
                                color: "var(--accent-color)",
                                mb: 1,
                            }}
                        >
                            Pabu!
                        </Typography>
                        <Stack spacing={1}>
                            <Typography sx={{ fontSize: "1.05rem", opacity: 0.95 }}>
                                • Native to Asia
                            </Typography>
                            <Typography sx={{ fontSize: "1.05rem", opacity: 0.95 }}>
                                • Stands for balance & kindness
                            </Typography>
                            <Typography sx={{ fontSize: "1.05rem", opacity: 0.95 }}>
                                • He helps you find happiness within yourself, while also
                                teaching you the importance of social relationships with the
                                people you love
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
