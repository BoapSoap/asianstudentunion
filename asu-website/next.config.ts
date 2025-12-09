// next.config.ts
import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = (() => {
    try {
        return supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
    } catch {
        return undefined;
    }
})();

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            ...(supabaseHost
                ? [
                      {
                          protocol: "https",
                          hostname: supabaseHost,
                      },
                  ]
                : []),
            {
                protocol: "https",
                hostname: "**.supabase.co",
            },
        ],
    },
};

export default nextConfig;
