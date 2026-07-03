'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, checkAuth } = useAuthStore();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            if (!isAuthenticated) {
                await checkAuth();
            }
            setIsChecking(false);
        };
        verifySession();
    }, [isAuthenticated, checkAuth]);

    useEffect(() => {
        if (!isChecking && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isChecking, isAuthenticated, router]);

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-sovereign-gold" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
