# ClinicFlow — Product Requirement Document

**A local-first Hospital Management & Queue System for rural Primary Healthcare Centers (PHCs) in Nigeria**

---

## 0. Product Vision

PHCs in Nigeria run on paper folders, unreliable power, and intermittent internet. ClinicFlow digitizes the patient journey — registration, triage, consultation, pharmacy — without assuming the internet works, the staff are fluent typists, or the patients can read. Every module is designed around three constraints: **offline-first**, **low-literacy staff UX**, **low-literacy patient UX**.

---

## 1. Digital Patient Indexing & Registration

### User Journey

1. Receptionist registers a new patient once: name, DOB/age estimate, sex, phone number (optional), address/community, next-of-kin.
2. System generates a unique **Clinic ID** and prints/renders a **QR card** (physical card handed to patient, or a paper slip if no printer).
3. On return visits, receptionist scans the QR via webcam → patient profile loads instantly, zero typing.
4. Receptionist can alternatively search by name, phone number, or Clinic ID (fuzzy search, tolerant of misspellings).

### Family Grouping

- During registration, receptionist can link a new patient to an existing patient as `parent`, `child`, `spouse`, `dependent`, or `sibling`.
- Opening any family member's profile shows a **Family Panel** surfacing: mother's antenatal history when opening a child's file, siblings' immunization status, household visit history.
- A `family_id` groups the household; `patients.guardian_id` links a minor to their primary guardian for consent/contact purposes.

### Technical Requirements

- QR encodes only the Clinic ID (not PHI) — the ID is looked up locally in IndexedDB or synced Postgres.
- Webcam scan uses a JS QR-decoding library (e.g. `qr-scanner`) running entirely client-side.
- Search must work fully offline against the local IndexedDB index (name, phone, Clinic ID indexed fields).
- Card rendering: printable HTML/canvas QR + Clinic ID + name, sized for standard card stock, works with any USB thermal or inkjet printer via browser print dialog — no special driver dependency.

### Acceptance Criteria

- New registration → card renders in under 3 seconds, entirely offline.
- Scanning a QR loads the full profile in under 1 second from local storage.
- Family panel correctly surfaces linked records for at least 4 relationship depths (grandparent → parent → child).

---

## 2. Triage & Encounters

### 2.1 Smart Triage Queue

- Nurse enters vitals (temp, BP, pulse, weight, SpO2 if available) via a vitals entry modal.
- A **client-side rules engine** evaluates thresholds in real time as vitals are entered:
  - Temp ≥ 39°C → flag **RED / URGENT**
  - Systolic BP ≥ 160 or Diastolic ≥ 110 (or any elevated BP in a flagged-pregnant patient) → flag **RED / URGENT**
  - SpO2 < 90% → flag **RED / URGENT**
  - Moderate deviations → flag **AMBER / PRIORITY**
  - Normal ranges → **GREEN / ROUTINE**
- RED-flagged patients are automatically moved to the top of the doctor's queue with a visible reason badge (e.g. "High Fever — 39.4°C").
- Rules engine config is a plain JSON/TS ruleset the Head of PHC can adjust (not hardcoded), versioned per PHC.

### 2.2 AI-Assisted Voice Intake

- Nurse presses and holds a large **"Hold to Speak"** button; releases to stop.
- Audio is transcribed and passed to an LLM (Gemini) with a structured-extraction prompt to populate: chief complaint, duration of symptoms, associated symptoms, in **English and Nigerian Pidgin**.
- Nurse reviews the auto-filled structured fields before saving — AI output is always a suggestion, never auto-committed without human confirmation.
- Works offline-degraded: if no connectivity, audio is stored locally and queued for transcription once online; nurse can also type manually with zero degradation.

### 2.3 Visual Vitals Trends

- Doctor's encounter view shows sparkline/line charts of BP, temperature, weight across the patient's visit history.
- Charts pull from local IndexedDB first (instant), reconciled with server data once synced.
- Flags out-of-range trend patterns (e.g., 3 consecutive elevated BP readings) as a soft "chronic risk" badge — informational only, not diagnostic.

### Acceptance Criteria

- Triage flag computed and visible within 500ms of vitals entry, fully offline.
- Voice intake correctly structures at least 80% of clearly-spoken chief complaints in an internal test set (English + Pidgin).
- Vitals trend chart renders for any patient with ≥2 historical visits.

---

## 3. Queue Management UI

### POS-Style Interface

- Full-screen, kiosk-oriented layouts for three views: **Nurse Station**, **Doctor's Desk**, **Waiting Room Display**.
- Touch targets minimum 56×56px, high color contrast, large typography (min 18px body, 32px+ ticket numbers).
- Minimal text-entry surfaces; prefer tap-to-select (symptom chips, vitals number pads) over free-text wherever the data is structured.
- Color-coded ticket cards: green (routine), amber (priority), red (urgent) — color plus icon plus label, never color alone (accessibility for color-blind staff).

