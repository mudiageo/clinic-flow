# Route Fidelity Cleanup — Implementation Plan

**Status:** Phases A–C complete (except ST-14, deferred); Phase I sync encounter repair implemented, pending live stale-op re-test — Phase D next (2026-11-19)
**Created:** 2026-11-17
**Source audits:** Systematic read-only review of every route under `src/routes/**`, the dashboard module config, and all supporting stores/remotes. Four parallel audits covered admin, superadmin/settings, clinical, and dashboard/public routes. No code was changed by the audit.

---

## 1. Objective

Eliminate **hardcoded data**, **mocks**, **no-op functionality**, and **broken/non-existent routes** across the application so every screen renders real data from the relevant `src/lib/state/*.svelte.ts` store or `src/lib/remote/*.remote.ts` query/mutation. The user specifically flagged:

- Dashboard analytics widget shows hardcoded `24` completed, `89%` sync health, `45%` capacity.
- The "Family Health" module links to `/families`, which 404s (only `/families/[id]` exists).
- Superadmin pages (announcements, device management, billing, etc.) are largely static/no-op.

This is a **cross-cutting cleanup**, not a single feature. Each issue below has a stable ID (e.g. `DB-01`, `BR-01`) so work can be assigned incrementally.

---

## 2. Guiding constraints (from `AGENTS.md`)

- **Component naming:** kebab-case filenames.
- **UI:** prefer `shadcn-svelte` / `more-shadcn-svelte` components; do not hand-roll tables/inputs that already exist.
- **Icons:** `@lucide/svelte` only.
- **Database access:** never use Dexie (`db`) directly in components — go through the stores in `src/lib/state/`.
- **Dates:** native `Intl` via `src/lib/utils/date.ts`; never `date-fns`.
- **Server architecture:** no `+page.server.ts` / `+layout.server.ts`. All server logic in `#lib/remote/*.remote.ts` using `query` / `command` / `form`, imported directly into `+page.svelte`. (Note: a few existing `+page.ts` universal loads call remotes — acceptable but not the preferred direct-import pattern.)
- **Feature protocol:** plan + tasks docs created before code; tick tasks as work proceeds; update user-facing docs; add a changeset.
- **Multi-tenancy:** every record is scoped by `phcId`. Writes must use `sessionStore.phcId` (never `crypto.randomUUID()` or `'placeholder-phc-id'`). Server remotes must derive the PHC from `event.locals.phcId`, not trust a client-supplied value.
- **Permissions:** Superadmins hold global authority to enable/restrict/lock features platform-wide; local Admins may only toggle features for their own PHC when not locked by a Superadmin.

---

## 3. Findings summary

Severity: **P0** = user-facing fake data / broken navigation (fix first). **P1** = no-op workflow or wrong wiring. **P2** = cosmetic/marketing/deferred.

### 3.1 Broken routes (BR) — P0

| ID    | Target                  | Referenced at                                       | Current state                                      |
| ----- | ----------------------- | --------------------------------------------------- | -------------------------------------------------- |
| BR-01 | `/families`             | `dashboard-modules.ts:42`, `field/+page.svelte:27`  | No index route; only `families/[id]/` exists → 404 |
| BR-02 | `/maternity/anc`        | `dashboard-modules.ts:112`                          | No route → 404                                     |
| BR-03 | `/maternity/partograph` | `dashboard-modules.ts:128`                          | No route → 404                                     |
| BR-04 | `/field/outreach`       | `dashboard-modules.ts:206`, `field/+page.svelte:33` | No route → 404                                     |
| BR-05 | `/superadmin/phcs`      | `dashboard-modules.ts:334`                          | No index route; only `phcs/[id]/` exists → 404     |
| BR-06 | `/support/nurse-queue`  | `(marketing)/support/+layout.svelte:19`             | No doc page → 404                                  |
| BR-07 | `/support/pharmacy`     | `(marketing)/support/+layout.svelte:21`             | No doc page → 404                                  |

These hrefs also surface in `(app)/+layout.svelte:196,255`, so they are visible to every role.

