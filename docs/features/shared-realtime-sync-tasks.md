# Shared Realtime Sync Tasks

## Design and safety

- [x] Define permissions and tenant boundaries
- [x] Document AI safety applicability
- [x] Define one-stream invalidation architecture

## Server

- [x] Add PHC-scoped sync topics
- [x] Add authenticated `watchRealtimeSignals` live query
- [x] Publish minimal wake-up signals after committed sync writes
- [x] Recheck active staff/PHC authorization during the stream
- [x] Keep record payloads out of signals

## Client

- [x] Add live connect/disconnect lifecycle to `syncStore`
- [x] Debounce burst wake-up signals
- [x] Add `syncAgain` handling for signals received during sync
- [x] Drain cursor batches before advancing to idle
- [x] Keep polling as mandatory recovery
- [x] Wire lifecycle into the authenticated app layout

## Correctness

- [x] Use real updates for partial local patches
- [x] Merge pulled update patches instead of replacing local records
- [x] Reject stale remote changes using client timestamps
- [x] Mark accepted local records as synced when no newer operation remains
- [x] Add cross-PHC, burst, reconnect, and cleanup tests

## Cross-device reliability remediation

- [x] Add PHC-scoped monotonic outbox versions and backfill existing operations
- [x] Add durable operation IDs and make mutation retries idempotent
- [x] Refresh every ordinary cursor pull to bypass SvelteKit query reuse
- [x] Persist applied records and cursor atomically in IndexedDB
- [x] Replay from the new version cursor without deleting pending local work
- [x] Trigger immediate debounced sync for every local collection mutation
- [x] Separate live-stream connection state from durable-data freshness
- [x] Reconcile rejected conflicts with the authoritative server version
- [x] Scope client creates to the session PHC and make the server authoritative for tenant scope
- [x] Add fresh-pull, pagination, retry, two-client, reconnect, and tenant-isolation tests
- [x] Apply and verify PostgreSQL and SQLite migrations
- [x] Update the realtime sync user guide and add a Changeset
- [x] Run formatting, targeted lint/type checks, service-worker check, tests, and production build
- [ ] Confirm cross-device convergence end to end in two signed-in browsers after the PHC-scope fix

## Documentation and validation

- [x] Create `docs/user-guides/realtime-sync.md`
- [x] Add a Changeset
- [x] Run Svelte autofixer on changed Svelte files/modules
- [x] Run formatting, targeted tests, service-worker check, and build
