# ClinicFlow — Feature Documentation & Implementation Tracker

> **Rules**: Commit after every phase. Use shadcn-svelte & more-shadcn-svelte components generously. Tauri Mobile v2 for native mobile. Remote functions (`form`, `query`, `query.live`, `command`) for all client-server communication.

**Legend**: `[ ]` Not started · `[/]` In progress · `[x]` Done

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1 — Sidebar & Role Layouts](#phase-1--sidebar--role-layouts)
3. [Phase 2 — Permissions System](#phase-2--permissions-system)
4. [Phase 3 — Nurse Dashboard](#phase-3--nurse-dashboard)
5. [Phase 4 — Doctor Dashboard & Lab](#phase-4--doctor-dashboard--lab)
6. [Phase 5 — Pharmacy Dashboard](#phase-5--pharmacy-dashboard)
7. [Phase 6 — Admin Dashboard](#phase-6--admin-dashboard)
8. [Phase 7 — Superadmin Dashboard](#phase-7--superadmin-dashboard)
9. [Phase 8 — Settings (All Roles)](#phase-8--settings-all-roles)
10. [Phase 9 — Marketing & Onboarding](#phase-9--marketing--onboarding)
11. [Phase 10 — Nigeria PHC Innovations](#phase-10--nigeria-phc-innovations)
12. [Phase 11 — Tauri Mobile v2](#phase-11--tauri-mobile-v2)
13. [Database Schema Extensions](#database-schema-extensions)
14. [Component Library Reference](#component-library-reference)
15. [Queue Architecture](#queue-architecture)

---

## Architecture Overview

### Tech Stack

- **Framework**: SvelteKit (Svelte 5 runes)
- **Styling**: Vanilla CSS + shadcn-svelte + more-shadcn-svelte
- **Database (Server)**: PostgreSQL via Drizzle ORM
- **Database (Client)**: Dexie (IndexedDB) — offline-first local store
- **Auth**: Better Auth
- **Client-Server**: SvelteKit Remote Functions (`query`, `form`, `command`, `query.live`)
- **Desktop**: Tauri v2
- **Mobile**: Tauri Mobile v2 (Android + iOS)
- **SMS**: Termii (primary) / Africa's Talking (fallback)

### Routing Structure

```
src/routes/
├── (marketing)/              ← Public marketing site
│   ├── +layout.svelte
│   ├── +page.svelte          ← Landing page
│   ├── register/             ← PHC registration
│   └── download/             ← Download portal
├── (app)/                    ← Authenticated app shell
│   ├── +layout.svelte        ← Auth gate only
│   ├── nurse/
│   │   ├── +layout.svelte    ← Nurse sidebar
│   │   └── ...pages
│   ├── doctor/
│   │   ├── +layout.svelte    ← Doctor sidebar
│   │   └── ...pages
│   ├── pharmacy/
│   │   ├── +layout.svelte    ← Pharmacy sidebar
│   │   └── ...pages
│   ├── admin/
│   │   ├── +layout.svelte    ← Admin sidebar
│   │   └── ...pages
│   └── superadmin/
│       ├── +layout.svelte    ← Superadmin sidebar
│       └── ...pages
├── login/
└── api/
```

### Queue Architecture (Offline-First)

| Scenario                   | Mechanism                           | Latency      |
| -------------------------- | ----------------------------------- | ------------ |
| 1 device, no internet      | Dexie `liveQuery` → Svelte `$state` | < 10ms       |
| Multiple devices, LAN only | Push/Pull sync (5s poll for queue)  | ~5s          |
| Multiple devices, internet | SSE `query.live` (cloud overlay)    | Near-instant |
| 2 windows, same machine    | `BroadcastChannel`                  | Instant      |

> `query.live` is the **online bonus** for remote monitoring only. The clinic queue works completely offline via Dexie.

---

## Phase 1 — Sidebar & Role Layouts

### Goals

- Remove the single monolithic layout with `{#if role}` guards
- Give each role its own `+layout.svelte` with a tailored sidebar
- Fix the broken `window.location.pathname` active link detection → use `page.url.pathname`
- Add mobile bottom navigation (Dock / BottomNav)

### Tasks

#### App Shell Layout (`(app)/+layout.svelte`)

- [x] Auth session check (`getCurrentSession`)
- [x] Redirect to `/login` if unauthenticated
- [x] Remove all nav items — delegate to role layouts
- [x] Render `{@render children()}` inside `SidebarProvider` shell only
- [x] Pass `sessionData` down via Svelte context (not re-fetching in each child layout)

#### Shared `AppSidebar` Component (`$lib/components/AppSidebar.svelte`)

- [x] Accept `navGroups: NavGroup[]` prop
- [x] Accept `role: string` and `phcName?: string` prop
- [x] Fix active link: `import { page } from '$app/state'` → `page.url.pathname`
- [x] `SidebarMenuBadge` for queue counts and alert counts
- [x] Collapsed icon mode with Tooltip labels
- [x] User info footer (avatar, name, role)
- [x] Sync indicator in footer
- [x] Log out button (uses `signOutAction` remote form)
- [x] Theme toggle in header
- [ ] Responsive: hide sidebar on mobile, show BottomNav instead

#### Mobile Bottom Navigation

- [x] `Dock` or `BottomNav` component (more-shadcn-svelte)
- [x] Show only on `max-width: 768px`
- [x] Role-specific bottom tabs (max 5 items)
- [x] Active tab indicator

#### Nurse Layout (`nurse/+layout.svelte`)

- [x] Sidebar with: Queue Board, Register Patient, Vitals & Triage, Search Patient, Reminders, Settings
- [x] Badge on Queue Board showing waiting count
- [x] Bottom nav: Queue | Register | Vitals | Search | More

#### Doctor Layout (`doctor/+layout.svelte`)

- [x] Sidebar with: Consultation Queue, Patients, Lab Requests, Settings
- [x] Badge on Consultation Queue showing pending count
- [x] Bottom nav: Queue | Patients | Lab | Settings

#### Pharmacy Layout (`pharmacy/+layout.svelte`)

- [x] Sidebar with: Dispense Queue, Inventory, Restock, Reports, Settings
- [ ] Badge on Dispense Queue showing pending prescriptions
- [ ] Alert badge on Inventory for low stock items

#### Admin Layout (`admin/+layout.svelte`)

- [x] Sidebar with: Dashboard, Patients, Staff, Appointments, Triage Rules, Reports, Settings
- [x] Access to all clinical views (nurse + doctor + pharmacy visible to admin)

#### Superadmin Layout (`superadmin/+layout.svelte`)

- [x] Sidebar with: PHC List, Users, Permissions Audit, Releases, System Health, Billing, Announcements, Settings

#### Receptionist Role

- [ ] Maps to nurse layout (same routes, same sidebar)
- [ ] Minor restriction: cannot record vitals (enforced via permission check)

---

## Phase 2 — Permissions System

### Goals

- [x] Granular per-staff permissions on top of roles
- [x] Admin can grant/revoke permissions for any staff in their PHC
- [x] Superadmin can audit permissions across all PHCs
- [x] Time-bound permissions (optional expiry date)

### DB Schema

#### `permissions` Table

```sql
id          UUID PRIMARY KEY
staff_id    UUID → staff.id
phc_id      UUID → phcs.id
permission  VARCHAR(80)   -- e.g. 'view:medical_records'
granted_by  UUID → staff.id (nullable)
granted_at  TIMESTAMP
expires_at  TIMESTAMP (nullable)
revoked     BOOLEAN DEFAULT false
```

#### Permission Taxonomy

| Permission Key         | Description                   | Default Roles              |
| ---------------------- | ----------------------------- | -------------------------- |
| `view:patient_records` | Read patient demographics     | nurse, doctor, admin       |
| `view:medical_records` | Read doctor notes & diagnoses | doctor, admin              |
| `create:encounter`     | Open a new encounter          | nurse, doctor              |
| `record:vitals`        | Record vitals & triage        | nurse, doctor              |
| `prescribe:medication` | Create prescriptions          | doctor                     |
| `dispense:medication`  | Dispense prescriptions        | pharmacy                   |
| `manage:inventory`     | Edit pharmacy stock           | pharmacy, admin            |
| `manage:staff`         | Invite/deactivate staff       | admin                      |
| `manage:triage_rules`  | Edit triage thresholds        | admin                      |
| `view:reports`         | Access analytics              | admin                      |
| `request:lab`          | Create lab requests           | doctor, nurse (if granted) |
| `manage:phc`           | Edit PHC profile & settings   | admin                      |
| `view:appointments`    | View appointment calendar     | nurse, doctor, admin       |
| `manage:appointments`  | Create/edit appointments      | nurse, admin               |
| `superadmin:all`       | Full platform access          | superadmin only            |

### Remote Functions (`$lib/remote/permissions.remote.ts`)

- [x] `getStaffPermissions(staffId)` — query: list permissions for a staff member
- [x] `getPhcPermissions(phcId)` — query: all permissions in a PHC
- [x] `grantPermission` — form: grant a permission (admin only)
- [x] `revokePermission` — form: revoke a permission (admin only)
- [x] `checkPermission(staffId, permission)` — query: boolean check

### Server Utility (`$lib/server/permissions.ts`)

- [x] `hasPermission(staffId, permission): Promise<boolean>`
- [x] `requirePermission(staffId, permission): Promise<void>` — throws 403
- [x] `getRoleDefaults(role): string[]` — default permissions by role

### UI — Admin Staff Management

- [x] Permission editor component (`permission-editor.svelte`)
- [x] `Switch` toggles per permission group
- [x] `DatePicker` for optional expiry date
- [x] `Badge` showing status: Active / Expires Soon / Revoked
- [x] `Dialog` confirm on revoke

### UI — Superadmin Permissions Audit

- [x] `DataTable` of all permissions across platform
- [x] Filter by PHC, role, permission key
- [x] Export CSV of audit log

---

## Phase 3 — Nurse Dashboard

### Routes

| Route                         | Description                          |
| ----------------------------- | ------------------------------------ |
| `/nurse`                      | Queue board                          |
| `/nurse/register`             | Patient registration wizard          |
| `/nurse/vitals`               | Vitals & triage                      |
| `/nurse/vitals/[encounterId]` | Record vitals for specific encounter |
| `/nurse/search`               | Quick patient search                 |
| `/nurse/reminders`            | SMS reminder list                    |
| `/nurse/reminders/new`        | Schedule new reminder                |
| `/nurse/settings`             | Account settings                     |

### Queue Board (`/nurse`)

- [x] Basic queue board exists
- [x] Live updates via Dexie `liveQuery` (already wired via `QueueStore`)
- [ ] Reduce sync poll for `queueTickets` to 5s (vs 30s for other entities)
- [x] `BroadcastChannel` for same-machine multi-window sync
- [x] Triage level color coding (red/amber/green rows)
- [x] "Call Next" button with `SidebarMenuBadge` count
- [x] Ticket card: patient name, ticket #, triage level badge, wait time
- [x] Mark as No-Show button
- [x] Mark as Done button
- [x] Empty state illustration when queue is empty

### Patient Registration Wizard (`/nurse/register`)

- [x] Basic form exists
- [x] Multi-step `Stepper` (more-shadcn-svelte):
  - Step 1: Demographics (name, DOB, sex, community)
  - Step 2: Contact (phone, address, next of kin)
  - Step 3: Family Link (new family / link to existing)
  - Step 4: Confirm + Print QR Card
- [x] `PhoneInput` (more-shadcn-svelte) — phone with +234 default
- [x] `DatePicker` or `DateStrip` — date of birth
- [x] `ChoiceBox` (more-shadcn-svelte) — sex selection (large tap targets)
- [x] `Autocomplete` — Nigerian state/LGA list
- [x] Estimated age input (when DOB unknown)
- [x] Pregnancy toggle (affects triage rules)
- [x] QR code generation on completion
- [x] Print QR card (patient ID card) — offline printable
- [x] Auto-add to queue after registration toggle

### Vitals & Triage (`/nurse/vitals`)

- [x] Basic vitals form exists
- [x] `Stepper`: Select Patient → Enter Vitals → AI Triage → Confirm
- [x] QR scanner for patient lookup (Tauri camera plugin)
- [x] Manual patient search as fallback (`Autocomplete`)
- [x] Vitals fields: Temperature, BP (systolic/diastolic), Pulse, Weight, SpO2
- [x] AI triage calculation (local rules from `triageRules` store)
- [x] Triage level badge shown immediately on calculation
- [x] Chief complaint input (text + voice button)
- [x] `AudioWave` animation during voice recording
- [x] Nigerian language selector for voice (English / Pidgin / Hausa / Yoruba / Igbo)
- [x] Submit → auto-add patient to consultation queue with triage level

### Patient Search (`/nurse/search`)

- [ ] `Autocomplete` / `Input` — search by name, phone, clinic ID
- [ ] Dexie-powered instant local search (offline)
- [ ] Patient card result: name, clinic ID, DOB, last visit
- [ ] Quick actions: View Profile | Add to Queue | Record Vitals
- [ ] QR scanner shortcut

### SMS Reminders (`/nurse/reminders`)

- [ ] List of scheduled/sent/failed reminders
- [ ] Filter by type (immunization / antenatal / follow-up)
- [ ] `Badge` status per reminder
- [ ] `Calendar` view toggle (list vs calendar)

### New Reminder (`/nurse/reminders/new`)

- [ ] Patient search / autocomplete
- [ ] `Select` — reminder type
- [ ] `DatePicker` — due date
- [ ] `PhoneInput` — recipient phone (auto-populated from patient)
- [ ] Message preview
- [ ] Submit via `form` remote function

---

## Phase 4 — Doctor Dashboard & Lab

### Routes

| Route                           | Description          |
| ------------------------------- | -------------------- |
| `/doctor`                       | Consultation queue   |
| `/doctor/consult/[encounterId]` | Active consultation  |
| `/doctor/patients`              | Patient search       |
| `/doctor/patients/[patientId]`  | Full patient profile |
| `/doctor/lab`                   | Lab requests list    |
| `/doctor/lab/new`               | Create lab request   |
| `/doctor/lab/[requestId]`       | View lab result      |
| `/doctor/settings`              | Account settings     |

### Consultation Queue (`/doctor`)

- [x] Basic page exists
- [x] Live queue from `QueueStore` (Dexie) — status `called` | `in_progress`
- [x] "Start Consultation" button → navigates to `/doctor/consult/[encounterId]`
- [x] Patient triage level badge visible on each card
- [x] Estimated wait time per patient

### Consultation View (`/doctor/consult/[encounterId]`)

- [x] Partial implementation exists
- [x] Split panel layout: Patient Summary (left) | Consultation (right)
- [x] Patient summary: demographics, vitals recorded today, past 3 encounters
- [x] `Tabs`: Notes | Prescriptions | Lab | Referral
- [x] Doctor notes `Textarea` with voice input button
- [x] Pidgin/English voice transcription → structured notes (AI route)
- [x] `Stepper`: Review Vitals → Write Notes → Prescribe → Lab → Referral → Complete
- [x] Prescription form: medication `Autocomplete` (from inventory), quantity, dosage
- [x] Lab request form (see below)
- [x] Referral letter generator (structured text → printable PDF)
- [x] "Complete Consultation" → marks encounter done, moves ticket to `done`

### Patient Profile (`/doctor/patients/[patientId]`)

- [ ] Demographics section
- [ ] `Tabs`: Encounters | Vitals | Prescriptions | Lab Results | Reminders | Appointments
- [ ] Encounter history timeline (most recent first)
- [ ] Vitals trend: `Sparkline` charts for BP, Temperature, Weight over time
- [ ] Prescription history: dispensed / pending
- [ ] Family group link (show household members)

### Lab Module

#### Lab Requests List (`/doctor/lab`)

- [ ] `DataTable`: patient name, test name, urgency, status, requested at
- [ ] Filter by status: Pending | Processing | Completed
- [ ] Badge per status
- [ ] Quick link to enter result (if lab staff / admin)

#### New Lab Request (`/doctor/lab/new`)

- [ ] Patient search / autocomplete
- [ ] `Select` — test type:
  - Malaria RDT
  - HIV Rapid Test
  - Full Blood Count (FBC)
  - Pregnancy Test
  - Urinalysis
  - Blood Group & Genotype
  - Widal Test
  - Random Blood Sugar
  - Other (free text)
- [ ] `ChoiceBox` — urgency: STAT | Urgent | Routine
- [ ] `Textarea` — clinical notes for lab
- [ ] Submit via `form` remote function

#### Lab Result Entry (`/doctor/lab/[requestId]`)

- [ ] Display: patient, test type, urgency, requesting doctor
- [ ] Result `Textarea` + structured fields per test type
- [ ] "Mark as Completed" → notifies requesting doctor (via `query.live` or sync)
- [ ] Result visible on patient profile `Lab Results` tab

#### DB: `lab_requests` Table

- [ ] Schema migration created
- [ ] Fields: id, encounterId, patientId, phcId, requestedByStaffId, testName, testType, urgency, notes, status, result, resultEnteredByStaffId, resultEnteredAt, createdAt

---

## Phase 5 — Pharmacy Dashboard

### Routes

| Route                      | Description                        |
| -------------------------- | ---------------------------------- |
| `/pharmacy`                | Inventory overview                 |
| `/pharmacy/dispense`       | Active prescription dispense queue |
| `/pharmacy/inventory/[id]` | Edit inventory item                |
| `/pharmacy/inventory/new`  | Add new item                       |
| `/pharmacy/restock`        | Restock requests                   |
| `/pharmacy/reports`        | Usage trends & expiry alerts       |
| `/pharmacy/settings`       | Account settings                   |

### Inventory Overview (`/pharmacy`)

- [x] Basic page exists
- [x] `DataTable` — sortable by name, stock level, category
- [x] Stock level `Badge`: In Stock (green) | Low Stock (amber) | Out of Stock (red)
- [x] `Progress` bar showing stock vs threshold
- [x] `Alert` banner for critical low stock items
- [x] Quick restock button per row

### Dispense Queue (`/pharmacy/dispense`)

- [x] Live list of pending prescriptions from `QueueStore`-equivalent
- [x] Group by patient encounter
- [x] "Dispense" button per prescription
- [x] `Dialog` confirm before dispensing: shows medication, quantity, patient
- [x] After dispense: decrements stock (delta sync operation), marks `dispensed=true`
- [x] Prescription marked dispensed updates in real-time via Dexie

### Inventory Item Edit (`/pharmacy/inventory/[id]`)

- [x] Edit: name, category, unit, current stock, low stock threshold, critical flag
- [x] `DateStrip` — expiry date tracking (future)
- [x] Stock adjustment: +/- manual correction with reason

### Add Item (`/pharmacy/inventory/new`)

- [x] `form` remote function
- [x] `Autocomplete` — common Nigerian essential medicines list
- [x] Category `Select`: Antimalarial | ARV | Vaccine | Family Planning | Antibiotic | Other

### Restock Requests (`/pharmacy/restock`)

- [x] List: item, quantity requested, status, date
- [x] `Badge` status: Pending | Acknowledged | Fulfilled
- [x] Admin can mark Fulfilled

### Reports (`/pharmacy/reports`)

- [x] Top dispensed medications (last 30 days)
- [x] Low stock trend `Chart`
- [x] Near-expiry items table
- [x] `DateStrip` / `DatePicker` for date range selection
- [x] Export CSV button

---

## Phase 6 — Admin Dashboard

### Routes

| Route                     | Description                       |
| ------------------------- | --------------------------------- |
| `/admin`                  | Operations dashboard              |
| `/admin/patients`         | Patient registry                  |
| `/admin/staff`            | Staff list                        |
| `/admin/staff/invite`     | Invite staff                      |
| `/admin/staff/[id]`       | Staff profile + permission editor |
| `/admin/appointments`     | Appointment calendar              |
| `/admin/appointments/new` | Create appointment                |
| `/admin/triage-rules`     | Configure triage thresholds       |
| `/admin/reports`          | Clinical reports                  |
| `/admin/reminders`        | Bulk reminder management          |
| `/admin/settings`         | PHC settings                      |

### Operations Dashboard (`/admin`)

- [x] Basic stats page exists
- [x] KPI cards: Total patients today, In queue now, Completed consultations, Pharmacy dispensed
- [x] `Chart` — visits per day (last 7 days)
- [x] `Chart` — triage level breakdown (pie/donut)
- [x] Active staff online indicator
- [x] Sync health widget (last sync time, pending ops count)
- [ ] `NumberTicker` — animated stat counters

### Patient Registry (`/admin/patients`)

- [x] Basic list exists
- [x] `DataTable` — searchable, filterable, paginated
- [x] Columns: Clinic ID, Name, Age, Sex, Community, Last Visit, Actions
- [x] Export to CSV / print

### Staff Management (`/admin/staff`)

- [x] `DataTable` — staff list: name, role, status (active/inactive), last login
- [x] Role `Badge` per staff
- [x] "Invite Staff" button → `/admin/staff/invite`
- [x] Toggle active/inactive (`Switch` + `Dialog` confirm)

### Invite Staff (`/admin/staff/invite`)

- [x] `form` remote function
- [x] Email input
- [x] Role `Select`
- [x] Optional: set specific permissions at invite time
- [ ] Generates one-time invite token → sends email
- [ ] Invited staff sets password on first login (secure token flow)

### Staff Profile & Permissions (`/admin/staff/[id]`)

- [x] Staff info: name, email, role, join date
- [x] `PermissionEditor` component
- [x] `Switch` toggles per permission
- [x] `DatePicker` for time-bound grant expiry
- [x] Permission audit log for this staff member

### Appointments (`/admin/appointments`)

- [x] `BigCalendar` (more-shadcn-svelte) — month/week/day view
- [x] Color-coded by appointment type
- [x] Click appointment → detail `Dialog`
- [x] "New Appointment" button → `/admin/appointments/new`

### New Appointment (`/admin/appointments/new`)

- [x] Patient `Autocomplete` search
- [x] Appointment type `Select`: Antenatal | Immunization | Follow-up | General | Lab Follow-up
- [x] Assigned staff `Select`
- [x] `DatePicker` + time picker
- [x] Duration (15/30/45/60 min)
- [x] Notes `Textarea`
- [x] SMS reminder toggle (auto-sends 24h before)

#### DB: `appointments` Table

- [x] Schema migration created
- [x] Fields: id, patientId, phcId, assignedStaffId, type, scheduledAt, durationMinutes, notes, status, smsReminderSent, createdAt

### Triage Rules (`/admin/triage-rules`)

- [x] `Table` — current rules: field, operator, threshold, result level, active
- [x] `Dialog` — add/edit rule:
  - Field `Select`: Temperature | Systolic BP | Diastolic BP | Pulse | SpO2 | Weight
  - Operator `Select`: ≥ | ≤ | > | <
  - `Slider` — threshold value
  - Result `Select`: Red | Amber | Green
  - "Requires pregnant" `Switch`
  - Reason template `Input`
- [x] Toggle active/inactive per rule
- [x] Changes sync to all devices via existing triage rules sync

### Reports (`/admin/reports`)

- [x] Daily visit count chart
- [x] Triage level distribution
- [x] Top chief complaints
- [x] Pharmacy usage summary
- [x] `DateStrip` date range selector
- [x] Export CSV / print

### PHC Settings (`/admin/settings`)

- [x] PHC name, state, LGA (editable)
- [x] SMS provider config (Termii API key)
- [x] Sync configuration (poll interval)
- [x] Danger zone: reset demo data

---

## Phase 7 — Superadmin Dashboard

### Routes

| Route                       | Description         |
| --------------------------- | ------------------- |
| `/superadmin`               | Platform overview   |
| `/superadmin/phcs`          | All PHCs list       |
| `/superadmin/phcs/[id]`     | PHC deep-dive       |
| `/superadmin/users`         | All users           |
| `/superadmin/permissions`   | Permissions audit   |
| `/superadmin/billing`       | Subscription status |
| `/superadmin/releases`      | Manage app releases |
| `/superadmin/system`        | System health       |
| `/superadmin/announcements` | Broadcast to admins |

### Platform Overview (`/superadmin`)

- [x] Basic page exists (PHC list)
- [x] KPIs: Total PHCs, Total patients, Total staff, Daily active users
- [ ] `NumberTicker` animated counters
- [x] PHC health table: name, state, last sync, active staff, patient count
- [ ] System alerts: sync errors, failed SMS, low stock (any PHC)

### PHC Deep-Dive (`/superadmin/phcs/[id]`)

- [x] PHC info: name, LGA, state, created, subscription status
- [x] Staff list with roles
- [x] Usage stats: visits (30d), patients registered (all time)
- [x] Sync health: last sync, pending operations, conflict count
- [x] Actions: Deactivate PHC | Reset Data | Send Announcement

### All Users (`/superadmin/users`)

- [ ] `DataTable` — all users across all PHCs
- [ ] Filter by PHC, role
- [ ] Deactivate user

### Permissions Audit (`/superadmin/permissions`)

- [x] `DataTable` — all permission grants across platform
- [x] Filter by PHC, staff, permission key, status
- [x] Export audit log CSV

### Releases (`/superadmin/releases`)

- [x] GitHub Releases API integration (fetch latest release artifacts)
- [x] Show current release version per platform: Windows, macOS, Linux, Android, iOS
- [x] Download count metrics (if available)
- [x] `Video` embed — product demo video
- [x] Manual release notes editor

### System Health (`/superadmin/system`)

- [x] DB connection status
- [x] Sync queue depth (total pending `syncOperations`)
- [x] SMS queue: pending, sent (24h), failed (24h)
- [x] Error log viewer (last 50 errors)
- [x] Server uptime

### Announcements (`/superadmin/announcements`)

- [x] Rich text editor for announcement
- [x] Target: All PHCs | Specific PHC | Specific Role
- [x] Send via in-app notification + email

---

## Phase 8 — Settings (All Roles)

### Routes (nested under each role)

| Route                            | Description               |
| -------------------------------- | ------------------------- |
| `/[role]/settings`               | Profile & account         |
| `/[role]/settings/security`      | Password change, security |
| `/[role]/settings/notifications` | Notification preferences  |

### Profile (`/[role]/settings`)

- [x] Display name edit
- [x] Email (read-only, contact superadmin to change)
- [x] Role display (read-only)
- [x] PHC name display

### Security (`/[role]/settings/security`)

- [x] `Password` — current password verify
- [x] `Password` — new password with strength indicator
- [x] Session list (active sessions, revoke others)

### Notifications (`/[role]/settings/notifications`)

- [x] `Switch` toggles per notification type
- [x] Email notifications: on/off
- [x] In-app alerts: on/off per category

---

## Phase 9 — Marketing & Onboarding

### Routes

| Route       | Description               |
| ----------- | ------------------------- |
| `/`         | Marketing landing page    |
| `/register` | PHC registration          |
| `/download` | Download portal           |
| `/features` | Feature showcase per role |
| `/pricing`  | Pricing (free tier)       |
| `/contact`  | Contact form              |

### Landing Page (`/`)

- [x] Basic hero exists
- [x] Rich hero with animated gradient + product screenshot/video
- [x] Feature grid (6 key features with icons)
- [x] Role showcase: Nurse | Doctor | Pharmacy | Admin tabs
- [x] Testimonials / partner logos section
- [x] "How it works" `Stepper` walkthrough
- [x] `Event` cards (more-shadcn-svelte) — training webinars, launch events
- [x] Free pricing CTA
- [x] Footer: links, social, contact

### PHC Registration (`/register`)

- [x] Basic form exists with remote function
- [x] `VerifyHuman` utility (anti-bot, Cloudflare Turnstile or similar)
- [x] `Stepper` — multi-step:
  - Step 1: PHC Details (name, state, LGA, type)
  - Step 2: Admin Account (name, email, password, phone)
  - Step 3: Verify Human
  - Step 4: Success → redirect to dashboard
- [x] `ChoiceBox` — PHC type: Primary | Secondary | Private Clinic
- [x] `PhoneInput` — admin phone (+234 default)
- [x] `Password` with strength meter
- [x] Nigerian states/LGA `Autocomplete`
- [x] Device detection → adapt messaging:
  - Tauri: "Setting up your offline kiosk"
  - Mobile: "Staff mobile access"
  - Web: Standard registration

### Download Portal (`/download`)

- [x] Basic page exists
- [x] Platform cards: Windows | macOS | Linux | Android | iOS
- [x] GitHub Releases API → dynamic version + download URL
- [x] System requirements per platform
- [x] Installation guide (collapsible)
- [x] `Video` — installation walkthrough embed
- [x] QR code to download mobile app

---

## Phase 10 — Nigeria PHC Innovations

### 10.1 — Maternal Health Module

- [x] ANC visit tracker (Visits 1–8 with WHO schedule)
- [x] EDD calculator (from LMP)
- [x] Partogram (labour progress chart)
- [x] Postnatal schedule auto-generated
- [x] Immunization schedule generated from baby DOB

### 10.2 — Digital Immunization Card

- [x] WHO-compatible schedule generated per patient DOB
- [x] Vaccine status: Due | Given | Overdue
- [x] Print-friendly offline card
- [x] QR links to digital record
- [x] Auto-schedule SMS reminders per vaccine dose

### 10.3 — Nigerian Language Voice Input

- [x] Voice chief complaint in English, Pidgin, Hausa, Yoruba, Igbo
- [x] AI transcription → structured complaint
- [x] Language selector `ChoiceBox`
- [x] `AudioWave` animation during recording

### 10.4 — Disease Outbreak Detection

- [x] Auto-flag: ≥ 5 patients from same community, same chief complaint, within 7 days
- [x] Admin alert banner: "Possible outbreak: Malaria × 6 — Ugbowo community"
- [x] Superadmin LGA-level heatmap
- [x] Weekly epidemiological summary auto-generated

### 10.5 — Two-Way SMS

- [x] Inbound SMS webhook (Termii → `/api/sms/inbound`)
- [x] Patient replies: CONFIRM → confirms appointment, STOP → unsubscribes
- [x] SMS inbox viewer for admin

### 10.6 — Referral System

- [x] Doctor generates structured referral letter
- [x] Fields: from-PHC, to-facility, patient, reason, urgency, doctor name
- [x] Referral PDF export (offline-capable)
- [x] SMS referral summary to receiving facility

### 10.7 — Family Health Dashboard

- [x] View entire household in one view
- [x] All open reminders for family
- [x] Upcoming appointments per household
- [x] Register newborn linked to mother's record

### 10.8 — Offline Sync Health UI

- [x] Sync progress bar in sidebar footer
- [x] "Last synced X min ago" live counter
- [x] Conflict resolution UI (admin reviews conflicts)
- [x] Per-device sync history log

### 10.9 — Real-Time Staff Notifications

- [x] Nurse notified when doctor calls their patient
- [x] Doctor notified when lab result is entered
- [x] Pharmacy notified on new prescription
- [x] In-app notification bell with unread count
- [x] Powered by `BroadcastChannel` (LAN) + `query.live` (online)

### 10.10 — NHIS/HMO Tracking (stub)

- [x] Flag patients as NHIS enrollees on registration
- [x] Track NHIS-billable services per encounter
- [x] Simple visit claim form (not connected to NHIS API yet)

### 10.11 — First-Launch Onboarding Wizard (Tauri)

- [ ] Detected on first Tauri launch (no PHC data in local DB)
- [ ] `Stepper`:
  - Step 1: Welcome + `Video` tutorial
  - Step 2: Register or Login PHC
  - Step 3: Database initialization progress
  - Step 4: First admin account setup
  - Step 5: Invite staff or launch solo
  - Step 6: Done → Dashboard
- [ ] Offline seed data option (demo patients for training)
- [ ] QR scanner test/calibration step

---

## Phase 11 — Tauri Mobile v2

- [ ] Tauri Mobile v2 project configuration (Android + iOS targets)
- [ ] `(mobile)` route group for mobile-specific pages
- [ ] `BottomNav` as primary navigation (no sidebar)
- [ ] Biometric login (Tauri plugin)
- [ ] Camera plugin for QR scanning
- [ ] Local notifications (Tauri plugin) — appointment reminders
- [ ] Offline-first same as desktop (shared Dexie + sync)
- [ ] App icon, splash screen, store metadata
- [ ] Build pipeline: GitHub Actions → APK/IPA artifacts

---

## Database Schema Extensions

### New Tables to Create

#### `permissions`

- [x] Migration file created
- [x] Drizzle schema added
- [x] Server utility functions

#### `lab_requests`

- [ ] Migration file created
- [ ] Drizzle schema added
- [ ] Local Dexie type added
- [ ] Remote functions

#### `appointments`

- [ ] Migration file created
- [ ] Drizzle schema added
- [ ] Local Dexie type added
- [ ] Remote functions

#### `staff_invites`

- [ ] Migration file created
- [ ] Token generation + email flow

### Schema Modifications

#### `staff` table

- [ ] Add `phone: varchar` field
- [ ] Add `lastLoginAt: timestamp` field

#### `patients` table

- [ ] Add `nhisNumber: varchar` (nullable) — for NHIS tracking
- [ ] Add `bloodGroup: varchar` (nullable)
- [ ] Add `knownAllergies: text` (nullable)
- [ ] Add `isAncPatient: boolean` — antenatal care flag
- [ ] Add `edd: timestamp` (nullable) — estimated due date

---

## Component Library Reference

| Component                 | Package            | Used In                                 |
| ------------------------- | ------------------ | --------------------------------------- |
| `Sidebar`, `SidebarMenu*` | shadcn-svelte      | All role layouts                        |
| `Dock`                    | more-shadcn-svelte | Mobile navigation                       |
| `BottomNav`               | more-shadcn-svelte | Mobile navigation                       |
| `Stepper`                 | more-shadcn-svelte | Registration, consult, onboarding       |
| `PhoneInput`              | more-shadcn-svelte | Patient reg, staff invite, PHC reg      |
| `DatePicker`              | more-shadcn-svelte | DOB, appointments, reminders            |
| `DateStrip`               | more-shadcn-svelte | Expiry dates, date range selector       |
| `BigCalendar`             | more-shadcn-svelte | Admin appointments                      |
| `Autocomplete`            | more-shadcn-svelte | Patient search, medication, state/LGA   |
| `ChoiceBox`               | more-shadcn-svelte | Sex, PHC type, urgency, language        |
| `Password`                | more-shadcn-svelte | All password inputs + strength meter    |
| `VerifyHuman`             | more-shadcn-svelte | PHC registration anti-bot               |
| `Video`                   | more-shadcn-svelte | Releases page, marketing, onboarding    |
| `Event`                   | more-shadcn-svelte | Marketing page webinars/events          |
| `NumberTicker`            | local component    | Dashboard metric animations             |
| `AudioWave`               | local component    | Voice input indicator                   |
| `DataTable`               | shadcn-svelte      | Staff, patients, inventory, audit log   |
| `Chart`                   | shadcn-svelte      | Reports, sparklines                     |
| `Badge`                   | shadcn-svelte      | Triage, role, stock status, permissions |
| `Dialog`                  | shadcn-svelte      | Confirm actions, forms                  |
| `Switch`                  | shadcn-svelte      | Permissions, active toggle              |
| `Slider`                  | shadcn-svelte      | Triage threshold editor                 |
| `Progress`                | shadcn-svelte      | Stock level, sync progress              |
| `Alert`                   | shadcn-svelte      | Low stock, critical triage, warnings    |
| `Tabs`                    | shadcn-svelte      | Patient profile, settings               |
| `Avatar`                  | shadcn-svelte      | User footer in sidebar                  |
| `Skeleton`                | shadcn-svelte      | Loading states                          |
| `Toast`                   | shadcn-svelte      | Success/error feedback                  |
| `Tooltip`                 | shadcn-svelte      | Collapsed sidebar icon labels           |
| `Separator`               | shadcn-svelte      | Sidebar sections                        |
| `Select`                  | shadcn-svelte      | Dropdowns throughout                    |
| `Input`                   | shadcn-svelte      | Text inputs throughout                  |
| `Textarea`                | shadcn-svelte      | Notes, complaints                       |
| `Button`                  | shadcn-svelte      | Actions throughout                      |
| `Card`                    | shadcn-svelte      | Dashboard widgets                       |
| `Table`                   | shadcn-svelte      | Triage rules, permissions               |

---

## Queue Architecture

```
Write (any device)
       │
       ▼
  Dexie IndexedDB  ──► Dexie liveQuery ──► Svelte $state ──► UI (instant, offline)
       │
       ▼
   syncLog entry
       │
  (online / LAN)
       ▼
  pushOperations ──► Local SvelteKit server (LAN) or Cloud PostgreSQL
       │
  Other devices: pullChanges (every 5s for queue) ──► apply to Dexie ──► UI updates
       │
  (internet bonus)
       ▼
  query.live SSE ──► Remote superadmin/supervisor monitoring
       │
  Same machine, 2 windows:
  BroadcastChannel ──► instant cross-tab sync
```

---

_Last updated: 2026-07-15 | Implementation starting Phase 1_

## Missed Edge Cases & Polish (from Phases 1-8)
- [ ] Implement `NumberTicker` animated counters for dashboard KPIs.
- [ ] Implement `All Users` list view in Superadmin with role/PHC filtering.
- [ ] Add specific `liveQuery` optimizations (e.g. reduce sync poll for queueTickets to 5s if applicable, though WebSocket / BroadcastChannel covers most of this).
- [ ] Full `Family Grouping UI` linking multiple patient profiles.
- [ ] Additional mobile responsiveness polish (hiding sidebar and showing `BottomNav` cleanly across all role layouts).

