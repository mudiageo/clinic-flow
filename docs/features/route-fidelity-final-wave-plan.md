# Route Fidelity — Final Wave (Implementation Plan)

**Status:** Complete (committed and pushed as Wave 3). Last updated: 2026-11-21.
**Companion checklist:** `docs/features/route-fidelity-final-wave-tasks.md`
**Parent:** `docs/features/route-fidelity-cleanup-plan.md` / `docs/features/route-fidelity-cleanup-tasks.md`
**Scope:** NW-08, NW-11, NW-12, NW-13, plus the marketing pitch-stats decision. ST-14 remains explicitly deferred; SY-06 remains a live re-test requested by the user.

---

## 1. Objective

Waves 1 and 2 replaced fabricated admin/superadmin data and no-op actions with durable, auditable behaviour. This final wave removes the remaining interactive stubs from four routes:

- `families/[id]`: "Add Relative" and "Register Newborn" are toast-only stubs.
- `settings/notifications`: "SMS Notifications (Coming Soon)" is a permanently disabled switch.
- `connect`: "Scan QR Code" is a toast-only stub and the paired device name is random.
- `onboarding`: `includeSeedData` is never passed on, the database-progress bar is `Math.random()`, and "Hardware Calibration" is a fake camera with a skip toast.

The rule remains: **no fake data, no no-op controls, no plausible-looking placeholder**. Where a capability genuinely cannot be delivered in this wave, the control is removed and the capability is explicitly recorded as Planned in the tracker.

---

## 2. Permissions (explicitly defined)

Superadmins retain global authority to enable/restrict/lock features platform-wide; local Admins may toggle only for their own PHC and cannot override a Superadmin lock.

| Action                             | Permission / role                                                                 | Scope | Notes                                                                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Register newborn / add relative    | authenticated PHC staff; family views require `view:families` / `manage:families` | PHC   | Follows the offline-first `patientStore.create` pattern used by nurse registration. Records are PHC-scoped and enter the normal sync log. No new server permission. |
| Change own notification preference | signed-in staff, own account only                                                 | Self  | `staff.preferences` via the existing durable preference mechanism. Never accepts another staff member's id.                                                         |
| Pair a device                      | valid, unexpired pairing token issued by an admin                                 | PHC   | Server re-validates the token and derives the PHC from it. Device remains `pending` until an admin approves.                                                        |
| Initialise database / register PHC | setup command                                                                     | Setup | Existing `initDatabase` / `registerPhc` trust boundary is unchanged.                                                                                                |

---

## 3. AI safety & mitigations

**None of these features generate or consume AI output.** Controls that must hold:

1. No fabricated clinical data. Newborn/relative records are created only from fields a human explicitly entered; no sample names, ages, or diagnoses are invented.
2. Deterministic clinic IDs via `patientStore.allocateClinicId(...)` — never `Math.random()`-derived IDs (ST-02 rule).
3. No fake delivery receipts. Pairing shows a real `pending` status; onboarding verification calls real remotes and reports only what they return.
4. Any `<AiDisclaimer>` and human-in-the-loop guardrails on touched pages remain untouched.
5. Demo seed data stays opt-in and clearly labelled if it is ever enabled; it is not silently injected into a real PHC.

---

## 4. Implementation

### 4.1 NW-08 — family actions

`src/routes/(app)/families/[id]/+page.svelte`

- Replace the two toast stubs with dialogs built from existing shadcn-svelte `Dialog` primitives.
- **Register Newborn**: required baby name, sex and date of birth; mother selected from current family members (used as `guardianId`); phone/address/community inherited from the mother; `familyId` set to the current family. Deterministic clinic ID from `patientStore.allocateClinicId('BB')`. Create with `patientStore.create`.
- **Add Relative**: two modes — register a new patient into the family (name/sex/DOB/phone required as appropriate), or link an existing unlinked patient in the same PHC via `patientStore.update(id, { familyId })`. Both are real, reversible-through-normal-UI operations.
- Validation mirrors nurse registration: name required, DOB required for newborn, PHC comes from `family.phcId`/`sessionStore.activePhcId` and is never taken from a form.

### 4.2 NW-11 — notification preference

`src/routes/(app)/settings/notifications/+page.svelte`, `src/lib/state/settings.svelte.ts`

- Enable the SMS switch and write through `authStore.updatePreferences({ ...prefs, smsAlerts })` so the choice is durable via the existing `staff.preferences` sync path.
- Gate with `settingsStore.current.twoWaySmsEnabled`: if the PHC has not enabled two-way SMS, show a clear hint and keep the switch disabled rather than pretending it will work.
- Copy must state plainly that the preference is saved to the profile and that alert delivery depends on PHC SMS being enabled. **Actual staff SMS delivery (staff phone number + urgent-triage event hook) is recorded as Planned in the tracker** — no delivery is claimed.
- Email/in-app toggles keep their existing behaviour.

### 4.3 NW-12 — connect pairing

`src/routes/connect/+page.svelte`

- Wire the existing `QrScanner` component into a dialog. On scan, parse the pairing URL: the QR generated by the admin contains `${origin}/connect?token=...`, so the scanned URL's origin is the server URL (this also fixes the current mismatch where the connect page demands a `serverUrl` query param that the admin never generates).
- Replace auto-pairing-on-load with an explicit pairing confirmation dialog showing an editable device name. The prefilled name is deterministic (a persisted local device id plus a platform label) rather than random. Pairing proceeds only after confirmation, via `validatePairingToken`.
- Show the real returned status (`pending` — waiting for admin approval); do not imply the device is already approved.

### 4.4 NW-13 — onboarding honesty

`src/routes/onboarding/+page.svelte`, `src/lib/remote/setup.remote.ts`

- Replace the fake `Math.random()` percentage with an indeterminate progress indicator bound to the actual `initDatabase` promise. Handle the `{ success: false }` return value as a failure instead of advancing.
- Replace the fake camera calibration step with a real **Setup verification** step that calls `checkServerStatus()` and reports only real results (server reachable, PHC configured), then finishes setup. No animated fake scanner.
- `includeSeedData`: remove the dead checkbox. Server-side, PHC-scoped demo seeding has no authenticated entry point at onboarding (registration is not signed in, and the existing seed writers are a CLI script and a browser-only Dexie seeder). The capability stays **Planned** and is recorded in the tracker; no misleading control remains.

### 4.5 Pitch stats decision

Confirm the marketing `pitch` statistics are acceptable as static marketing copy (a DB-era decision). If accepted, tick the parent-tracker item with a note; no code change.

---

## 5. Data model & migration notes

No new tables or columns are required for this wave. Family membership uses existing `patients.familyId`; preferences use existing `staff.preferences`; device pairing uses existing `devices` + pairing tokens.

---

## 6. Validation (per wave)

- `vp fmt --check` and `vp lint` on changed files.
- Svelte autofixer on every edited `.svelte` component until clean.
- `pnpm check:sw`, `vp build`, `vp test --run --project server`.
- `pnpm run check` — no **new** diagnostics vs the 225 errors / 23 warnings in 64 files baseline.
- Keep `local.db` untracked and untouched.

---

## 7. Documentation & closure

- Update user-facing docs for changed flows in `/support/admin-operations` or the appropriate support page.
- Tick items in this plan's companion tasks file and in `docs/features/route-fidelity-cleanup-tasks.md`; keep ST-14 and SY-06 open with their reasons.
- Add one `minor` changeset.
- Commit and push as a separate wave.
