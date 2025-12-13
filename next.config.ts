import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "image.tmdb.org",
                pathname: "/t/p/**",
            },
            {
                protocol: "https",
                hostname: "cdn.myanimelist.net",
                pathname: "/images/**",
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "2mb",
        },
    },
};

export default nextConfig;
