"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { usePathname } from "next/navigation";
import { Roboto_Mono, Mr_Dafoe } from "next/font/google";

// ------------------------------------------------------
// FONT CONFIG — change these two blocks to try new fonts
// ------------------------------------------------------
const navBodyFont = Roboto_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const navTitleFont = Mr_Dafoe({
    subsets: ["latin"],
    weight: "400",
});

// handy aliases so you don't touch the rest of the file
const NAV_BODY_CLASS = navBodyFont.className;
const NAV_BODY_FAMILY = navBodyFont.style.fontFamily;
const NAV_TITLE_FAMILY = navTitleFont.style.fontFamily;
// ------------------------------------------------------

// Title sequence — English shows up between language pairs
const EN_TITLE = { text: "Asian Student Union", lang: "en" };

const TITLE_SEQUENCE = [
    EN_TITLE,
    { text: "亚洲学生联合会", lang: "zh-Hans" }, // Chinese (Simplified)
    { text: "アジア学生会", lang: "ja" },       // Japanese
    EN_TITLE,
    { text: "아시안 학생회", lang: "ko" },       // Korean
    { text: "एशियन छात्र संघ", lang: "hi" },     // Hindi
    EN_TITLE,
    { text: "Samahan ng Mga Estudyanteng Asyano", lang: "fil" }, // Filipino - i hope this is accurate
    EN_TITLE,
];

