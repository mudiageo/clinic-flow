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
- [ ] Live updates via Dexie `liveQuery` (already wired via `QueueStore`)
- [ ] Reduce sync poll for `queueTickets` to 5s (vs 30s for other entities)
- [ ] `BroadcastChannel` for same-machine multi-window sync
- [ ] Triage level color coding (red/amber/green rows)
- [ ] "Call Next" button with `SidebarMenuBadge` count
- [ ] Ticket card: patient name, ticket #, triage level badge, wait time
- [ ] Mark as No-Show button
- [ ] Mark as Done button
- [ ] Empty state illustration when queue is empty

### Patient Registration Wizard (`/nurse/register`)

- [x] Basic form exists
- [ ] Multi-step `Stepper` (more-shadcn-svelte):
  - Step 1: Demographics (name, DOB, sex, community)
  - Step 2: Contact (phone, address, next of kin)
  - Step 3: Family Link (new family / link to existing)
  - Step 4: Confirm + Print QR Card
- [ ] `PhoneInput` (more-shadcn-svelte) — phone with +234 default
- [ ] `DatePicker` or `DateStrip` — date of birth
- [ ] `ChoiceBox` (more-shadcn-svelte) — sex selection (large tap targets)
- [ ] `Autocomplete` — Nigerian state/LGA list
- [ ] Estimated age input (when DOB unknown)
- [ ] Pregnancy toggle (affects triage rules)
- [ ] QR code generation on completion
- [ ] Print QR card (patient ID card) — offline printable
- [ ] Auto-add to queue after registration toggle

### Vitals & Triage (`/nurse/vitals`)

- [x] Basic vitals form exists
- [ ] `Stepper`: Select Patient → Enter Vitals → AI Triage → Confirm
- [ ] QR scanner for patient lookup (Tauri camera plugin)
- [ ] Manual patient search as fallback (`Autocomplete`)
- [ ] Vitals fields: Temperature, BP (systolic/diastolic), Pulse, Weight, SpO2
- [ ] AI triage calculation (local rules from `triageRules` store)
- [ ] Triage level badge shown immediately on calculation
- [ ] Chief complaint input (text + voice button)
- [ ] `AudioWave` animation during voice recording
- [ ] Nigerian language selector for voice (English / Pidgin / Hausa / Yoruba / Igbo)
- [ ] Submit → auto-add patient to consultation queue with triage level

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
- [ ] Live queue from `QueueStore` (Dexie) — status `called` | `in_progress`
- [ ] "Start Consultation" button → navigates to `/doctor/consult/[encounterId]`
- [ ] Patient triage level badge visible on each card
- [ ] Estimated wait time per patient

### Consultation View (`/doctor/consult/[encounterId]`)

- [x] Partial implementation exists
- [ ] Split panel layout: Patient Summary (left) | Consultation (right)
- [ ] Patient summary: demographics, vitals recorded today, past 3 encounters
- [ ] `Tabs`: Notes | Prescriptions | Lab | Referral
- [ ] Doctor notes `Textarea` with voice input button
- [ ] Pidgin/English voice transcription → structured notes (AI route)
- [ ] `Stepper`: Review Vitals → Write Notes → Prescribe → Lab → Referral → Complete
- [ ] Prescription form: medication `Autocomplete` (from inventory), quantity, dosage
- [ ] Lab request form (see below)
- [ ] Referral letter generator (structured text → printable PDF)
- [ ] "Complete Consultation" → marks encounter done, moves ticket to `done`

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
- [ ] KPI cards: Total patients today, In queue now, Completed consultations, Pharmacy dispensed
- [ ] `Chart` — visits per day (last 7 days)
- [ ] `Chart` — triage level breakdown (pie/donut)
- [ ] Active staff online indicator
- [ ] Sync health widget (last sync time, pending ops count)
- [ ] `NumberTicker` — animated stat counters

### Patient Registry (`/admin/patients`)

- [x] Basic list exists
- [ ] `DataTable` — searchable, filterable, paginated
- [ ] Columns: Clinic ID, Name, Age, Sex, Community, Last Visit, Actions
- [ ] Export to CSV / print

### Staff Management (`/admin/staff`)

- [ ] `DataTable` — staff list: name, role, status (active/inactive), last login
- [ ] Role `Badge` per staff
- [ ] "Invite Staff" button → `/admin/staff/invite`
- [ ] Toggle active/inactive (`Switch` + `Dialog` confirm)

### Invite Staff (`/admin/staff/invite`)

- [ ] `form` remote function
- [ ] Email input
- [ ] Role `Select`
- [ ] Optional: set specific permissions at invite time
- [ ] Generates one-time invite token → sends email
- [ ] Invited staff sets password on first login (secure token flow)

### Staff Profile & Permissions (`/admin/staff/[id]`)

