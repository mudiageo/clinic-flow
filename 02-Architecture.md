# ClinicFlow — Local-First Synchronization Architecture & State Management

---

## 0. Two Rules That Shape Everything Below

1. **Userland never touches Dexie directly.** Components, routes, and other application code only ever call methods on a small set of Svelte 5 class-based stores (`patientStore`, `queueStore`, `vitalsStore`, `pharmacyStore`, `reminderStore`). Dexie — and its `liveQuery()` — is an implementation detail sealed inside those classes. This keeps the reactivity model consistent (everything is a rune, nothing is a raw Dexie observable leaking into a component) and means the local storage engine could be swapped later without touching a single `.svelte` file.
2. **Sync uses SvelteKit remote functions, not hand-rolled API routes.** `query`, `query.live`, and `command` (from `$app/server`) replace `+server.ts` push/pull endpoints. This requires the experimental remote functions flag and is subject to the same static-adapter constraint already noted in the Agent Build Brief §0 — `query`/`command`/`query.live` need a real server runtime, so they run on the separately-deployed sync server, not inside the Tauri static bundle.

Enable remote functions in `svelte.config.js`:
```js
/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    experimental: { async: true },
  },
  kit: {
    experimental: { remoteFunctions: true },
  },
};
export default config;
```
> Reference: https://svelte.dev/docs/kit/remote-functions

---

## 1. Local-First Strategy

### 1.1 Principle
IndexedDB is the **source of truth for the running clinic session**. Every read and every write goes to IndexedDB first, unconditionally, whether or not the network is up. PostgreSQL is a durable, shared, eventually-consistent mirror — not a dependency for any in-clinic action.

### 1.2 Local Storage Layer (Dexie — sealed behind store classes)
Use **Dexie.js** as the IndexedDB wrapper. This file is only ever imported by the store classes in §3, never by components or routes.

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

export interface SyncLogEntry {
  localId?: number;       // auto-increment
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete' | 'delta';
  payload: unknown;
  timestamp: number;
  synced: 0 | 1;
}

