"use client";

import { useEffect, useState } from "react";
import LiquidEther from "./LiquidEther";

export default function BackgroundLiquid() {
    const [enabled, setEnabled] = useState(true);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const smallScreen = window.matchMedia("(max-width: 768px)");

        const update = () => setEnabled(!(reduceMotion.matches || smallScreen.matches));
        update();

        reduceMotion.addEventListener("change", update);
        smallScreen.addEventListener("change", update);
        return () => {
            reduceMotion.removeEventListener("change", update);
            smallScreen.removeEventListener("change", update);
        };
    }, []);

    useEffect(() => {
        const handleVisibility = () => setVisible(!document.hidden);
        handleVisibility();
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    if (!enabled || !visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: -1,
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            <LiquidEther
                colors={["#340404", "#7a0c0c", "#c01717", "#ffb300", "#ffd75e"]}
                mouseForce={9}
                cursorSize={56}
                resolution={0.18}
                isBounce
                autoDemo={false}
                autoSpeed={0.16}
                autoIntensity={0.55}
                takeoverDuration={0.25}
                autoResumeDelay={3000}
                autoRampDuration={0.6}
            />
        </div>
    );
}
