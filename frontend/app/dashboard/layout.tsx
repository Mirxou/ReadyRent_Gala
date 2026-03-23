'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check auth on mount to avoid hydration mismatch
        const checkAuth = setTimeout(() => {
            // Use persisted token check as fallback
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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-gala-purple" />
                    <p className="text-muted-foreground animate-pulse">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col pt-20"> {/* pt-20 to account for fixed Navbar */}
            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block h-[calc(100vh-5rem)] sticky top-20">
                    <DashboardSidebar />
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {/* Background Ambient Glow */}
                    <div className="fixed inset-0 pointer-events-none z-[-1]">
                        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-gala-purple/5 blur-[100px]" />
                        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-gala-pink/5 blur-[100px]" />
                    </div>

                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
