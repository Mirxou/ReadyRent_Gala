"use client";

import React, { useState, useEffect } from 'react';
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
  // Use useState + useEffect to avoid hydration mismatch (Math.random is non-deterministic)
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }
    // Generate deterministic particles based on index to avoid hydration mismatch
    // while satisfying React 19 purity rules
    const seed = active ? 42 : 0;
    const pseudoRandom = (index: number) => {
      const x = Math.sin(seed + index * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    };
    const newParticles: Particle[] = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: pseudoRandom(i) * 120 - 60,
      y: pseudoRandom(i + 12) * 120 - 60,
      size: pseudoRandom(i + 24) * 3 + 1,
      duration: pseudoRandom(i + 36) * 4 + 2,
      delay: pseudoRandom(i + 48) * 3,
      color: pseudoRandom(i + 60) > 0.4 ? '#C5A059' : '#FFFFFF'
    }));
    setParticles(newParticles);
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
export function SovereignGlow({ children, color = "gold", intensity = "medium", className = "" }: { 
  children: React.ReactNode,
  color?: "gold" | "blue" | "obsidian" | "emerald" | "purple",
  intensity?: "low" | "medium" | "high",
  className?: string
}) {
  const glowColors = {
    gold: "rgba(197, 160, 89, 0.15)",
    blue: "rgba(30, 58, 138, 0.15)",
    obsidian: "rgba(0, 0, 0, 0.4)",
    emerald: "rgba(16, 185, 129, 0.15)",
    purple: "rgba(168, 85, 247, 0.15)",
  };

  const blurLevels = {
    low: "blur-xl",
    medium: "blur-2xl",
    high: "blur-[80px]",
  };

  return (
    <div className={`relative group ${className}`}>
       <div 
         className={`absolute -inset-1 rounded-[inherit] ${blurLevels[intensity]} opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none`}
         style={{ backgroundColor: glowColors[color] }}
       />
       {children}
    </div>
  );
}
