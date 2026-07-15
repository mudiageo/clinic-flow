# ClinicFlow — Rapid Prototyping Checklist & Development Timeline

**Deadline: July 13, 11:59 PM** (from today, July 1 — 12 build days). Full-featured scope, all 9 modules, real implementations throughout.

---

## Phase 1 — Database & Core CRUD (Days 1–2)

- [x] Scaffold SvelteKit project (`sv create`), install Drizzle, Postgres, Better Auth, shadcn-svelte, Tailwind v4 (see Agent Build Brief §2)
- [x] Enable experimental remote functions in `svelte.config.js` (`compilerOptions.experimental.async` + `kit.experimental.remoteFunctions`) — do this now, not when Phase 4's sync work starts, since query/command/prerender/form usage should be idiomatic from day one, not bolted on later
- [x] Write full `schema.ts` (Document 3) and run initial migration
- [x] Seed script: 1 demo PHC, 3 staff accounts (nurse/doctor/admin), ~20 demo patients across 5 families, baseline pharmacy inventory
- [x] Better Auth setup with role-based session (`staff.role` gate on routes)
- [x] Core CRUD remote functions (`query`/`command`/`form` — not `+server.ts` routes) for patients, encounters, vitals, queue tickets, pharmacy inventory, prescriptions, reminders, per Document 2 §2.2's pattern
- [ ] Basic admin dashboard shell (routing + layout only, no charts yet)

## Phase 2 — Offline Client UI & Local Storage (Days 3–5)

- [x] Dexie schema (Document 2 §1.2) — this file is imported _only_ by the state layer, never by components (Document 2 §0, rule 1)
- [x] `LocalCollection<T>` base class (Document 2 §3.2) — build this once, before any domain store, since every subsequent store extends it
- [x] Domain class stores extending `LocalCollection`: `patientStore`, `queueStore`, `vitalsStore`, `pharmacyStore`, `reminderStore` (Document 2 §3.3–3.4) — each is the _only_ way userland reads/writes that entity
- [ ] `SyncStore` class scaffold (Document 2 §2.3) — state fields (`online`, `pendingCount`) wired up now; the actual push/pull calls come in Phase 4 once `sync.remote.ts` exists, but the class and its reactive fields should exist early so the sync status indicator can be built and tested
- [ ] Registration flow UI (POS-style, large touch targets) — offline-functional end to end, built entirely against `patientStore` methods, zero direct Dexie access in components
- [ ] Family grouping UI: link patients, family panel view (via `patientStore.familyMembers()`)
- [ ] Queue Management UI: Nurse Station, Doctor's Desk, Waiting Room Display — three distinct routes/layouts, built against `queueStore`
- [x] Sync status indicator component (Document 2 §3.5) — build this early, keep it visible throughout all further UI work as a constant sanity check
- [ ] **Checkpoint:** grep the codebase for any component importing `$lib/local-db/db` or calling `liveQuery` directly — should return zero results outside `src/lib/state/`. Fix before moving to Phase 3.

## Phase 3 — Frictionless Access Integrations (Days 6–8)

- [x] QR generation on registration (client-side canvas render + print stylesheet, `qrcode` package)
- [x] Webcam QR scanning (`qr-scanner` lib) → instant profile load via `patientStore.findByClinicId()`
- [x] Vitals entry modal with real-time triage rules engine evaluation (client-side, reading `triageRules` synced locally, writing via `vitalsStore` and `queueStore.applyTriageFlag()`)
- [x] Triage rule config admin screen (Head of PHC can edit thresholds)
- [x] AI Voice Intake: Hold-to-Speak recording, server-side remote `command` wrapping the Gemini structured-extraction call (never call Gemini from the client — Agent Build Brief §5.3), review-before-save UI
- [x] Vitals trend charts (sparkline component, reads from `vitalsStore.items`, not Dexie directly)
- [x] Web Speech API queue announcements, language-selectable, chime + repeat
- [x] Pharmacy dispense queue + dispense-and-deplete flow (delta-based decrement via `pharmacyStore`, works offline, delta reconciled server-side in Phase 4)
- [x] Low-stock dashboard panel + restock request action
- [x] SMS reminder scheduling UI (encounter form "next dose" field) + reminders admin list, backed by `reminderStore`

