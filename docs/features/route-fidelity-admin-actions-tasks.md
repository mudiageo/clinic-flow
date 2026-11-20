# Route Fidelity — Admin Actions & Provider Adapters (Tasks)

**Plan:** `docs/features/route-fidelity-admin-actions-plan.md`
**Parent tracker:** `docs/features/route-fidelity-cleanup-tasks.md`
**Delivery:** two waves; commit and push each wave separately.

## Wave 1 — data honesty + existing wiring (no new DB table)

- [x] Fix `view:sync_health` missing from `PermissionKey` union.
- [x] MK-07 / NW-15: replace static releases + history with `getReleases()`; wire download links; remove video placeholder.
- [x] MK-07 / NW-15: add `github-provider` adapter and publish command with confirmation + audit.
- [x] MK-09: add PHC-scoped sync-health query over durable `sync_operations` / `devices` tables.
- [x] MK-09: replace fake "Device Sync Log" with real device sync history; preserve conflict handling.
- [x] NW-05: expose `registerPendingDevice` through a validated remote command/form.
- [x] NW-05: wire "Add Manually" device dialog/button to the remote and refresh device list.
- [x] Add focused tests for provider mode selection and sync-health aggregation.
- [x] Update user-facing docs for releases, sync health and devices (`/support/admin-operations`).
- [x] Validation: changed-file `vp fmt --check`, Svelte autofixer, `pnpm check:sw`, `vp build`, `vp test --run --project server`, `pnpm run check` (226 errors / 23 warnings; no new diagnostics).
- [x] Add Wave 1 changeset; update parent tracker; commit and push.

## Wave 2 — config tables, adapters, referrals

- [x] MK-10: add PHC-scoped `dhis2_config` table in PG + SQLite dialects and migrations.
- [x] MK-10: add `getDhis2Config` / `updateDhis2Config` remotes; wire page UIDs; preserve clinical-integrity notice.
- [x] NW-01: add durable `nhis_claims` table in PG + SQLite dialects and migrations.
- [x] NW-01: add `nhis-provider` adapter + submit remote; manual queue by default, private endpoint override opt-in; replace simulated submit and hardcoded status.
- [x] HF-01: add read-only advisory HFR `facility-registry-provider.ts` with live/unconfigured/unavailable states and TTL cache; no console mode.
- [x] HF-02: wire advisory HFR referral destination directory; clinician confirms the target.
- [x] HF-03: wire advisory HFR onboarding validation and admin data-quality review; never auto-overwrite.
- [x] NW-03: add `sms-provider` adapter + SMS test command; replace simulated test toast.
- [x] NW-06: add superadmin-scoped reset-password and deactivate-user commands with confirmation + audit.
- [x] NW-07: add `phcs.active` column (both dialects + migrations).
- [x] NW-07: add PHC-scoped sync-status query and deactivate/reset-data commands; remove literal "Healthy".
- [x] NW-14: replace `dispatchReminders` stub with adapter-backed dispatch, durable status and permission check.
- [x] NW-09: wire doctor referral tab to the working referral flow.
- [x] NW-10: replace simulated referral SMS with adapter-backed remote and session-derived signature.
- [x] Add focused tests for adapter mode selection and referral/NHIS server logic.
- [x] Update user-facing docs for claims, SMS, referrals and superadmin actions.
- [x] Validation: full checks as in Wave 1; no increase over the post-Wave-1 baseline (226 errors / 23 warnings).
- [x] Add Wave 2 changeset; update parent tracker and main tracker; commit and push.

## Deferred / unchanged

- [ ] ST-14 stays unchecked/deferred.
- [ ] Universal offline `0000` PIN preserved.
- [ ] `/download` distribution remains Planned; no local repo-download expectation.
- [ ] `local.db` remains untracked and untouched.
