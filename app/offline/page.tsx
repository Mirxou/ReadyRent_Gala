"use client";

import React from 'react';
import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-neutral-100">
                <div className="bg-purple-100 p-4 rounded-full inline-flex mb-6 animate-pulse">
                    <WifiOff className="h-10 w-10 text-purple-600" />
                </div>

                <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                    لا يوجد اتصال بالإنترنت
                </h1>

                <p className="text-neutral-600 mb-8 leading-relaxed">
                    يبدو أنك فقدت الاتصال. لا تقلق، يمكنك الاستمرار في تصفح الصفحات التي زرتها مسبقاً، ولكن بعض الميزات قد لا تعمل.
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
                        onClick={() => window.location.reload()}
                    >
                        نحاولة الاتصال مجدداً
                    </Button>

                    <Link href="/" className="w-full">
                        <Button variant="outline" className="w-full border-neutral-200">
                            العودة للرئيسية
                        </Button>
                    </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-100 text-xs text-neutral-400">
                    STANDARD Offline Mode v1.0
                </div>
            </div>
        </div>
    );
}
