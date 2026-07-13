# ClinicFlow — Local-First Synchronization Architecture & State Management

---

## 1. Local-First Strategy

### 1.1 Principle
IndexedDB is the **source of truth for the running clinic session**. Every read and every write goes to IndexedDB first, unconditionally, whether or not the network is up. PostgreSQL is a durable, shared, eventually-consistent mirror — not a dependency for any in-clinic action.

### 1.2 Local Storage Layer
Use **Dexie.js** as the IndexedDB wrapper (matches your established stack). Each core table gets a local mirror:

```ts
// src/lib/local-db/db.ts
import Dexie, { type Table } from 'dexie';

export interface LocalPatient {
  id: string;            // UUID, generated client-side at creation time
  clinicId: string;
  familyId: string | null;
  guardianId: string | null;
  name: string;
  phone: string | null;
  dob: string | null;
  sex: 'male' | 'female' | 'other';
  syncStatus: 'synced' | 'pending' | 'conflict';
  updatedAt: number;      // epoch ms, used for LWW + sync cursors
  serverUpdatedAt: number | null;
  deleted: boolean;
}

export interface LocalQueueTicket {
  id: string;
  patientId: string;
  ticketNumber: number;
  status: 'waiting' | 'called' | 'in_progress' | 'done';
  triageLevel: 'green' | 'amber' | 'red';
  triageReason: string | null;
  createdAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  updatedAt: number;
}

// ... LocalVitalsRecord, LocalPharmacyInventory, LocalReminder follow the same shape

class ClinicFlowDB extends Dexie {
  patients!: Table<LocalPatient, string>;
  queueTickets!: Table<LocalQueueTicket, string>;
  vitalsRecords!: Table<LocalVitalsRecord, string>;
  pharmacyInventory!: Table<LocalPharmacyInventory, string>;
  reminders!: Table<LocalReminder, string>;
  syncLog!: Table<SyncLogEntry, string>;

  constructor() {
    super('clinicflow');
    this.version(1).stores({
      patients: 'id, clinicId, familyId, name, phone, syncStatus, updatedAt',
      queueTickets: 'id, patientId, status, triageLevel, createdAt, syncStatus',
      vitalsRecords: 'id, patientId, recordedAt, syncStatus',
      pharmacyInventory: 'id, itemName, currentStock, syncStatus',
      reminders: 'id, patientId, dueDate, sent, syncStatus',
      syncLog: '++localId, entityType, entityId, operation, timestamp, synced',
    });
  }
}

export const db = new ClinicFlowDB();
```

### 1.3 Write Path (fully offline-capable)
Every mutation (register patient, enter vitals, dispense drug, etc.) follows this exact sequence, regardless of connectivity:

1. Generate a client-side UUID for new records (never wait for a server-issued ID).
2. Write directly to the relevant Dexie table, `syncStatus: 'pending'`, `updatedAt: Date.now()`.
3. Append an entry to `syncLog` describing the operation (`create` / `update` / `delete`, entity type, entity id, payload snapshot).
4. UI reads reactively from Dexie via live queries — the write is immediately visible with zero network round trip.

This guarantees registration, triage, queueing, vitals, and prescribing all work identically whether the clinic has internet or not — the sync engine is a background concern, invisible to the staff workflow.

