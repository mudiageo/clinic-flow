# Permission-Composable Dashboard System — Full Plan

> **Status:** PLANNING | **Priority:** P0 — Foundational UX before any new features

---

## 1. The Core Problem

Today, every role has a **hardcoded layout** (`/nurse`, `/doctor`, `/admin`) with no way for an Admin to say _"this CHEW should also be able to register patients"_ or _"this midwife needs the maternity board"_. This is too rigid for the diverse, understaffed reality of Nigerian PHCs.

---

## 2. Proposed System: Permission-Composable Dashboards

### Principle
A staff member's dashboard is **assembled at runtime** from a master list of **Dashboard Modules**. Each module is a tile/card/nav-link. Each module declares what `permission` key unlocks it. If a staff member has that permission, the module appears — regardless of their role.

### Two Layers
1. **Role Defaults:** When a staff member is invited (e.g., as a `chew`), they automatically receive a sensible default permission set.
2. **Admin Overrides:** The OIC or Admin can go to a **Permission Editor** UI and grant extra permissions or revoke defaults for any individual staff member.

---

## 3. Complete Permission Registry (36 Keys)

### Patient Management
| Key | Description |
|---|---|
| `manage:patients` | Register, edit, view all patient records |
| `view:patients` | Read-only patient search & profiles |
| `manage:families` | Register and edit household/family units |

### Queue & Triage
| Key | Description |
|---|---|
| `manage:queue` | Add patients to queue, call next, mark done |
| `manage:vitals` | Record vitals & apply triage flags |
| `view:queue:general` | View General Outpatient queue tab |
| `view:queue:anc` | View ANC queue tab |
| `view:queue:epi` | View EPI/Immunization queue tab |

### Clinical
| Key | Description |
|---|---|
| `manage:consultations` | Conduct doctor consultations, write SOAP notes |
| `manage:prescriptions` | Prescribe medications |
| `manage:labs` | Request and review lab tests |
| `view:labs` | View lab request status (read-only) |
| `manage:referrals` | Issue patient referral letters |

### Maternal & Reproductive Health
| Key | Description |
|---|---|
| `view:anc` | Access ANC workflow views |
| `manage:anc` | Run ANC consultations, update pregnancy records |
| `view:maternity` | View Maternity Ward Board |
| `manage:maternity` | Manage labour & delivery (Partograph, etc.) |
| `manage:immunization` | Administer EPI immunizations |

### Pharmacy & Inventory
| Key | Description |
|---|---|
| `manage:inventory` | Add, edit, delete inventory items |
| `view:inventory` | View drug stock levels |
| `manage:dispensing` | Dispense medications to patients |
| `view:cold_chain` | View cold chain vaccine tracker |
| `manage:restock` | Raise restock requests |
| `view:prescriptions` | View prescription records |

### Appointments & Reminders
| Key | Description |
|---|---|
| `manage:appointments` | Book, edit, cancel appointments |
| `view:appointments` | View appointment calendar |
| `manage:reminders` | Set and manage SMS reminders |

### Field & Community Health
| Key | Description |
|---|---|
| `use:field_mode` | Access CHEW Field Outreach Mode (offline-first) |
| `manage:outreach` | Log household visits and community outreach data |

### Reporting & Analytics
| Key | Description |
|---|---|
| `view:reports` | View clinic HMIS analytics & charts |
| `export:dhis2` | Export data in DHIS2/HMIS format to LGA |
| `view:outbreaks` | View Outbreak Radar dashboard |
| `view:idsr` | View/Generate IDSR weekly reports |
| `view:audit` | View system audit log |

### Administration
| Key | Description |
|---|---|
| `manage:staff` | Invite, activate/deactivate staff |
| `manage:permissions` | Grant/revoke permissions for staff |
| `manage:phc` | Edit PHC name, LGA, feature flags |
| `manage:devices` | Register and approve clinic devices |
| `manage:triage_rules` | Edit AI triage thresholds |
| `manage:nhis` | Manage NHIS claims & billing |
| `view:sms_inbox` | View two-way SMS inbox |
| `view:sync_health` | View server sync health & status |

