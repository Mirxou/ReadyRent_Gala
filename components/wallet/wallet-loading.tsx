'use client';

import { motion } from 'framer-motion';

export function WalletLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="text-2xl font-black tracking-widest text-sovereign-gold animate-pulse">Sovereign Vault</div>
      <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="h-full w-1/2 bg-sovereign-gold"
        />
      </div>
    </div>
  );
}
