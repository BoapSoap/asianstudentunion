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
        </>
    );
}