---

## 4. Role Default Permission Sets

Auto-granted when a staff member is invited. Admin can customise on top of these.

### `receptionist`
`view:patients`, `manage:patients`, `manage:queue`, `manage:appointments`, `view:appointments`

### `chew`
`view:patients`, `manage:patients`, `manage:queue`, `manage:vitals`, `view:queue:general`, `view:queue:epi`, `manage:immunization`, `use:field_mode`, `manage:outreach`, `manage:reminders`

### `jchew`
`view:patients`, `manage:queue`, `manage:vitals`, `view:queue:general`, `use:field_mode`

### `nurse`
`view:patients`, `manage:patients`, `manage:queue`, `manage:vitals`, `view:queue:general`, `view:queue:anc`, `view:queue:epi`, `view:anc`, `manage:reminders`, `view:appointments`

### `nurse_midwife`
Everything `nurse` gets + `manage:anc`, `view:maternity`, `manage:maternity`, `manage:immunization`

### `eho`
`view:patients`, `view:queue:general`, `manage:outreach`, `view:reports`

### `cho` (Community Health Officer)
Everything `nurse` gets + `manage:consultations`, `manage:prescriptions`, `manage:labs`, `manage:referrals`, `manage:anc`, `view:maternity`, `manage:immunization`, `view:reports`

### `doctor` (Visiting Doctor)
`view:patients`, `view:queue:general`, `manage:consultations`, `manage:prescriptions`, `manage:labs`, `manage:referrals`, `view:reports`, `manage:nhis`

### `pharmacy`
`view:patients`, `view:inventory`, `manage:inventory`, `manage:dispensing`, `view:cold_chain`, `manage:restock`, `view:prescriptions`

### `oic` (Officer in Charge)
All of the above + `manage:staff`, `manage:permissions`, `manage:phc`, `manage:appointments`, `export:dhis2`, `view:outbreaks`, `view:idsr`, `view:sms_inbox`, `view:audit`, `manage:devices`, `manage:triage_rules`, `view:sync_health`

### `admin`
Everything `oic` gets + `manage:nhis`, `manage:triage_rules`

---

## 5. Dashboard Module Registry (35+ Modules)

### 🧑‍⚕️ Patient Care
| Module | Label | Href | Permission |
|---|---|---|---|
| `register-patient` | Register Patient | `/nurse/register` | `manage:patients` |
| `search-patient` | Search Patients | `/nurse/search` | `view:patients` |
| `patient-records` | Patient Records | `/doctor/patients` | `view:patients` |
| `family-health` | Family Health | `/families` | `manage:families` |

### 🚦 Queue & Triage
| Module | Label | Href | Permission |
|---|---|---|---|
| `triage-board` | Triage Board | `/nurse?tab=general` | `view:queue:general` |
| `anc-queue` | ANC Queue | `/nurse?tab=anc` | `view:queue:anc` |
| `epi-queue` | Immunization Queue | `/nurse?tab=epi` | `view:queue:epi` |
| `vitals-station` | Vitals & Triage | `/nurse/vitals` | `manage:vitals` |

### 🩺 Clinical
| Module | Label | Href | Permission |
|---|---|---|---|
| `doctor-queue` | Doctor's Queue | `/doctor` | `manage:consultations` |
| `lab-requests` | Lab Requests | `/doctor/lab` | `manage:labs` |
| `view-labs` | Lab Results | `/doctor/lab` | `view:labs` |

### 🤰 Maternal Health
| Module | Label | Href | Permission |
|---|---|---|---|
| `anc-clinics` | ANC Clinics | `/maternity/anc` | `view:anc` |
| `maternity-ward` | Maternity Ward | `/maternity` | `view:maternity` |
| `partograph` | Partograph (Labour) | `/maternity/partograph` | `manage:maternity` |
| `immunization` | EPI Immunization | `/immunization` | `manage:immunization` |

