"use client";

import { useEffect, useState } from 'react';
import { offlineQueue } from '@/lib/offline-queue';
import { toast } from 'sonner';

export function useOfflineSync() {
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const handleOnline = async () => {
            const queue = await offlineQueue.getQueue();
            if (queue.length === 0) return;

            setIsSyncing(true);
            const toastId = toast.loading(`جاري مزامنة ${queue.length} عملية...`);

            let syncedCount = 0;
            let errorsCount = 0;

            for (const item of queue) {
                try {
                    await fetch(item.url, {
                        method: item.method,
                        headers: { 'Content-Type': 'application/json' },
                        body: item.body ? JSON.stringify(item.body) : undefined,
                        credentials: 'include',
                    });

                    if (item.id) {
                        await offlineQueue.removeItem(item.id);
                        syncedCount++;
                    }
                } catch (error) {
                    console.error("Sync failed for item", item, error);
                    errorsCount++;
                }
            }

            setIsSyncing(false);
            toast.dismiss(toastId);

            if (syncedCount > 0) {
                toast.success(`✅ تمت مزامنة ${syncedCount} عملية بنجاح`);
            }
            if (errorsCount > 0) {
                toast.error(`⚠️ فشلت ${errorsCount} عملية. سيتم إعادة المحاولة لاحقاً`);
            }
        };

        window.addEventListener('online', handleOnline);

        // Check immediately on mount if we are online and have items
        if (navigator.onLine) {
            handleOnline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return { isSyncing };
}