## Phase 4 — Sync Engine & Kiosk Deployment (Days 9–11) ✅ Completed

- [x] `src/routes/sync/sync.remote.ts`: `pushOperations` (command), `pullChanges` (query), `getQueueUpdates` (query.live) — Document 2 §2.2
- [x] Wire `SyncStore.flush()` to call `pushOperations`/`pullChanges` on the 30s timer and connectivity events (Document 2 §2.3)
- [x] `LiveQueueStore` consuming `getQueueUpdates` for cross-device Waiting Room propagation (Document 2 §3.7)
- [x] Conflict resolution: LWW default, delta merge for stock, urgency-override for triage (Document 2 §2.4)
- [x] Sync Conflicts admin panel for the rare unresolved case
- [x] Tauri wrapper: `adapter-static` swap, full-screen kiosk lock, app icon, auto-launch config (Agent Build Brief §5.7)
- [ ] LAN relay mode for multi-device same-clinic sync when internet is down: the relay serves the same `sync.remote.ts` functions locally (Document 2 §3.7)
- [ ] Server-side SMS dispatch worker (cron/queue reading due `reminders`, Termii/Africa's Talking sandbox integration) — this is a scheduled job, not a client-invoked remote function, since nothing on the client triggers it
- [ ] `pnpm tauri build` — verify installer/binary runs standalone and correctly reaches the deployed sync server
- [ ] Full offline demo run-through: airplane mode toggle test across registration → triage → queue → prescription → reconnect → verify sync, including a second device picking up the change via `getQueueUpdates`

## Day 12 — Buffer, Polish, Demo Video

- [ ] Bug bash across all modules
- [ ] Record demo video: the offline "wow moment" (working online, cut Wi-Fi mid-session, continue working, reconnect, show sync completing across two devices) is the centerpiece — script this shot explicitly
- [ ] Write up project details/submission form content
- [ ] Submit via the Google Form before 11:59 PM

---

## Cross-Cutting Notes

- **Build the sync status indicator and offline write-path in Phase 2, not later.** Every subsequent feature depends on this foundation being solid — retrofitting offline-first onto features built network-first is the single biggest risk to this timeline.
- **Enforce the class-store boundary from Phase 2 onward.** If any later-phase feature reaches for Dexie directly because "it's faster right now," that's the same kind of shortcut that causes painful rework later — route it through the relevant store class instead, even under time pressure.
- **Triage rules as data (not hardcoded conditionals)** should be respected from Phase 1 onward, even though the UI to edit them comes in Phase 3 — build the rules engine against the `triageRules` table from day one so you don't refactor mid-build.
- **Remote functions are an experimental SvelteKit feature.** If you hit a hard blocker or breaking change mid-build (Days 9–10 especially, when `sync.remote.ts` is being built out), the fallback is to reimplement the same three endpoints (`pushOperations`, `pullChanges`, `getQueueUpdates`) as plain `+server.ts` routes with `fetch()` calls from `SyncStore` — the request/response shapes in Document 2 §2.2 are designed to translate directly, so this is a mechanical swap, not a redesign, if it becomes necessary. Don't pre-emptively build both; only fall back if actually blocked.
- **AI voice intake and SMS reminders are the most likely to eat unexpected time** (external API integration, sandbox credential setup, transcription accuracy tuning). If you're behind by Day 8, these are the two features to timebox hardest — a working manual-entry fallback already exists for both, so a rough-but-functional AI/SMS pass is acceptable without threatening the rest of the demo.
- **Test the offline demo scenario early and often**, not just on Day 12 — "turn off Wi-Fi and keep working" needs to be rehearsed against real IndexedDB and `query.live` reconnect behavior, not assumed to work because the architecture doc says it should.
