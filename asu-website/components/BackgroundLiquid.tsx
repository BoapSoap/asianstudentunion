"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import LiquidEther from "./LiquidEther";

function canUseWebGL() {
    try {
        const canvas = document.createElement("canvas");
        return (
            !!window.WebGLRenderingContext &&
            (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
    } catch (e) {
        return false;
    }
}

export default function BackgroundLiquid() {
    const envAllows =
        typeof process === "undefined" ||
        process.env.NEXT_PUBLIC_ENABLE_LIQUID !== "false";
    const [enabled, setEnabled] = useState(true);
    const [visible, setVisible] = useState(true);
    const [ready, setReady] = useState(false);
    const [resolution, setResolution] = useState(0.12);
    const pathname = usePathname();
    const webglSupported = useMemo(() => canUseWebGL(), []);

    const isHeavyRoute = useMemo(() => false, [pathname]);

    useEffect(() => {
        // defer mount so main content can settle first
        const timeout = setTimeout(() => setReady(true), 800);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const smallScreen = window.matchMedia("(max-width: 768px)");
        const lowPower = window.matchMedia("(prefers-reduced-data: reduce)");
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const res = dpr > 1.5 ? 0.07 : 0.1; // drop internal resolution on high-DPI screens
        if (resolution !== res) {
            const id = requestAnimationFrame(() => setResolution(res));
            return () => cancelAnimationFrame(id);
        }

        const update = () =>
            setEnabled(!(reduceMotion.matches || smallScreen.matches || lowPower.matches));
        update();

        reduceMotion.addEventListener("change", update);
        smallScreen.addEventListener("change", update);
        lowPower.addEventListener("change", update);
        return () => {
            reduceMotion.removeEventListener("change", update);
            smallScreen.removeEventListener("change", update);
            lowPower.removeEventListener("change", update);
        };
    }, [resolution]);

    useEffect(() => {
        const handleVisibility = () => setVisible(!document.hidden);
        handleVisibility();
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    if (!envAllows || !enabled || !visible || isHeavyRoute || !ready || !webglSupported) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: -1,
                overflow: "hidden",
                pointerEvents: "none",
                backgroundColor: "#1a0404",
                background:
                    "radial-gradient(circle at 18% 18%, rgba(214, 47, 47, 0.35), transparent 46%), radial-gradient(circle at 78% 72%, rgba(255, 134, 134, 0.3), transparent 45%), linear-gradient(145deg, #1a0404 0%, #240303 45%, #2d0202 100%), #240303",
            }}
        >
            {webglSupported ? (
                <LiquidEther
                    colors={["#340404", "#7a0c0c", "#c01717", "#ffb300", "#ffd75e"]}
                    mouseForce={7}
                    cursorSize={48}
                    resolution={resolution}
                    isBounce
                    autoDemo={false}
                    autoSpeed={0.09}
                    autoIntensity={0.32}
                    takeoverDuration={0.25}
                    autoResumeDelay={3000}
                    autoRampDuration={0.6}
                />
            ) : null}
        </div>
    );
}
