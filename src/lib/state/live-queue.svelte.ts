import { getQueueUpdates } from '../../routes/sync/sync.remote';
import type { LocalQueueTicket } from '$lib/local-db/db';

class LiveQueueStore {
  private liveQueryHandle: any = null;
  private phcId: string | null = null;
  
  tickets = $state<LocalQueueTicket[]>([]);
  connected = $state(false);

  connect(phcId: string) {
    if (this.liveQueryHandle && this.phcId === phcId) return;
    this.phcId = phcId;
    
    // Remote functions query.live returns a store-like object we can subscribe to
    this.liveQueryHandle = getQueueUpdates(phcId);
    
    // Manually react to the stream updates
    $effect.root(() => {
        $effect(() => {
            this.tickets = this.liveQueryHandle.current ?? [];
            this.connected = this.liveQueryHandle.connected;
        });
    });
  }
}

export const liveQueueStore = new LiveQueueStore();
