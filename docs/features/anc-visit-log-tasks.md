# ANC Visit Log — Tasks

- [x] Define permissions, feature flag, and AI-safety statement in the plan.
- [x] Add `LocalAncVisit` type, Dexie table, and version 12 migration.
- [x] Add `ancVisits` to the local sync operation entity union.
- [x] Create `anc-visits.svelte.ts` store with validation, attribution, and query helpers.
- [x] Add PG and SQLite Drizzle tables, indexes, and relations.
- [x] Generate both dialect migrations.
- [x] Register the entity in seed adapters and sync table map.
- [x] Extend clinical write policy with `manage:anc` and `maternalHealthEnabled`.
- [x] Validate/normalize ANC payloads at the sync boundary.
- [x] Add ANC visit dependency rank.
- [x] Create the ANC visit dialog with staff-entry disclaimer.
- [x] Wire the Log ANC Visit button and list recorded visits in `anc-tracker.svelte`.
- [x] Add user-facing guide `docs/user-guides/anc-record-keeping.md`.
- [x] Add/update policy, convergence, dependency, and store tests.
- [x] Run Svelte autofixer, formatting/lint, type check, build, and tests.
- [x] Commit and push as a separate change.
