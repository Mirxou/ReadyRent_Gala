"use client";

import { motion } from "framer-motion";
import { SocialCommander } from "@/features/social/components/social-commander";
import { SovereignConcierge } from "@/shared/components/sovereign/sovereign-concierge";

export default function SocialPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className="pb-20 airy-dashboard"
      dir="rtl"
    >
      <SocialCommander />

      {/* 🤖 GLOBAL CONCIERGE */}
      <SovereignConcierge />
    </motion.div>
  );
}

