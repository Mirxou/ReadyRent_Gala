'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Wallet,
    Settings,
    LogOut,
    Sparkles,
    FileSignature,
    Scale,
    BrainCircuit,
    Scissors,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';

const sidebarItems = [
    {
        title: 'نظرة عامة',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'الخزانة السيادية',
        href: '/dashboard/wallet',
        icon: Wallet,
    },
    {
        title: 'سجل الرغبات',
        href: '/dashboard/wishlist',
        icon: Sparkles,
    },
    {
        title: 'الأصول الملكية',
        href: '/dashboard/products',
        icon: Package,
    },
    {
        title: 'سجل العقود',
        href: '/dashboard/orders',
        icon: FileSignature,
    },
    {
        title: 'نبض النظام',
        href: '/dashboard/analytics',
        icon: BrainCircuit,
    },
    {
        title: 'شبكة الحرفيين',
        href: '/dashboard/artisans',
        icon: Scissors,
    },
    {
        title: 'التحكيم والنزاعات',
        href: '/dashboard/disputes',
        icon: Scale,
    },
    {
        title: 'الإعدادات',
        href: '/dashboard/settings',
        icon: Settings,
    },
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const { logout } = useAuthStore();

    return (
        <div className="flex flex-col h-full w-72 bg-background/80 backdrop-blur-3xl border-l border-white/5 relative overflow-hidden" dir="rtl">
            
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sovereign-gold/5 rounded-full blur-[80px] -z-10" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-sovereign-blue/5 rounded-full blur-[100px] -z-10" />

            <div className="p-8 flex-1">
                <div className="flex items-center gap-3 mb-12 group cursor-pointer">
                    <div className="relative">
                        <ShieldCheck className="w-8 h-8 text-sovereign-gold group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-sovereign-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter text-foreground uppercase">
                           Sovereign<span className="text-sovereign-gold">.</span>
                        </span>
                        <span className="text-[8px] font-black tracking-[0.4em] text-muted-foreground uppercase -mt-1 opacity-60">
                            Registry System
                        </span>
                    </div>
                </div>

                <nav className="space-y-3">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link key={item.href} href={item.href}>
                                <button
                                    className={cn(
                                        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                                        isActive
                                            ? "bg-white/5 text-foreground shadow-2xl shadow-black/20 border border-white/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sovereign-gold rounded-l-full shadow-[0_0_15px_rgba(180,146,84,0.5)]" />
                                    )}
                                    <Icon className={cn(
                                        "w-5 h-5 transition-all duration-500",
                                        isActive ? "text-sovereign-gold scale-110" : "group-hover:text-sovereign-gold group-hover:scale-110"
                                    )} />
                                    <span className={cn(
                                        "text-sm font-black tracking-tight",
                                        isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                                    )}>
                                        {item.title}
                                    </span>
                                </button>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-8 mt-auto border-t border-white/5">
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-4 px-6 py-4 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all duration-300 group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-black tracking-tight uppercase">خروج سيادي</span>
                </button>
            </div>
        </div>
    );
}
