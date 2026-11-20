# Clinical Data Models — Implementation Plan

**Status:** Implemented and validated. Last verified: 2026-11-20.
**Companion checklist:** `docs/features/clinical-data-models-tasks.md`
**Prerequisite context:** `docs/features/route-fidelity-cleanup-plan.md` (Phase D, MK-01–MK-03), `docs/Architecture-Implementation-Plan.md`, `docs/startup-wiki/07-Engineering-Guide.md`.

---

## 1. Objective

The route-fidelity cleanup removed fabricated clinical values from `/maternity`, `/immunization` and `/pharmacy/cold-chain`, leaving honest empty states. Two of those pages still lack the durable data models needed to make their actions real:

- **Immunization:** the current "Mark Complete" action only flips an appointment to `completed`. It does not record _which vaccine, dose, batch or expiry_ was administered, by whom, or when. That is clinically insufficient for an EPI register.
- **Cold chain:** there is no temperature-log model at all, and no batch/expiry fields on vaccine stock. "Log Temperature" is disabled.
- **Pharmacy inventory:** `pharmacy_inventory` has stock levels but no batch number or expiry date, so vaccine stock cannot be checked for expiry.

This feature adds the durable, offline-first models and rewires the three pages to real flows. It also adds the permission/flag enforcement those flows require.

### Explicit non-goals

- No AI is introduced. These are deterministic, staff-entered clinical records.
- No automatic vaccine wastage, rescheduling, or clinical decision support.
- No new distribution/deployment work.

---

## 2. Permissions and feature gating (required by AGENTS.md §8)

### 2.1 Roles and permissions

| Action                           | Permission                                                                | Superadmin vs local Admin                                                                    |
| -------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| View immunization register       | authenticated + `phcId` scope (same as appointments/other clinical lists) | Both; data always tenant-scoped                                                              |
| Record an immunization           | `manage:immunization` (existing key)                                      | Superadmin has global authority; local Admin may grant within own PHC unless platform-locked |
| View cold-chain temperatures     | `view:cold_chain` (existing key)                                          | Both                                                                                         |
| Log a temperature                | **new** `manage:cold_chain`                                               | Superadmin global; local Admin grants within own PHC                                         |
| View/edit vaccine batch & expiry | `view:inventory` / `manage:inventory` (existing keys)                     | Both                                                                                         |

`manage:cold_chain` must be added to:

- `src/lib/config/permissions.ts` (`PermissionKey` union + `PERMISSION_DESCRIPTIONS`)
- `src/lib/config/role-defaults.ts` (the four roles that already hold `view:cold_chain`: pharmacy, OIC, admin, superadmin)
- `src/lib/config/dashboard-modules.ts` only if the cold-chain module's required permission is tightened (currently `view:cold_chain`)

### 2.2 Feature flags

- `immunizationEnabled` already exists on `phcs` (both dialects). It was previously only read by the client `settingsStore`. The new audit remote and the sync push boundary now re-check it server-side; client-side gating is not authorization.
- **New flag** `coldChainEnabled` on `phcs` (both dialects, default `true`), surfaced through `getPhcSettings`/`updatePhcSettings` and `settingsStore`, with an Admin toggle in `/admin/settings`. Superadmin may lock it platform-wide via the existing settings/permission model.
- Server-side flag checks must live in the new remotes and in the `pushOperations` boundary — never only in a component.

### 2.3 Sync-boundary enforcement (implemented)

`src/routes/sync/sync.remote.ts` previously only enforced a permission for `outreachRecords`. The new authoritative gate lives in `src/lib/clinical/policy.ts` and enforces, for every push operation:

- `immunizationRecords` → `manage:immunization` + `immunizationEnabled`
- `temperatureLogs` → `manage:cold_chain` + `coldChainEnabled`
- server-forced `phcId` and `recordedByStaffId` (attribution cannot be forged by a client)
- `normalizeClinicalPayload(...)`: required fields, string lengths, dose 1–4, plausible temperature range, valid timestamps

This prevents any authenticated user from pushing clinical records via a crafted sync payload. Client-side checks are convenience only; this server boundary is authoritative.

---

## 3. AI safety and clinical-risk mitigations

**No AI is used in this feature.** Per AGENTS.md §8.2, state this explicitly and still apply clinical-safety guardrails:

