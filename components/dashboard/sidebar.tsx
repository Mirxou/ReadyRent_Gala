'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Package,
    Wallet,
    Settings,
    LogOut,
    Sparkles,
    FileSignature,
    Scale,
    BrainCircuit,
    Scissors,
    ShieldCheck,
    BarChart3,
    Users,
    ListChecks,
    ClipboardList,
    CalendarCheck,
    Bell,
    Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';

const sidebarSections = [
    {
        title: null,
        items: [
            { title: 'نظرة عامة', href: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: 'إدارة',
        items: [
            { title: 'الحجوزات', href: '/dashboard/bookings', icon: CalendarCheck },
            { title: 'الخزانة', href: '/dashboard/wallet', icon: Wallet },
            { title: 'الإشعارات', href: '/dashboard/notifications', icon: Bell },
            { title: 'سجل الرغبات', href: '/dashboard/wishlist', icon: Sparkles },
            { title: 'الأصول الملكية', href: '/dashboard/products', icon: Package },
            { title: 'العقود والطلبات', href: '/dashboard/orders', icon: FileSignature },
            { title: 'قائمة الانتظار', href: '/dashboard/waitlist', icon: ListChecks },
        ]
    },
    {
        title: 'تحليلات',
        items: [
            { title: 'نبض النظام', href: '/dashboard/analytics', icon: BrainCircuit },
            { title: 'التقارير الاستخباراتية', href: '/dashboard/reports', icon: BarChart3 },
        ]
    },
    {
        title: 'مجتمع',
        items: [
            { title: 'شبكة الحرفيين', href: '/dashboard/artisans', icon: Scissors },
            { title: 'الفيد الاجتماعي', href: '/dashboard/social', icon: Users },
        ]
    },
    {
        title: 'أخرى',
        items: [
            { title: 'التحكيم والنزاعات', href: '/dashboard/disputes', icon: Scale },
            { title: 'توحيد الأصول', href: '/dashboard/standardize', icon: ClipboardList },
            { title: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
        ]
    },
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const { logout } = useAuthStore();

    return (
        <div className="flex flex-col h-full w-72 bg-background/80 backdrop-blur-3xl border-l border-white/5 relative overflow-hidden" dir="rtl">
            
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sovereign-gold/5 rounded-full blur-[80px] -z-10" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-sovereign-gold/5 rounded-full blur-[100px] -z-10" />

            <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-3 mb-10 group cursor-pointer">
                    <div className="relative">
                        <ShieldCheck className="w-7 h-7 text-sovereign-gold group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tighter text-foreground uppercase">
                           STANDARD<span className="text-sovereign-gold">.</span>
                        </span>
                        <span className="text-[8px] font-black tracking-[0.3em] text-muted-foreground uppercase -mt-0.5 opacity-50">
                            Registry System
                        </span>
                    </div>
                </div>

                <nav className="space-y-6">
                    {sidebarSections.map((section, sIdx) => (
                        <div key={sIdx}>
                            {section.title && (
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 px-4 mb-2 block">
                                    {section.title}
                                </span>
                            )}
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link key={item.href} href={item.href}>
                                            <button
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden text-sm",
                                                    isActive
                                                        ? "bg-white/5 text-foreground shadow-lg shadow-black/10 border border-white/10"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                                )}
                                            >
                                                {isActive && (
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sovereign-gold rounded-l-full shadow-[0_0_10px_rgba(180,146,84,0.4)]" />
                                                )}
                                                <Icon className={cn(
                                                    "w-4 h-4 transition-all duration-300",
                                                    isActive ? "text-sovereign-gold scale-110" : "group-hover:text-sovereign-gold"
                                                )} />
                                                <span className={cn(
                                                    "font-medium",
                                                    isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                                                )}>
                                                    {item.title}
                                                </span>
                                            </button>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            <div className="p-6 mt-auto border-t border-white/5">
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all duration-300 group"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">خروج</span>
                </button>
            </div>
        </div>
    );
}