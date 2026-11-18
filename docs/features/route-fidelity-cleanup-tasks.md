# Route Fidelity Cleanup — Tasks

> Companion to `docs/features/route-fidelity-cleanup-plan.md`. Tick `[x]` as each item is completed. Issue IDs map 1:1 to the plan.

## Phase A — Navigation integrity (P0)

- [x] **BR-01** Create `(app)/families/+page.svelte` list (from `familyStore`); fix `familyStore` first (ST-06)
- [x] **BR-02** Resolve `/maternity/anc` (re-pointed to the real ANC queue tab)
- [x] **BR-03** Resolve `/maternity/partograph` (re-pointed to the maternity workspace)
- [x] **BR-04** Create `(app)/field/outreach/+page.svelte` backed by outreach data
- [ ] **BR-05** Create `(app)/superadmin/phcs/+page.svelte` list from `getPhcList()`
- [ ] **BR-06** Add `support/nurse-queue` doc page or repoint link
- [ ] **BR-07** Add `support/pharmacy` doc page or repoint link
- [ ] Verify all 44 `dashboard-modules.ts` hrefs resolve to a route directory

## Phase B — Dashboard data (P0)

- [ ] **DB-01** Add `queueStore.completedToday` derived value; replace hardcoded `24`
- [ ] **DB-02** Add `syncStore.syncHealth` derived value; replace hardcoded `89%`
- [ ] **DB-03** Define capacity model; replace hardcoded `45%` / `<Progress value={45}>`
- [ ] **DB-04** Replace bad low-stock filter with `pharmacyStore.lowStock`
- [ ] **DB-05** Add `reminderStore.overdueReminders`; fix "overdue" label
- [ ] Remove all `: any` casts from dashboard widget code

## Phase C — Stub IDs & store wiring (P1)

- [ ] **ST-01** `pharmacy/inventory/new`: `phcId` → `sessionStore.phcId`
- [ ] **ST-02** `nurse/register`: deterministic clinic ID, session PHC, real ticket number
- [ ] **ST-03** `nurse/search`: `phcId` → `sessionStore.phcId`
- [ ] **ST-04** `nurse/vitals`: `phcId` → `sessionStore.phcId`, real ticket number
- [x] **ST-05** `patients/[id]` + child panels: `findById()` → `get()`
- [x] **ST-06** `families.svelte.ts`: proper `FamilyStore extends LocalCollection`
- [x] **ST-07** `families/[id]`: wire `familyStore`, remove stale comment/unused `queueStore`
- [x] **ST-08** Replace `javascript:history.back()` with a safe history handler (patients + families)
- [ ] **ST-09** Add `email` to `getAllStaffUsers()` select
- [ ] **ST-10** Align reminder `type` union with select options
- [ ] **ST-11** `pharmacy/+page`: real `requestedByStaffId` + configured reorder default
- [ ] **ST-12** Remove fake identity fallbacks in `superadmin/settings`
- [ ] **ST-13** Remove/realize mDNS card in `admin/server-status`
- [ ] **ST-14** Remove `pin === '0000'` auth backdoor
- [ ] **ST-15** Route `admin/sync` through `syncStore` instead of direct Dexie

## Phase D — Mocked clinical modules (P0/P1)

- [ ] **MK-01** `maternity`: remove fake admissions; wire `pregnancyStore`/`patientStore`; wire Admit/Vitals actions
- [ ] **MK-02** `immunization`: remove fake roster; bind search; wire Record action
- [ ] **MK-03** `pharmacy/cold-chain`: remove fake temps/vaccines; add cold-chain store/remote; wire Log Temperature
- [ ] **NW-08** `families/[id]`: implement Register Newborn + Add Relative
- [ ] **NW-09** `doctor/consult`: wire referral-tab Generate Referral; fix mobile pane placeholder
- [ ] **NW-10** `doctor/referral/print`: real SMS remote + session-based signature
- [ ] Preserve `<AiDisclaimer>` and human-in-the-loop guardrails in all AI-touching pages

## Phase E — Mocked superadmin/admin pages (P0/P1)

- [ ] **MK-04** `superadmin/system`: use `getServerStatus`; remove Math.random + fake error log
- [ ] **MK-05** `superadmin/billing`: implement remote/DB or add explicit "Demo" banner
- [x] **MK-06** `superadmin/announcements`: implement broadcast remote/DB or add explicit "Demo" banner
- [ ] **MK-07** `superadmin/releases`: use `getReleases`; wire Publish; remove video placeholder
- [ ] **MK-08** `epidemiology.remote.ts`: replace `Math.random()` case data with real aggregation; add demo disclaimer until fixed
- [ ] **MK-09** `admin/sync-health`: derive device log from sync state
- [ ] **MK-10** `admin/reports/dhis2`: configurable UIDs with documented defaults
- [ ] **NW-01** `admin/nhis-claims`: real submit remote; real claim status
- [ ] **NW-02** `admin/outbreak-radar`: real SMS remote; fix `FileSignature` import; remove false "Uses Termii" claim
- [ ] **NW-03** `admin/settings`: real SMS-test remote
- [ ] **NW-04** `admin/audit`: implement `getAuditLog`; wire data + Filter button
- [ ] **NW-05** `admin/devices`: wire Add Manually
- [ ] **NW-06** `superadmin/users`: reset-password + deactivate remotes
- [ ] **NW-07** `superadmin/phcs/[id]`: sync status + deactivate + reset-data remotes
- [ ] **NW-14** `admin/reminders`: replace `dispatchReminders` stub with real SMS dispatch
- [ ] **NW-15** `superadmin/releases`: Publish + ExternalLink buttons

## Phase F — Auth/onboarding/marketing polish (P1/P2)

- [ ] **NW-12** `connect`: implement or hide QR scanner; real device name
- [ ] **NW-13** `onboarding`: wire `includeSeedData`; real progress; remove/realize fake calibration
- [ ] **NW-11** `settings/notifications`: resolve "SMS Notifications (Coming Soon)"
- [ ] Confirm marketing `pitch` stats are acceptable as static copy (DB-era decision)

## Docs & release hygiene

- [ ] Create/update user-facing docs (Walkthrough/tooltips/guides) for changed flows
- [ ] Add a changeset per phase
- [ ] Update the main feature tracker if applicable (`docs/AI-Features-Implementation-Plan.md`)
- [ ] Final validation: `vp fmt --check .`, `pnpm check:sw`, `vp build`, `vp test --run`
