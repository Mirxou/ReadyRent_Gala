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
    Sparkles
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
        title: 'منتجاتي',
        href: '/dashboard/products',
        icon: Package,
    },
    {
        title: 'الطلبات',
        href: '/dashboard/orders',
        icon: ShoppingBag,
    },
    {
        title: 'المحفظة',
        href: '/dashboard/wallet',
        icon: Wallet,
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
        <div className="flex flex-col h-full w-64 bg-background/50 backdrop-blur-xl border-l border-gray-200 dark:border-white/10">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <Sparkles className="w-6 h-6 text-gala-gold animate-pulse" />
                    <span className="text-xl font-bold bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">
                        لوحة البائع
                    </span>
                </div>

                <nav className="space-y-2">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start gap-3 rounded-xl transition-all duration-300",
                                        isActive
                                            ? "bg-gradient-to-r from-gala-purple/10 to-gala-pink/10 text-gala-purple hover:text-gala-purple hover:bg-gala-purple/20 border border-gala-purple/20"
                                            : "hover:bg-gray-100 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5", isActive ? "text-gala-purple" : "text-muted-foreground")} />
                                    <span className="font-medium">{item.title}</span>
                                    {isActive && (
                                        <span className="mr-auto w-1.5 h-1.5 rounded-full bg-gala-purple animate-pulse" />
                                    )}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-gray-200 dark:border-white/10">
                <Button
                    variant="ghost"
                    onClick={() => logout()}
                    className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">تسجيل الخروج</span>
                </Button>
            </div>
        </div>
    );
}
