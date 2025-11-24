"use client";

import { useState } from "react";
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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const [logoWiggle, setLogoWiggle] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const pathname = usePathname();

    const navItems = [
        { label: "Upcoming Events", href: "/#events" },
        { label: "Our History", href: "/about" },
        { label: "Officers", href: "/officers" },
        { label: "Gallery", href: "/gallery" },
    ];

    return (
        <AppBar
            position="sticky"
            elevation={3}
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

                {/* TITLE */}
                <Typography
                    variant="h6"
                    sx={{
                        flexGrow: 1,
                        fontWeight: 700,
                        color: "#FFD700",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                    }}
                >
                    <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
                        Asian Student Union
                    </Link>
                </Typography>

                {/* DESKTOP NAV BUTTONS */}
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
                    sx: {
                        backgroundColor: "rgba(30,30,30,0.9)",
                        backdropFilter: "blur(8px)",
                        color: "#FFD700",
                    },
                }}
            >
                <List sx={{ width: 250 }}>
                    {navItems.map((item) => (
                        <ListItem key={item.href} disablePadding>
                            <ListItemButton
                                component={Link}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                            >
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        sx: {
                                            color:
                                                pathname === item.href
                                                    ? "#FFD700"
                                                    : "#f0e6b8",
                                            fontWeight:
                                                pathname === item.href ? 700 : 500,
                                        },
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            {/* KEYFRAMES (inline, hydration-safe) */}
            <style jsx global>{`
                @keyframes wiggle {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                    75% { transform: rotate(-2deg); }
                    100% { transform: rotate(0deg); }
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
