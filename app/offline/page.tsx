"use client";

import React from 'react';
import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <div className="bg-sovereign-gold/10 p-4 rounded-full inline-flex mb-6 animate-pulse">
                    <WifiOff className="h-10 w-10 text-sovereign-gold" />
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-2">
                    لا يوجد اتصال بالإنترنت
                </h1>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                    يبدو أنك فقدت الاتصال. لا تقلق، يمكنك الاستمرار في تصفح الصفحات التي زرتها مسبقاً، ولكن بعض الميزات قد لا تعمل.
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        className="w-full bg-sovereign-gold hover:bg-sovereign-gold/90 text-background font-medium"
                        onClick={() => window.location.reload()}
                    >
                        محاولة الاتصال مجدداً
                    </Button>

                    <Link href="/" className="w-full">
                        <Button variant="outline" className="w-full">
                            العودة للرئيسية
                        </Button>
                    </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
                    وضع عدم الاتصال STANDARD الإصدار 1.0
                </div>
            </div>
        </div>
    );
}
