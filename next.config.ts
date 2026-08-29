import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  disablePrecacheWarmup: true,
  // Disable in dev when using Turbopack (not supported yet)
  disable: process.env.NODE_ENV !== 'production',
});

const nextConfig: NextConfig = {
    allowedDevOrigins: ['*.space-z.ai', 'localhost', '127.0.0.1'],
    typescript: {
        ignoreBuildErrors: true, // TODO: fix remaining unknown→string JSX casts in cart, bundles, artisans pages
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '256kb',
        },
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 3600,
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8000',
                pathname: '/media/**',
            },
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
                hostname: 'picsum.photos',
            },
        ],
    },
    turbopack: {
        root: '.',
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), payment=(self)' },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: https://res.cloudinary.com https://picsum.photos https://images.unsplash.com blob:",
                            "font-src 'self' data:",
                            "connect-src 'self' ws: wss:",
                            "frame-ancestors 'self'",
                            "base-uri 'self'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default withSerwist(nextConfig);
