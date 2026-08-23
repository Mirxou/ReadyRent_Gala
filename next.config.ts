import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: ['*.space-z.ai', 'localhost', '127.0.0.1'],

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
        ],
    },
    turbopack: {
        root: '.',
    },
};

export default nextConfig;