- [ ] Staff info: name, email, role, join date
- [ ] `PermissionEditor` component
- [ ] `Switch` toggles per permission
- [ ] `DatePicker` for time-bound grant expiry
- [ ] Permission audit log for this staff member

### Appointments (`/admin/appointments`)

- [ ] `BigCalendar` (more-shadcn-svelte) — month/week/day view
- [ ] Color-coded by appointment type
- [ ] Click appointment → detail `Dialog`
- [ ] "New Appointment" button → `/admin/appointments/new`

### New Appointment (`/admin/appointments/new`)

- [ ] Patient `Autocomplete` search
- [ ] Appointment type `Select`: Antenatal | Immunization | Follow-up | General | Lab Follow-up
- [ ] Assigned staff `Select`
- [ ] `DatePicker` + time picker
- [ ] Duration (15/30/45/60 min)
- [ ] Notes `Textarea`
- [ ] SMS reminder toggle (auto-sends 24h before)

#### DB: `appointments` Table

- [ ] Schema migration created
- [ ] Fields: id, patientId, phcId, assignedStaffId, type, scheduledAt, durationMinutes, notes, status, smsReminderSent, createdAt

### Triage Rules (`/admin/triage-rules`)

- [ ] `Table` — current rules: field, operator, threshold, result level, active
- [ ] `Dialog` — add/edit rule:
  - Field `Select`: Temperature | Systolic BP | Diastolic BP | Pulse | SpO2 | Weight
  - Operator `Select`: ≥ | ≤ | > | <
  - `Slider` — threshold value
  - Result `Select`: Red | Amber | Green
  - "Requires pregnant" `Switch`
  - Reason template `Input`
- [ ] Toggle active/inactive per rule
- [ ] Changes sync to all devices via existing triage rules sync

### Reports (`/admin/reports`)

- [ ] Daily visit count chart
- [ ] Triage level distribution
- [ ] Top chief complaints
- [ ] Pharmacy usage summary
- [ ] `DateStrip` date range selector
- [ ] Export CSV / print

### PHC Settings (`/admin/settings`)

- [ ] PHC name, state, LGA (editable)
- [ ] SMS provider config (Termii API key)
- [ ] Sync configuration (poll interval)
- [ ] Danger zone: reset demo data

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
- [ ] KPIs: Total PHCs, Total patients, Total staff, Daily active users
- [ ] `NumberTicker` animated counters
- [ ] PHC health table: name, state, last sync, active staff, patient count
- [ ] System alerts: sync errors, failed SMS, low stock (any PHC)

### PHC Deep-Dive (`/superadmin/phcs/[id]`)

- [ ] PHC info: name, LGA, state, created, subscription status
- [ ] Staff list with roles
- [ ] Usage stats: visits (30d), patients registered (all time)
- [ ] Sync health: last sync, pending operations, conflict count
- [ ] Actions: Deactivate PHC | Reset Data | Send Announcement

### All Users (`/superadmin/users`)

- [ ] `DataTable` — all users across all PHCs
- [ ] Filter by PHC, role
- [ ] Deactivate user

### Permissions Audit (`/superadmin/permissions`)

- [ ] `DataTable` — all permission grants across platform
- [ ] Filter by PHC, staff, permission key, status
- [ ] Export audit log CSV

### Releases (`/superadmin/releases`)

- [ ] GitHub Releases API integration (fetch latest release artifacts)
- [ ] Show current release version per platform: Windows, macOS, Linux, Android, iOS
- [ ] Download count metrics (if available)
- [ ] `Video` embed — product demo video
- [ ] Manual release notes editor

### System Health (`/superadmin/system`)

- [ ] DB connection status
- [ ] Sync queue depth (total pending `syncOperations`)
- [ ] SMS queue: pending, sent (24h), failed (24h)
- [ ] Error log viewer (last 50 errors)
- [ ] Server uptime

### Announcements (`/superadmin/announcements`)

- [ ] Rich text editor for announcement
- [ ] Target: All PHCs | Specific PHC | Specific Role
- [ ] Send via in-app notification + email

---

## Phase 8 — Settings (All Roles)

### Routes (nested under each role)

| Route                            | Description               |
| -------------------------------- | ------------------------- |
| `/[role]/settings`               | Profile & account         |
| `/[role]/settings/security`      | Password change, security |
| `/[role]/settings/notifications` | Notification preferences  |

### Profile (`/[role]/settings`)

- [ ] Display name edit
- [ ] Email (read-only, contact superadmin to change)
- [ ] Role display (read-only)
- [ ] PHC name display

### Security (`/[role]/settings/security`)

- [ ] `Password` (more-shadcn-svelte) — current password verify
- [ ] `Password` — new password with strength meter
- [ ] `Stepper`: Verify Identity → New Password → Confirm
- [ ] Session list (active sessions, revoke others)

