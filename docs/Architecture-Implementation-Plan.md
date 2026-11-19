# ClinicFlow: Multi-Tier Architecture & Sync Implementation Plan

> **Status:** Living document — last verified 2026-11-19.
>
> This document separates **what is implemented today** from the **planned / roadmap** end-state. The original Edge-to-Cloud design remains the long-term target; the sections marked **Planned** are aspirational and must not be read as shipped behaviour. For authoritative detail on the parts that are live, see:
>
> - [`docs/features/shared-realtime-sync-plan.md`](features/shared-realtime-sync-plan.md) — current sync/realtime architecture
> - [`docs/user-guides/realtime-sync.md`](user-guides/realtime-sync.md) — user-facing sync behaviour
> - [`docs/data-model/client-server-field-mapping.md`](data-model/client-server-field-mapping.md) — client/server schema adapter
> - [`docs/LAN-Setup-Guide.md`](LAN-Setup-Guide.md) — local/LAN deployment
> - [`docs/Technical-Implementation-Roadmap.md`](Technical-Implementation-Roadmap.md) — original phase-by-phase build plan

---

## Part A — Current implementation (shipped)

### A.1 Runtime targets

One SvelteKit codebase serves the roles in a clinic; what changes between deployments is the database dialect and who the client points at.

| Target                     | Runtime                                                    | Database                                         | Who uses it                                           |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| **Client PWA / Tauri app** | Browser on Android tablets, or Tauri desktop/WebView       | Dexie (IndexedDB) — local-first                  | CHEWs, nurses, doctors, pharmacy, admin               |
| **Clinic server**          | Node.js process (can run on a Windows/Linux PC on the LAN) | libSQL/SQLite when `DATABASE_URL` is a file path | One per clinic; tablets on the same Wi-Fi point to it |
| **Cloud server**           | Node.js process (managed/hosted)                           | PostgreSQL when `DATABASE_URL` is `postgres://…` | Backup, cross-PHC superadmin, analytics               |

The dialect is selected at runtime in `src/lib/server/db/index.ts` from the `DATABASE_URL` prefix, using two Drizzle schemas: `schema.ts` (PostgreSQL) and `schema.sqlite.ts` (libSQL/SQLite). The exact same build runs either mode with no code changes.

### A.2 Deployment & delivery today

- The app is built with the **Vite+** toolchain (`vp build`) and served as a normal SvelteKit process. Local clinics run it against a `file:`/`libsql:`/`*.db` database on an always-on PC; cloud deployments run it against PostgreSQL.
- **Tauri** currently packages the **client** application for desktop/mobile targets (cross-platform builds are produced in CI). It does **not** yet embed a compiled Bun server sidecar — that remains planned (§B.2).
- A local server advertises itself on the LAN with **mDNS** via `bonjour-service` in `src/hooks.server.ts`, but **only** when it is running against a local database. It publishes as `clinicflow.local` with the configured port.

### A.3 Zero-config networking & device routing (current)

- Tablets discover the clinic server on `/connect` by probing `http://clinicflow.local` across the known ClinicFlow and dev ports (`27341`, `27342`, `5173`, `3000`, `8080`, `80`, `4173`); a manual IP fallback is also available.
- The chosen origin is stored as `clinicflow_server_url` in `localStorage` (and cached for the service worker). `src/hooks.client.ts` intercepts client fetches to `/_app/remote/` and rewrites them to that origin, so remote-function calls reach the selected clinic server.
- Vite dev/preview set `server.host` / `allowedHosts` so LAN and `clinicflow.local` access work; `hooks.server.ts` applies CORS for Tauri origins (`tauri://localhost`, `asset://localhost`) and localhost dev.
- **Field/cellular routing to a cloud node is not automatic today** — the stored server URL is the single active target. Dynamic local-vs-cloud switching is planned (§B.4).

### A.4 Sync pipeline (current)

The authoritative record is the server database plus a durable sync/outbox record. Realtime delivery is only an accelerator. See `docs/features/shared-realtime-sync-plan.md` for the full design.

