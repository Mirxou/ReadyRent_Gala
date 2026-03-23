import { defaultCache } from "@serwist/next/worker";
import { Serwist, BackgroundSyncPlugin } from "serwist";

// `PrecacheEntry` is not exported by the installed `@serwist/window` version.
// We only need a minimal shape for typing the SW manifest.
type PrecacheEntry = { url: string; revision?: string };

declare global {
    interface WorkerGlobalScope {
        __SW_MANIFEST?: (PrecacheEntry | string)[];
    }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    // Cast to `any` because Serwist's RuntimeCaching typing differs slightly across versions.
    runtimeCaching: [
        ...defaultCache,
        {
            // Custom API Caching with Background Sync for Mutations
            urlPattern: ({ url }: any) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
                cacheName: "api-cache",
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 5, // 5 minutes
                },
                plugins: [
                    new BackgroundSyncPlugin("offline-actions", {
                        maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
                    }),
                ],
            },
        } as any,
    ] as any,
});

serwist.addEventListeners();