### Notifications (`/[role]/settings/notifications`)

- [ ] `Switch` toggles per notification type
- [ ] Email notifications: on/off
- [ ] In-app alerts: on/off per category

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
- [ ] Rich hero with animated gradient + product screenshot/video
- [ ] Feature grid (6 key features with icons)
- [ ] Role showcase: Nurse | Doctor | Pharmacy | Admin tabs
- [ ] Testimonials / partner logos section
- [ ] "How it works" `Stepper` walkthrough
- [ ] `Event` cards (more-shadcn-svelte) — training webinars, launch events
- [ ] Free pricing CTA
- [ ] Footer: links, social, contact

### PHC Registration (`/register`)

- [x] Basic form exists with remote function
- [ ] `VerifyHuman` utility (anti-bot, Cloudflare Turnstile or similar)
- [ ] `Stepper` — multi-step:
  - Step 1: PHC Details (name, state, LGA, type)
  - Step 2: Admin Account (name, email, password, phone)
  - Step 3: Verify Human
  - Step 4: Success → redirect to dashboard
- [ ] `ChoiceBox` — PHC type: Primary | Secondary | Private Clinic
- [ ] `PhoneInput` — admin phone (+234 default)
- [ ] `Password` with strength meter
- [ ] Nigerian states/LGA `Autocomplete`
- [ ] Device detection → adapt messaging:
  - Tauri: "Setting up your offline kiosk"
  - Mobile: "Staff mobile access"
  - Web: Standard registration

### Download Portal (`/download`)

- [x] Basic page exists
- [ ] Platform cards: Windows | macOS | Linux | Android | iOS
- [ ] GitHub Releases API → dynamic version + download URL
- [ ] System requirements per platform
- [ ] Installation guide (collapsible)
- [ ] `Video` — installation walkthrough embed
- [ ] QR code to download mobile app

---

## Phase 10 — Nigeria PHC Innovations

### 10.1 — Maternal Health Module

- [ ] ANC visit tracker (Visits 1–8 with WHO schedule)
- [ ] EDD calculator (from LMP)
- [ ] Partogram (labour progress chart)
- [ ] Postnatal schedule auto-generated
- [ ] Immunization schedule generated from baby DOB

### 10.2 — Digital Immunization Card

- [ ] WHO-compatible schedule generated per patient DOB
- [ ] Vaccine status: Due | Given | Overdue
- [ ] Print-friendly offline card
- [ ] QR links to digital record
- [ ] Auto-schedule SMS reminders per vaccine dose

### 10.3 — Nigerian Language Voice Input

- [ ] Voice chief complaint in English, Pidgin, Hausa, Yoruba, Igbo
- [ ] AI transcription → structured complaint
- [ ] Language selector `ChoiceBox`
- [ ] `AudioWave` animation during recording

### 10.4 — Disease Outbreak Detection

- [ ] Auto-flag: ≥ 5 patients from same community, same chief complaint, within 7 days
- [ ] Admin alert banner: "Possible outbreak: Malaria × 6 — Ugbowo community"
- [ ] Superadmin LGA-level heatmap
- [ ] Weekly epidemiological summary auto-generated

### 10.5 — Two-Way SMS

- [ ] Inbound SMS webhook (Termii → `/api/sms/inbound`)
- [ ] Patient replies: CONFIRM → confirms appointment, STOP → unsubscribes
- [ ] SMS inbox viewer for admin

### 10.6 — Referral System

- [ ] Doctor generates structured referral letter
- [ ] Fields: from-PHC, to-facility, patient, reason, urgency, doctor name
- [ ] Referral PDF export (offline-capable)
- [ ] SMS referral summary to receiving facility

### 10.7 — Family Health Dashboard

- [ ] View entire household in one view
- [ ] All open reminders for family
- [ ] Upcoming appointments per household
- [ ] Register newborn linked to mother's record

### 10.8 — Offline Sync Health UI

- [ ] Sync progress bar in sidebar footer
- [ ] "Last synced X min ago" live counter
- [ ] Conflict resolution UI (admin reviews conflicts)
- [ ] Per-device sync history log

### 10.9 — Real-Time Staff Notifications

- [ ] Nurse notified when doctor calls their patient
- [ ] Doctor notified when lab result is entered
- [ ] Pharmacy notified on new prescription
- [ ] In-app notification bell with unread count
- [ ] Powered by `BroadcastChannel` (LAN) + `query.live` (online)

### 10.10 — NHIS/HMO Tracking (stub)

- [ ] Flag patients as NHIS enrollees on registration
- [ ] Track NHIS-billable services per encounter
- [ ] Simple visit claim form (not connected to NHIS API yet)

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
