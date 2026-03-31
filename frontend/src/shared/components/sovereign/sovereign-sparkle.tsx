"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * SovereignSparkle - Interaction Delight.
 * Refined for Phase 11: Sovereign Mastery.
 * 
 * Principles:
 * - Floating Particles: Weightless gold/white dots.
 * - Soft Pulse: High-fidelity atmosphere.
 * - Minimal Motion: No chaotic dispersion.
 */

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export function SovereignSparkle({ children, active = true }: { children: React.ReactNode, active?: boolean }) {
  const particles = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 120 - 60, // -60% to 60%
      y: Math.random() * 120 - 60,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 2, // Slower for "Authority"
      delay: Math.random() * 3,
      color: Math.random() > 0.4 ? '#C5A059' : '#FFFFFF' // Sovereign Gold or White
    }));
  }, [active]);

  return (
    <div className="relative inline-block group">
      {active && particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0], 
            scale: [0, 1.2, 0.8],
            x: [0, p.x],
            y: [0, p.y],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: [0.32, 0.72, 0, 1] // Authority ease
          }}
          className="absolute left-1/2 top-1/2 pointer-events-none z-10"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '50%',
            boxShadow: `0 0 15px ${p.color}44`,
          }}
        />
      ))}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
}

// 🛡️ High-Fidelity Glow Variant
export function SovereignGlow({ children, color = "gold", intensity = "medium" }: { 
  children: React.ReactNode, 
  color?: "gold" | "blue" | "obsidian",
  intensity?: "low" | "medium" | "high"
}) {
  const glowColors = {
    gold: "rgba(197, 160, 89, 0.15)",
    blue: "rgba(30, 58, 138, 0.15)",
    obsidian: "rgba(0, 0, 0, 0.4)",
  };

  const blurLevels = {
    low: "blur-xl",
    medium: "blur-2xl",
    high: "blur-[80px]",
  };

  return (
    <div className="relative group">
       <div 
         className={`absolute -inset-1 rounded-[inherit] ${blurLevels[intensity]} opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none`}
         style={{ backgroundColor: glowColors[color] }}
       />
       {children}
    </div>
  );
}