### 1.4 Read Path
All UI reads query Dexie directly using `dexie-react-hooks`-equivalent Svelte live queries (via a small custom `liveQuery` wrapper using Dexie's `liveQuery()` + Svelte stores/runes — see §3). Server data never blocks a read.

---

## 2. Sync Engine Specification

### 2.1 Goals
- Reconcile local IndexedDB with PostgreSQL whenever connectivity is available.
- Guarantee **Read-Your-Writes**: once a nurse enters vitals, the doctor's view (same device or LAN-networked device) reflects it — locally if same device, via sync if a different device.
- Resolve conflicts deterministically without manual intervention in the common case.

### 2.2 Sync Trigger
- A background `SyncManager` (runs as a Svelte 5 `$effect` at the app root, plus a `navigator.onLine` listener and periodic 30s poll as a fallback for flaky "technically online but flapping" connections).
- On trigger: push pending local mutations, then pull server changes since last cursor.

### 2.3 Push Phase
```ts
async function pushPending() {
  const pending = await db.syncLog.where('synced').equals(0).toArray();
  if (pending.length === 0) return;

  const batches = chunk(pending, 50); // batch to keep payloads reasonable on poor connections
  for (const batch of batches) {
    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        body: JSON.stringify({ operations: batch }),
      });
      const { accepted, conflicts } = await res.json();

      for (const id of accepted) {
        await db.syncLog.update(id, { synced: 1 });
      }
      for (const conflict of conflicts) {
        await handleConflict(conflict);
      }
    } catch {
      break; // network dropped mid-sync — safe to retry later, nothing is lost locally
    }
  }
}
```

### 2.4 Pull Phase
```ts
async function pullServerChanges() {
  const cursor = await getLastSyncCursor(); // stored in a local meta table
  const res = await fetch(`/api/sync/pull?since=${cursor}`);
  const { changes, newCursor } = await res.json();

  for (const change of changes) {
    await applyRemoteChange(change); // see conflict resolution below
  }
  await setLastSyncCursor(newCursor);
}
```

### 2.5 Conflict Resolution
Primary strategy: **Last-Write-Wins by `updatedAt`, with field-level merge for non-overlapping fields where practical, and a hard-priority override for safety-critical fields.**

- Every record carries `updatedAt` (client clock) — client clocks are not fully trusted, so the server additionally stamps `serverReceivedAt` and is the tiebreak authority.
- **Default rule:** incoming remote change wins if `remoteUpdatedAt > localUpdatedAt`; otherwise local wins and is re-pushed.
- **Special case — `pharmacy_inventory.current_stock`:** never LWW. Stock changes are treated as **deltas, not absolute values** — both client and server emit `{ delta: -1 }` operations, and the server applies deltas additively in arrival order. This prevents two offline devices from both decrementing stock and one silently clobbering the other's decrement.
- **Special case — `queue_tickets.triageLevel`:** if a conflict arises between a `red` and a lower flag for the same patient during the same visit, **the more urgent flag always wins**, regardless of timestamp — patient safety overrides LWW here.
- Any conflict the automatic rules can't cleanly resolve is written with `syncStatus: 'conflict'` and surfaced in a small Admin "Sync Conflicts" panel for manual review — this should be rare given the rules above.

### 2.6 Server-Side Sync Endpoint (SvelteKit route sketch)
```ts
// src/routes/api/sync/push/+server.ts
import { db as serverDb } from '$db';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { operations } = await request.json();
  const accepted: string[] = [];
  const conflicts: unknown[] = [];

  for (const op of operations) {
    const existing = await serverDb.query[op.entityType].findFirst({
      where: (t, { eq }) => eq(t.id, op.entityId),
    });

    if (op.entityType === 'pharmacyInventory' && op.field === 'currentStock') {
      await serverDb
        .update(pharmacyInventory)
        .set({ currentStock: sql`${pharmacyInventory.currentStock} + ${op.delta}` })
        .where(eq(pharmacyInventory.id, op.entityId));
      accepted.push(op.localId);
      continue;
    }

    if (!existing || op.updatedAt >= existing.updatedAt) {
      await serverDb.insert(schemaTable(op.entityType))
        .values(op.payload)
        .onConflictDoUpdate({ target: idColumn, set: op.payload });
      accepted.push(op.localId);
    } else {
      conflicts.push({ localId: op.localId, serverVersion: existing });
    }
  }

  return json({ accepted, conflicts });
}
```

---

## 3. Svelte 5 Runes State Blueprint

### 3.1 Why Runes Fit This Problem
The queue must reflect the same state across three simultaneous views (Nurse, Doctor, Waiting Room) that may be on the same device or different devices on the clinic LAN. Runes give fine-grained reactivity locally; the sync engine + Dexie `liveQuery` bridges cross-device state.

### 3.2 Local Live-Query Store Bridge
```ts
// src/lib/state/queue.svelte.ts
import { liveQuery } from 'dexie';
import { db } from '$lib/local-db/db';

class QueueState {
  tickets = $state<LocalQueueTicket[]>([]);

  constructor() {
    const query = liveQuery(() =>
      db.queueTickets
        .where('status')
        .anyOf(['waiting', 'called', 'in_progress'])
        .toArray()
    );

    // Bridge Dexie's observable into a Svelte 5 rune
    query.subscribe((result) => {
      this.tickets = result;
    });
  }

  // Derived, automatically recomputes whenever `tickets` changes
  sortedQueue = $derived(
    [...this.tickets].sort((a, b) => {
      const priority = { red: 0, amber: 1, green: 2 };
      if (priority[a.triageLevel] !== priority[b.triageLevel]) {
        return priority[a.triageLevel] - priority[b.triageLevel];
      }
      return a.createdAt - b.createdAt;
    })
  );

  nextTicket = $derived(this.sortedQueue[0] ?? null);
}

export const queueState = new QueueState();
```

### 3.3 Cross-Device Propagation on the Same LAN
For same-device, multi-tab (Nurse tab + Doctor tab on one kiosk) instant sync without waiting for a server round trip, use the `BroadcastChannel` API alongside Dexie:

```ts
// src/lib/state/broadcast.svelte.ts
const channel = new BroadcastChannel('clinicflow-queue');

export function broadcastQueueChange(ticketId: string) {
  channel.postMessage({ type: 'queue-updated', ticketId });
}

channel.onmessage = async (event) => {
  if (event.data.type === 'queue-updated') {
    // Dexie liveQuery already re-fires on local table writes in the same
    // browser context; this channel exists for cases where a Service
    // Worker or separate tab wrote outside the current page's Dexie handle.
  }
};
```

For **different physical devices** on the clinic LAN with no internet, ClinicFlow runs a lightweight local sync relay (a small Node/SvelteKit instance on a LAN-visible machine, e.g. the reception PC) so the sync push/pull described in §2 targets `http://<lan-ip>:PORT` instead of only the internet-facing server — the same protocol works, just pointed at a local relay that itself syncs upstream to Postgres once internet returns.

### 3.4 Waiting Room View — Reactive Announcement Trigger
```svelte
<!-- src/routes/waiting-room/+page.svelte -->
<script lang="ts">
  import { queueState } from '$lib/state/queue.svelte';

  let lastAnnounced = $state<string | null>(null);

  $effect(() => {
    const called = queueState.tickets.find(t => t.status === 'called');
    if (called && called.id !== lastAnnounced) {
      announceTicket(called.ticketNumber);
      lastAnnounced = called.id;
    }
  });

  function announceTicket(num: number) {
    const utterance = new SpeechSynthesisUtterance(`Ticket number ${num}, please proceed to the doctor.`);
    utterance.lang = 'en-NG';
    speechSynthesis.speak(utterance);
  }
</script>
```

### 3.5 Sync Status Indicator (staff-visible, builds trust in offline mode)
```svelte
<script lang="ts">
  import { syncState } from '$lib/state/sync.svelte';
</script>

<div class="sync-badge" class:offline={!syncState.online}>
  {#if syncState.online}
    ✅ Synced
  {:else}
    📴 Offline — {syncState.pendingCount} changes saved locally
  {/if}
</div>
```

This last piece matters more than it looks: low-literacy staff need explicit, constant reassurance that "offline" does not mean "broken" or "not saved."
