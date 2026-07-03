'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { SovereignOracle } from '@/shared/components/sovereign/sovereign-oracle';
import { cn } from '@/lib/utils';

/**
 * DashboardLayout - The Sovereign Command Center.
 * Phase 11: Sovereign Mastery Edition.
 * 
 * Principles:
 * - Airy Spacing: 64px section gaps and 40px internal margins.
 * - Architectural Integrity: Uses @/shared and @/features aliases.
 * - Material Luxury: Ambient obsidian-gold depth.
 */

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = setTimeout(() => {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

            if (!isAuthenticated && !token) {
                router.push('/login');
            } else {
                setIsLoading(false);
            }
        }, 100);

        return () => clearTimeout(checkAuth);
    }, [isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background selection:bg-sovereign-gold/30">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-sovereign-gold opacity-40" />
                        <ShieldCheck className="absolute inset-0 m-auto w-6 h-6 text-sovereign-gold animate-pulse" />
                    </div>
                    <div className="space-y-1 text-center">
                        <p className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px] italic">Consulting Sovereign Registry</p>
                        <p className="text-[8px] font-black text-white/10 uppercase tracking-widest leading-none">Authentication Protocol V.11</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col pt-20 selection:bg-sovereign-gold/30">
            <div className="flex-1 flex overflow-hidden">
                
                {/* 🛡️ Desktop Sidebar (Airy Depth) */}
                <div className="hidden lg:block h-[calc(100vh-5rem)] sticky top-20 border-r border-white/5 bg-white/[0.01]">
                    <DashboardSidebar />
                </div>

                {/* 🌌 Main Command Center */}
                <main className={cn(
                    "flex-1 overflow-y-auto relative",
                    "p-[40px] pt-[64px]" // Applying --page-margin and --section-gap usage
                )}>
                    {/* Background Strategic Ambient Glows */}
                    <div className="fixed inset-0 pointer-events-none z-0">
                        <div className="absolute top-[-10%] right-[10%] w-[50%] h-[50%] rounded-full bg-sovereign-gold/[0.03] blur-[140px] animate-soft-pulse" />
                        <div className="absolute bottom-[0%] left-[10%] w-[40%] h-[40%] rounded-full bg-sovereign-gold/[0.02] blur-[120px]" />
                        
                        {/* Grid Texture Overlay */}
                        <div className="absolute inset-0 bg-[url('/images/textures/grid.svg')] bg-repeat opacity-[0.02] mix-blend-overlay" />
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="space-y-[64px]"> {/* Root section spacing */}
                            {children}
                        </div>
                    </div>
                    
                    {/* 🤖 The Global Oracle Presence */}
                    <SovereignOracle />
                    
                    {/* 👑 Quality Assurance Footer */}
                    <footer className="mt-[120px] pb-10 flex border-t border-white/5 pt-10 px-4 justify-between items-center opacity-20 hover:opacity-40 transition-opacity duration-1000">
                        <div className="flex items-center gap-4">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Standard Sovereign Ecosystem</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest italic">All Operations Logged & Verified</span>
                    </footer>
                </main>
            </div>
        </div>
    );
}
