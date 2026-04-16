import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ['hijri-date-converter'],
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 3600,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: '**.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
    // 🛡️ SECURITY HEADERS (Phase 3 Audit M12) - PROD MODE
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geoloc=()',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: `default-src 'self'; script-src 'self' https://va.vercel-scripts.com; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https://**.amazonaws.com https://**.cloudinary.com https://images.unsplash.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests;`,
                    },
                ],
            },
        ];
    },
    // Turbopack disabled in production
};

const withSerwist = require("@serwist/next").default({
    swSrc: "app/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);