export default function Navbar() {
    const [logoWiggle, setLogoWiggle] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // sequence + typewriter state
    const [sequenceIndex, setSequenceIndex] = useState(0);
    const [displayedTitle, setDisplayedTitle] = useState(
        TITLE_SEQUENCE[0].text
    );

    const pathname = usePathname();

    const navItems = [
        { label: "Upcoming Events", href: "/#events" },
        { label: "Our History", href: "/about" },
        { label: "Officers", href: "/officers" },
        { label: "Gallery", href: "/gallery" },
    ];

    // Typewriter / spell-out animation for the navbar title
    useEffect(() => {
        const full = TITLE_SEQUENCE[sequenceIndex].text;

        setDisplayedTitle(""); // clear before typing
        let charIndex = 0;
        let dwellTimeout: ReturnType<typeof setTimeout> | undefined;

        const typingInterval = setInterval(() => {
            charIndex += 1;
            setDisplayedTitle(full.slice(0, charIndex));

            if (charIndex >= full.length) {
                clearInterval(typingInterval);
                // pause on the completed word, then move to next sequence item
                dwellTimeout = setTimeout(() => {
                    setSequenceIndex(
                        (prev) => (prev + 1) % TITLE_SEQUENCE.length
                    );
                }, 1800);
            }
        }, 70); // speed per character

        return () => {
            clearInterval(typingInterval);
            if (dwellTimeout) clearTimeout(dwellTimeout);
        };
    }, [sequenceIndex]);

    return (
        <AppBar
            position="sticky"
            elevation={3}
            className={NAV_BODY_CLASS}
            sx={{
                backgroundColor: "rgba(183, 28, 28, 0.95)",
                backdropFilter: "blur(6px) saturate(1.2)",
            }}
        >
            <Toolbar sx={{ display: "flex", alignItems: "center" }}>
                {/* MOBILE MENU BUTTON */}
                <IconButton
                    sx={{ display: { xs: "flex", md: "none" }, color: "#FFD700", mr: 1 }}
                    onClick={() => setMobileOpen(true)}
                >
                    <MenuIcon />
                </IconButton>

                {/* LOGO with Wiggle Animation */}
                <IconButton
                    href="/"
                    onMouseDown={() => {
                        setLogoWiggle(true);
                        setTimeout(() => setLogoWiggle(false), 300);
                    }}
                    sx={{
                        p: 0,
                        mr: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        transition: "transform .25s ease",
                        animation: logoWiggle ? "wiggle 0.3s ease" : "none",
                    }}
                >
                    <Image
                        src="/resources/mainicon.png"
                        alt="ASU Logo"
                        width={40}
                        height={40}
                        style={{ borderRadius: "50%" }}
                    />
                </IconButton>

                {/* TITLE — rotating languages with typewriter effect */}
                <Typography
                    variant="h6"
                    sx={{
                        flexGrow: 1,
                        fontWeight: 400,
                        color: "#FFD700",
                        textTransform: "none",
                        letterSpacing: 0,
                        fontSize: { xs: "1.7rem", sm: "1.9rem" },
                        lineHeight: 1.1,
                        fontFamily: NAV_TITLE_FAMILY,
                        overflow: "visible",
                    }}
                >
                    <Link
                        href="/"
                        style={{
                            color: "inherit",
                            textDecoration: "none",
                            display: "inline-block",
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {displayedTitle}
                        </span>
                    </Link>
                </Typography>

                {/* DESKTOP NAV BUTTONS — use body font */}
                <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
                    {navItems.map((item) => (
                        <AnimatedNavButton
                            key={item.href}
                            href={item.href}
                            active={pathname === item.href}
                        >
                            {item.label}
                        </AnimatedNavButton>
                    ))}
                </Box>
            </Toolbar>

            {/* -------- MOBILE DRAWER -------- */}
            <Drawer
                anchor="left"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                PaperProps={{
                    className: NAV_BODY_CLASS,
                    sx: {
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
                        backdropFilter: "blur(12px)",
                        color: "#FFD700",
                        borderRight: "1px solid rgba(255,255,255,0.35)",
                        boxShadow: "0 0 32px rgba(0,0,0,0.55)",
                    },
                }}
            >
                <Box
                    sx={{
                        width: { xs: 260, sm: 280 },
                        py: 2.5,
                        px: 2,
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                    }}
                >
                    {/* Drawer header with logo + animated title */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 2,
                            px: 0.5,
                        }}
                    >
                        <Box
                            component={Link}
                            href="/"
                            onClick={() => {
                                setMobileOpen(false);
                                setLogoWiggle(true);
                                setTimeout(() => setLogoWiggle(false), 300);
                            }}
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "10px",
                                overflow: "hidden",
                                flexShrink: 0,
                                cursor: "pointer",
                                transition: "transform .25s ease",
                                animation: logoWiggle ? "wiggle 0.3s ease" : "none",
                            }}
                        >
                            <Image
                                src="/resources/mainicon.png"
                                alt="ASU Logo"
                                width={40}
                                height={40}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </Box>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 400,
                                textTransform: "none",
                                letterSpacing: 0,
                                color: "#FFD700",
                                fontSize: "1.5rem",
                                lineHeight: 1.1,
                                fontFamily: NAV_TITLE_FAMILY,
                                overflow: "visible",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {displayedTitle}
                            </span>
                        </Typography>
                    </Box>

                    <Divider
                        sx={{
                            borderColor: "rgba(255,255,255,0.35)",
                            mb: 1.5,
                        }}
                    />

                    <List sx={{ flex: 1 }}>
                        {navItems.map((item) => {
                            const selected = pathname === item.href;
                            return (
                                <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                                    <ListItemButton
                                        component={Link}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        selected={selected}
                                        sx={{
                                            borderRadius: 2,
                                            px: 1.5,
                                            py: 1,
                                            transition:
                                                "background-color 0.2s ease, transform 0.1s ease",
                                            "&.Mui-selected": {
                                                backgroundColor: "rgba(255,215,0,0.2)",
                                            },
                                            "&.Mui-selected:hover": {
                                                backgroundColor: "rgba(255,215,0,0.26)",
                                            },
                                            "&:hover": {
                                                backgroundColor: "rgba(255,255,255,0.18)",
                                                transform: "translateX(2px)",
                                            },
                                        }}
                                    >
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                sx: {
                                                    color: selected
                                                        ? "#FFD700"
                                                        : "rgba(255,255,255,0.96)",
                                                    fontWeight: selected ? 700 : 500,
                                                    letterSpacing: "0.02em",
                                                    fontFamily: NAV_BODY_FAMILY,
                                                },
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </Drawer>

            {/* KEYFRAMES (inline, hydration-safe) */}
            <style jsx global>{`
                @keyframes wiggle {
                    0% {
                        transform: rotate(0deg);
                    }
                    25% {
                        transform: rotate(-3deg);
                    }
                    50% {
                        transform: rotate(3deg);
                    }
                    75% {
                        transform: rotate(-2deg);
                    }
                    100% {
                        transform: rotate(0deg);
                    }
                }
            `}</style>
        </AppBar>
    );
}

/* -----------------------------------------
   Animated Nav Button Component
-------------------------------------------- */
function AnimatedNavButton({
                               href,
                               children,
                               active,
                           }: {
    href: string;
    children: React.ReactNode;
    active: boolean;
}) {
    const [pressed, setPressed] = useState(false);

    return (
        <Button
            component={Link}
            href={href}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            sx={{
                position: "relative",
                color: "#FFD700",
                fontWeight: 600,
                transition: "transform .15s ease",
                fontFamily: NAV_BODY_FAMILY,

                // Click Pop Animation
                transform: pressed ? "scale(0.9)" : "scale(1)",

                // Hover shimmer
                "&:hover": {
                    color: "#fff4b0",
                },

                // Active underline UI
                "&::after": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    bottom: -4,
                    width: active ? "100%" : "0%",
                    height: "3px",
                    backgroundColor: "#FFD700",
                    borderRadius: "2px",
                    transition: "width .25s ease",
                },
                "&:hover::after": {
                    width: "100%",
                },
            }}
        >
            {children}
        </Button>
    );
}