```
local mutation (component → state store)
  → Dexie table row + syncLog entry (same transaction)
  → pushOperations  (src/routes/sync/sync.remote.ts)
      → validate + authorize + tenant-scope from session
      → database transaction + durable outbox row (monotonic PHC version)
      → commit
      → publish minimal PHC-scoped wake-up signal
  → one shared watchRealtimeSignals query.live per signed-in client
  → debounced pullChanges(lastCursor)  (durable, cursor-based, idempotent)
  → apply batches to IndexedDB atomically with the cursor
  → existing Dexie-backed domain stores update reactively
  → fallback 15–30s reconciliation + reconnect catch-up
```

Key properties that are live:

- **One** wake-up stream per client, not one per table; signals carry no patient data.
- **Monotonic, server-assigned versions** replace timestamp cursors; the applied cursor is stored with its batch.
- **Idempotent retries** use durable operation IDs (including inventory deltas), so a lost response cannot double-apply a mutation.
- **Tenant scope** is derived from the authenticated session, never a client-supplied `phcId`.
- **Operation ordering** pushes parent records (`patients`, `encounters`) before dependents, and missing encounter parents are backfilled durably for legacy ops.
- **Conflict recovery** preserves the rejected local payload and exposes Retry Local / Discard Local in Admin → Sync Engine.
- **Connection state** (`Live`/`Connecting`/`Stale`/`Offline`) and **data freshness** (`Current`/`Syncing`/`Stale data`/`Cached`/`Sync error`) are shown separately — `Live` does not imply current data.
- A client/server field-mapping adapter (`src/lib/seed/adapters.ts`, documented in `docs/data-model/client-server-field-mapping.md`) bridges the historical Dexie/Drizzle field and type drift.
- The service worker does not cache live-query responses; `Cache-Control: no-store` is preserved.

### A.5 Security, safety & data handling (current)

- Authentication is Better Auth; role hierarchy ranges from JCHEW/CHEW up through Doctor, Pharmacist, Admin (PHC) and Superadmin (platform).
- Superadmins can enable/restrict/lock features platform-wide; local Admins can toggle features for their PHC unless locked.
- AI is advisory only: the provider chain is Gemini (remote, when available) with a WebLLM/WebGPU offline fallback; every AI output requires human confirmation and shows `<AiDisclaimer>`. No AI writes a diagnosis, prescription, or triage decision autonomously.
- Known deliberate exception: a universal offline `0000` PIN fallback still exists in `src/routes/login/+page.svelte` and is tracked as unchecked **`ST-14`** in `docs/features/route-fidelity-cleanup-tasks.md` (remove the auth backdoor). It is documented here as deferred technical debt, not an endorsed auth design.

---

## Part B — Planned / roadmap (not yet implemented)

Everything in this part is preserved from the original Edge-to-Cloud plan and related roadmaps. It is the intended end-state, not current behaviour.

### B.1 Architectural hierarchy (target)

- **Tier 1: Master Discovery Node (ClinicFlow HQ)**
  - _Role:_ A lightweight registry mapping `provisioning_codes` to specific Client Nodes. Holds zero patient data (PII).
- **Tier 2: Client Node (e.g., FMoH Cloud Server)**
  - _Role:_ The main PostgreSQL database for a specific client. Hosts the Superadmin dashboard (Outbreak Radar, DHIS2 export). _(The cloud server and these dashboards largely exist today; the “Client Node” is the target naming/registry role.)_
- **Tier 3: Local Clinic Server (The Edge Hub)**
  - _Role:_ A local machine running a Bun-compiled standalone executable or a Tauri Sidecar, using a lightweight **SQLite** database as the "mini-cloud" for that clinic. _(Running a local SQLite server exists today; the Bun-compiled/Sidecar delivery is planned.)_
- **Tier 4: The Client PWA (Tablets)**
  - _Role:_ The SvelteKit frontend installed on Android tablets using IndexedDB (Dexie). _(Implemented today.)_

### B.2 Server deployment & delivery (planned)

Rural clinic IT staff cannot be expected to configure Node.js or PostgreSQL. The plan is to ship the Local Clinic Server using two zero-configuration methods, both built from the existing SvelteKit backend via Bun adapters (see `docs/Technical-Implementation-Roadmap.md`, Phase 1):

