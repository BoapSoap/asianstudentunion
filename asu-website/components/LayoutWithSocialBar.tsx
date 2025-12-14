"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import SocialBar from "@/components/SocialBar";

export default function LayoutWithSocialBar({
                                                children,
                                            }: {
    children: ReactNode;
}) {
    const pathname = usePathname();
    const isStudio = pathname?.startsWith("/studio");

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (window.location.hash) return; // let anchor links handle their own scrolling
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [pathname]);

    return (
        <>
            {children}
            {!isStudio && <SocialBar />}
            {!isStudio && (
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        padding: "0 16px 14px",
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.62)",
                        letterSpacing: "0.01em",
                        opacity: 0.78,
                        flexDirection: "column",
                    }}
                >
                    <span>
                        Copyright © 2025 Asian Student Union | All rights
                        reserved.
                    </span>
                    <span>Designed and built by Anmol Tadikonda.</span>
                </div>
            )}
        </>
    );
}
