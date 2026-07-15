# Remaining Tasks to Completion

## 1. Registration Flow & Family Grouping UI

- **POS-style Registration Form**: Build offline-first form targeting `patientStore.create()`.
- **QR Generation**: Integrate `qrcode` to generate and print patient QR cards natively in the browser.
- **QR Scanning**: Integrate `qr-scanner` for webcam scanning, triggering an instant `findByClinicId()` lookup.
- **Family Grouping UI**: Build UI to link patients (`parent`, `child`, `sibling`) and display a comprehensive Family Panel view on patient profiles.

## 2. Queue Management & Triage UI

- **Nurse Station View**: UI to triage patients, enter vitals, and auto-evaluate against the local `triageRules` engine.
- **Doctor's Desk View**: View prioritized queue, review vitals trends via sparklines, and perform encounter (including voice intake).
- **Waiting Room Display**: Auto-updating public screen using the `speechSynthesis` Web Speech API to play TTS announcements (with a chime) when a ticket is called.

## 3. Server-Side SMS Dispatch Worker

- **Cron Job**: Implement a scheduled worker (`node-cron` or built-in interval) running on the Node backend.
- **Integration**: Periodically read the `reminders` table and dispatch SMS messages using Termii / Africa's Talking API for due immunizations and antenatal visits.

## 4. Infrastructure & Verification

- **LAN Relay Mode**: Setup and document local startup scripts so multiple Tauri instances can sync against a local SvelteKit server when internet is down.
- **Tauri Verification**: Run `pnpm build:all` to ensure the desktop binary builds, runs autonomously, accesses IndexedDB, and points correctly to the server.
- **Full Offline Demo Run**: End-to-end testing (airplane mode toggle) across registration, triage, queue, and sync.
