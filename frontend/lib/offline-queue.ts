import { openDB, DBSchema } from 'idb';

interface OfflineAction {
    id?: number;
    url: string;
    method: string;
    body: any;
    timestamp: number;
    status: 'PENDING' | 'SYNCING' | 'FAILED';
}

interface OfflineDB extends DBSchema {
    'action-queue': {
        key: number;
        value: OfflineAction;
    };
}

const DB_NAME = 'ready-rent-offline-db';
const STORE_NAME = 'action-queue';

export class OfflineQueue {
    private dbPromise;

    constructor() {
        if (typeof window !== 'undefined') {
            this.dbPromise = openDB<OfflineDB>(DB_NAME, 1, {
                upgrade(db) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                },
            });
        }
    }

    async enqueueAction(url: string, method: string, body: any) {
        if (!this.dbPromise) return;
        const db = await this.dbPromise;
        return db.add(STORE_NAME, {
            url,
            method,
            body,
            timestamp: Date.now(),
            status: 'PENDING',
        });
    }

    async getQueue() {
        if (!this.dbPromise) return [];
        const db = await this.dbPromise;
        return db.getAll(STORE_NAME);
    }

    async removeItem(id: number) {
        if (!this.dbPromise) return;
        const db = await this.dbPromise;
        return db.delete(STORE_NAME, id);
    }

    async clearQueue() {
        if (!this.dbPromise) return;
        const db = await this.dbPromise;
        return db.clear(STORE_NAME);
    }
}

export const offlineQueue = new OfflineQueue();
