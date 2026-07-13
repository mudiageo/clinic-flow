# ClinicFlow — Rapid Prototyping Checklist & Development Timeline

**Deadline: July 13, 11:59 PM** (from today, July 1 — 12 build days). Full-featured scope, all 9 modules, real implementations throughout.

---

## Phase 1 — Database & Core CRUD (Days 1–2)

- [ ] Scaffold SvelteKit project, install Drizzle, Postgres, Better Auth, shadcn-svelte, Tailwind v4
- [ ] Write full `schema.ts` (Document 3) and run initial migration
- [ ] Seed script: 1 demo PHC, 3 staff accounts (nurse/doctor/admin), ~20 demo patients across 5 families, baseline pharmacy inventory
- [ ] Better Auth setup with role-based session (`staff.role` gate on routes)
- [ ] CRUD API routes: patients, encounters, vitals, queue tickets, pharmacy inventory, prescriptions, reminders
- [ ] Basic admin dashboard shell (routing + layout only, no charts yet)

## Phase 2 — Offline Client UI & Local Storage (Days 3–5)

- [ ] Dexie schema (Document 2 §1.2) mirroring server schema
- [ ] Local write-path wrapper: every mutation writes to Dexie + `syncLog` first, always
- [ ] Svelte 5 `liveQuery` → rune bridge (Document 2 §3.2) for patients, queue, vitals
- [ ] Registration flow UI (POS-style, large touch targets) — offline-functional end to end
- [ ] Family grouping UI: link patients, family panel view
- [ ] Queue Management UI: Nurse Station, Doctor's Desk, Waiting Room Display — three distinct routes/layouts
- [ ] Sync status indicator component (Document 2 §3.5) — build this early, keep it visible throughout all further UI work as a constant sanity check

## Phase 3 — Frictionless Access Integrations (Days 6–8)

- [ ] QR generation on registration (client-side canvas render + print stylesheet)
- [ ] Webcam QR scanning (`qr-scanner` lib) → instant profile load
- [ ] Vitals entry modal with real-time triage rules engine evaluation (client-side, reading `triageRules` synced locally)
- [ ] Triage rule config admin screen (Head of PHC can edit thresholds)
- [ ] AI Voice Intake: Hold-to-Speak recording, Gemini structured-extraction call, review-before-save UI
- [ ] Vitals trend charts (sparkline component, pulls from local Dexie history)
- [ ] Web Speech API queue announcements, language-selectable, chime + repeat
- [ ] Pharmacy dispense queue + dispense-and-deplete flow (delta-based decrement, works offline)
- [ ] Low-stock dashboard panel + restock request action
- [ ] SMS reminder scheduling UI (encounter form "next dose" field) + reminders admin list

## Phase 4 — Sync Engine & Kiosk Deployment (Days 9–11)

- [ ] Server-side `/api/sync/push` and `/api/sync/pull` endpoints (Document 2 §2.3–2.6)
- [ ] Conflict resolution: LWW default, delta merge for stock, urgency-override for triage
- [ ] Sync Conflicts admin panel for the rare unresolved case
- [ ] LAN relay mode for multi-device same-clinic sync when internet is down (Document 2 §3.3)
- [ ] Server-side SMS dispatch worker (cron/queue reading due `reminders`, Termii/Africa's Talking sandbox integration)
- [ ] Tauri wrapper: full-screen kiosk lock, app icon, auto-launch config
- [ ] `pnpm exec tauri build` — verify installer/binary runs standalone
- [ ] Full offline demo run-through: airplane mode toggle test across registration → triage → queue → prescription → reconnect → verify sync

## Day 12 — Buffer, Polish, Demo Video

- [ ] Bug bash across all modules
- [ ] Record demo video: the offline "wow moment" (working online, cut Wi-Fi mid-session, continue working, reconnect, show sync completing) is the centerpiece — script this shot explicitly
- [ ] Write up project details/submission form content
- [ ] Submit via the Google Form before 11:59 PM

---

## Cross-Cutting Notes

- **Build the sync status indicator and offline write-path in Phase 2, not later.** Every subsequent feature depends on this foundation being solid — retrofitting offline-first onto features built network-first is the single biggest risk to this timeline.
- **Triage rules as data (not hardcoded conditionals)** should be respected from Phase 1 onward, even though the UI to edit them comes in Phase 3 — build the rules engine against the `triageRules` table from day one so you don't refactor mid-build.
- **AI voice intake and SMS reminders are the most likely to eat unexpected time** (external API integration, sandbox credential setup, transcription accuracy tuning). If you're behind by Day 8, these are the two features to timebox hardest — a working manual-entry fallback already exists for both, so a rough-but-functional AI/SMS pass is acceptable without threatening the rest of the demo.
- **Test the offline demo scenario early and often**, not just on Day 12 — "turn off Wi-Fi and keep working" needs to be rehearsed against real IndexedDB behavior, not assumed to work because the architecture doc says it should.