1. **No fabricated values.** Every record must originate from a staff-entered form. No defaults that look like measurements (e.g. no default `4.2°C`), no generated vaccine names, no synthesized batch numbers.
2. **Attribution.** Both new tables carry `recordedByStaffId` derived from `event.locals.staffId` (server) or `sessionStore.staffId` (client), and a timestamp. Records are never anonymous.
3. **Input validation.** Temperature bounded to a physically plausible range (e.g. `-50` to `100 °C`) with one decimal place; vaccine name, dose and batch non-empty and length-limited; expiry must be a valid future-ish date but must not be auto-corrected.
4. **Excursions are advisory.** A reading outside 2–8 °C flags a visual warning only. It must **not** auto-delete stock, auto-notify externally, or alter a vaccine record. Human review is mandatory.
5. **Corrections are additive.** No silent overwrite of an administered vaccine. A correction is a new record (with a `correctionOf` link); the original remains visible in the register.
6. **Disclaimer.** Both pages display: "Staff-entered record. Verify against the physical register and vaccine vial before clinical use."
7. **Existing guardrails preserved.** `<AiDisclaimer>` and human-in-the-loop rules elsewhere in the app are untouched.

---

## 4. Data model

### 4.1 `immunizationRecords` (new, synced)

| Field                    | Type                            | Notes                                |
| ------------------------ | ------------------------------- | ------------------------------------ |
| `id`                     | uuid / text                     | client-generated, PK                 |
| `phcId`                  | uuid / text                     | FK → phcs; tenant scope              |
| `patientId`              | uuid / text                     | FK → patients                        |
| `appointmentId`          | uuid / text, nullable           | FK → appointments                    |
| `vaccineName`            | varchar(120)                    | free text from controlled list in UI |
| `doseNumber`             | integer                         | 1..4                                 |
| `administeredAt`         | timestamp                       | when given                           |
| `batchNumber`            | varchar(80), nullable           | from vial                            |
| `expiryDate`             | date, nullable                  | from vial                            |
| `route`                  | varchar(40), nullable           | e.g. oral / IM                       |
| `recordedByStaffId`      | uuid / text                     | FK → staff                           |
| `correctionOf`           | uuid / text, nullable           | self-FK for additive corrections     |
| `notes`                  | text, nullable                  |                                      |
| `createdAt`, `updatedAt` | timestamp                       |                                      |
| local mirror             | `syncStatus`, `serverUpdatedAt` | LocalCollection requirements         |

### 4.2 `temperatureLogs` (new, synced)

| Field                    | Type                            | Notes                    |
| ------------------------ | ------------------------------- | ------------------------ |
| `id`, `phcId`            | as above                        | tenant scope             |
| `fridgeLabel`            | varchar(80)                     | which unit was read      |
| `temperatureCelsius`     | numeric(5,2)                    | staff-entered, validated |
| `recordedAt`             | timestamp                       |                          |
| `recordedByStaffId`      | uuid / text                     | FK → staff               |
| `notes`                  | text, nullable                  |                          |
| `createdAt`, `updatedAt` | timestamp                       |                          |
| local mirror             | `syncStatus`, `serverUpdatedAt` |                          |

### 4.3 `pharmacyInventory` additions (both dialects + local type)

- `batchNumber: varchar(80)` nullable
- `expiryDate: date` nullable

No new table; fields flow through the existing `pharmacyInventory` sync entity and `toServerRow`/`toClientRow` date shims (`src/lib/seed/adapters.ts`).

### 4.4 `phcs` addition

- `coldChainEnabled: boolean` default `true` (both dialects).

---

## 5. Files to modify (exact touchpoints from the architecture audit)

### Local (offline-first)

- `src/lib/local-db/db.ts` — two new interfaces, two `Table` fields, Dexie `version(11).stores(...)`; also add the two names to the stale `LocalSyncOperation.entityName` union for hygiene.
- `src/lib/state/immunization-records.svelte.ts` (new) — `LocalCollection` store with `record()` and `correct()` helpers.
- `src/lib/state/temperature-logs.svelte.ts` (new) — `LocalCollection` store with `log()` helper.
- `src/lib/state/pharmacy.svelte.ts` — local type gains `batchNumber`/`expiryDate`.
- `src/lib/state/settings.svelte.ts` — expose `coldChainEnabled`.

### Server schema / migrations

- `src/lib/server/db/schema.ts` (PG) and `src/lib/server/db/schema.sqlite.ts` — new tables, relations, `pharmacyInventory` columns, `phcs.coldChainEnabled`.
- `drizzle.config.ts` is dialect-switched by `DATABASE_URL`: generate **twice** (`postgres://…` and `file:…`) with `pnpm db:generate`, commit both `drizzle/postgres` and `drizzle/sqlite` outputs (SQL + meta snapshots + journal).
- Apply locally with `pnpm db:migrate` / `initDatabase` already handles both dialects.

### Sync engine

