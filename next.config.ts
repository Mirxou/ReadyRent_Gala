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
    output: 'standalone',
    allowedDevOrigins: ['*.space-z.ai', 'localhost', '127.0.0.1'],
    // NOTE: typescript.ignoreBuildErrors was previously `true` to mask unknown→string JSX casts
    // in cart/bundles/artisans pages. P0 fix: re-enable type checking so type errors
    // surface at build time instead of silently shipping to production.
    // If `next build` fails after this change, fix the offending types in the listed pages.
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    // P2-42 fix: removed `experimental.serverActions.bodySizeLimit: '256kb'`
    // — it was dead config. ripgrep for 'use server' returns 0 matches, so
    // there are no Server Actions anywhere in the codebase. The 256kb limit
    // was therefore a no-op and only confused readers.
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 3600,
        // P2-47 fix: was `**.amazonaws.com` and `**.cloudinary.com` (wildcard)
        // — allowed ANY S3 bucket or Cloudinary cloud to use our Next.js
        // image optimizer as a free resizing proxy (CPU/bandwidth abuse).
        // Now restricted to the specific Cloudinary cloud name from env.
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8000',
                pathname: '/media/**',
            },
            // Pin to the configured Cloudinary cloud name; fall back to
            // `res.cloudinary.com` only if env var is missing (dev convenience)
            {
                protocol: 'https',
                hostname: process.env.CLOUDINARY_CLOUD_NAME
                    ? `res.cloudinary.com`
                    : 'res.cloudinary.com',
                pathname: `/${process.env.CLOUDINARY_CLOUD_NAME || 'standard-rent'}/**`,
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
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            // P1 fix: removed 'unsafe-eval' — ripgrep confirmed zero eval()/new Function()/setTimeout(string) usages
                            "script-src 'self' 'unsafe-inline'",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: https://res.cloudinary.com https://picsum.photos https://images.unsplash.com blob:",
                            "font-src 'self' data:",
                            // P2 fix: pin WS to app origin + known notifications service instead of wildcard ws:/wss:
                            "connect-src 'self' wss://standard.rent ws://localhost:3004 wss://localhost:3004",
                            "frame-ancestors 'self'",
                            "base-uri 'self'",
                            // P2 hardening: defense-in-depth directives
                            "object-src 'none'",
                            "form-action 'self'",
                            "worker-src 'self'",
                            "manifest-src 'self'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default withSerwist(nextConfig);
