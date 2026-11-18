# Shared Realtime Sync Plan

**Status:** Completed
**Feature:** Application-wide near-realtime wake-up stream

## Objective

Deliver durable PHC data changes to connected clients within seconds without opening a separate `query.live` connection for every table. The live channel carries only invalidation metadata; the existing cursor-based sync engine remains authoritative for records and offline catch-up.

## Permissions and tenant boundaries

- Any authenticated, active staff member assigned to a PHC may connect to that PHC's sync signal stream.
- The server derives the PHC, staff identity, role, and permissions from `getRequestEvent().locals`; clients cannot choose a PHC or topic.
- Superadmins without a PHC assignment do not receive a PHC domain stream. Their platform control streams remain separate.
- Existing mutation permissions remain unchanged. Receiving a wake-up signal does not grant permission to mutate or read records outside the existing authorized sync query.
- Signals contain no names, clinic IDs, clinical values, or other patient-identifiable data.

## AI safety

This feature does not use AI and does not generate clinical advice. It only accelerates delivery of already-authorized durable records. Existing AI disclaimers and human review requirements remain unchanged for any AI-produced data stored elsewhere in ClinicFlow.

## Architecture

```text
durable mutation
  -> domain row + sync/outbox row
  -> commit
  -> publish minimal signal to phc:<phcId>:sync

watchRealtimeSignals query.live
  -> authenticate and derive PHC from locals
  -> yield initial reconciliation signal for SSR/hydration
  -> subscribe to the PHC topic
  -> recheck authorization on every signal/heartbeat

syncStore
  -> keep one live resource per signed-in client
  -> debounce bursts
  -> flush pending local operations
  -> drain cursor-based pull batches
  -> merge changes into IndexedDB with last-write-wins protection
  -> retain 15–30 second polling as recovery
```

## Implementation

### Server

- Add `syncTopics.phc(phcId)` to the provider-neutral realtime hub.
- Add `#lib/remote/realtime-sync.remote.ts` with `watchRealtimeSignals`.
- Validate authentication and active PHC membership before the first yield and on each subsequent emission.
- Publish only minimal metadata after a durable sync operation commits.
- Keep the hub provider-neutral; the first provider remains in-process and can later be replaced by Redis/pub-sub.

### Client

- Extend `syncStore` with `connect()` and `disconnect()` lifecycle methods.
- Consume one live resource and debounce signals into `flush()` calls.
- If a signal arrives during a sync, set `syncAgain` and run another cursor pull after the current pass.
- Drain all available 500-row batches before considering catch-up complete.
- Preserve the polling loop and reconnect catch-up.
- Connect after authenticated session initialization and disconnect when the app layout is destroyed.

### Consistency and safety

- Do not put record data in the live signal.
- Do not advance the cursor until a returned batch is fully applied.
- Ignore stale remote records when a newer local version exists.
- Coalesce bursts to prevent one pull per mutation.
- Keep cached records visible while offline; expose connection and freshness state through the sync store.
- Live remote responses remain excluded from service-worker runtime caching.

## Files

- `src/lib/server/realtime/hub.ts`
- `src/lib/remote/realtime-sync.remote.ts`
- `src/routes/sync/sync.remote.ts`
- `src/lib/state/sync.svelte.ts`
- `src/routes/(app)/+layout.svelte`
- `src/lib/server/realtime/hub.spec.ts`
- `src/lib/sync/conflict-resolution.spec.ts`
- `docs/user-guides/realtime-sync.md`

## Validation

- Initial authorized signal supports SSR/hydration.
- Two clients in one PHC receive a committed wake-up and catch up through `pullChanges`.
- A client in another PHC receives no signal or records.
- Burst signals result in a coalesced sync run.
- A signal arriving during sync causes one follow-up run.
- Disconnect/reconnect and polling recover missed signals without losing durable data.
- Stale remote snapshots never revive a completed or no-show queue ticket.
- Subscriptions are cleaned up on logout/navigation.
- Service worker does not cache the live response.