### 💊 Pharmacy
| Module | Label | Href | Permission |
|---|---|---|---|
| `dispense` | Dispense Meds | `/pharmacy/dispense` | `manage:dispensing` |
| `inventory` | Drug Inventory | `/pharmacy` | `view:inventory` |
| `cold-chain` | Cold Chain | `/pharmacy/cold-chain` | `view:cold_chain` |
| `restock` | Restock Requests | `/pharmacy/restock` | `manage:restock` |

### 📅 Appointments
| Module | Label | Href | Permission |
|---|---|---|---|
| `appointments` | Appointments | `/admin/appointments` | `view:appointments` |
| `reminders` | SMS Reminders | `/nurse/reminders` | `manage:reminders` |

### 🌍 Field & Community
| Module | Label | Href | Permission |
|---|---|---|---|
| `field-mode` | Field Outreach Mode | `/field` | `use:field_mode` |
| `outreach-log` | Outreach Log | `/field/outreach` | `manage:outreach` |

### 📊 Analytics & Reporting
| Module | Label | Href | Permission |
|---|---|---|---|
| `reports` | HMIS Analytics | `/admin/reports` | `view:reports` |
| `dhis2-export` | Export to DHIS2 | `/admin/reports?export=dhis2` | `export:dhis2` |
| `outbreak-radar` | Outbreak Radar | `/admin/outbreak-radar` | `view:outbreaks` |
| `idsr-report` | IDSR Weekly Report | `/admin/outbreak-radar?tab=idsr` | `view:idsr` |

### ⚙️ Administration
| Module | Label | Href | Permission |
|---|---|---|---|
| `staff-management` | Staff Management | `/admin/staff` | `manage:staff` |
| `permission-editor` | Permission Editor | `/admin/permissions` | `manage:permissions` |
| `phc-settings` | PHC Settings | `/admin/settings` | `manage:phc` |
| `device-management` | Device Management | `/admin/devices` | `manage:devices` |
| `triage-rules` | Triage Rules | `/admin/triage` | `manage:triage_rules` |
| `nhis-claims` | NHIS Claims | `/admin/nhis-claims` | `manage:nhis` |
| `sms-inbox` | SMS Inbox | `/admin/sms-inbox` | `view:sms_inbox` |
| `sync-health` | Server Sync | `/admin/sync-health` | `view:sync_health` |
| `audit-log` | Audit Log | `/admin/audit` | `view:audit` |

---

## 6. New Views to Build

| Screen | Route | Description | Who Sees It |
|---|---|---|---|
| **Universal Dashboard** (overhaul) | `/dashboard` | Permission-assembled tile grid | All roles |
| **Permission Editor** | `/admin/permissions` | Admin UI to manage per-staff permissions | OIC, Admin |
| **CHEW Field Mode** | `/field` | Mobile-first simplified offline outreach screen | CHEW, JCHEW |
| **Outreach Log** | `/field/outreach` | Log household visits + community data | CHEW, JCHEW, EHO |
| **Maternity Ward Board** | `/maternity` | Active admitted pregnant women tracker | Midwife, CHO |
| **ANC Clinic View** | `/maternity/anc` | Structured ANC form + pregnancy records | Midwife, Nurse, CHO |
| **Partograph** | `/maternity/partograph/[id]` | Digital labour monitoring chart | Midwife, CHO |
| **Immunization Tracker** | `/immunization` | EPI schedule tracker per child | CHEW, Nurse |
| **Cold Chain Tracker** | `/pharmacy/cold-chain` | Vaccine inventory + temperature alerts | Pharmacy, CHEW, Nurse |
| **DHIS2 Export Wizard** | `/admin/reports?export=dhis2` | Guided HMIS data export to LGA | OIC, Admin |

