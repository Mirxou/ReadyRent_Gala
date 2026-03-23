'use client';

import { useSovereign } from '@/contexts/SovereignContext';

export function SystemHaltBanner() {
    const { isSystemHalted } = useSovereign();

    if (!isSystemHalted) return null;

    return (
        <div className="system-halted-banner fixed top-0 left-0 right-0 bg-red-600 text-white p-4 text-center font-bold z-[9999] shadow-lg animate-pulse">
            <div className="container mx-auto">
                <p className="text-lg">
                    ⚠️ تم إيقاف النظام القضائي مؤقتاً | Sovereign AI Halted
                </p>
                <p className="text-sm mt-1 opacity-90">
                    العمليات القضائية معلقة. المعلومات متاحة للقراءة فقط.
                </p>
            </div>
        </div>
    );
}
