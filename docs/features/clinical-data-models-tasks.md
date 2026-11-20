# Clinical Data Models — Tasks

> Companion to `docs/features/clinical-data-models-plan.md`. Tick `[x]` as each item is completed. No changeset for this feature (project instruction). Last verified: 2026-11-20.

## Phase 1 — Permissions, flags and config

- [x] Add `manage:cold_chain` to `PermissionKey` and `PERMISSION_DESCRIPTIONS` in `src/lib/config/permissions.ts`
- [x] Grant `manage:cold_chain` to the roles that can view cold chain (pharmacy, OIC, admin, superadmin) in `src/lib/config/role-defaults.ts`
- [x] Verify `manage:immunization` covers all roles that record vaccinations (chew, nurse_midwife, cho, oic, admin, superadmin) — existing defaults retained
- [x] Add `coldChainEnabled` to `phcs` (PG + SQLite schemas) and to `updatePhcSettings` in `admin.remote.ts` and `sync.remote.ts`
- [x] Surface `coldChainEnabled` in `settingsStore` and add an Admin toggle in `/admin/settings`
- [x] Add a server-side clinical-write policy for both entity types (permissions + feature flags) at the `pushOperations` boundary

## Phase 2 — Local models and stores

- [x] Add `LocalImmunizationRecord` + `LocalTemperatureLog` interfaces, `Table` fields and `version(11).stores(...)` to `src/lib/local-db/db.ts`
- [x] Add both names to the stale `LocalSyncOperation.entityName` union (documentation hygiene)
- [x] Add `batchNumber` / `expiryDate` to `LocalPharmacyInventory`
- [x] Create `src/lib/state/immunization-records.svelte.ts` with `record()` and additive `correct()` helpers
- [x] Create `src/lib/state/temperature-logs.svelte.ts` with a validated `log()` helper
- [x] Ensure every write carries `sessionStore.phcId` and the active staff id; no client-supplied PHC is trusted

## Phase 3 — Server schemas and migrations

- [x] Add `immunizationRecords` table + relations to PG `schema.ts`
- [x] Add `temperatureLogs` table + relations to PG `schema.ts`
- [x] Add both tables + relations to SQLite `schema.sqlite.ts` (mirror PG columns/index names)
- [x] Add `batchNumber` / `expiryDate` to `pharmacyInventory` in both dialects
- [x] Generate PG migration `0016_melodic_mystique.sql` and SQLite migration `0006_magenta_domino.sql` with snapshots/journals
- [x] Strip unrelated Better Auth DDL from the generated SQLite migration so it applies on existing installations
- [x] Verify migrations apply on a scratch SQLite database (`initDatabase` path)

## Phase 4 — Sync registration

- [x] Add both entity names to `tableMap` in `src/routes/sync/sync.remote.ts`
- [x] Add both to `SYNC_ENTITY_TABLE` and the date-field lists in `src/lib/seed/adapters.ts`
- [x] Rank `immunizationRecords` after appointments in `operation-dependencies.ts`
- [x] Verify `tenant-scope.ts` needs no change (both tables have their own `phcId`)
- [x] Verify tenant scoping forces `payload.phcId = sessionPhcId` for both new entity types
- [x] Intentionally skip seed fixtures for clinical records (no fabricated clinical data)

## Phase 5 — Remotes and boundary validation

- [x] Create `src/lib/remote/immunization.remote.ts` read-only audit query with flag + PHC checks
- [x] Create `src/lib/remote/cold-chain.remote.ts` read-only audit query with `view:cold_chain`, flag + PHC checks
- [x] Validate all clinical payloads at the sync boundary with Valibot-style guards (`normalizeClinicalPayload`)
- [x] Confirm `getPharmacyInventory()` already returns batch/expiry (uses `findMany()`), so `pharmacy.remote.ts` needs no change

## Phase 6 — Pages

- [x] `/immunization`: replace "Mark Complete" with a validated "Record vaccination" dialog using `immunizationRecordsStore`
- [x] `/immunization`: show each patient's existing doses from the register; keep appointment-derived due/status list and search
- [x] `/pharmacy/cold-chain`: enable "Log Temperature" with a validated dialog using `temperatureLogsStore`
- [x] `/pharmacy/cold-chain`: show the real latest temperature, excursion warning, and real batch/expiry from inventory
- [x] Add the staff-entry verification disclaimer to both pages
- [x] Run `svelte-autofixer` on every edited `.svelte` file until clean
- [x] Verify no fabricated clinical values remain on any of the three pages

## Phase 7 — Tests and validation

- [x] Add both entity types to `cross-device-convergence.spec.ts`
- [x] Add cross-PHC rejection assertions to `tenant-scope.spec.ts`
- [x] Add `clinical/policy.spec.ts` covering permission + flag gates and payload validation
- [x] Add appointment/immunization dependency ordering assertion
- [x] `vp fmt --check` on changed files
- [x] `pnpm run check` — 231 errors / 23 warnings in 69 files, exactly matching the pre-feature baseline (no new diagnostics)
- [x] `pnpm check:sw`
- [x] `vp test --run --project server` — 14 files / 87 tests passed
- [x] `vp build`

## Phase 8 — Docs and closure

- [x] Add `docs/user-guides/clinical-record-keeping.md` explaining the new record-keeping flows and disclaimer
- [x] Mark **MK-03** complete in `docs/features/route-fidelity-cleanup-tasks.md`
- [x] Verify no changeset was added
- [x] Commit and push