class ClinicFlowDB extends Dexie {
  patients!: Table<LocalPatient, string>;
  queueTickets!: Table<LocalQueueTicket, string>;
  vitalsRecords!: Table<LocalVitalsRecord, string>;
  pharmacyInventory!: Table<LocalPharmacyInventory, string>;
  reminders!: Table<LocalReminder, string>;
  syncLog!: Table<SyncLogEntry, number>;

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

// Not exported. Only src/lib/state/*.svelte.ts may import this file.
export const db = new ClinicFlowDB();
```

### 1.3 Write Path (fully offline-capable)
Every mutation (register patient, enter vitals, dispense drug, etc.) follows this exact sequence, regardless of connectivity — but the caller is always a **store class method**, never inline Dexie calls in a component:

1. Generate a client-side UUID for new records (never wait for a server-issued ID).
2. Store class method writes to the relevant Dexie table, `syncStatus: 'pending'`, `updatedAt: Date.now()`.
3. Same method appends an entry to `syncLog` describing the operation.
4. The store's internal `liveQuery` subscription fires, updating the class's `$state` field, and every component reading that store's reactive property re-renders — zero network round trip, zero manual Dexie access from userland.

### 1.4 Read Path
Components call plain getters/derived properties on a store instance (e.g. `queueStore.sortedQueue`, `patientStore.search(term)`). Internally, exactly one `liveQuery()` subscription per store bridges Dexie to a `$state` field, as shown in §3. Server data never blocks a read.

---

## 2. Sync Engine Specification (via SvelteKit Remote Functions)

### 2.1 Goals
- Reconcile local IndexedDB with PostgreSQL whenever connectivity is available.
- Guarantee **Read-Your-Writes**: once a nurse enters vitals, the doctor's view (same device or LAN-networked device) reflects it — locally if same device, via sync if a different device.
- Resolve conflicts deterministically without manual intervention in the common case.
- Do all of this through typed remote functions rather than hand-rolled `fetch()` calls to REST-shaped routes.

### 2.2 Remote Functions File
All sync-related remote functions live in one file, deployed as part of the separately-hosted sync server (see Agent Build Brief §0 for why this cannot live inside the Tauri static bundle):

```ts
// src/routes/sync/sync.remote.ts
import { query, command } from '$app/server';
import * as v from 'valibot';
import { db as serverDb } from '$lib/server/db';
import { sql, eq } from 'drizzle-orm';
import { pharmacyInventory } from '$lib/server/db/schema';

const operationSchema = v.object({
  localId: v.number(),
  entityType: v.string(),
  entityId: v.string(),
  operation: v.picklist(['create', 'update', 'delete', 'delta']),
  payload: v.unknown(),
  updatedAt: v.number(),
});

// COMMAND: push a batch of pending local mutations to the server.
// Called by the sync manager (§2.4), never rendered, so `command` is
// correct here rather than `form` (no HTML form is involved).
export const pushOperations = command(
  v.array(operationSchema),
  async (operations) => {
    const accepted: number[] = [];
    const conflicts: unknown[] = [];

    for (const op of operations) {
      if (op.entityType === 'pharmacyInventory' && op.operation === 'delta') {
        const { itemId, delta } = op.payload as { itemId: string; delta: number };
        await serverDb
          .update(pharmacyInventory)
          .set({ currentStock: sql`${pharmacyInventory.currentStock} + ${delta}` })
          .where(eq(pharmacyInventory.id, itemId));
        accepted.push(op.localId);
        continue;
      }

      const existing = await serverDb.query[op.entityType]?.findFirst?.({
        where: (t: any, { eq }: any) => eq(t.id, op.entityId),
      });

      if (!existing || op.updatedAt >= existing.updatedAt) {
        await serverDb
          .insert(schemaTable(op.entityType))
          .values(op.payload as Record<string, unknown>)
          .onConflictDoUpdate({ target: idColumn(op.entityType), set: op.payload as Record<string, unknown> });
        accepted.push(op.localId);
      } else {
        conflicts.push({ localId: op.localId, serverVersion: existing });
      }
    }

    // Single-flight: reconnect the live queue query for any PHC affected by
    // this push, so other connected devices see the change immediately
    // without a separate round trip.
    const affectedPhcIds = new Set(
      operations
        .filter((o) => o.entityType === 'queueTickets')
        .map((o) => (o.payload as { phcId: string }).phcId)
    );
    for (const phcId of affectedPhcIds) {
      void getQueueUpdates(phcId).reconnect();
    }

    return { accepted, conflicts };
  }
);

// QUERY: pull server changes since a cursor. Used for the initial
// bulk catch-up sync (e.g. new device, or reconnecting after a long
// offline stretch) — the ongoing real-time case is handled by
// query.live below, not by polling this repeatedly.
export const pullChanges = query(
  v.object({ phcId: v.string(), since: v.number() }),
  async ({ phcId, since }) => {
    const changes = await serverDb.query.syncOperations.findMany({
      where: (t, { and, eq, gt }) => and(eq(t.phcId, phcId), gt(t.serverReceivedAt, new Date(since))),
      orderBy: (t, { asc }) => asc(t.serverReceivedAt),
    });
    const newCursor = changes.at(-1)?.serverReceivedAt?.getTime() ?? since;
    return { changes, newCursor };
  }
);

// QUERY.LIVE: real-time queue state for cross-device propagation on
// the clinic LAN. This is what lets the Waiting Room Display (a
// different physical device from the Nurse Station) update within
// ~1s of a triage/queue change, per the PRD's queue UI requirement.
export const getQueueUpdates = query.live(
  v.string(), // phcId
  async function* (phcId) {
    let lastEmitted: unknown = null;
    while (true) {
      const tickets = await serverDb.query.queueTickets.findMany({
        where: (t, { eq, inArray }) =>
          eq(t.phcId, phcId) && inArray(t.status, ['waiting', 'called', 'in_progress']),
      });
      // avoid redundant emits when nothing changed between polls
      const snapshot = JSON.stringify(tickets);
      if (snapshot !== lastEmitted) {
        lastEmitted = snapshot;
        yield tickets;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
);
```

> Reference: https://svelte.dev/docs/kit/remote-functions — see in particular the `query.live`, `command`, and single-flight mutation (`.reconnect()`, `requested(...)`) sections, which this design uses directly rather than reimplementing equivalent behavior by hand.

### 2.3 Sync Trigger — Sync Store
The sync manager is itself a Svelte 5 class store (see §3), not a bare module-level effect. It owns the connectivity listener, the periodic flush, and the `pushOperations`/`pullChanges` calls:

```ts
// src/lib/state/sync.svelte.ts
import { db } from '$lib/local-db/db';
import { pushOperations, pullChanges } from '../../routes/sync/sync.remote';

class SyncStore {
  online = $state(navigator.onLine);
  pendingCount = $state(0);
  lastSyncedAt = $state<number | null>(null);

  private phcId: string;
  private cursor = 0;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(phcId: string) {
    this.phcId = phcId;
    window.addEventListener('online', () => { this.online = true; this.flush(); });
    window.addEventListener('offline', () => { this.online = false; });
    this.refreshPendingCount();
    this.intervalHandle = setInterval(() => this.flush(), 30_000);
  }

  private async refreshPendingCount() {
    this.pendingCount = await db.syncLog.where('synced').equals(0).count();
  }

  async flush() {
    if (!this.online) return;

    const pending = await db.syncLog.where('synced').equals(0).toArray();
    if (pending.length > 0) {
      const batches = chunk(pending, 50);
      for (const batch of batches) {
        try {
          const { accepted, conflicts } = await pushOperations(
            batch.map(toOperationPayload)
          );
          await db.syncLog.bulkUpdate(
            accepted.map((localId) => ({ key: localId, changes: { synced: 1 } }))
          );
          for (const conflict of conflicts) await handleConflict(conflict);
        } catch {
          break; // offline mid-flush — nothing lost, retry on next trigger
        }
      }
      await this.refreshPendingCount();
    }

    try {
      const { changes, newCursor } = await pullChanges({ phcId: this.phcId, since: this.cursor });
      for (const change of changes) await applyRemoteChange(change);
      this.cursor = newCursor;
      this.lastSyncedAt = Date.now();
    } catch {
      // pull failure is non-fatal; next flush retries
    }
  }
}

export const syncStore = new SyncStore(getCurrentPhcId());
```

Components read `syncStore.online` / `syncStore.pendingCount` directly (see §3.5) — no separate "sync status" plumbing needed elsewhere.

### 2.4 Conflict Resolution
Primary strategy: **Last-Write-Wins by `updatedAt`, with a hard-priority override for safety-critical fields, and deltas instead of absolute values for stock.**

- Every record carries `updatedAt` (client clock) — client clocks are not fully trusted, so the server additionally stamps `serverReceivedAt` and is the tiebreak authority.
- **Default rule:** incoming remote change wins if `remoteUpdatedAt > localUpdatedAt`; otherwise local wins and is re-pushed on the next flush.
- **Special case — `pharmacy_inventory.current_stock`:** never LWW. Stock changes are treated as **deltas, not absolute values** (see `pushOperations` above) — this prevents two offline devices from both decrementing stock and one silently clobbering the other's decrement.
- **Special case — `queue_tickets.triageLevel`:** if a conflict arises between a `red` and a lower flag for the same patient during the same visit, **the more urgent flag always wins**, regardless of timestamp — patient safety overrides LWW here.
- Any conflict the automatic rules can't cleanly resolve is written with `syncStatus: 'conflict'` and surfaced in a small Admin "Sync Conflicts" panel for manual review — this should be rare given the rules above.

---

## 3. Svelte 5 Class Store Blueprint

### 3.1 Design Rule
Every domain area gets exactly one class, instantiated once as a module-level singleton, exposing:
- **Reactive state** (`$state` fields, `$derived` computed views) — read-only from the outside in spirit, even though Svelte doesn't enforce that; treat store internals as private and only mutate via methods.
- **Methods** for every mutation and query userland needs (`create`, `update`, `list`, `search`, domain-specific helpers like `dispense` or `bumpToTop`).
- **No Dexie types or `liveQuery` calls visible outside the class file.**

### 3.2 Base Pattern — a Generic Local Collection
Most stores share the same shape (list + CRUD + sync-log write), so factor that into a small base class and extend it per entity:

```ts
// src/lib/state/local-collection.svelte.ts
import { liveQuery, type Table } from 'dexie';
import { db } from '$lib/local-db/db';

export abstract class LocalCollection<T extends { id: string; updatedAt: number; syncStatus: string }> {
  items = $state<T[]>([]);

  protected constructor(
    protected table: Table<T, string>,
    protected entityType: string,
    queryFn: () => Promise<T[]>,
  ) {
    liveQuery(queryFn).subscribe((result) => {
      this.items = result;
    });
  }

  get(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  async create(data: Omit<T, 'id' | 'updatedAt' | 'syncStatus'>): Promise<string> {
    const id = crypto.randomUUID();
    const record = { ...data, id, updatedAt: Date.now(), syncStatus: 'pending' } as T;
    await this.table.add(record);
    await db.syncLog.add({
      entityType: this.entityType,
      entityId: id,
      operation: 'create',
      payload: record,
      timestamp: Date.now(),
      synced: 0,
    });
    return id;
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    const patch = { ...changes, updatedAt: Date.now(), syncStatus: 'pending' } as Partial<T>;
    await this.table.update(id, patch);
    await db.syncLog.add({
      entityType: this.entityType,
      entityId: id,
      operation: 'update',
      payload: patch,
      timestamp: Date.now(),
      synced: 0,
    });
  }
}
```

### 3.3 Patient Store
```ts
// src/lib/state/patients.svelte.ts
import { db, type LocalPatient } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class PatientStore extends LocalCollection<LocalPatient> {
  constructor() {
    super(db.patients, 'patients', () => db.patients.where('deleted').equals(0).toArray());
  }

  search(term: string): LocalPatient[] {
    const t = term.trim().toLowerCase();
    if (!t) return [];
    return this.items.filter(
      (p) => p.name.toLowerCase().includes(t) || p.phone?.includes(t) || p.clinicId.toLowerCase().includes(t)
    );
  }

  findByClinicId(clinicId: string): LocalPatient | undefined {
    return this.items.find((p) => p.clinicId === clinicId);
  }

  familyMembers(familyId: string): LocalPatient[] {
    return this.items.filter((p) => p.familyId === familyId);
  }
}

export const patientStore = new PatientStore();
```

Userland usage — no Dexie import, no `liveQuery` import, anywhere in this component:
```svelte
<script lang="ts">
  import { patientStore } from '$lib/state/patients.svelte';
  let searchTerm = $state('');
  const results = $derived(patientStore.search(searchTerm));
</script>

<input bind:value={searchTerm} placeholder="Search by name, phone, or Clinic ID" />
{#each results as patient}
  <PatientCard {patient} />
{/each}
```

### 3.4 Queue Store — Domain-Specific Methods on Top of the Base
```ts
// src/lib/state/queue.svelte.ts
import { db, type LocalQueueTicket } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class QueueStore extends LocalCollection<LocalQueueTicket> {
  constructor() {
    super(db.queueTickets, 'queueTickets', () =>
      db.queueTickets.where('status').anyOf(['waiting', 'called', 'in_progress']).toArray()
    );
  }

  sortedQueue = $derived(
    [...this.items].sort((a, b) => {
      const priority = { red: 0, amber: 1, green: 2 };
      if (priority[a.triageLevel] !== priority[b.triageLevel]) {
        return priority[a.triageLevel] - priority[b.triageLevel];
      }
      return a.createdAt - b.createdAt;
    })
  );

  nextTicket = $derived(this.sortedQueue[0] ?? null);

  async callNext(): Promise<void> {
    const next = this.nextTicket;
    if (!next) return;
    await this.update(next.id, { status: 'called', calledAt: Date.now() } as Partial<LocalQueueTicket>);
  }

  async applyTriageFlag(ticketId: string, level: 'green' | 'amber' | 'red', reason: string): Promise<void> {
    const current = this.get(ticketId);
    // urgency-override: never downgrade a red flag via a later lower-priority write
    if (current?.triageLevel === 'red' && level !== 'red') return;
    await this.update(ticketId, { triageLevel: level, triageReason: reason } as Partial<LocalQueueTicket>);
  }
}

export const queueStore = new QueueStore();
```

### 3.5 Sync Status Indicator (staff-visible, builds trust in offline mode)
```svelte
<script lang="ts">
  import { syncStore } from '$lib/state/sync.svelte';
</script>

<div class="sync-badge" class:offline={!syncStore.online}>
  {#if syncStore.online}
    ✅ Synced
  {:else}
    📴 Offline — {syncStore.pendingCount} changes saved locally
  {/if}
</div>
```

This matters more than it looks: low-literacy staff need explicit, constant reassurance that "offline" does not mean "broken" or "not saved." Note this component reads `syncStore` (a class store), never `db` (Dexie) — consistent with the rule in §0.

### 3.6 Waiting Room View — Reactive Announcement Trigger
```svelte
<!-- src/routes/waiting-room/+page.svelte -->
<script lang="ts">
  import { queueStore } from '$lib/state/queue.svelte';

  let lastAnnounced = $state<string | null>(null);

  $effect(() => {
    const called = queueStore.items.find((t) => t.status === 'called');
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

### 3.7 Cross-Device Propagation
Two layers, matching the two "different device" scenarios:

- **Same device, multiple tabs/windows** (Nurse tab + Doctor tab on one kiosk): Dexie's `liveQuery` already re-fires for any write made through the store classes in the same browser context — no extra plumbing needed, since all writes go through `LocalCollection.create`/`update`.
- **Different physical devices on the clinic LAN, possibly with no internet**: this is what `getQueueUpdates` (the `query.live` remote function in §2.2) is for. Because remote functions require a real server runtime, this LAN case depends on the local sync relay described in the Agent Build Brief §0 being reachable on the LAN even when the internet is down — the relay serves the same remote functions locally, then itself syncs upstream to Postgres once internet returns. A store consuming this looks like:

```ts
// src/lib/state/live-queue.svelte.ts
import { getQueueUpdates } from '../../routes/sync/sync.remote';

class LiveQueueStore {
  private live = getQueueUpdates(getCurrentPhcId());
  tickets = $derived(this.live.current ?? []);
  connected = $derived(this.live.connected);
}

export const liveQueueStore = new LiveQueueStore();
```
This complements — does not replace — `queueStore` (§3.4): `queueStore` is what the local device writes through and always works offline; `liveQueueStore` is what reconciles other devices' state onto the screen when connectivity allows, per the `query.live` reconnect semantics triggered from `pushOperations` in §2.2.
