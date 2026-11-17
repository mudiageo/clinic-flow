# Seed Consolidation & Sync Plumbing — Architecture Plan

## 1. Overview

ClinicFlow currently has four independent dataset sources and a disabled synchronisation path. This feature consolidates them into one deterministic fixture catalogue, makes seeding idempotent and PHC-scoped, repairs the client/server data plumbing, and documents the remaining schema drift for a later migration.

### Permissions

This is a developer/tooling feature. No new clinical capability is exposed.

| Role                                             | Access                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `superadmin`                                     | May view cross-PHC seeded data via existing `/superadmin/phcs/*` queries                       |
| `admin`                                          | May trigger the client-side demo seed from `/admin/settings` (existing button, unchanged gate) |
| `doctor` / `nurse` / `receptionist` / `pharmacy` | Read seeded clinical data only through existing permissions                                    |

Feature flags: none. Global Superadmin lock hierarchy is not applicable to developer seeding. Local Admins cannot change seeded content; the seed is a build-time fixture, not a runtime toggle.

### AI Safety

No AI model is invoked, no AI output is displayed, and no clinical decision is automated by this feature. `<AiDisclaimer>` is not required. The generated data is synthetic and clearly labelled as demo content in the docs. Human-in-the-loop guardrails: seeded records are never written to a production deployment by this tooling; `db:seed` refuses to run when `DATABASE_URL` is not localhost unless `--force-remote` is supplied.

## 2. Problems being solved

1. Four seeding paths: `src/lib/server/db/seed.ts`, `src/lib/utils/seed.ts`, `src/lib/server/db/seed.test.ts`, and `triageRuleStore.seedDefaults()` — each with different patients, stock, and triage thresholds.
2. `seed.test.ts` is a "test" that only writes rows and asserts `true === true`; `pnpm test` mutates the database.
3. Seeding was not idempotent: re-running created duplicate PHCs, staff, families and patients.
4. `syncStore.setPhcId()` is never called, so no push or pull happens. Seeded Postgres clinical data is invisible on clinical screens.
5. Two mock PHC ids (`demo-phc-1`, `PHC-DEMO`) are written into records, creating orphaned data.
6. Client and server field names/types drifted; `pushOperations` inserts client payloads verbatim, so patient and prescription pushes fail.

## 3. Architecture

### 3.1 Single fixture catalogue

`src/lib/seed/fixtures.ts` — client-safe, no Drizzle or server imports. Exports:

- `SEED_NAMESPACE`, `seedId(key)` — deterministic UUID from a slug.
- `PHC_PROFILES` — three profile definitions (Oredo, Ikpoba-Okha, Egor).
- `buildFixtures(profile)` — returns typed records in **client shape** (`LocalPatient`, `LocalQueueTicket`, …) and the small set of server-only extras (staff emails, auth users, devices, SMS inbox, audit log).
- Server-shaped rows are derived from the same objects via `toServerRow()`, shared with the sync boundary.

All timestamps are generated relative to "now" so datasets never rot. All IDs are stable across runs.

### 3.2 Writers (two, not four)

| Writer                      | Target            | Entry point                                | Idempotency                                                             |
| --------------------------- | ----------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `src/lib/server/db/seed.ts` | PostgreSQL        | `pnpm db:seed [-- --phc=<slug>] [--reset]` | deterministic IDs + upsert; `--reset` deletes only seed-namespaced rows |
| `src/lib/utils/seed.ts`     | Dexie (IndexedDB) | Admin Settings "Seed Demo Data"            | deterministic IDs + `bulkPut`                                           |

`seed.test.ts` is deleted. `triageRuleStore.seedDefaults()` delegates to the shared rule set (no fourth dataset).

### 3.3 PHC profiles

| Slug          | Profile                        | Dataset                                                                       |
| ------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| `oredo`       | urban reference site           | ~45 patients, full pharmacy, labs, appointments, reminders                    |
| `ikpoba-okha` | peri-urban, ANC/stock stressed | ~25 patients, low/critical stock, ANC-heavy schedule                          |
| `egor`        | rural, minimal staffing        | ~15 patients, 1 doctor + 2 nurses + 1 CHEW, 5-case diarrhoea outbreak cluster |

Default `pnpm db:seed` seeds all three. `--phc=<slug>` is opt-in and seeds only that site.

### 3.4 Sync plumbing (option 2)

1. `(app)/+layout.svelte` calls `syncStore.setPhcId(sessionStore.phcId)` after session init.
2. `settings.svelte.ts`, `pregnancy.svelte.ts`, `delivery-dialog.svelte` use `clinicflow_phc_id` (the key actually written by `/connect` and `/onboarding`); `admin/appointments/new` and `admin/triage` stop hardcoding mock IDs.
3. Admin Settings "Reset Local Database" clears `clinicflow_sync_cursor` so a fresh Dexie can pull seed rows.
4. `toServerRow()` / `toClientRow()` adapters at the sync boundary make push/pull work across the field drift. Timestamp conversion lists are completed; `families` is added to `tableMap`.
5. `sync.remote.ts` no longer special-cases `demo-phc-1`.

The adapters are deliberately centralised so the later schema migration can delete them.

### 3.5 Documentation

`docs/data-model/client-server-field-mapping.md` records the full A–F field mapping (blocking renames, timestamp gaps, client-only and server-only fields, table names, and the structurally different sync-log objects). It marks the current adapter as a compatibility shim and points to the future migration.

### 3.6 Tests

`src/lib/seed/fixtures.spec.ts` is a pure, database-free test: unique IDs and clinic IDs, all FK references resolve, enum values valid, non-negative stock, date windows, no contradictory triage rules. It runs in the existing `server` Vitest project.

## 4. Files to modify/create

- create `docs/features/seed-consolidation-plan.md`, `docs/features/seed-consolidation-tasks.md`
- create `docs/data-model/client-server-field-mapping.md`
- create `src/lib/seed/fixtures.ts`, `src/lib/seed/fixtures.spec.ts`
- rewrite `src/lib/server/db/seed.ts`, `src/lib/utils/seed.ts`
- delete `src/lib/server/db/seed.test.ts`
- edit `src/lib/state/triage-rules.svelte.ts`, `src/lib/state/settings.svelte.ts`, `src/lib/state/pregnancy.svelte.ts`, `src/lib/state/sync.svelte.ts`
- edit `src/lib/components/maternal/delivery-dialog.svelte`
- edit `src/routes/(app)/+layout.svelte` (low-stock badges + `setPhcId`), `src/routes/(app)/admin/settings/+page.svelte`, `src/routes/(app)/admin/appointments/new/+page.svelte`, `src/routes/(app)/admin/triage/+page.svelte`, `src/routes/(app)/nurse/vitals/+page.svelte`
- edit `src/lib/state/session.svelte.ts` (`activePhcId` accessor)
- edit `src/routes/sync/sync.remote.ts`
- edit `package.json` (remove rejected local-db helper scripts)
- update `docs/features/*` tracker if required

## 5. Verification

- `pnpm db:seed` then again → second run reports 0 inserted / all skipped.
- `pnpm db:seed -- --phc=egor` → only Egor fixtures present.
- `vp test --run src/lib/seed/fixtures.spec.ts` → pass, no DB.
- `vp fmt --check .`, `pnpm check:sw`, `vp build` with dummy env.
- Dev server: login, dashboard, nurse queue, pharmacy, reports, Outbreak Radar show seeded data.
