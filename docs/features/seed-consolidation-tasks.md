# Seed Consolidation & Sync Plumbing — Tasks

## Phase 1: Documentation

- [x] Write `docs/features/seed-consolidation-plan.md`
- [x] Write this task checklist
- [x] Write `docs/data-model/client-server-field-mapping.md` with the A–F mapping tables and the "migrate later" header

## Phase 2: Fixture catalogue

- [x] Create `src/lib/seed/fixtures.ts` with deterministic IDs, three PHC profiles and client/server row builders
- [x] Create `src/lib/seed/fixtures.spec.ts` (pure, DB-free validation)
- [x] Delete `src/lib/server/db/seed.test.ts`

## Phase 3: Idempotent writers

- [x] Rewrite `src/lib/server/db/seed.ts` to upsert from the fixture catalogue, with `--phc=` and `--reset` flags and localhost guard
- [x] Rewrite `src/lib/utils/seed.ts` to `bulkPut` the same client-shaped fixtures, scoped to a PHC, idempotent
- [x] Make `triageRuleStore.seedDefaults()` reuse the shared rule set
- [x] Update `package.json` scripts so seed flags pass through; remove the rejected local-db helper scripts

## Phase 4: Sync plumbing

- [x] Call `syncStore.setPhcId(sessionStore.phcId)` in `(app)/+layout.svelte`
- [x] Unify the `clinicflow_phc_id` storage key in settings, pregnancy and delivery dialog
- [x] Remove all `demo-phc-1` / `PHC-DEMO` literals from UI code and the server special case
- [x] Clear `clinicflow_sync_cursor` on Reset Local Database
- [x] Add `toServerRow()` / `toClientRow()` adapters at the sync boundary, complete timestamp lists, add `families` to `tableMap`
- [x] Fix `(app)/+layout.svelte` low-stock badges to use `currentStock` / `lowStockThreshold`

## Phase 5: Verification and docs

- [x] Run the fixture test with no database — 20 tests pass
- [x] Run `pnpm db:seed` twice; confirm idempotency (identical row counts)
- [x] Run `pnpm db:seed -- --phc=egor`; confirm scoping (only Egor affected)
- [x] Verify a clean install: drop/recreate DB → `pnpm db:migrate` → `pnpm db:seed` (3 PHCs, correct counts)
- [x] Run `vp fmt --check .`, `pnpm check:sw`, `vp build`, fixture test
- [x] Verify the dev UI: sign-in for doctor/nurse/admin/pharmacy, dashboard, nurse queue, admin settings, reports, Outbreak Radar, pharmacy dispense
- [x] Update user-facing docs for the new demo-data workflow (`docs/user-guides/demo-data.md`)