---

## 7. Permission Editor Admin UI (Design)

The **Permission Editor** at `/admin/permissions` will be the crown jewel:

- **Staff List Panel** — Shows all staff with their role badge, avatar, and current active permission count.
- **Permission Panel (per staff)** — Click a staff member to open their permission breakdown, grouped by category.
  - ✅ **Green toggle** = granted (either default or manually added)
  - ⬜ **Grey toggle** = available but not granted
  - 🔒 **Locked** = locked by Superadmin and cannot be toggled at PHC level
- **Bulk Role Reset** — "Reset to role defaults" button to undo all custom overrides.
- **Grant with Expiry** — Optional expiry date when granting a permission (e.g., "Acting OIC for 2 weeks").
- **Audit Trail** — Every toggle is logged to the `audit_log` with the granting staff's ID and a reason.
- **Visual Role Diff** — Show which permissions are _above_ the role default (highlighted in blue) vs. which defaults were _revoked_ (highlighted in red).

---

---

## 8. Enhancement Ideas (All Approved)

### 🎯 Smarter Permissions

**Context-Sensitive Permissions**
Permissions can carry optional *conditions*. E.g., a JCHEW can only register patients when Field Mode is active (`context: ['field_mode']`). Enforced at both the server route-guard and the UI module visibility level.

**Permission Request Flow**
Staff can *request* a permission from their own dashboard (e.g., "I need Lab access"). The OIC gets an in-app notification with one-tap approve/deny. A full trail is logged to the audit log.

**Supervisor Delegation**
An OIC can delegate a subset of their permissions to a CHO for a specific period (e.g., Acting OIC for 2 weeks during leave). The CHO temporarily inherits `manage:staff` and `manage:phc`. Delegated actions are flagged distinctly in the audit log. OIC can revoke with one tap.

**Permission Templates ("Presets")**
Admins can create named reusable templates — e.g., **"Saturday Outreach Team"** or **"Immunization Campaign Day"** — and apply them to multiple staff in bulk. This avoids repeating individual permission grants for recurring events.

---

### 🏥 Living Dashboards

**Live Status Widgets**
Each module tile shows a real-time stat instead of just being a static link:
- Triage Board → `12 waiting · 2 red`
- Cold Chain → `3 vaccines expiring this week`
- Reminders → `5 overdue ANC follow-ups`
- DHIS2 Export → `Report due in 4 days`

**Contextual Inline Quick-Actions**
Tiles have inline action buttons — Appointments tile has a "Book Now" slide-over, Reminders tile shows the next 3 due patients with "Send Now", Restock tile has a "Request" button — all without leaving the dashboard.

**Shift / Duty Context ("Clock In / Clock Out")**
Staff clock in at the start of a shift and clock out at the end. The dashboard shows live stats while on duty and a day summary when off-duty. Feeds into OIC staff attendance reports and gives every audit log entry a duty-shift context.

**Pinned Modules**
Each staff member can pin/unpin their most-used modules to the top of their personal dashboard (from modules they already have access to). Preferences are persisted per-staff. Useful for CHEWs who primarily work in Field Mode.

---

### 🔐 Security & Access Control

**Sensitive Action Re-Authentication**
High-stakes actions (exporting all patient data to DHIS2, revoking staff permissions, editing triage rules) require a **PIN re-entry** even if the staff member is already logged in. Prevents exploitation of an unattended logged-in device.

**Device-Scoped Permissions**
A registered device (tablet/kiosk) has its own permission scope. A tablet registered as "Triage Kiosk" only renders triage/vitals modules regardless of who logs in. Prevents the waiting room screen from showing admin panels.

**Failed Permission Audit Alerts**
If a staff member repeatedly hits a "no access" wall on a module (e.g., trying to access Lab Requests 5 times in a day), the system notifies the OIC: *"Nurse Joy attempted to access Lab Requests 5 times today — consider granting access or investigating."*

---

