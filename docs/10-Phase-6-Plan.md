# Phase 6: Admin Dashboard

This phase completes the Admin module — upgrading the existing operations dashboard, building the staff management workflow (list, invite, profile), adding an appointments system (new DB table, store, calendar UI), enhancing triage rule configuration, creating clinical reports, and adding PHC settings.

## User Review Required

> [!IMPORTANT]
> This phase introduces a new `appointments` table (both Dexie and Drizzle), a staff invitation flow, and a full calendar UI. Please review the architecture below — in particular the appointment scheduling strategy and the staff invite token mechanism.

## Existing State (What We Already Have)

| Route / File | Status | Notes |
| :--- | :---: | :--- |
| `admin/+layout.svelte` | ✅ | Sidebar with 5 nav groups, mobile BottomNav |
| `admin/+page.svelte` | ⚠️ Partial | KPI cards exist (NumberTicker), triage breakdown, low stock table. **Missing**: visit trend chart, triage pie chart, active staff indicator, sync health widget |
| `admin/patients/+page.svelte` | ⚠️ Partial | Patient list with search + QR card dialog. **Missing**: DataTable with pagination/filter, column sorting, CSV export |
| `admin/staff/[id]/+page.svelte` | ⚠️ Partial | Loads staff member + PermissionEditor. **Missing**: staff info card, permission audit log |
| `admin/reminders/+page.svelte` | ✅ | SMS reminder list + bulk dispatch |
| `admin/sync/+page.svelte` | ✅ | Sync engine dashboard + conflict resolution |
| `admin/triage/+page.svelte` | ⚠️ Partial | Lists rules with toggle. **Missing**: add/edit dialog with Slider, operator Select, pregnancy Switch |
| Remote: `admin.remote.ts` | ⚠️ Partial | `getStaffMember`, `getPhcStaffList`. **Missing**: `inviteStaff`, `updateStaffStatus`, `getPhcSettings`, `updatePhcSettings` |
| Remote: `permissions.remote.ts` | ✅ | Grant, revoke, audit queries all working |

---

## Proposed Changes

### 1. Database & State — Appointments

#### [MODIFY] [db.ts](file:///root/clinic-flow/src/lib/local-db/db.ts)

- Add `LocalAppointment` interface:
  ```ts
  interface LocalAppointment {
    id: string;
    patientId: string;
    phcId: string;
    assignedStaffId: string | null;
    type: 'antenatal' | 'immunization' | 'follow-up' | 'general' | 'lab-follow-up';
    scheduledAt: number;
    durationMinutes: number;
    notes: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
    smsReminderSent: boolean;
    createdAt: number;
    syncStatus: 'synced' | 'pending' | 'conflict';
    updatedAt: number;
  }
  ```
- Register `appointments` Dexie table (version 4): `'id, patientId, assignedStaffId, scheduledAt, status, syncStatus'`

#### [MODIFY] [schema.ts](file:///root/clinic-flow/src/lib/server/db/schema.ts)

- Add `appointments` pgTable with columns matching the interface above.

#### [NEW] [appointments.svelte.ts](file:///root/clinic-flow/src/lib/state/appointments.svelte.ts)

- `AppointmentStore` extending `LocalCollection<LocalAppointment>`.
- Getters: `upcoming` (scheduled, future), `today` (scheduled for today), `forPatient(patientId)`, `forStaff(staffId)`, `forDate(date)`.

#### [MODIFY] [sync.remote.ts](file:///root/clinic-flow/src/routes/sync/sync.remote.ts)

- Register `appointments` in `tableMap` → `schema.appointments`.

---

### 2. Remote Functions — Staff & Settings

#### [MODIFY] [admin.remote.ts](file:///root/clinic-flow/src/lib/remote/admin.remote.ts)

- `inviteStaff` — **form**: accepts email, role, optional permission keys. Generates a one-time invite token, inserts a `staff` row with `status: 'invited'`, and triggers an email with the invite link.
- `updateStaffStatus` — **form**: toggle a staff member active/inactive. Accepts `staffId` and `active: boolean`.
- `getPhcSettings` — **query**: returns PHC profile (name, state, LGA, SMS config, sync interval).
- `updatePhcSettings` — **form**: updates PHC name, state, LGA, SMS provider config, sync poll interval.
- `getStaffPermissionAuditLog(staffId)` — **query**: returns the grant/revoke history for a specific staff member.

---

