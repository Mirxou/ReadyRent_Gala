'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Flame } from 'lucide-react';

interface LiveViewerCountProps {
    productId: number;
}

export const LiveViewerCount = ({ productId }: LiveViewerCountProps) => {
    const [viewerCount, setViewerCount] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;

        const fetchCount = async () => {
            try {
                const res = await api.get(`/analytics/live/activity/${productId}/`);
                if (isMounted && res.data?.viewers != null) {
                    setViewerCount(res.data.viewers as number);
                }
            } catch (_err) {
                console.error("Failed to fetch live count");
            }
        };

        fetchCount();

        const pollInterval = setInterval(fetchCount, 5000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [productId]);

    // Don't show if 0 or 1 (just me)
    if (viewerCount <= 1) return null;

    return (
        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full text-xs font-bold border border-rose-100 animate-pulse">
            <Flame className="w-4 h-4 fill-rose-600" />
            <span>{viewerCount} أشخاص يشاهدون الآن</span>
        </div>
    );
};
