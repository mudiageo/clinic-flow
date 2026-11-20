# Route Fidelity — Admin Actions & Provider Adapters (Implementation Plan)

**Status:** In progress — Wave 1 complete and pushed; Wave 2 in implementation. Last verified: 2026-11-20.
**Companion checklist:** `docs/features/route-fidelity-admin-actions-tasks.md`
**Parent:** `docs/features/route-fidelity-cleanup-plan.md` (remaining Phase E items + referral items).
**Scope:** MK-07, NW-15, MK-09, NW-05 (Wave 1); MK-10, NW-01, NW-03, NW-06, NW-07, NW-14, NW-09, NW-10 (Wave 2). ST-14 remains explicitly deferred.

---

## 1. Objective

The earlier route-fidelity batches removed fabricated data and false claims from admin/superadmin pages, but many **actions are still no-ops** and some pages still render **fake device/log/status values**. This batch replaces those with real, auditable behaviour:

- Wire real release data and a provider-adapter-backed publish action.
- Replace the fake "Device Sync Log" with data derived from the durable sync tables.
- Wire "Add Manually" for devices, user/PHC superadmin actions, SMS test/dispatch, NHIS claim submission and DHIS2 UID configuration.
- Wire the doctor referral tab and print/SMS flow.

**Two waves, each committed and pushed separately** (per user decision):

- **Wave 1** — data honesty + wiring that needs no new DB table.
- **Wave 2** — new DB config/status columns, provider adapters, and referral flows.

---

## 2. Permissions (explicitly defined)

Superadmins have global authority and may enable/restrict/lock these features platform-wide. Local Admins may only exercise these actions inside their own PHC and cannot override a Superadmin lock.

| Action                                    | Permission key                     | Scope                 | Status in codebase                                              |
| ----------------------------------------- | ---------------------------------- | --------------------- | --------------------------------------------------------------- |
| View releases / publish                   | `manage:platform`                  | Platform (superadmin) | Exists (`permissions.ts:64`)                                    |
| View sync health                          | `view:sync_health`                 | PHC (admin)           | **Used but missing from `PermissionKey` union** — fix in Wave 1 |
| View/approve devices                      | `manage:devices`                   | PHC (admin)           | Exists (`permissions.ts:59`)                                    |
| Configure DHIS2 export                    | `export:dhis2`                     | PHC (admin)           | Exists (`permissions.ts:50`)                                    |
| Submit NHIS claims                        | `manage:nhis`                      | PHC (admin)           | Exists (`permissions.ts:61`)                                    |
| SMS test / dispatch                       | `manage:phc` / `manage:reminders`  | PHC (admin)           | Exists (`permissions.ts:58,42`)                                 |
| Reset password / deactivate user          | `manage:platform` + `manage:staff` | Platform (superadmin) | Exists (`permissions.ts:64,56`)                                 |
| Deactivate PHC / reset data / sync status | `manage:platform`                  | Platform (superadmin) | Exists (`permissions.ts:64`)                                    |
| Generate referral / send referral SMS     | `manage:referrals`                 | PHC (doctor)          | Exists — verify in `role-defaults.ts`                           |

All new remotes re-check authorization **server-side** with `requirePermission(...)` / `requireSuperadmin()` and derive `phcId` from `getRequestEvent().locals`, never from client input.

---

## 3. AI safety & mitigations

These are operational/admin pages; **none generate AI clinical content**. Controls that must be preserved:

1. `admin/reports/dhis2` clinical-integrity notice (no AI processing in the final payload) stays visible.
2. Any `AiDisclaimer` and human-in-the-loop guardrails on touched pages remain untouched (survey found none in this batch's pages, but every edited page must be checked).
3. Provider adapters never invent clinical values. In console/mock mode, results are explicitly labelled `console-mode` and surfaced in the UI — no `termii_sandbox_*`-style IDs that look like real delivery receipts.
4. Destructive actions (deactivate user/PHC, reset data, publish release) require an explicit confirmation dialog and an audit-log entry; no silent mutation.
5. No external provider call is made with patient-identifiable data in console mode; payloads logged to console are operational metadata only (claim/reference IDs, phone number for SMS test only where already present on the page).

---

## 4. Provider adapter architecture (user-directed)

Create `src/lib/server/integrations/` with a small, swappable adapter layer:

```
external-provider.ts   shared ProviderMode/ProviderResult contract + console refs
sms-provider.ts        wraps existing sendSms(); env: TERMII_API_KEY (or PHC termiiApiKey)
nhis-provider.ts       env: NHIS_API_URL, NHIS_API_KEY (private endpoint override)
github-provider.ts     env: GITHUB_TOKEN
facility-registry-provider.ts  read-only HFR lookup; env: HFR_API_KEY, HFR_API_URL (optional)
```

Contract:

```ts
type ProviderMode = 'live' | 'console';
type ProviderResult<T> =
	| { ok: true; mode: 'live'; data: T }
	| { ok: true; mode: 'console'; data: T; reason: string }
	| { ok: false; mode: 'console' | 'live'; error: string };
```

- If the relevant env vars are **present**, call the real provider (`live`).
- If **absent**, log the non-clinical outbound payload with `console.info('[console-mode] ...')` and return a clearly-marked `console` result with a `console:<kind>:<uuid>` reference — never a provider-shaped ID such as `termii_sandbox_*`.
- Each adapter is a single module so switching providers is a one-file change.
- All adapter calls happen server-side inside remotes; clients receive `{ mode, ok, reference }` and render a visible **"Console mode — not delivered"** badge when `mode === 'console'`.
- Durable side effects (claim status, SMS dispatch records, audit log) are still written in the same transaction/path as today; console mode changes only the delivery leg.

### 4.1 Research findings and exceptions (verified 2026-11-20)

- **NHIA/NHIS claims have no documented public submission API.** Nigerian claims move through HMO portals, paper, spreadsheets, and licensed desktop tools. The NHIA self-service portal is for enrollees, and `claimit.nhia.gov.gh` is Ghana's scheme, not Nigeria's. Therefore the primary claims path is a **durable manual-submission queue** (draft → ready → submitted → acknowledged/paid) with an exportable claim packet; a generic `NHIS_API_URL` + `NHIS_API_KEY` **private endpoint override** is opt-in only and is never described as a public API.
- **Nigeria does have a documented read-only facility registry:** the Federal Ministry of Health HFR API (`https://backend.hfr.fmohconnect.gov.ng/api/v1`, plus FHIR R4 at `/api/fhir`), authenticated with `X-API-Key` (key request form, ~24h approval), GET-only, rate-limited.
- **HFR is reference data, not an action integration.** It gets **no console mode**: there is no action to hand to a human and fabricating a facility row is forbidden. Its states are `live` (real, cached result), `unconfigured` (no key — lookup disabled, manual entry works), and `unavailable` (request failed — show error, keep any cached result marked stale). A dev-only diagnostic log of the query URL is acceptable but is not a user-facing mode. This is an explicit exception to the global live/console rule, which was written for mutating integrations.
- HFR data is advisory only: local DB remains authoritative for PHC identity, HFR IDs are never DHIS2 UIDs or foreign keys, nothing auto-writes, queries carry no PHI, and HFR registration is **not** evidence of NHIA accreditation or eligibility.

---

## 5. Wave 1 — data honesty + existing wiring (no new DB table)

| Item          | Work                                                                                                                                                                                                                                                                     | Key files                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| MK-07 / NW-15 | Replace static `v1.2.4`/`Oct 2023` releases and hardcoded history with `getReleases()`; wire `ExternalLink` buttons to `ReleaseInfo.downloads`; remove video placeholder; publish button uses `github-provider` adapter + confirmation; no-op → real command.            | `src/routes/(app)/superadmin/releases/+page.svelte`, `src/lib/remote/releases.remote.ts`, new `github-provider.ts`        |
| MK-09         | Replace `// Mock sync history` device rows with a new PHC-scoped query over `sync_operations` + `devices.lastSyncAt`; show real device names, versions, last-sync and counts; keep existing real conflict handling. Fix `view:sync_health` missing from `PermissionKey`. | `src/routes/(app)/admin/sync-health/+page.svelte`, new `src/lib/remote/sync-health.remote.ts`, `permissions.ts`           |
| NW-05         | Wire "Add Manually" to a new superadmin/admin-scoped command wrapping existing `registerPendingDevice`; validation for name/MAC/role; refresh device list.                                                                                                               | `src/routes/(app)/admin/devices/+page.svelte`, `src/lib/remote/devices.remote.ts`, `src/lib/server/db/queries/devices.ts` |

Wave 1 also adds `minor` changeset + user-facing docs updates for the changed flows, then commit and push.

---

## 6. Wave 2 — config tables, adapters, referrals

| Item  | Work                                                                                                                                                                                                                                                                                                           | Key files                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| MK-10 | Add PHC-scoped DHIS2 UID config storage (new table `dhis2_config` in both PG + SQLite dialects + migrations); remote `getDhis2Config`/`updateDhis2Config` with documented defaults; page uses configured UIDs; values remain real store data.                                                                  | `schema.ts`, `schema.sqlite.ts`, new remotes, page           |
| NW-01 | Add durable `nhis_claims` table (PG + SQLite + migrations) with status/reference; **manual-submission queue** is the default (exportable claim packet, honest statuses), with an opt-in `nhis-provider` private-endpoint override; page shows real per-claim status instead of hardcoded "Pending Submission". | new table, new remote/adapter, page                          |
| HF-01 | Add read-only advisory `facility-registry-provider.ts` for Nigeria HFR with `live`/`unconfigured`/`unavailable` states and a TTL cache; **no console mode**, no fabricated rows.                                                                                                                               | new provider, `env.ts`                                       |
| HF-02 | Use HFR lookup as an advisory referral destination directory (filter by state/LGA/type); clinician always confirms the target.                                                                                                                                                                                 | referral pages, new remote                                   |
| HF-03 | Use HFR for PHC onboarding validation and an admin data-quality review list; advisory only, never auto-overwrite.                                                                                                                                                                                              | onboarding, admin page, new remote                           |
| NW-03 | Replace fake `testSms()` timeout with `smsTest` command using `sms-provider` adapter and existing `sendSms()`; show real `mode`/reference.                                                                                                                                                                     | `admin/settings/+page.svelte`, `sms-provider.ts`, new remote |
| NW-06 | Add superadmin-scoped reset-password and deactivate commands (Better Auth `user.password`, `staff.active`) with confirmation + audit; wire menu items.                                                                                                                                                         | `superadmin.remote.ts`, `superadmin/users/+page.svelte`      |
| NW-07 | Add `active` column to `phcs` (both dialects + migrations) for deactivation; add PHC-scoped sync-status query (from `syncVersion`/`sync_operations`) and deactivate/reset-data commands with confirmation + audit; replace literal `Healthy`.                                                                  | schemas, remotes, page                                       |
| NW-14 | Replace stub `dispatchReminders` (`routes/sms/sms.remote.ts`) with `sms-provider` adapter calls; write real `status`/`sentAt`/`provider`/`providerMessageId`; add `manage:reminders` check + audit.                                                                                                            | `sms.remote.ts`, adapter, page                               |
| NW-09 | Wire referral-tab "Generate Referral Letter" to the working header flow; replace mobile pane placeholder with the real referral UI.                                                                                                                                                                            | `doctor/consult/[id]/+page.svelte`                           |
| NW-10 | Replace simulated `handleSendSms()` with `sms-provider` adapter; signature from session staff, not hardcoded "Dr. ClinicFlow User".                                                                                                                                                                            | `doctor/referral/print/+page.svelte`, new remote             |

Wave 2 also adds `minor` changeset + user-facing docs and then commit and push.

---

## 7. Data model & migration notes

- New tables: `dhis2_config` (PHC-scoped, one row per PHC), `nhis_claims` (PHC + encounter + status + reference).
- New column: `phcs.active` (boolean, default true) in both dialects.
- Generate PG + SQLite migrations with snapshots/journals, strip any unrelated Better Auth DDL from generated SQLite migrations (same rule as the clinical feature), and apply to a scratch SQLite DB to verify.
- All durable writes append an outbox/audit record in the same transaction where the project rules require it.

---

## 8. Validation (per wave)

- `vp fmt --check` on changed files
- `pnpm check:sw`, `vp build`, `vp test --run --project server`
- `pnpm run check` — no **new** diagnostics vs the pre-batch baseline. Note: fixing `view:sync_health` is expected to _reduce_ errors by 5 (one in `permissions.ts`, three in `role-defaults.ts`, one in `dashboard-modules.ts`), so the post-Wave-1 count should be ~226 rather than 231.
- Add focused `*.spec.ts` tests for provider adapter mode selection (live vs console) and sync-health aggregation.
- Re-run Svelte autofixer on every edited `.svelte` file until clean.

## 9. Documentation & closure

- Update `docs/features/route-fidelity-cleanup-tasks.md` item-by-item as waves land.
- Update user-facing docs/guides for changed flows (releases, sync health, devices, claims, SMS, referrals).
- One `minor` changeset per wave (repo convention + parent tracker item).
- Update the main tracker if applicable; final validation; commit and push each wave.