### 3. UI — Operations Dashboard Enhancement

#### [MODIFY] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/+page.svelte)

Upgrade the existing dashboard (currently 261 lines) with:

- **KPI Row** (keep existing 3 cards, add a 4th): `Completed Consultations` — count of encounters where queue ticket status is `done` today.
- **Visits Per Day Chart** — bar/line chart showing daily visit counts for the last 7 days. Derive from `encounterStore` grouping by `visitDate`.
- **Triage Level Pie Chart** — donut chart showing RED / AMBER / GREEN breakdown of today's queue.
- **Active Staff Indicator** — use staff list from `getPhcStaffList`, show avatars of staff who have recent activity (encounters/vitals logged today).
- **Sync Health Widget** — compact card: last sync time, pending ops count, online/offline badge. Derive from `syncStore`.

> **Component needed**: Install `chart` from shadcn-svelte (`pnpx shadcn-svelte@latest add chart`). This is a wrapper around Chart.js / layerchart. If not available, use a lightweight SVG-based approach.

---

### 4. UI — Patient Registry Enhancement

#### [MODIFY] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/patients/+page.svelte)

Upgrade the existing patient list (currently 193 lines) with:

- Replace the current list with a full `DataTable` component (already installed).
- Columns: Clinic ID, Name, Age (calculated from DOB), Sex, Community, Last Visit, Actions.
- Column sorting, text filter, pagination (20 per page).
- **Export CSV** button — generates and downloads a CSV of all patients.
- **Print** button — opens print dialog of the current view.
- Keep existing QR card dialog functionality.

---

### 5. UI — Staff Management

#### [NEW] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/staff/+page.svelte)

Staff list page:

- `DataTable` — columns: Name, Email, Role, Status (Active/Inactive/Invited), Last Login, Actions.
- Role `Badge` per staff member (color-coded by role).
- "Invite Staff" `Button` → navigates to `/admin/staff/invite`.
- Per-row actions dropdown: View Profile | Toggle Active/Inactive.
- Toggle active/inactive uses `Dialog` confirmation + calls `updateStaffStatus` remote form.

#### [NEW] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/staff/invite/+page.svelte)

Staff invitation form:

- `Input` — email address (required).
- `Select` — role: Nurse | Doctor | Pharmacist | Admin.
- Optional permission overrides: `Switch` toggles per permission key (using the permission taxonomy from Phase 2).
- Submit via `inviteStaff` remote form → success toast + redirect to `/admin/staff`.
- Note: The invited staff member receives an email with a one-time token link. On first login they set their password (handled by existing Better Auth flow).

#### [MODIFY] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/staff/[id]/+page.svelte)

Enhance the existing staff profile (currently 86 lines):

- **Staff Info Card**: avatar, name, email, role badge, join date, status badge.
- **Tabs**: Permissions | Audit Log.
- Permissions tab: existing `PermissionEditor` (already working).
- Audit Log tab: chronological list of permission grants/revokes for this staff member. Uses `getStaffPermissionAuditLog(staffId)`.

---

### 6. UI — Appointments

#### [NEW] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/appointments/+page.svelte)

Appointment calendar page:

- **Calendar View** — use shadcn `Calendar` component in month view as the primary picker.
- **Day Agenda** — clicking a date shows the list of appointments for that day in a side panel or below the calendar.
- Appointment cards: patient name, type badge, time, assigned staff, status badge.
- Color-coded by appointment type (antenatal=purple, immunization=blue, follow-up=amber, general=green, lab-follow-up=red).
- "New Appointment" `Button` → navigates to `/admin/appointments/new`.
- Click any appointment → `Dialog` with full details + actions (Cancel, Mark Complete, Mark No-Show).

#### [NEW] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/appointments/new/+page.svelte)

New appointment form:

- Patient `Autocomplete` — search from `patientStore`.
- Appointment type `Select`: Antenatal | Immunization | Follow-up | General | Lab Follow-up.
- Assigned staff `Select` — populated from `getPhcStaffList`.
- Date `Calendar` picker + time `Select` (30-min slots from 8:00–17:00).
- Duration `Select`: 15 | 30 | 45 | 60 minutes.
- Notes `Textarea`.
- SMS reminder `Switch` — when enabled, a reminder is auto-created for 24h before the appointment.
- Submit → adds to `appointmentStore` (offline-first via Dexie) + creates SMS reminder if toggled.

---

