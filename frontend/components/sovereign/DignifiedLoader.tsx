'use client';

import { motion } from 'framer-motion';

export function DignifiedLoader({ label = "جاري التحقق..." }: { label?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-6 p-12">
            {/* The Breathing Ring */}
            <div className="relative w-24 h-24">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-amber-500/30"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [0.8, 1.2, 1.4],
                            opacity: [0, 0.5, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.8,
                            ease: "easeInOut"
                        }}
                    />
                ))}

                {/* Core Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-2 border-t-amber-500 border-r-amber-500/50 border-b-transparent border-l-transparent rounded-full"
                    />
                </div>
            </div>

            {/* Text Label */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center font-serif"
            >
                <div className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-1">
                    {label}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-widest">
                    Sovereign Verification
                </div>
            </motion.div>
        </div>
    );
}
