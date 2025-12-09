// next.config.ts
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = (() => {
    try {
        return supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
    } catch {
        return undefined;
    }
})();

const remotePatterns: RemotePattern[] = [
    ...(supabaseHost
        ? [
              {
                  protocol: "https",
                  hostname: supabaseHost,
                  pathname: "/**",
              } satisfies RemotePattern,
          ]
        : []),
    {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
    },
];

const nextConfig: NextConfig = {
    images: {
        remotePatterns,
    },
};

export default nextConfig;
