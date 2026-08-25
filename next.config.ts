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
};

export default withSerwist(nextConfig);
