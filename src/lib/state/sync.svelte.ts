import { db } from '$lib/local-db/db';
import { liveQuery } from 'dexie';

class SyncStore {
  online = $state(true);
  pendingCount = $state(0);
  lastSync = $state<Date | null>(null);
  syncing = $state(false);

  constructor() {
    if (typeof window !== 'undefined') {
      this.online = navigator.onLine;
      window.addEventListener('online', () => {
        this.online = true;
        this.flush();
      });
      window.addEventListener('offline', () => {
        this.online = false;
      });

      // Keep pending count reactive
      liveQuery(() => db.syncLog.where('synced').equals(0).count()).subscribe((count) => {
        this.pendingCount = count;
      });

      // Background periodic flush timer
      setInterval(() => {
        this.flush();
      }, 30000);
    }
  }

  async flush(): Promise<void> {
    if (!this.online || this.syncing) return;
    this.syncing = true;
    try {
      // Periodic sync flushing scaffolded here. Actual implementation in Phase 4
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      this.syncing = false;
    }
  }
}

export const syncStore = new SyncStore();
