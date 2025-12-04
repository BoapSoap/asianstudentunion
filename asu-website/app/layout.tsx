import "./globals.css";
import "../components/GlassSurface.css";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import LayoutWithSocialBar from "../components/LayoutWithSocialBar";
import BackgroundLiquid from "../components/BackgroundLiquid";
import EmotionCacheProvider from "./EmotionCacheProvider";

export const metadata: Metadata = {
    title: "Asian Student Union",
    description: "Celebrating Culture & Community at SFSU",
    icons: {
        icon: [
            {
                url: "/resources/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                url: "/resources/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
        apple: "/resources/android-chrome-192x192.png",
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body suppressHydrationWarning>
        <EmotionCacheProvider>
            {/* Background liquid effect */}
            <BackgroundLiquid />
            {/* Global Navbar */}
            <Navbar />

            {/* Page content + SocialBar (hidden on /studio) */}
            <LayoutWithSocialBar>{children}</LayoutWithSocialBar>
        </EmotionCacheProvider>
        </body>
        </html>
    );
}