### 🌍 Nigeria-Specific

**Supervisor Override (QR Code)**
When a CHEW is in offline Field Mode, a supervisor (OIC) can scan a QR code from their own device to temporarily unlock a specific action (e.g., voiding a record, registering an unusual case) for 10 minutes. Fully audited when synced.

**Multi-PHC Roaming**
A CHO or Visiting Doctor assigned to cover multiple PHCs in the same LGA can have their account roam across facilities. The dashboard auto-adapts to whichever PHC server they are connected to (detected via mDNS broadcast). Permissions are scoped per-PHC.

---

### 🤖 AI Integration

**AI Dashboard Personalisation**
After 2 weeks of usage, the AI analyses which modules each staff member opens most and surfaces a suggestion: *"It looks like you open EPI Queue 10x daily. Pin it to the top?"* Suggestions are shown as a dismissable banner.

**AI Permission Anomaly Detection**
If a staff member suddenly starts accessing modules they never used before (e.g., a CHEW accessing DHIS2 Export at midnight), the AI flags it to the OIC and Superadmin as a potential security anomaly. Shown in the audit log with an `⚠️ Anomaly` badge.

---

### 📱 Progressive Web App

**Role-Aware Push Notifications**
PWA push notifications are scoped by permissions — staff with `view:queue:anc` get a push when an ANC patient enters the queue. Staff with `view:outbreaks` get a push when a new outbreak pre-alert fires. No irrelevant noise.

**Offline Module Caching**
The modules a staff member has access to get pre-cached for offline PWA use. A CHEW with `use:field_mode` gets their field screens and the last patient registry pre-cached. Staff without that permission don't get those assets — saving storage on low-spec Android devices.

> [!NOTE]
> **WhatsApp Permission Notifications** (staff receive a WhatsApp message when their permissions are updated) has been scheduled for the Phase 2 WhatsApp/Termii integration work. See the main AI-Features-Plan.md, Section 4.

---

## 9. Implementation Phases

### Phase 1: Config Files (Backend)
- [ ] Create `$lib/config/permissions.ts` — Full permission registry
- [ ] Create `$lib/config/role-defaults.ts` — Default sets per role
- [ ] Create `$lib/config/dashboard-modules.ts` — Full module registry

### Phase 2: Server-side Permissions
- [ ] Update `auth.remote.ts` — Inject active permissions into session data on login
- [ ] Update `hooks.server.ts` — Route guards check permissions (not just role) using a helper `hasPermission(role, pathname)` function
- [ ] Add `grantPermission`, `revokePermission`, `resetToDefaults`, `getStaffPermissions` to `admin.remote.ts`
- [ ] Auto-seed default permissions when a staff invite is accepted

### Phase 3: Client Permission Store
- [ ] Create `$lib/state/session.svelte.ts` with `can(key)` reactive helper
- [ ] Update `(app)/+layout.svelte` — Populate session store from page data

### Phase 4: Universal Dashboard
- [ ] Rebuild `/dashboard/+page.svelte` — Dynamic category-grouped tile grid
- [ ] Update sidebar nav — Filter all nav links through `can()` helper
- [ ] Update login redirects — All roles land at `/dashboard`

### Phase 5: Permission Editor UI
- [ ] Build `/admin/permissions/+page.svelte`
- [ ] Wire up grant/revoke/reset remotes
- [ ] Add audit log entries per toggle

### Phase 6: New Role-Specific Views
- [ ] Build `/field` — CHEW Field Mode
- [ ] Build `/maternity` — Maternity Ward Board
- [ ] Build `/pharmacy/cold-chain` — Cold Chain Tracker
- [ ] Build `/immunization` — EPI Schedule Tracker

### Phase 7: Changeset & Docs
- [ ] Create `.changeset/permission-composable-dashboard.md`
- [ ] Update in-app Walkthrough guides for each new view
- [ ] Create user-facing support docs for the Permission Editor
