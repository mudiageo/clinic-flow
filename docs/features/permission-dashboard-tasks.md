# Permission-Composable Dashboard System — Tasks

## Phase 1: Config Files (Backend)
- [x] Create `$lib/config/permissions.ts` — Full permission registry
- [x] Create `$lib/config/role-defaults.ts` — Default sets per role
- [x] Create `$lib/config/dashboard-modules.ts` — Full module registry

## Phase 2: Server-side Permissions
- [x] Update `auth.remote.ts` — Inject active permissions into session data on login (Done via `hooks.server.ts` globally for all endpoints)
- [x] Update `hooks.server.ts` — Route guards check permissions (not just role) using DASHBOARD_MODULES mapping
- [x] Add `grantPermission`, `revokePermission`, `resetToDefaults`, `getStaffPermissions` to `permissions.remote.ts`
- [x] Refactored `requirePermission` across the app to use the new permission registry and server locals

## Phase 3: Client Permission Store
- [x] Create `$lib/state/session.svelte.ts` with `can(key)`, `canAny()`, `canAll()` reactive helpers
- [x] Update `(app)/+layout.svelte` — Populate session store from page data, expose via context

## Phase 4: Universal Dashboard
- [x] Rebuild `/dashboard/+page.svelte` — Dynamic category-grouped tile grid with live stat widgets
- [x] Update login redirects — All roles (email + PIN login) land at `/dashboard`
- [ ] Update sidebar nav — Filter all nav links through `can()` helper

## Phase 5: Permission Editor UI
- [ ] Build `/admin/permissions/+page.svelte`
- [ ] Wire up grant/revoke/reset remotes
- [ ] Add audit log entries per toggle

## Phase 6: New Role-Specific Views
- [ ] Build `/field` — CHEW Field Mode
- [ ] Build `/maternity` — Maternity Ward Board
- [ ] Build `/pharmacy/cold-chain` — Cold Chain Tracker
- [ ] Build `/immunization` — EPI Schedule Tracker

## Phase 7: Changeset & Docs
- [ ] Create `.changeset/permission-composable-dashboard.md`
- [ ] Update in-app Walkthrough guides for each new view
- [ ] Create user-facing support docs for the Permission Editor
