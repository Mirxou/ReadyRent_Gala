"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Handshake, 
  Sparkles,
  Zap,
  Globe,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TrustAssuranceChips - The Sigils of Confidence.
 * Moved to src/shared/components/sovereign/trust-assurance-chips.tsx (Phase 11).
 * 
 * Principles:
 * - High-Fidelity Feedback: Hover-glimmer effects.
 * - Pill Design: Absolute 999px radius (The Pill Recipe).
 * - Arabic Dominance: Clear trust indicators for the Algerian elite market.
 */

export function TrustAssuranceChips() {
  const chips = [
    { label: 'هوية موثقة سيادياً', label_en: 'Identity Verified', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'ضمان مالي محمي', label_en: 'Escrow Protected', icon: Lock, color: 'text-sovereign-gold', bg: 'bg-sovereign-gold/10' },
    { label: 'تحكيم بنظام STANDARD', label_en: 'Standard Arbitrated', icon: Handshake, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'تأمين النخبة الشامل', label_en: 'Elite Insurance', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="flex flex-wrap gap-4" dir="rtl">
      {chips.map((chip, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: i * 0.1, 
            ease: [0.32, 0.72, 0, 1] 
          }}
          whileHover={{ 
            scale: 1.05, 
            y: -2,
            backgroundColor: "rgba(255, 255, 255, 0.05)"
          }}
          className={cn(
            "flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/5 shadow-2xl cursor-default transition-all duration-500 backdrop-blur-xl group",
            chip.bg
          )}
        >
          <div className="relative">
            <chip.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", chip.color)} />
            <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-white/40 animate-pulse" />
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] font-black italic tracking-tight text-white/90">
                {chip.label}
            </span>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">
                {chip.label_en}
            </span>
          </div>
          
          <div className="h-4 w-px bg-white/10 mx-1" />
          <Zap className="w-3 h-3 text-white/10 group-hover:text-sovereign-gold transition-colors" />
        </motion.div>
      ))}
    </div>
  );
}