### Multilingual Audio Announcements

- Waiting Room View uses the Web Speech API (`speechSynthesis`) to audibly announce the next ticket number when called.
- Language/voice selectable per-PHC: English, Pidgin-accented English, Hausa, Yoruba, Igbo (subject to available browser TTS voices; fallback to English if a voice is unavailable, with a visible on-screen indicator of the current ticket regardless).
- Announcement repeats twice with a chime before and after, since patients may not be looking at the screen.

### Acceptance Criteria

- Queue state updates propagate to Waiting Room Display within 1 second of a nurse/doctor action, on the same LAN, without needing external internet.
- Announcement plays correctly for at least English and one Nigerian language voice in the demo environment.

---

## 4. Pharmacy & Stock Monitor

### Dispense & Deplete

- When a doctor finalizes a prescription, each prescribed item's `pharmacy_inventory.current_stock` is decremented automatically on save.
- Pharmacy staff view shows a **Dispense Queue**: patients with pending prescriptions, tap to confirm physical handover (separates "prescribed" from "actually given out" for audit accuracy).

### Low-Stock Alerts

- Dashboard (Head of PHC view) shows a live low-stock panel: any item where `current_stock <= low_stock_threshold`.
- Critical items (antimalarials, ARVs, core vaccines, family planning commodities) are flagged with higher urgency styling.
- "Request Restock" action generates a simple restock request record intended for LGA follow-up (logged, not necessarily transmitted automatically in v1).

### Acceptance Criteria

- Stock decrements correctly and atomically on prescription save, including when offline (resolved on sync — see Document 2 conflict resolution).
- Low-stock banner appears within the dashboard the moment a threshold is crossed, no page refresh required.

---

## 5. SMS Immunization & Antenatal Reminders

### User Journey

- When a child receives a vaccine dose, or a pregnant patient has an antenatal visit, the encounter form includes a "Schedule Next Dose/Visit" field with a suggested default interval (e.g., next polio dose in 4 weeks).
- System schedules an outbound SMS reminder to the guardian's/patient's phone number ~7 days before the due date, and a same-day reminder.
- SMS sent via Termii or Africa's Talking API (configurable provider), triggered by a scheduled job when the app has connectivity (this is server-side, not dependent on the clinic's local browser being open).

### Technical Requirements

- Reminder scheduling is written to `reminders` table at encounter-save time (works offline; reminder records sync to server like any other record).
- Actual SMS dispatch happens server-side via a cron/queue worker reading due reminders — not reliant on clinic connectivity, only on the server's.
- Message templates support English + one local language variant, kept short (≤160 chars where possible) for SMS cost control.

### Acceptance Criteria

- Reminder correctly scheduled and visible in an admin "Upcoming Reminders" list at encounter save time.
- Test SMS successfully dispatched via sandbox/test credentials for at least one provider.

---

## 6. Roles & Access

| Role                | Access                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| Receptionist        | Registration, search, family linking, queue check-in                       |
| Nurse               | Vitals entry, triage, voice intake, queue management                       |
| Doctor              | Full encounter view, vitals trends, prescriptions                          |
| Pharmacy Staff      | Dispense queue, stock levels                                               |
| Head of PHC / Admin | Dashboard, low-stock/restock, triage rule config, reminders admin, reports |

Authentication via Better Auth, session-based, with an offline-tolerant local session cache so staff aren't locked out mid-shift if connectivity drops.

---

## 7. Non-Functional Requirements

- **Offline durability:** the app must remain fully usable for registration, triage, queueing, vitals, and prescribing with zero internet connectivity for at least a full clinic day.
- **Power resilience:** app state must survive an abrupt browser/device restart (crash-safe local persistence — no partial writes lost).
- **Low-literacy tolerance:** every primary action reachable via icon + large tap target; text-heavy screens avoided for staff-facing routine flows.
- **Data privacy:** patient data stored locally is not encrypted-at-rest in v1 (acceptable for hackathon scope) but this is explicitly flagged as a v2 requirement (device-level encryption / IndexedDB encryption wrapper) given PHI sensitivity.
- **Kiosk deployment:** packaged via Tauri as a locked full-screen desktop app for shared clinic terminals.

---

## 8. Explicit Non-Goals (v1)

- No formal EMR interoperability (e.g., HL7/FHIR export) — out of scope for hackathon prototype.
- No clinical diagnostic decision support beyond the stated triage flagging and chronic-trend badges; ClinicFlow does not diagnose.
- No billing/insurance module.
