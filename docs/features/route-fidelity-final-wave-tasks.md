# Route Fidelity — Final Wave (Tasks)

**Plan:** `docs/features/route-fidelity-final-wave-plan.md`
**Parent tracker:** `docs/features/route-fidelity-cleanup-tasks.md`
**Delivery:** one wave; commit and push separately from earlier waves.

## Implementation

- [x] NW-08: replace Add Relative toast stub with a real dialog (register new patient or link existing patient into the family).
- [x] NW-08: replace Register Newborn toast stub with a real dialog creating a patient with `familyId`, mother as `guardianId`, and a deterministic clinic ID.
- [x] NW-11: enable the SMS notification switch and persist it through `authStore.updatePreferences`.
- [x] NW-11: gate on `settingsStore.current.twoWaySmsEnabled` and add honest copy; record staff SMS delivery as Planned.
- [x] NW-12: wire the existing `QrScanner` component and parse the admin pairing URL (`origin` + `token`).
- [x] NW-12: replace the random device name with a deterministic, user-confirmable name; pair only after explicit confirmation.
- [x] NW-13: replace the `Math.random()` progress bar with an indeterminate indicator bound to the real `initDatabase` promise; handle `{ success: false }`.
- [x] NW-13: replace the fake camera calibration step with real setup verification via `checkServerStatus()`.
- [x] NW-13: remove the dead `includeSeedData` checkbox; keep PHC-scoped onboarding demo seeding as Planned.
- [x] Decide and record the marketing `pitch` stats outcome in the parent tracker — accepted as static marketing copy (DB-era decision), no code change.
- [x] Update user-facing docs for the changed flows (`/support/admin-operations`).
- [x] Validation: changed-file `vp fmt --check`, `vp lint`, Svelte autofixer, `pnpm check:sw`, `vp build`, `vp test --run --project server`, `pnpm run check` (no new diagnostics vs 225 errors / 23 warnings in 64 files).
- [x] Add a `minor` changeset; update parent tracker; commit and push.

## Deferred / unchanged

- [ ] ST-14 stays unchecked/deferred (universal offline `0000` PIN preserved).
- [ ] SY-06 stays open: automated validation passes, but a live stale-op re-test was requested.
- [ ] Staff SMS alert delivery (phone number + urgent-triage event hook) stays Planned.
- [ ] PHC-scoped demo seeding at onboarding stays Planned.
- [ ] `/download` distribution remains Planned; no local repo-download expectation.
- [ ] `local.db` remains untracked and untouched.