1.  **The Tauri Sidecar (Desktop Workstations):** bundle the compiled SvelteKit/Bun binary inside the ClinicFlow Tauri desktop app so the local sync server starts silently in the background when the OIC opens it.
2.  **The Standalone Executable (Headless/Mini PCs):** a single dependency-free `.exe`/Linux binary (`bun build --compile`, likely via `svelte-smol` or a configured `svelte-adapter-bun` wrapper to bundle static assets) that hosts the SQLite DB and sync engine on first run, generating a local `clinicflow_data.db`.

### B.3 Zero-config networking & enrollment (planned)

- **mDNS & IP fallback:** already partly delivered (§A.3). The target plan additionally specifies a Bun-compatible mDNS library (e.g. `multicast-dns`) and auto-targeting `http://clinicflow.local`.
- **Provisioning (6-digit code):** a `/provision` flow where the admin enters a 6-digit code; the Master Node (Vercel) returns the specific Client Node URL (e.g. `fmoh.clinicflow.com`), saved to `localStorage`, triggering the initial downward sync.
- **Partial replication:** download only the data relevant to that PHC into local SQLite to prevent data bloat.
- **Tablet lockdown:** the Welcome screen locks tablets to the clinic, downloads the encrypted staff roster, and makes authentication 100% local.

### B.4 Advanced sync mechanics & edge cases (planned)

The target design dynamically routes data: sync to the Local Server when mDNS/local IP is available; when out in the field on cellular, sync directly to the Cloud Node, which then pushes down to the Local Server. (Today the server URL is a single fixed target — §A.3.) The intended safeguards:

1.  **Hybrid Logical Clocks (HLCs):** stop relying on tablet wall clocks (`Date.now()`), which reset when batteries die. Records carry `{ physicalTime, counter, nodeId }` so the CRDT engine sequences events correctly under severe clock drift.
2.  **Schema Versioning & OTA Updates:** every sync payload/header carries `app_version` (e.g. `x-app-version: 1.2.0`). If a clinic has been offline across a schema change, the Cloud Node rejects the sync (e.g. `426 Upgrade Required`) and forces a Tauri Over-The-Air update first.
3.  **Dual-Queue Syncing:** two outbox stores — `queue_critical` (lightweight JSON: vitals, triage, prescriptions) and `queue_blobs` (images/audio, base64/Blob) — with resumable chunking and a worker that drains critical data first so a slow 3G upload never blocks life-saving records.
4.  **Clinical Conflict Resolution:** the CRDT engine merges concurrent edits mathematically (e.g. two nurses editing an allergy list), flags the result `requires_audit: true`, and surfaces it in an OIC/Doctor-only Audit Inbox where a human clicks "Approve Clinical State" after review.
5.  **Durable versioned reconciliation (now shipped):** monotonic versions, idempotent operation IDs, atomic cursor persistence, and shared wake-up plus polling recovery — originally listed here as the fifth safeguard and now implemented (§A.4).

### B.5 Broader roadmap (cross-referenced, not duplicated)

These planned items live in their authoritative docs and are intentionally not restated in full here:

- **AI features:** see `docs/AI-Features-Implementation-Plan.md` — Dr. Assist, RxBrain, SOAP notes, and Risk Stratification are complete; Outbreak Radar, AI Smart Reminder Scheduler, AI Report Narrative, and AI Triage Optimizer remain planned, under the global Superadmin/Admin control hierarchy and mandatory AI-safety rules.
- **Infrastructure & UX:** see `docs/ROADMAP.md` — marketing site overhaul, Global Persistent Clinical Copilot (Svelte 5 global runes + agentic function calling), and UX QoL items (admin table sorting/filtering, unified Patient Timeline, kiosk focus/keyboard improvements, explicit dark-mode toggle).
- **Original phase plan:** see `docs/Technical-Implementation-Roadmap.md` for the full phased specification of §B.1–B.4, and `docs/startup-wiki/05-ClinicFlow-End-to-End-Ref.md` for the intended end-to-end data flow (which still describes the target CRDT/HLC model).
