"use client";

import { useState, useEffect, type MouseEvent } from "react";
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
import { usePathname, useRouter } from "next/navigation";
import { Roboto_Mono, Mr_Dafoe } from "next/font/google";
import { FiShoppingCart } from "react-icons/fi";
import GlassSurface from "./GlassSurface";
import {
    emitOpenStoreCart,
    readStoreCartCount,
    STORE_CART_OPEN_SESSION_KEY,
    STORE_CART_STORAGE_KEY,
    STORE_CART_UPDATED_EVENT,
} from "@/lib/storeCart";

const DESKTOP_CART_SLOT_WIDTH = 176;
const STORE_NEW_BADGE_WINDOW_MS = 21 * 24 * 60 * 60 * 1000;

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
    const [storeEnabled, setStoreEnabled] = useState(false);
    const [showStoreNewBadge, setShowStoreNewBadge] = useState(false);
    const [storeCartCount, setStoreCartCount] = useState(0);
    const [cartCtaPulse, setCartCtaPulse] = useState(false);

    // sequence + typewriter state
    const [sequenceIndex, setSequenceIndex] = useState(0);
    const [displayedTitle, setDisplayedTitle] = useState(
        TITLE_SEQUENCE[0].text
    );

    const pathname = usePathname();
    const router = useRouter();

    const displayedLang = TITLE_SEQUENCE[sequenceIndex].lang;
    const isLongTitleLanguage = displayedLang === "fil";

    const navItems = [
        { label: "Upcoming Events", href: "/#events" },
        { label: "Our History", href: "/about" },
        { label: "Officers", href: "/officers" },
        { label: "Gallery", href: "/gallery" },
        ...(storeEnabled ? [{ label: "Store", href: "/store", isStore: true }] : []),
    ];
    const navFrameMaxWidth = storeCartCount > 0 ? 1340 : storeEnabled ? 1260 : 1120;

    const enableGlassNav = true; // toggle to false to temporarily disable fluid glass

    const handleHomeClick =
        (closeDrawer = false) =>
        (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
            if (closeDrawer) setMobileOpen(false);

            // When we're already on the home page (or at a hash), Next won't reset scroll,
            // so force the URL back to "/" and scroll to the top smoothly.
            if (pathname === "/") {
                event.preventDefault();
                if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", "/");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            }
        };

    // Typewriter / spell-out animation for the navbar title
    useEffect(() => {
        let charIndex = 0;
        let dwellTimeout: ReturnType<typeof setTimeout> | undefined;
        let typingInterval: ReturnType<typeof setInterval> | undefined;

        const kickoff = setTimeout(() => {
            const entry = TITLE_SEQUENCE[sequenceIndex];
            const full = entry.text;

            setDisplayedTitle(""); // clear before typing

            typingInterval = setInterval(() => {
                charIndex += 1;
                setDisplayedTitle(full.slice(0, charIndex));

                if (charIndex >= full.length) {
                    if (typingInterval) clearInterval(typingInterval);
                    // pause on the completed word, then move to next sequence item
                    dwellTimeout = setTimeout(() => {
                        setSequenceIndex(
                            (prev) => (prev + 1) % TITLE_SEQUENCE.length
                        );
                    }, 1800);
                }
            }, 70); // speed per character
        }, 0);

        return () => {
            clearTimeout(kickoff);
            if (typingInterval) clearInterval(typingInterval);
            if (dwellTimeout) clearTimeout(dwellTimeout);
        };
    }, [sequenceIndex]);

    useEffect(() => {
        let cancelled = false;

        const loadStoreVisibility = async () => {
            try {
                const response = await fetch("/api/store/settings", {
                    cache: "no-store",
                });
                if (!response.ok) return;

                const payload = (await response.json()) as {
                    settings?: { is_enabled?: boolean; updated_at?: string | null };
                };

                if (cancelled) return;

                const isEnabled = payload?.settings?.is_enabled === true;
                setStoreEnabled(isEnabled);

                if (!isEnabled) {
                    setShowStoreNewBadge(false);
                    return;
                }

                const enabledAtRaw = payload?.settings?.updated_at;
                const enabledAtMs = enabledAtRaw ? Date.parse(enabledAtRaw) : Number.NaN;
                if (!Number.isFinite(enabledAtMs)) {
                    setShowStoreNewBadge(false);
                    return;
                }

                const ageMs = Date.now() - enabledAtMs;
                setShowStoreNewBadge(ageMs >= 0 && ageMs <= STORE_NEW_BADGE_WINDOW_MS);
            } catch {
                // ignore navbar store-link failures
            }
        };

        void loadStoreVisibility();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let pulseTimeout: ReturnType<typeof setTimeout> | undefined;

        const updateCount = (nextCount: number) => {
            setStoreCartCount((previous) => {
                if (previous === 0 && nextCount > 0) {
                    setCartCtaPulse(true);
                    if (pulseTimeout) clearTimeout(pulseTimeout);
                    pulseTimeout = setTimeout(() => setCartCtaPulse(false), 1100);
                }
                return nextCount;
            });
        };

        updateCount(readStoreCartCount());

        const handleUpdated = (event: Event) => {
            const detail = (event as CustomEvent<{ count?: number }>).detail;
            const next = Number(detail?.count);
            if (Number.isFinite(next) && next >= 0) {
                updateCount(next);
                return;
            }
            updateCount(readStoreCartCount());
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key === STORE_CART_STORAGE_KEY) {
                updateCount(readStoreCartCount());
            }
        };

        window.addEventListener(STORE_CART_UPDATED_EVENT, handleUpdated as EventListener);
        window.addEventListener("storage", handleStorage);

        return () => {
            if (pulseTimeout) clearTimeout(pulseTimeout);
            window.removeEventListener(STORE_CART_UPDATED_EVENT, handleUpdated as EventListener);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    const handleStoreCartClick = () => {
        if (pathname === "/store") {
            emitOpenStoreCart();
            return;
        }

        if (typeof window !== "undefined") {
            window.sessionStorage.setItem(STORE_CART_OPEN_SESSION_KEY, "1");
        }
        router.push("/store");
    };

    const isActiveNavHref = (href: string) => {
        if (href.startsWith("/#")) return pathname === "/";
        return pathname === href;
    };

    const navContent = (
        <Box sx={{ px: { xs: 1.4, md: 2.2 }, py: { xs: 0.3, md: 0.5 }, width: "100%" }}>
            <Toolbar
                disableGutters
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.1,
                    minHeight: { xs: 56, md: 66 },
                }}
            >
                {/* MOBILE MENU BUTTON */}
                <IconButton
                    sx={{ display: { xs: "flex", md: "none" }, color: "#FFD700", mr: 1 }}
                    onClick={() => setMobileOpen(true)}
                >
                    <MenuIcon />
                </IconButton>

                {/* LOGO with Wiggle Animation */}
                <IconButton
                    component={Link}
                    href="/"
                    onClick={handleHomeClick()}
                    onMouseDown={() => {
                        setLogoWiggle(true);
                        setTimeout(() => setLogoWiggle(false), 300);
                    }}
                    sx={{
                        p: 0,
                        mr: 1.5,
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
                        width={36}
                        height={36}
                        style={{ borderRadius: "50%" }}
                    />
                </IconButton>

                {/* TITLE — rotating languages with typewriter effect */}
                <Typography
                    variant="h6"
                    sx={{
                        flexGrow: 1,
                        minWidth: 0,
                        fontWeight: 500,
                        color: "#FFD700",
                        textTransform: "none",
                        letterSpacing: "-0.01em",
                        fontSize: {
                            xs:
                                displayedLang === "fil"
                                    ? "1.05rem"
                                    : "clamp(1.35rem, 5.5vw, 1.65rem)",
                            sm: isLongTitleLanguage ? "1.5rem" : "1.9rem",
                        },
                        lineHeight: { xs: 1.15, sm: 1.18 },
                        py: { xs: 0, sm: 0.12 },
                        fontFamily: NAV_TITLE_FAMILY,
                        overflow: { xs: "hidden", md: "clip", lg: "visible" },
                        textOverflow: { xs: "ellipsis", md: "clip", lg: "clip" },
                        maxWidth: { xs: "calc(100% - 120px)", sm: "100%" },
                        whiteSpace: { xs: "nowrap", sm: "nowrap" },
                        mr: { xs: 1, md: 1.5 },
                        textShadow: "0 1px 6px rgba(0,0,0,0.4), 0 0 10px rgba(255,215,0,0.28)",
                    }}
                >
                    <Link
                        href="/"
                        onClick={handleHomeClick()}
                        style={{
                            color: "inherit",
                            textDecoration: "none",
                            display: "inline",
                        }}
                    >
                        <span
                            style={{
                                display: "inline",
                                whiteSpace: "nowrap",
                                paddingRight: "0.2em",
                            }}
                        >
                            {displayedTitle}
                        </span>
                    </Link>
                </Typography>

                {/* DESKTOP NAV BUTTONS – use body font */}
                <Box
                    sx={{
                        display: { xs: "none", md: "flex" },
                        alignItems: "center",
                        gap: 1.4,
                        pr: 0.8,
                        flexShrink: 0,
                    }}
                >
                    {navItems.map((item) => (
                        <Box key={item.href} sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                            <AnimatedNavButton href={item.href} active={isActiveNavHref(item.href)}>
                                {item.label}
                            </AnimatedNavButton>
                            {item.isStore && showStoreNewBadge && (
                                <Box
                                    component="span"
                                    sx={{
                                        position: "absolute",
                                        top: -7,
                                        right: -8,
                                        borderRadius: "999px",
                                        border: "1px solid rgba(255,255,255,0.42)",
                                        background: "linear-gradient(90deg, #ffd700 0%, #ffea94 100%)",
                                        color: "#4a0707",
                                        px: 0.7,
                                        py: 0.12,
                                        fontSize: "0.56rem",
                                        fontWeight: 900,
                                        lineHeight: 1.2,
                                        letterSpacing: "0.08em",
                                        boxShadow: "0 6px 14px rgba(0,0,0,0.28)",
                                        pointerEvents: "none",
                                    }}
                                >
                                    NEW!
                                </Box>
                            )}
                        </Box>
                    ))}

                    <Box
                        sx={{
                            width: storeCartCount > 0 ? DESKTOP_CART_SLOT_WIDTH : 0,
                            overflow: "hidden",
                            ml: storeCartCount > 0 ? 0.2 : 0,
                            display: "flex",
                            justifyContent: "flex-end",
                            transition: "width .35s cubic-bezier(.2,.8,.2,1), margin-left .3s ease",
                        }}
                    >
                        <Button
                            onClick={handleStoreCartClick}
                            startIcon={<FiShoppingCart size={18} />}
                            sx={{
                                minWidth: 168,
                                whiteSpace: "nowrap",
                                borderRadius: 999,
                                px: 1.55,
                                py: 0.75,
                                fontWeight: 700,
                                letterSpacing: "0.07em",
                                textTransform: "uppercase",
                                fontFamily: NAV_BODY_FAMILY,
                                color: "#4a0707",
                                background: "linear-gradient(90deg, #ffd700 0%, #ffea94 100%)",
                                boxShadow: "0 0 0 rgba(255,215,0,0)",
                                animation: cartCtaPulse ? "cartCtaPulse 1s ease" : "none",
                                transform: storeCartCount > 0 ? "translateX(0) scale(1)" : "translateX(18px) scale(0.92)",
                                transformOrigin: "right center",
                                opacity: storeCartCount > 0 ? 1 : 0,
                                pointerEvents: storeCartCount > 0 ? "auto" : "none",
                                transition: "transform .35s cubic-bezier(.2,.8,.2,1), opacity .25s ease",
                                "&:hover": {
                                    background: "linear-gradient(90deg, #ffe055 0%, #fff0b0 100%)",
                                },
                            }}
                        >
                            Cart ({storeCartCount})
                        </Button>
                    </Box>
                </Box>
            </Toolbar>
        </Box>
    );

    return (
        <AppBar
            position="sticky"
            elevation={0}
            className={NAV_BODY_CLASS}
            sx={{
                background: "transparent",
                boxShadow: "none",
                top: 6,
                pt: 0.2,
                pb: 0.2,
            }}
        >
            <Box
                sx={{
                    width: { xs: "calc(100% - 18px)", sm: "calc(100% - 26px)", md: "100%" },
                    maxWidth: { xs: "calc(100% - 18px)", sm: "calc(100% - 26px)", md: navFrameMaxWidth },
                    mx: "auto",
                    transition: { md: "max-width .35s cubic-bezier(.2,.8,.2,1)" },
                }}
            >
                {enableGlassNav ? (
                    <GlassSurface
                        width="100%"
                        height="auto"
                        borderRadius={30}
                        backgroundOpacity={0.22}
                        saturation={1.05}
                        displace={0}
                        distortionScale={-80}
                    >
                        {navContent}
                </GlassSurface>
                ) : (
                    <Box
                        sx={{
                            width: "100%",
                            borderRadius: 30,
                            background: "rgba(0,0,0,0.34)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: "0 12px 28px rgba(0,0,0,0.32)",
                        }}
                    >
                        {navContent}
                    </Box>
                )}
            </Box>

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
                            onClick={(event) => {
                                handleHomeClick(true)(event);
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
                                fontWeight: 500,
                                textTransform: "none",
                                letterSpacing: "-0.01em",
                                color: "#FFD700",
                                fontSize:
                                    displayedLang === "fil"
                                        ? "1.05rem"
                                        : "clamp(1.35rem, 5.5vw, 1.65rem)",
                                lineHeight: 1.18,
                                fontFamily: NAV_TITLE_FAMILY,
                                overflow: "visible",
                                maxWidth: "100%",
                                whiteSpace: "nowrap",
                                textShadow: "0 1px 6px rgba(0,0,0,0.4), 0 0 10px rgba(255,215,0,0.28)",
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

                    {storeCartCount > 0 && (
                        <Button
                            onClick={() => {
                                setMobileOpen(false);
                                handleStoreCartClick();
                            }}
                            startIcon={<FiShoppingCart size={18} />}
                            sx={{
                                mb: 1.5,
                                justifyContent: "flex-start",
                                borderRadius: 2,
                                border: "1px solid rgba(255,255,255,0.35)",
                                background: "rgba(255,215,0,0.18)",
                                color: "#FFD700",
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                py: 1,
                                "&:hover": { background: "rgba(255,215,0,0.24)" },
                            }}
                        >
                            Cart ({storeCartCount})
                        </Button>
                    )}

                    <List sx={{ flex: 1 }}>
                        {navItems.map((item) => {
                            const selected = isActiveNavHref(item.href);
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
                                            primary={
                                                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8 }}>
                                                    <span>{item.label}</span>
                                                    {item.isStore && showStoreNewBadge && (
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                borderRadius: "999px",
                                                                border: "1px solid rgba(255,255,255,0.35)",
                                                                background: "rgba(255,215,0,0.22)",
                                                                color: "#FFD700",
                                                                px: 0.6,
                                                                py: 0.1,
                                                                fontSize: "0.58rem",
                                                                fontWeight: 800,
                                                                lineHeight: 1.1,
                                                                letterSpacing: "0.08em",
                                                            }}
                                                        >
                                                            NEW!
                                                        </Box>
                                                    )}
                                                </Box>
                                            }
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
                @keyframes cartCtaPulse {
                    0% {
                        transform: scale(1);
                        box-shadow: 0 0 0 rgba(255, 215, 0, 0);
                    }
                    35% {
                        transform: scale(1.08);
                        box-shadow: 0 0 0 10px rgba(255, 215, 0, 0.14);
                    }
                    100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 rgba(255, 215, 0, 0);
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
                    fontWeight: 500,
                    transition: "transform .18s ease, color .18s ease",
                    fontFamily: NAV_BODY_FAMILY,
                    letterSpacing: "0.08em",
                    px: 1.7,
                    py: 0.75,
                    borderRadius: 999,
                    overflow: "hidden",

                // Click Pop Animation
                transform: pressed ? "scale(0.9)" : "scale(1)",

                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(135deg, rgba(183,28,28,0), rgba(183,28,28,0.25))",
                    opacity: active ? 1 : 0,
                    transition: "opacity .2s ease",
                    zIndex: -1,
                },
                "&::after": {
                    content: '""',
                    position: "absolute",
                    left: "12%",
                    right: "12%",
                    bottom: 4,
                    height: "2px",
                    backgroundColor: "#b71c1c",
                    borderRadius: 999,
                    transform: active ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform .18s ease",
                },

                "&:hover::before": {
                    opacity: 1,
                },

                "&:hover": {
                    color: "#fff4b0",
                    textShadow: "0 0 8px rgba(255,215,0,0.35)",
                    "&::after": {
                        transform: "scaleX(1)",
                    },
                },
            }}
        >
            {children}
        </Button>
    );
}
