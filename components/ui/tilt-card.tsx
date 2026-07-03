'use client';

import { useRef } from 'react';
import Tilt from 'react-parallax-tilt';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    tiltMaxAngleX?: number;
    tiltMaxAngleY?: number;
    glareEnable?: boolean;
}

export function TiltCard({
    children,
    className = '',
    tiltMaxAngleX = 10,
    tiltMaxAngleY = 10,
    glareEnable = true
}: TiltCardProps) {
    return (
        <Tilt
            className={`transform-gpu ${className}`}
            tiltMaxAngleX={tiltMaxAngleX}
            tiltMaxAngleY={tiltMaxAngleY}
            perspective={1000}
            scale={1.02}
            transitionSpeed={2000}
            glareEnable={glareEnable}
            glareMaxOpacity={0.3}
            glareColor="#8B5CF6"
            glarePosition="all"
            glareBorderRadius="1rem"
        >
            <div className="relative h-full w-full rounded-2xl card-glass border-gradient overflow-hidden group">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-animated opacity-10 group-hover:opacity-20 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative z-10 h-full">
                    {children}
                </div>
            </div>
        </Tilt>
    );
}
