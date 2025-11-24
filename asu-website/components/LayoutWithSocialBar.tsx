"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SocialBar from "@/components/SocialBar";

export default function LayoutWithSocialBar({
                                                children,
                                            }: {
    children: ReactNode;
}) {
    const pathname = usePathname();
    const isStudio = pathname?.startsWith("/studio");

    return (
        <>
            {children}
            {!isStudio && <SocialBar />}
        </>
    );
}
