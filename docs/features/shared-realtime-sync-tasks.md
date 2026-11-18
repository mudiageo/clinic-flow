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

## Documentation and validation

- [x] Create `docs/user-guides/realtime-sync.md`
- [x] Add a Changeset
- [x] Run Svelte autofixer on changed Svelte files/modules
- [x] Run formatting, targeted tests, service-worker check, and build
