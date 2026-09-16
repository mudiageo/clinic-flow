# Permission-Composable Dashboard System — Tasks

## Phase 1-7: Core Permissions & Routing
- [x] Backend Configs, Store, Role Defaults
- [x] Permission Editor UI
- [x] Role-Specific Views (/field, /maternity, /pharmacy/cold-chain, /immunization)
- [x] Initial Changeset & Docs

## Phase 8: Universal App Shell (Navigation Refactor)
- [x] Move `<AppSidebar>` and `<BottomNav>` to `src/routes/(app)/+layout.svelte`
- [x] Dynamically populate Sidebar/BottomNav using `DASHBOARD_MODULES` and `sessionStore.can()`
- [x] Delete redundant nested layouts (e.g., `/nurse/+layout.svelte`, `/admin/+layout.svelte`)

## Phase 9: Interactive Data Dashboard (The Missing UI)
- [x] Add "Action Buttons" to tiles (e.g., "Book Now", "Send SMS", "Request Restock")
- [x] Inject Live Queue Widget (table/list) directly into the dashboard for users with queue permissions
- [x] Inject Admin Analytics Widgets (Charts, Total Patients, Completed Consultations) for OIC/Admins
- [x] Inject Outbreak/System Alerts Widget directly on the dashboard
- [x] Build proper empty states and skeleton loaders for the new dashboard widgets
