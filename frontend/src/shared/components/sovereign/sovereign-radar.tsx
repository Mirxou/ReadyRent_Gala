"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * SovereignRadar - The Localized Geofence.
 * Moved to src/shared/components/sovereign/sovereign-radar.tsx (Phase 11).
 * 
 * Principles:
 * - Real-time Scanning: 360-degree conic gradient beam.
 * - Geographic Authority: Radar points for Algerian hubs (Algiers, Oran, etc.).
 * - Luxury Tech: Subtle glow and high-contrast grid lines.
 */

interface Point {
  x: number;
  y: number;
  label?: string;
  label_ar?: string;
}

interface SovereignRadarProps {
  className?: string;
  points?: Point[];
  scanColor?: string;
}

export function SovereignRadar({ 
  className, 
  points = [
    { x: 45, y: 30, label: 'Algiers Hub', label_ar: 'مركز العاصمة' },
    { x: 70, y: 60, label: 'Current Transit', label_ar: 'قيد العبور النشط' },
    { x: 30, y: 80, label: 'Assigned Courier', label_ar: 'المندوب المعين' }
  ],
  scanColor = 'rgba(197, 160, 89, 0.3)' 
}: SovereignRadarProps) {
  return (
    <div className={cn("relative w-full aspect-square rounded-full bg-sovereign-obsidian/40 border border-white/5 overflow-hidden backdrop-blur-xl shadow-2xl group", className)} dir="rtl">
      
      {/* 1. Target Grids (The Geometry of Trust) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className="w-1/4 h-1/4 rounded-full border border-white/[0.03]" />
         <div className="w-1/2 h-1/2 rounded-full border border-white/[0.03]" />
         <div className="w-3/4 h-3/4 rounded-full border border-white/[0.03]" />
         <div className="absolute w-full h-px bg-white/[0.02]" />
         <div className="absolute h-full w-px bg-white/[0.02]" />
      </div>

      {/* 2. Radar Scan (The Moving Intelligence Beam) */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ 
          background: `conic-gradient(from 0deg, ${scanColor}, transparent 60deg)`,
          transformOrigin: '50% 50%'
        }}
        className="absolute inset-0"
      />

      {/* 3. Detected Entities (The Assets) */}
      {points.map((point, i) => (
        <motion.div
           key={i}
           initial={{ opacity: 0, scale: 0 }}
           animate={{ 
             opacity: [0, 1, 0.4, 1], 
             scale: [0.8, 1.4, 1] 
           }}
           transition={{ 
             duration: 3, 
             repeat: Infinity, 
             delay: i * 0.8,
             ease: "easeInOut"
           }}
           style={{ left: `${point.x}%`, top: `${point.y}%` }}
           className="absolute w-4 h-4 -ml-2 -mt-2 group/point"
        >
           {/* The Core Orb */}
           <div className="w-full h-full rounded-full bg-sovereign-gold shadow-[0_0_25px_rgba(197,160,89,0.9)] border-2 border-white/20" />
           
           {/* Detailed Tooltip Label */}
           <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/point:opacity-100 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="bg-sovereign-obsidian/90 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md shadow-2xl flex flex-col items-center gap-0.5 min-w-[120px]">
                    <span className="text-[10px] font-black italic text-white/90 whitespace-nowrap">{point.label_ar}</span>
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">{point.label}</span>
                </div>
           </div>
        </motion.div>
      ))}

      {/* 4. Infrastructure Feedback Footer */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-1000">
         <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] italic">Active Radar V.10</span>
         </div>
         <p className="text-[7px] font-black text-white/10 uppercase tracking-[0.2em] font-mono">Sovereign Asset Detection: ONLINE</p>
      </div>

      {/* Decorative Shimmer Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-1000" />
    </div>
  );
}
