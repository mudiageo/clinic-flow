# ANC Visit Log — Feature Plan

## Objective

Wire the existing **Log ANC Visit** button in the maternal health tracker to a durable, offline-first clinical record. Staff must be able to record a legitimate antenatal contact against an active pregnancy, with attribution and validation, during the knowledge-showcase demo.

This is a small extension of the existing maternal-health workflow. The already-submitted deck is not being changed.

## Permissions and feature control

- Required permission: `manage:anc` (already defined for `nurse_midwife`, `cho`, `oic`, `admin`, and `superadmin` defaults).
- Required PHC feature flag: `maternalHealthEnabled`.
- Superadmins retain global authority through the existing role override and platform feature controls. Local Admins may toggle the PHC flag only where it has not been locked at platform level.
- The server sync boundary remains authoritative: permission and flag checks are re-run there; client checks are only a convenience.

## AI safety and mitigations

- **No AI is used in this workflow.** Values are entered by a staff member and stored as a staff-authored record.
- The dialog shows a visible disclaimer: “Staff-entered record. Verify against the physical ANC register before clinical use.”
- The record is advisory documentation, not a diagnosis, risk score, or treatment recommendation. No automated interpretation is generated.
- Human-in-the-loop guardrail: the midwife/nurse remains responsible for checking the physical register and the patient before and after saving. Corrections are additive through the normal clinical-record process; the app does not silently infer or overwrite clinical values.
- The existing global AI advisory banner remains visible; it is not replaced by this workflow-specific notice.

## Data captured

All fields are optional except the visit date, the patient, and the active pregnancy:

| Field               | Type     | Validation                                |
| ------------------- | -------- | ----------------------------------------- |
| `visitNumber`       | `number  | null`                                     | 1–8 when supplied           |
| `visitDate`         | epoch ms | finite, not more than 1 day in the future |
| `systolicBp`        | `number  | null`                                     | 50–300 when supplied        |
| `diastolicBp`       | `number  | null`                                     | 20–200 when supplied        |
| `weightKg`          | `number  | null`                                     | 1–400 when supplied         |
| `fetalHeartRateBpm` | `number  | null`                                     | 50–250 when supplied        |
| `fundalHeightCm`    | `number  | null`                                     | 5–60 when supplied          |
| `notes`             | `string  | null`                                     | trimmed, max 500 characters |

Gestational age is not captured or inferred by this workflow; the existing pregnancy summary remains the source for LMP and EDD display.

## Implementation

### Local/offline layer

- Add `LocalAncVisit` and an `ancVisits` Dexie table in `src/lib/local-db/db.ts` (Dexie version 12).
- Add `ancVisits` to the `LocalSyncOperation.entityName` union.
- Add `src/lib/state/anc-visits.svelte.ts` extending `LocalCollection`; expose `logVisit()`, `forPregnancy()`, and `latestForPregnancy()`.
- Store derives `phcId` from `sessionStore.activePhcId` and `recordedByStaffId` from `sessionStore.staffId`; no component touches Dexie.

### Server/sync layer

- Add matching `ancVisits` tables and relations to both Drizzle schemas (`schema.ts`, `schema.sqlite.ts`) and generate migrations for both dialects.
- Register the entity in `SYNC_ENTITY_TABLE`, date conversion sets, and `tableMap`.
- Extend `ClinicalEntityType` / write policy with `ancVisits: { permission: 'manage:anc', flag: 'maternalHealthEnabled' }`.
- Normalize and validate the ANC payload at the sync boundary, forcing session PHC and recorded-by staff identity.
- Rank `ancVisits` after `pregnancyRecords` in sync dependency ordering.

### UI layer

- Add `src/lib/components/maternal/anc-visit-dialog.svelte` using shadcn-svelte `Dialog`, `Input`, `Label`, `Select`, and `Textarea`, with `@lucide/svelte` icons and `svelte-sonner` feedback.
- Open the dialog from `anc-tracker.svelte`; disable the button with an explanatory title when the flag or permission is absent.
- Show recorded visits beneath the ANC summary so the demo can confirm the write immediately.

## Tests

- Clinical policy: permission, flag, valid/invalid ANC payloads, partial update behaviour.
- Sync convergence: ANC visits converge within a PHC and are isolated from another PHC.
- Dependency ordering: pregnancy parent is pushed before its ANC visit child.
- Store/unit: validation and attribution for `logVisit()`.
- Svelte checks: autofixer clean; no new Svelte/TypeScript diagnostics versus baseline.

## Files to modify/create

- `src/lib/local-db/db.ts`
- `src/lib/state/anc-visits.svelte.ts`
- `src/lib/components/maternal/anc-visit-dialog.svelte`
- `src/lib/components/maternal/anc-tracker.svelte`
- `src/lib/server/db/schema.ts`
- `src/lib/server/db/schema.sqlite.ts`
- generated migrations under `drizzle/postgres` and `drizzle/sqlite`
- `src/lib/seed/adapters.ts`
- `src/routes/sync/sync.remote.ts`
- `src/lib/clinical/policy.ts`
- `src/lib/sync/operation-dependencies.ts`
- related specs listed above
- `docs/user-guides/anc-record-keeping.md`
