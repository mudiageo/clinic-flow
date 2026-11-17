---
'clinic-flow': minor
---

**Feature:** Deterministic demo-data fixture catalogue

Consolidated the four scattered demo-data sources (server seeder, browser seeder, seed test and triage defaults) into a single, shared fixture catalogue under `src/lib/seed`.

- **One catalogue**: `fixtures.ts` defines stable, synthetic data for all three demo PHCs (Oredo, Ikpoba-Okha, Egor), each with its own realistic clinical profile. Egor now carries a 5-case diarrhoea outbreak cohort.
- **Idempotent seeding**: `pnpm db:seed` is repeatable without duplicates, supports `--phc=<slug>` and `--reset`, and refuses to write to non-local databases. Removed the `demo-phc-1` / `PHC-DEMO` placeholders entirely.
- **Client/server shim**: `toServerRow` / `toClientRow` adapters bridge the drifted Dexie and Drizzle schemas at the sync boundary, with the field mapping documented for a future migration.
- **Sync plumbing**: wired `setPhcId`, unified the `clinicflow_phc_id` key, cleared the stale sync cursor on reset, and fixed low-stock sidebar badges.
- Added a DB-free fixture test suite, an implementation plan/task checklist, a client/server field-mapping reference and a demo-data user guide.