### 3.2 Dashboard hardcoded data (DB) — P0

| ID    | Location                         | Current                                                                                                                             | Required source                                                                               |
| ----- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| DB-01 | `dashboard/+page.svelte:254`     | `24` "Completed"                                                                                                                    | Queue tickets with `status:'done'` and `completedAt` today (`queueStore`)                     |
| DB-02 | `dashboard/+page.svelte:260`     | `89%` "Sync Health"                                                                                                                 | Derived from `syncStore` (`online`, `pendingCount`, `conflicts`, `lastSyncedAt`, `isSyncing`) |
| DB-03 | `dashboard/+page.svelte:269,271` | `45%` + `<Progress value={45}>` "Clinic Capacity"                                                                                   | Define a real capacity model (configured limit vs. today's throughput) in store/settings      |
| DB-04 | `dashboard/+page.svelte:152-154` | Filters `i.quantity <= i.reorderLevel` — **fields do not exist** (`LocalPharmacyInventory` has `currentStock`, `lowStockThreshold`) | Use `pharmacyStore.lowStock` (already correct)                                                |
| DB-05 | `dashboard/+page.svelte:150,168` | `pendingReminders.length` labelled "overdue" — `pendingReminders` only filters `status==='scheduled'`                               | Add an `overdueReminders` derived value filtering `dueDate < Date.now()` in `reminderStore`   |

`ICONS`, `CATEGORY_ORDER`, `CATEGORY_COLORS`, `ROLE_LABELS` (lines 64-105, 120-144, 176-189) are genuine display constants — leave them. Total Queue, queue list, critical patients and low-stock alert counts are already correctly store-derived.

### 3.3 Fully mocked modules / fabricated data (MK) — P0/P1

| ID    | Location                                                                | Finding                                                                                                                                                                                                             |
| ----- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MK-01 | `maternity/+page.svelte:7-29,49-52,102-116`                             | `// Mock active admissions` — fake patients "Amina Yusuf"/"Blessing Okoro", fake dilation/FHR; Admit/Vitals/Partograph buttons are no-ops. `pregnancyStore` + `patientStore` exist but are unused.                  |
| MK-02 | `immunization/+page.svelte:8-38,61,115-117`                             | `// Mock EPI roster` — fake infants/vaccines/due dates; search input inert; "Record" button no-op. Should be backed by `appointmentStore.forPatient(...)` / a real EPI store.                                       |
| MK-03 | `pharmacy/cold-chain/+page.svelte:13-22,42-45,91-92`                    | `// Mock data` — fake `fridgeTemp = 4.2`, fake vaccine stock/expiry, fake "by Nurse Joy" provenance; "Log Temperature" no-op. No cold-chain store/remote exists.                                                    |
| MK-04 | `superadmin/system/+page.svelte:11-25,112-127`                          | Explicit `// Mocking system health data...`; fake uptime/ping/sync/SMS metrics, `Math.random()` "live" updates every 3 s, static fake error log (2023 timestamps). Real `getServerStatus` remote exists but unused. |
| MK-05 | `superadmin/billing/+page.svelte:44-103,113-120`                        | Static fake clinics/prices/dates, `₦450,000` revenue, `"12.5% from last month"`; Send Reminder / Approve Offline Payment / Generate Invoices are no-ops. No billing remote/table exists.                            |
| MK-06 | `superadmin/announcements/+page.svelte:23-38,131,142-155`               | `// Mock sending` — timeout + toast only; fake reach (`1,245`/`42`); fake "Recent Broadcasts". No announcement remote/table exists.                                                                                 |
| MK-07 | `superadmin/releases/+page.svelte:12-18,38-41,86-94,108-141`            | Static fake releases (`v1.2.4`, Oct 2023), no-op Publish/ExternalLink, "Demo Video Player Placeholder". Real `getReleases` remote exists but unused.                                                                |
| MK-08 | `epidemiology.remote.ts:12-17` → `superadmin/epidemiology/+page.svelte` | `getOutbreakData()` fabricates all case counts/risk levels with `Math.random()`; `generateReport()` is a timeout + `alert('...Demo.')`. **Patient/public-health safety concern** — see §6.                          |
| MK-09 | `admin/sync-health/+page.svelte:23-29,124-146`                          | `// Mock sync history for demo purposes` — fake devices ("Tablet 1 (Reception)"), fake times/counts rendered as "Device Sync Log".                                                                                  |
| MK-10 | `admin/reports/dhis2/+page.svelte:20-28,48-62`                          | Hardcoded placeholder UIDs (`CLINIC_FLOW_DATASET_UID`, etc.); comments admit demo aggregation. Values themselves derive from stores.                                                                                |

### 3.4 No-op / simulated workflows (NW) — P1

| ID    | Location                                           | Finding                                                                                                                                                                               |
| ----- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NW-01 | `admin/nhis-claims/+page.svelte:26-28,79-81`       | `submitClaim()` → `toast.success('(simulated)')`; no remote exists. Claims all show hardcoded "Pending Submission".                                                                   |
| NW-02 | `admin/outbreak-radar/+page.svelte:62-78,657-670`  | `sendSms()` → `setTimeout` + toast; no real SMS remote. Line 672 falsely claims "Uses Termii SMS integration." Also `FileSignature` at 745 is used but not imported (render bug).     |
| NW-03 | `admin/settings/+page.svelte:128-138,248-251`      | `testSms()` → timeout + "Test SMS successfully delivered (simulated)". No remote.                                                                                                     |
| NW-04 | `admin/audit/+page.svelte:20,40-43,62-91`          | Reads `data.entries`/`data.total` but no load supplies them → always empty. `getAuditLog` remote exists but is itself a TODO stub returning `[]`. "Filter Log" button has no handler. |
| NW-05 | `admin/devices/+page.svelte:147-149`               | "Add Manually" button has no handler (approve/revoke/delete are real via `devices.remote.ts`).                                                                                        |
| NW-06 | `superadmin/users/+page.svelte:117-118`            | "Reset Password" / "Deactivate User" menu items have no handlers; no remotes exist.                                                                                                   |
| NW-07 | `superadmin/phcs/[id]/+page.svelte:46-56,98-99`    | "Sync Status" always green + literal `Healthy`; "Deactivate" and "Reset Data" buttons have no handlers/remotes.                                                                       |
| NW-08 | `families/[id]/+page.svelte:34-36,57`              | "Register Newborn" and "Add Relative" only toast "will open here"/"modal open".                                                                                                       |
| NW-09 | `doctor/consult/[id]/+page.svelte:813`             | Referral-tab "Generate Referral Letter" no-op (working flow is header button at 423). Mobile pane at 1005-1017 shows "Same content as left pane for mobile" instead of the UI.        |
| NW-10 | `doctor/referral/print/+page.svelte:21-27,139`     | `handleSendSms()` simulated; signature hardcoded "Dr. ClinicFlow User". SMS worker exists server-side but no remote is called.                                                        |
| NW-11 | `settings/notifications/+page.svelte:74,79`        | "SMS Notifications (Coming Soon)" — permanently disabled switch.                                                                                                                      |
| NW-12 | `connect/+page.svelte:289,148-150`                 | "QR Scanner component not implemented yet!" toast; random device name `Tablet-<random>`.                                                                                              |
| NW-13 | `onboarding/+page.svelte:82-85,356-387,45,247-253` | Fake `Math.random()` progress bar; static fake camera calibration with "Skip" → toast; `includeSeedData` checkbox never passed to `registerPhc()`.                                    |
| NW-14 | `admin/reminders/+page.svelte:29-66`               | "Dispatch Pending SMS Now" calls `dispatchReminders`, which is a stub (`sms.remote.ts:4-27`: console.log + fake `termii_sandbox_*` IDs).                                              |
| NW-15 | `superadmin/releases/+page.svelte:38-41,70-72`     | Covered by MK-07 (Publish button, ExternalLink buttons no-op).                                                                                                                        |

### 3.5 Stub IDs & broken store wiring (ST) — P1

| ID    | Location                                                         | Finding                                                                                                                                                                                     |
| ----- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ST-01 | `pharmacy/inventory/new/+page.svelte:34`                         | `phcId: 'placeholder-phc-id'` written to real records → use `sessionStore.phcId`.                                                                                                           |
| ST-02 | `nurse/register/+page.svelte:117-118,122,142-144`                | Clinic ID uses `Math.random()`; `phcId: crypto.randomUUID()` twice; `ticketNumber: 0`. Use deterministic ID + session PHC + real ticket number.                                             |
| ST-03 | `nurse/search/+page.svelte:58`                                   | `phcId: crypto.randomUUID(), // Stub or auth store`.                                                                                                                                        |
| ST-04 | `nurse/vitals/+page.svelte:166,168`                              | `phcId: crypto.randomUUID()`, `ticketNumber: 0`.                                                                                                                                            |
| ST-05 | `patients/[id]/+page.svelte:137,141` + related                   | Calls `patientStore.findById()` — **method does not exist**; `LocalCollection` exposes `get(id)`. Child `AncTracker`/`ImmunizationCard` will fail at runtime.                               |
| ST-06 | `families.svelte.ts:4`                                           | `new LocalCollection<LocalFamily>('families')` passes 1 arg; constructor needs `(table, entityType, queryFn)` → store is broken. Convert to a proper `FamilyStore extends LocalCollection`. |
| ST-07 | `families/[id]/+page.svelte:5,21`                                | Ignores `familyStore`; imports `queueStore` but never uses it; stale "No appointments local store yet" comment.                                                                             |
| ST-08 | `patients/[id]/+page.svelte:33`, `families/[id]/+page.svelte:46` | `href="javascript:history.back()"` pseudo-links → use `goto(-1)` / history API.                                                                                                             |
| ST-09 | `superadmin/users/+page.svelte:32,91` + `queries/staff.ts:22-32` | `user.email` rendered/searched but never selected by `getAllStaffUsers()` → blank column; `.toLowerCase()` throws on search.                                                                |
| ST-10 | `nurse/reminders/create-reminder-dialog.svelte:23,128-131`       | `type` union is `follow_up                                                                                                                                                                  | immunization | antenna`but`<select>`offers`appointment | medication | vaccination` — selected values fall outside the type. |
| ST-11 | `pharmacy/+page.svelte:50-51`                                    | `requestedByStaffId: null`, `quantityRequested: Math.max(100, …)` hardcoded business default.                                                                                               |
| ST-12 | `superadmin/settings/+page.svelte:23-24`                         | Fake identity fallbacks `'Super Admin'` / `'admin@clinicflow.org'`.                                                                                                                         |
| ST-13 | `admin/server-status/+page.svelte:236-249`                       | "mDNS Active", hostname `clinicflow-server.local`, "Broadcasting" badge shown as live; remote has no mDNS field.                                                                            |
| ST-14 | `login/+page.svelte:108`                                         | **Auth backdoor**: `pin === '0000'` accepts any staff login ("allow fallback for testing offline architecture"). Security risk.                                                             |
| ST-15 | `admin/sync/+page.svelte:2,29-84`                                | Reads/writes Dexie `db` directly in component instead of `syncStore` (rule deviation).                                                                                                      |

### 3.6 Clean files (no action)

All `+page.ts` files; `dashboard` queue widgets (other than DB items); `(app)/+layout.svelte` data; `doctor/+page`, `doctor/patients` (list+detail), `doctor/lab`, `nurse/+page`, `nurse/reminders/*`, `pharmacy/dispense`, `pharmacy/inventory/[id]`, `pharmacy/restock`, `pharmacy/reports`, `admin/+page`, `admin/appointments*`, `admin/patients`, `admin/permissions`, `admin/reports`, `admin/sms-inbox`, `admin/staff*`, `admin/triage`, `superadmin/permissions/*`, `settings/+layout`, `settings/+page`, `settings/security`, `kiosk`, `waiting-room`, all `(marketing)` pages except the two broken support links, and the root layout.

---

## 4. Implementation phases

Work is intentionally incremental; each phase is independently shippable with its own changeset.

### Phase A — Navigation integrity (BR-01…BR-07) — do first

1. Add `(app)/families/+page.svelte`: list of `familyStore.items` with search, link to `/families/[id]`. Fix `familyStore` (ST-06) first.
2. Add `(app)/maternity/anc/+page.svelte` and `(app)/maternity/partograph/+page.svelte`, backed by `pregnancyStore` / real labour data (may initially reuse the maternity page with a `?tab=` param instead of new routes — **decision needed**).
3. Add `(app)/field/outreach/+page.svelte` backed by an outreach store/remote (see `docs/features/integration-field-outreach-plan.md`).
4. Add `(app)/superadmin/phcs/+page.svelte`: list from `getPhcList()`, link to `phcs/[id]`; mirror detail page's real data.
5. Add `(marketing)/support/nurse-queue/+page.svelte` and `support/pharmacy/+page.svelte` docs, or repoint the two links to existing guides.

### Phase B — Dashboard data (DB-01…DB-05)

1. `queue.svelte.ts`: add a `liveQuery` for `status in ['done','no_show']` and a `completedToday` derived value filtering `completedAt >= startOfToday`; expose `overdueReminders` in `reminderStore`.
2. `sync.svelte.ts`: add `syncHealth` derived value from `online`, `pendingCount`, `conflicts`, `lastSyncedAt`, `isSyncing`, with a documented, deterministic formula.
3. Define a capacity model: prefer a configured `dailyCapacity` in `PhcSettings` with a sensible default; derive % as `(completedToday + activeQueue) / dailyCapacity`, clamped 0-100. If no config is desired, present "—" rather than a fake number (**decision needed**).
4. Replace DB-01…DB-05 in `dashboard/+page.svelte` with the derived values; remove the `: any` casts by using the typed `pharmacyStore.lowStock`.

### Phase C — Stub IDs & store wiring (ST-01…ST-15)

1. Replace every `crypto.randomUUID()`/`'placeholder-phc-id'`/`ticketNumber: 0` with `sessionStore.phcId` and a real ticket-number allocator (centralize in `queueStore`).
2. Fix `patientStore.findById()` → `.get()`; fix `familyStore` construction; replace `javascript:history.back()` with `goto(-1)`.
3. Remove the `pin === '0000'` backdoor (ST-14) and add `email` to `getAllStaffUsers()` (ST-09).
4. Align reminder `type` union with the select options (ST-10); remove fake identity fallbacks (ST-12) and mDNS card (ST-13).
5. Route `admin/sync` through `syncStore` (ST-15).

### Phase D — Mocked clinical modules (MK-01…MK-03, NW-08…NW-11)

1. `maternity`, `immunization`, `pharmacy/cold-chain`: remove inline fake arrays, wire to `pregnancyStore`/`patientStore`, `appointmentStore`, and a new cold-chain store/remote respectively; wire Admit / Record / Log Temperature actions.
2. `families/[id]`: implement Register Newborn (create patient with `familyId`, link to mother) and Add Relative (add family member) via stores; wire Upcoming Visits to `appointmentStore.forPatient()`.
3. `doctor/consult` referral tab + `doctor/referral/print`: wire to the existing `generateReferral` flow and a real SMS remote; replace hardcoded signature with `sessionStore.user.name`.

### Phase E — Mocked superadmin / admin pages (MK-04…MK-10, NW-01…NW-07, NW-14…NW-15)

1. `superadmin/system`: use `getServerStatus` remote for real metrics; remove `Math.random()` and fake error log.
2. `superadmin/releases`: use the existing `getReleases` remote; wire Publish; remove video placeholder.
3. `admin/sync-health`: derive device log from `syncStore` / `sync_operations` instead of the mock array.
4. `admin/audit`: implement `getAuditLog` remote for real and wire `data` via direct remote import; wire the Filter button.
5. NHIS, SMS test, outbreak escalation, reminders dispatch: add real remotes (`query`/`command`) with `event.locals.phcId` scoping; remove `(simulated)` copy and fake Termii IDs.
6. Announcements & billing: add new remote + DB table (announcements: title/body/audience/reach/createdBy; billing: subscription/usage) or, if deferred, **clearly label pages as "Demo — not yet connected"** instead of presenting fabricated data as real.
7. DHIS2 placeholder UIDs: move to configurable settings with documented defaults.
8. `superadmin/users` / `superadmin/phcs/[id]`: add reset-password, deactivate, reset-data remotes with confirmation dialogs.

### Phase F — Auth / onboarding / marketing polish (NW-12…NW-13, BR-06…BR-07, ST-14)

1. Remove QR-scanner toast → either implement a scanner component or hide the action.
2. Onboarding: wire `includeSeedData` to `registerPhc()`, replace fake progress with real `initDatabase` progress, remove fake calibration step or implement camera capture.
3. Fix the two support links (BR-06/BR-07).

---

## 5. Permissions & multi-tenancy requirements

| Area                                                         | Required permission / role                        | Superadmin vs Admin                                                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/families` (BR-01)                                          | `manage:families` / `view:families`               | Local Admins toggle `familyHealthEnabled` for their PHC; Superadmin can lock globally.                                                                    |
| `/maternity/*`, `/maternity/partograph`                      | `view:maternity`, `manage:maternity`, `view:anc`  | `maternalHealthEnabled` toggle; Superadmin lock wins.                                                                                                     |
| `/field/outreach`                                            | `manage:outreach`, `use:field_mode`               | Local toggle; Superadmin lock wins.                                                                                                                       |
| `/superadmin/phcs`, announcements, billing, releases, system | `manage:platform` (Superadmin only)               | Global authority; no local Admin equivalent.                                                                                                              |
| All new remotes                                              | authenticated + PHC-scoped                        | Derive `phcId` from `event.locals.phcId`; never accept client `phcId` for writes. Superadmin-only remotes must check `locals.user.role === 'superadmin'`. |
| SMS / outbreak escalation                                    | `manage:reminders` / `view:outbreaks` + PHC scope | Feature flags `twoWaySmsEnabled`, `outbreakDetectionEnabled` gate the actions; Superadmin locks propagate.                                                |

---

## 6. AI safety & clinical risk mitigations

Several findings involve AI or clinical data integrity. Per `AGENTS.md` §7.2, these require explicit mitigations:

- **MK-08 (`epidemiology.remote.ts` using `Math.random()` for case counts/risk levels):** fabricated epidemiological surveillance data presented as real is a **public-health safety hazard** — could drive incorrect outbreak responses or resource allocation. Must be replaced with deterministic aggregation from real `outbreaks` data. Until then, the page must display a prominent "Demo data — not for clinical or public-health decisions" disclaimer.
- **NW-02 (`outbreak-radar` AI/SMS):** preserve the existing human-in-the-loop guardrail — "Run AI Analysis" must remain advisory; keep `<AiDisclaimer>` on AI output; require explicit staff confirmation before any LGA SMS is sent; never auto-send based on AI output alone.
- **AI outputs elsewhere (`getPatientRiskScore`, `RxBrain`, `DrAssist`, triage):** must retain their `<AiDisclaimer>` and never be silently replaced by mock values; cleanup must not weaken these safeguards.
- **MK-01/MK-02/MK-03 (clinical/stock mock data):** fake vitals, fake vaccine rosters, and fake fridge temperatures could mislead clinical staff. Remove entirely or gate behind a clearly-labelled "Demo mode" banner visible on the page.

---

## 7. Validation plan

- `pnpm db:seed -- --reset` from a known state; clear browser IDB; sign in per role.
- Walk each fixed route from `docs/...-tasks.md`, verifying real values appear and no console errors.
- Verify every `href` from `dashboard-modules.ts` resolves (automated check: compare each href against the route tree).
- Verify writes carry `sessionStore.phcId` (inspect `syncLog`/`sync_operations` payloads).
- `vp fmt --check .`, `pnpm check:sw`, `vp build`, `vp test --run`.
- Add/update a changeset per phase; never weaken the existing auth/sync guardrails.

---

## 8. Decisions needed from user

1. **Broken sub-routes:** create real `maternity/anc`, `maternity/partograph`, `field/outreach` pages, or fold them into tabs on the existing pages? (Affects BR-02/03/04.)
2. **Capacity (DB-03):** configure a real `dailyCapacity` setting, derive from throughput, or show "—" until configured?
3. **Deferred pages (MK-05 announcements, MK-06 billing):** implement full remote+DB now, or add an explicit "Demo — not connected" banner now and defer?
4. **Auth backdoor (ST-14):** remove outright, or keep behind an explicit dev-only flag? (Recommended: remove.)
5. **Order:** which phase/item IDs should I implement first? The user indicated they will choose what to work on.

---

## 9. App-shell spacing & search dropdown (Phase G, 2026-11-18)

The authenticated `<main>` had no horizontal or top padding, so ~33 routes touched the screen edges while ~28 routes patched it locally with inconsistent `p-6` / `px-4` / `py-8` / `mt-6`. Padding is now centralized in `(app)/+layout.svelte` as `<div class="px-4 py-6 md:px-6 print:p-0">` around `{@render children()}`; 18 pages had their redundant local padding removed. Routes that already provide their own spacing (`/settings` nested layout, `/doctor/referral/print`) opt out via `page.route.id`. Full-height and print pages were deliberately left untouched.

Patient search results were clipped because the Autocomplete dropdown was an `absolute` child inside shadcn `Card` (which has `overflow-hidden`) and the app shell's scroll containers. The dropdown now renders through bits-ui `Portal` to `document.body` and uses `position: fixed` anchored to the input's `getBoundingClientRect()`, with flip-up, viewport-height clamping, and scroll/resize listeners that are cleaned up on destroy. Keyboard selection, click-outside, and all consumer snippets are unchanged.

---

## 10. Patient Search → Vitals handoff (Phase H, 2026-11-19)

Nurses previously had to search for the same patient twice: once on Patient Search and again after choosing **Take Vitals Instead**. The action now links to `/nurse/vitals?patient=<local-id>` using the selected patient's local registry ID. Vitals reads `page.url.searchParams`, waits reactively for `patientStore.get(id)` (the Dexie-backed store hydrates asynchronously), then applies the shared selection helper: select the patient, clear the search box and any stale vitals inputs, and advance to step 2. A plain local guard makes this a one-time handoff; manual selection, QR scanning, and all save/triage behavior are unchanged.

The shared app-shell padding opt-out was also corrected to use generated `RouteId` values that include the `(app)` group (`/(app)/settings`, `/(app)/doctor/referral/print`), so those self-padded routes are no longer double-padded. The nurse queue support guide now explains the handoff. No new global store or server state is involved; the URL remains shareable and survives refresh.

---

## 11. Sync encounter dependency repair (Phase I, 2026-11-19)

Nurse Vitals generated a random `encounterId` and wrote it into `vitals_records` and `queue_tickets`, but never created the corresponding `encounters` row. Postgres correctly rejected those pushes with FK `23503`, so clinical observations from affected devices never reached the authoritative database.

Fix, in order:

1. Vitals creates the encounter through `encounterStore.create()` first and reuses the returned id for vitals and any new queue ticket; an existing waiting ticket with no encounter is linked to it.
2. `pushOperations` stably orders `patients` before `encounters` before all dependents, so a batch that legitimately contains both cannot be applied in the wrong order.
3. For legacy pending ops that still reference an absent encounter, the server creates a minimal encounter in the same transaction as the dependent insert/update. The patient is resolved from the existing or incoming payload, the PHC always comes from `event.locals.phcId` (never the client), and the backfill is appended to the durable outbox so other devices receive it through `pullChanges`.
4. Regression tests cover stable ordering and the dependency decision, including the case where an encounter op is already present in the batch.

No AI is involved. The change strictly improves clinical data integrity: no fabricated vitals are introduced, and every backfilled encounter remains tied to the authenticated session's PHC and the supplied patient. Existing permissions are unchanged; only authenticated users with a PHC assignment can push these records.
