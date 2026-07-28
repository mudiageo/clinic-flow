## Phase 6: Admin Dashboard — Tasks

### 1. Database & Stores — Appointments
- `[x]` Add `LocalAppointment` interface to Dexie schema (`src/lib/local-db/db.ts`).
- `[x]` Register `appointments` Dexie table (version 4).
- `[x]` Add `appointments` pgTable to Drizzle schema (`src/lib/server/db/schema.ts`).
- `[x]` Create `AppointmentStore` in `src/lib/state/appointments.svelte.ts`.
- `[x]` Register `appointments` in sync remote (`src/routes/sync/sync.remote.ts`).

### 2. Remote Functions — Staff & Settings
- `[x]` Add `inviteStaff` form action to `admin.remote.ts`.
- `[x]` Add `updateStaffStatus` form action to `admin.remote.ts`.
- `[x]` Add `getPhcSettings` query to `admin.remote.ts`.
- `[x]` Add `updatePhcSettings` form action to `admin.remote.ts`.
- `[x]` Add `getStaffPermissionAuditLog(staffId)` query to `admin.remote.ts`.

### 3. Install New shadcn Components
- `[ ]` Install `chart` component (`pnpx shadcn-svelte@latest add chart`).
- `[ ]` Install `date-picker` component (`pnpx shadcn-svelte@latest add date-picker`).
- `[ ]` Install `slider` component (`pnpx shadcn-svelte@latest add slider`).

### 4. Operations Dashboard Enhancement (`/admin`)
- `[x]` Add 4th KPI card: "Completed Consultations" (encounters done today).
- `[x]` Add Visits Per Day bar chart (last 7 days from `encounterStore`).
- `[x]` Add Triage Level donut chart (today's RED/AMBER/GREEN breakdown).
- `[x]` Add Active Staff indicator (avatars of staff with today's activity).
- `[x]` Add Sync Health widget (last sync, pending ops, online/offline badge).

### 5. Patient Registry Enhancement (`/admin/patients`)
- `[x]` Replace current list with full `DataTable` (sortable, filterable, paginated).
- `[x]` Columns: Clinic ID, Name, Age, Sex, Community, Last Visit, Actions.
- `[x]` Add Export CSV button.
- `[x]` Add Print button.

### 6. Staff Management (`/admin/staff`)
- `[x]` Build Staff List page with `DataTable` (name, email, role badge, status, last login).
- `[x]` Add per-row toggle active/inactive with confirmation `Dialog`.
- `[x]` Build Invite Staff page (`/admin/staff/invite`) with email, role Select, optional permission Switches.
- `[x]` Enhance Staff Profile (`/admin/staff/[id]`) — staff info card, Tabs (Permissions | Audit Log).

### 7. Appointments (`/admin/appointments`)
- `[x]` Build Appointment Calendar page with month Calendar + day agenda panel.
- `[x]` Implement color-coded appointment type badges.
- `[x]` Add appointment detail `Dialog` (Cancel, Complete, No-Show actions).
- `[x]` Build New Appointment form (`/admin/appointments/new`) with patient Autocomplete, type/staff/date/time Selects, duration, notes, SMS toggle.

### 8. Triage Rules Enhancement (`/admin/triage`)
- `[x]` Add "Add Rule" button + `Dialog` form (field, operator, threshold, result level, pregnancy Switch, reason).
- `[x]` Add per-row "Edit" button opening pre-filled dialog.
- `[x]` Ensure changes sync to all devices via `triageRuleStore`.

### 9. Reports (`/admin/reports`)
- `[x]` Build Reports page with date range selector.
- `[x]` Add Daily Visit Count bar chart.
- `[x]` Add Triage Level Distribution pie/donut chart.
- `[x]` Add Top Chief Complaints horizontal bar chart.
- `[x]` Add Pharmacy Usage Summary table.
- `[x]` Add Export CSV + Print buttons.

### 10. PHC Settings (`/admin/settings`)
- `[x]` Build Settings page with PHC profile fields (name, state, LGA Autocomplete).
- `[x]` Add SMS provider config (Termii API key input + test button).
- `[x]` Add Sync poll interval Select.
- `[x]` Add Danger Zone: Reset Demo Data with double-confirm Dialog.

### 11. Layout Navigation Update
- `[x]` Add `/admin/staff` (Staff List) to sidebar Staff group.
- `[x]` Add `/admin/appointments` to sidebar Clinical group.
- `[x]` Add `/admin/reports` to sidebar Clinical group.
- `[x]` Add `/admin/settings` to sidebar Configuration group.
