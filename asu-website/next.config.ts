// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.sanity.io",
            },
        ],
    },
    async rewrites() {
        const studioHost =
            process.env.NEXT_PUBLIC_STUDIO_DOMAIN || "studio.asianstudentunion.org";

        return [
            {
                source: "/",
                has: [{ type: "host", value: studioHost }],
                destination: "/studio",
            },
            {
                // Rewrite everything on the studio host except Next.js internals/assets to /studio/*
                source: "/:path((?!_next/|api/|resources/|favicon\\.ico).*)",
                has: [{ type: "host", value: studioHost }],
                destination: "/studio/:path",
            },
        ];
    },
};

export default nextConfig;
