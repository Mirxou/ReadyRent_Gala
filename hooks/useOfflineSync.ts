"use client";

import { useEffect, useState } from 'react';
import { offlineQueue } from '@/lib/offline-queue';
import { toast } from 'sonner';
import axios from 'axios';

export function useOfflineSync() {
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const handleOnline = async () => {
            const queue = await offlineQueue.getQueue();
            if (queue.length === 0) return;

            setIsSyncing(true);
            const toastId = toast.loading(`Mise en ligne de ${queue.length} actions...`);

            let syncedCount = 0;
            let errorsCount = 0;

            for (const item of queue) {
                try {
                    await axios({
                        url: item.url,
                        method: item.method,
                        data: item.body,
                        headers: {
                            'Content-Type': 'application/json',
                            // Add auth headers if needed, or rely on existing axios interceptors
                        }
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
                toast.success(`✅ ${syncedCount} actions synchronisées avec succès.`);
            }
            if (errorsCount > 0) {
                toast.error(`⚠️ ${errorsCount} actions ont échoué. Elles seront réessayées plus tard.`);
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