### 7. UI — Triage Rules Enhancement

#### [MODIFY] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/triage/+page.svelte)

Enhance the existing triage rules page (currently 207 lines):

- Keep existing rule list with toggle.
- Add "Add Rule" `Button` → opens `Dialog`.
- **Add/Edit Rule Dialog**:
  - Field `Select`: Temperature | Systolic BP | Diastolic BP | Pulse | SpO2 | Weight.
  - Operator `Select`: ≥ | ≤ | > | <.
  - Threshold value `Input` (number) with contextual unit label (°C, mmHg, bpm, %, kg).
  - Result level `Select`: Red (Immediate) | Amber (Warning) | Green (Stable).
  - "Requires pregnant" `Switch`.
  - Reason template `Input` — e.g. "High fever detected".
- Per-row "Edit" button opens the same dialog pre-filled.
- Changes saved to `triageRuleStore` → syncs to all devices.

---

### 8. UI — Reports

#### [NEW] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/reports/+page.svelte)

Clinical reports page:

- **Date Range Selector** — `Calendar`-based date range picker at the top.
- **Daily Visit Count** — bar chart showing encounters per day within selected range.
- **Triage Level Distribution** — donut/pie chart of RED / AMBER / GREEN across selected period.
- **Top Chief Complaints** — horizontal bar chart of the most common chief complaints (parsed from encounter notes).
- **Pharmacy Usage Summary** — table of most dispensed medications (from `prescriptionStore`).
- **Export** — CSV download of the report data. Print button for the current view.

All data is derived from local Dexie stores (offline-capable): `encounterStore`, `queueStore`, `vitalsStore`, `prescriptionStore`, `pharmacyStore`.

---

### 9. UI — PHC Settings

#### [NEW] [+page.svelte](file:///root/clinic-flow/src/routes/(app)/admin/settings/+page.svelte)

PHC settings page:

- **PHC Profile Card**: editable name, state, LGA fields. Uses `Autocomplete` for Nigerian states/LGA list (same as registration page).
- **SMS Provider Config**: `Input` for Termii API key (masked), test SMS button.
- **Sync Configuration**: `Select` for poll interval (5s | 10s | 30s | 60s).
- **Danger Zone**: `Card` with destructive styling — "Reset Demo Data" button with `Dialog` double-confirm.
- Save via `updatePhcSettings` remote form.

---

### 10. Layout Update

#### [MODIFY] [+layout.svelte](file:///root/clinic-flow/src/routes/(app)/admin/+layout.svelte)

- Add navigation entries for new routes:
  - Staff group: add `/admin/staff` (Staff List) alongside existing `/admin/staff/[id]`.
  - Add `/admin/appointments` to Clinical group.
  - Add `/admin/reports` to Clinical group.
  - Add `/admin/settings` to Configuration group.

---

## New shadcn Components to Install

```bash
# Chart component for dashboard and reports visualizations
pnpx shadcn-svelte@latest add chart

# Date picker for appointment scheduling and report date ranges
pnpx shadcn-svelte@latest add date-picker

# Slider for triage rule thresholds (if useful)
pnpx shadcn-svelte@latest add slider
```

---

## Verification Plan

### Automated Tests

- No new automated tests required at this stage.

### Manual Verification

1. **Dashboard**: Navigate to `/admin`. Verify all 4 KPI cards display correct counts. Verify the visits-per-day chart renders with data from the last 7 days.
2. **Patient Registry**: Navigate to `/admin/patients`. Verify the DataTable is searchable, sortable, and paginated. Export CSV and confirm it downloads correctly.
3. **Staff Flow**: Navigate to `/admin/staff`. Verify staff list renders with role badges. Click "Invite Staff", fill the form, and submit. Verify the invited staff appears in the list with "Invited" status. Navigate to a staff profile, verify permission editor and audit log tabs work.
4. **Appointments**: Navigate to `/admin/appointments`. Click "New Appointment", create an appointment for today. Verify it appears on the calendar. Click it and verify the detail dialog. Mark it complete.
5. **Triage Rules**: Navigate to `/admin/triage`. Click "Add Rule", fill in the dialog, save. Verify the new rule appears in the list. Toggle it off and on. Edit it.
6. **Reports**: Navigate to `/admin/reports`. Select a date range. Verify all charts render. Export CSV.
7. **Settings**: Navigate to `/admin/settings`. Edit the PHC name, save. Verify it persists on reload.
