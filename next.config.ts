import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Development: restrict to known origins (not '*')
    allowedDevOrigins: process.env.NODE_ENV === 'development'
        ? ['http://localhost:3000', 'http://localhost:81']
        : [],

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