- `src/routes/sync/sync.remote.ts` — add both to `tableMap` (line ~25); add clinical-write permission/flag checks near line 196.
- `src/lib/seed/adapters.ts` — add both to `SYNC_ENTITY_TABLE`; add `administeredAt`, `recordedAt`, `expiryDate` to the date-field lists.
- `src/lib/sync/operation-dependencies.ts` / `tenant-scope.ts` — no change expected (new tables have their own `phcId`), but verify.
- `src/lib/server/db/seed.ts`, `src/lib/seed/fixtures.ts`, `src/lib/utils/seed.ts` — optional seed rows; if added, all three must be updated together.

### Remotes

- `src/lib/remote/immunization.remote.ts` (new) — read-only audit `query` for the PHC register, with `immunizationEnabled` and PHC-scope checks.
- `src/lib/remote/cold-chain.remote.ts` (new) — read-only audit `query` for temperature logs, with `view:cold_chain`, `coldChainEnabled` and PHC-scope checks.
- Writes do **not** use a server command: they go local-first through `LocalCollection` → Dexie `syncLog` → guarded `pushOperations`, which writes the domain row and outbox atomically. This avoids duplicate writes and keeps offline behaviour intact.
- `pharmacy.remote.ts` needs no projection change: `getPharmacyInventory()` uses `findMany()` and already returns the new `batchNumber`/`expiryDate` columns.

### Permissions / config

- `src/lib/config/permissions.ts`, `role-defaults.ts`, `dashboard-modules.ts` (if needed).
- `src/lib/remote/admin.remote.ts` settings schema — include `coldChainEnabled` in `updatePhcSettings`.
- `src/routes/(app)/admin/settings/+page.svelte` — add the toggle.

### Pages

- `src/routes/(app)/immunization/+page.svelte` — replace "Mark Complete" with a "Record vaccination" dialog that writes through `immunizationStore` (offline-first) and shows the patient's existing doses from the register. Keep appointment-derived due/status list.
- `src/routes/(app)/pharmacy/cold-chain/+page.svelte` — enable "Log Temperature" via a validated dialog writing through `temperatureStore`; render real latest reading with excursion warning; show real batch/expiry from inventory.
- `src/routes/(app)/maternity/+page.svelte` — no structural change; verify `pregnancyRecords` sync registration (it is already in the live `tableMap`, only missing from the dead type union).

### Tests

- `src/lib/sync/cross-device-convergence.spec.ts` — add both entity names to the convergence list.
- `src/lib/sync/tenant-scope.spec.ts` — assert cross-PHC rejection for both.
- New `src/lib/sync/clinical-write-policy.spec.ts` — permission + flag gate for both entity types.
- Manual migration validation for both dialects (no automated migration test exists in the repo).

### Docs

- This plan + companion tasks.
- User-facing guide: update the nurse/pharmacy support docs under `docs/startup-wiki/` (or in-app Walkthrough/tooltips) explaining how to record a vaccination and a temperature reading, and the verification disclaimer.
- Mark MK-03 complete in `docs/features/route-fidelity-cleanup-tasks.md` when the cold-chain page is live.
- **No changeset** (project instruction).

---

## 6. Validation plan

- `vp fmt --check` on changed files, `pnpm run check`, `pnpm check:sw`, `vp test --run --project server`, `vp build`.
- Seed both dialects, sign in as nurse/pharmacy/admin/superadmin, verify permission gating and flag behaviour.
- Two-client sync test: record on device A, confirm arrival on B; verify outbox row written in same transaction.
- Cross-PHC test: user in PHC A cannot read/write PHC B records.
- Offline: record while offline, reconnect, confirm no loss and no duplicate.
- Confirm service worker does not cache live-query responses (unchanged behaviour).

---

## 7. Decisions recorded

1. **Create the models** rather than shipping permanent empty states — user decision 2026-11-20.
2. **Separate feature batch**, committed after the D-A cleanup (`32d891e`) — user decision 2026-11-20.
3. **Local-first stores for writes**, with server remotes for reads/audit and a sync-boundary permission gate — consistent with the existing offline-first architecture.
4. **`manage:cold_chain` is a new permission**; `manage:immunization` is reused.
5. **`coldChainEnabled` is a new flag**; `immunizationEnabled` is reused but gains server-side enforcement.
6. **Remotes are read-only audit queries.** All writes stay local-first and are validated/authorized at the sync boundary, so offline devices and online devices use one code path.
7. **`immunizationRecords` is ranked after appointments** in `operation-dependencies.ts` so a same-batch appointment FK is satisfiable.
8. **Generated SQLite migration `0006_magenta_domino.sql` had unrelated Better Auth `CREATE TABLE` statements removed.** The prior SQLite snapshot never contained those tables; leaving them in would make `initDatabase` fail on existing installations. The snapshot still records them, so drizzle-kit will not re-add them. This is a deliberate, documented deviation from raw generator output.
