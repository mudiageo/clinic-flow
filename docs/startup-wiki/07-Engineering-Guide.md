# ClinicFlow Engineering Guide

_Part of the Startup Foundation documentation. Living document — update as the architecture evolves._
_Audience: new engineers, contractors, the founder reviewing their own decisions, grant/investor due diligence._
_Last verified: 2026-11-19._

> This guide describes **what is implemented today**. Items that are designed but not yet built are labelled **Planned**. For authoritative detail see [`AGENTS.md`](../../AGENTS.md), [`docs/features/shared-realtime-sync-plan.md`](../features/shared-realtime-sync-plan.md), [`docs/user-guides/realtime-sync.md`](../user-guides/realtime-sync.md), [`docs/data-model/client-server-field-mapping.md`](../data-model/client-server-field-mapping.md), the architecture plan in [`docs/Architecture-Implementation-Plan.md`](../Architecture-Implementation-Plan.md), and the demo-prep docs [`docs/Knowledge-Showcase-Speaker-Script.md`](../Knowledge-Showcase-Speaker-Script.md) and [`docs/user-guides/anc-record-keeping.md`](../user-guides/anc-record-keeping.md).

---

## 1. What ClinicFlow Is (Engineering Perspective)

ClinicFlow is a **local-first, multi-device clinical workflow system** that runs primarily on a fleet of Android tablets inside a clinic's local Wi-Fi network. It has three runtime targets that share one codebase:

| Target                           | Runtime                                                              | Database                                                                      | Who uses it                                    |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| **PWA / Tauri client**           | Browser on Android tablets; Tauri desktop/WebView                    | Dexie (IndexedDB) — local                                                     | CHEWs, nurses, doctors, pharmacy               |
| **Clinic server (local master)** | Node.js process on an always-on PC (can run the same build as cloud) | libSQL/SQLite when `DATABASE_URL` is a file path (`file:`, `libsql:`, `*.db`) | One per clinic; tablets on the LAN point to it |
| **Cloud server**                 | Node.js process (managed/hosted)                                     | PostgreSQL when `DATABASE_URL` is `postgres://…`                              | Backup, cross-PHC superadmin, analytics        |

The same SvelteKit application serves all three. The runtime environment is detected from `DATABASE_URL` in `src/lib/server/db/index.ts` (file path = local/SQLite; `postgres://` = cloud/PG) and from private env via `$app/env/private` / `$app/env`. The toolchain is **Vite+** (`vp`), not bare pnpm/Bun (see §9).

**Planned delivery:** package the local server as a Bun-compiled standalone executable or a Tauri sidecar (§12 and `docs/Architecture-Implementation-Plan.md`, Part B).

---

## 2. Repository Structure

```
clinic-flow/
├── src/
│   ├── routes/
│   │   ├── (app)/          # Authenticated app shell — all clinical roles
│   │   │   ├── nurse/      # Queue board, patient registration, vitals
│   │   │   ├── doctor/     # Consultations, lab, patient records
│   │   │   ├── pharmacy/   # Dispensing, inventory, cold chain, restock
│   │   │   ├── admin/      # Settings, staff, sync, reports, outbreak radar
│   │   │   ├── superadmin/ # Cross-PHC: users, billing, epidemiology
│   │   │   ├── maternity/  # ANC records
│   │   │   ├── immunization/
│   │   │   ├── field/      # Field mode (offline-only, reduced UI)
│   │   │   └── families/[id]/
│   │   ├── (marketing)/    # Public site: landing, support docs, download
│   │   ├── sync/           # sync.remote.ts — pushOperations / pullChanges
│   │   ├── connect/        # Device discovery / onboarding (clinicflow.local probe)
│   │   ├── kiosk/          # Kiosk-mode waiting room display
│   │   ├── login/ / onboarding/ / welcome/ / waiting-room/
│   │   └── pitch/          # Demo / investor pitch pages (not clinical)
│   ├── lib/
│   │   ├── remote/         # All server-side logic (query / command / form)
│   │   ├── state/          # Svelte 5 runes-based reactive stores (Dexie)
│   │   ├── local-db/       # Dexie database initialisation (db.ts)
│   │   ├── sync/           # Durable sync helpers (outbox adapters, conflicts, wakeup)
│   │   ├── server/         # Server-only: auth, DB schema, Drizzle, seed, realtime hub
│   │   │   ├── auth.ts     # Better Auth instance
│   │   │   ├── realtime/   # Provider-neutral hub (hub.ts) + topics
│   │   │   ├── sync/       # Durable outbox writer (outbox.ts)
│   │   │   └── db/
│   │   │       ├── schema.ts       # Drizzle schema — PostgreSQL
│   │   │       ├── schema.sqlite.ts # Drizzle schema — libSQL/SQLite
│   │   │       ├── index.ts        # DB connection (dialect-aware)
│   │   │       └── seed.ts
│   │   ├── services/ai/    # AI provider abstraction
│   │   └── utils/          # date.ts, formatters, etc.
│   ├── hooks.server.ts     # mDNS broadcast, CORS, auth session
│   ├── hooks.client.ts     # Rewrites remote calls to stored clinic server URL
│   └── app.d.ts            # SvelteKit type augmentation
├── .github/workflows/      # build / release / nightly / init-android
├── docs/                   # Architecture, grants, startup wiki
└── grant-work/             # Grant application working directory (gitignored)
```

---

## 3. The Data Layer

### 3.1 Client: Dexie (IndexedDB)

Every piece of clinical data that a user creates on a tablet is **written to IndexedDB first**. The network is never in the write path. This is what makes the app work offline.

All Dexie access goes through **store classes** in `src/lib/state/`. Each store extends `LocalCollection<T>` — a base class that wraps Dexie with reactive Svelte 5 state (`$state`, `$derived`).

```
Never import Dexie directly in a component.
Always use the stores: patientStore, queueStore, vitalsStore, etc.
```

The Dexie database is initialised in `src/lib/local-db/db.ts`. All table schemas are defined there. When you add a new entity, add a Dexie table here and a corresponding store in `src/lib/state/<feature>.svelte.ts`.

### 3.2 Server: Drizzle ORM (dual schema, dialect-aware)

The server database uses **Drizzle ORM** with a runtime dialect switch in `src/lib/server/db/index.ts`:

| `DATABASE_URL`                      | Dialect       | Driver                                                 | Schema file        | Used in                        |
| ----------------------------------- | ------------- | ------------------------------------------------------ | ------------------ | ------------------------------ |
| `file:`, `libsql:`, or `.db` suffix | libSQL/SQLite | `@libsql/client` via `drizzle-orm/libsql`              | `schema.sqlite.ts` | Local clinic server, local dev |
| `postgres://` / `postgresql://`     | PostgreSQL    | `postgres` (postgres.js) via `drizzle-orm/postgres-js` | `schema.ts`        | Cloud, production              |

`src/lib/server/db/queries/_core.ts` exposes `getTable()` to resolve the correct table object for the active dialect. Schema drift between Dexie and Drizzle is bridged by `src/lib/seed/adapters.ts` (`toServerRow` / `toClientRow`), documented in `docs/data-model/client-server-field-mapping.md`.

### 3.3 Sync engine & realtime (current)

The sync store is `src/lib/state/sync.svelte.ts`. It:

1. Appends every local create/update/delete to a durable **operation log** (`syncLog`) in IndexedDB, in the same transaction as the record write.
2. Calls `pushOperations` (`src/routes/sync/sync.remote.ts`) with a debounced immediate flush plus periodic reconciliation (15–30s). Operations are pushed parent-first (`patients`, `encounters` before dependents).
3. Calls `pullChanges` with a monotonic, server-assigned version cursor; batches are applied to IndexedDB atomically with the cursor.
4. Uses `BroadcastChannel` (`clinicflow_sync_channel`) to coordinate across browser tabs and trigger immediate sync across tabs.
5. Subscribes to a **single** `watchRealtimeSignals` `query.live` stream (`src/lib/remote/realtime-sync.remote.ts`) per signed-in client. Server mutations publish a minimal **PHC-scoped** signal through the provider-neutral hub (`src/lib/server/realtime/hub.ts`); the signal carries no patient data and only tells the client to pull changes.
6. Tracks **connection** and **data-freshness** separately (`Live`/`Connecting`/`Stale`/`Offline` vs `Current`/`Syncing`/`Stale data`/`Cached`/`Sync error`). `Live` does not mean data is current; polling remains a mandatory recovery path.

This architecture replaced an earlier timestamp-cursor implementation. See `docs/features/shared-realtime-sync-plan.md` and `docs/user-guides/realtime-sync.md`. The LAN sync path is **implemented** (see §7) — the former "cloud-only" limitation no longer applies.

---

## 4. Remote Functions — The Server-Side Pattern

**Do not use `+page.server.ts` or `+layout.server.ts`.** All server-side logic lives in `src/lib/remote/*.remote.ts` files (plus the sync exception `src/routes/sync/sync.remote.ts`) and uses SvelteKit's experimental remote functions API:

```ts
// src/lib/remote/patients.remote.ts
import { query, command } from '$app/server';

export const getPatient = query(async (id: string) => {
	// runs on the server, result is sent to the client
	return db.select().from(patients).where(eq(patients.id, id));
});

export const updatePatient = command(async (data: PatientUpdate) => {
	// mutation — runs on server, returns void or result
	await db.update(patients).set(data).where(eq(patients.id, data.id));
});
```

```svelte
<!-- In +page.svelte -->
<script lang="ts">
	import { getPatient } from '#lib/remote/patients.remote.ts';
	const patient = await getPatient(params.id); // top-level await in Svelte 5
</script>
```

Remote files by domain:

| File                             | Covers                                                    |
| -------------------------------- | --------------------------------------------------------- |
| `admin.remote.ts`                | PHC settings, staff management                            |
| `ai.remote.ts`                   | AI calls (server-side)                                    |
| `announcements.remote.ts`        | Platform announcements                                    |
| `audit.remote.ts`                | Audit log reads                                           |
| `auth.remote.ts`                 | Login, session, password                                  |
| `cloud-uplink.remote.ts`         | Cloud sync triggers                                       |
| `contact.remote.ts`              | Contact/enquiry submission                                |
| `devices.remote.ts`              | Device enrolment                                          |
| `encounters.remote.ts`           | Doctor consultations, diagnoses                           |
| `epidemiology.remote.ts`         | Outbreak pattern queries (superadmin)                     |
| `export.remote.ts`               | Data export (CSV, DHIS2)                                  |
| `kiosk.remote.ts`                | Waiting room display data                                 |
| `lab-requests.remote.ts`         | Lab orders and results                                    |
| `patients.remote.ts`             | Patient CRUD, search                                      |
| `permissions.remote.ts`          | Role and permission management                            |
| `pharmacy.remote.ts`             | Dispensing, inventory, restock                            |
| `queue.remote.ts`                | Queue operations (admit, call, complete)                  |
| `realtime-sync.remote.ts`        | `watchRealtimeSignals` shared wake-up stream              |
| `releases.remote.ts`             | Version/release info                                      |
| `reminders.remote.ts`            | Appointment reminder CRUD                                 |
| `server-status.remote.ts`        | Health check, sync status                                 |
| `settings.remote.ts`             | System-wide settings                                      |
| `setup.remote.ts`                | First-run onboarding                                      |
| `staff.remote.ts`                | Staff profiles, invites                                   |
| `superadmin.remote.ts`           | Cross-PHC admin operations                                |
| `src/routes/sync/sync.remote.ts` | Durable `pushOperations` / `pullChanges` (sync exception) |

Live queries that need a stream use `query.live` (`watchAnnouncements`, `watchRealtimeSignals`), authenticate **before** the first yield, and clean up subscriptions in `finally`.

---

## 5. Authentication

Authentication uses **Better Auth** (`src/lib/server/auth.ts`). Session management is server-side. The client reads the session via `src/lib/state/auth.svelte.ts`.

Role hierarchy (lowest to highest trust):

```
JCHEW < CHEW < CHO < Nurse < Midwife < Doctor < Pharmacist < Lab < EHO
< Admin (PHC-level) < Superadmin (platform-wide)
```

Permission checks happen at two levels:

1. **Server:** in remote functions (check session role before returning data)
2. **Client:** in the `(app)` layout, which redirects unauthenticated users and hides role-specific nav items

The permission system is managed via `admin/permissions/` (per-PHC) and `superadmin/permissions/` (global locks). Audit logs of permission changes are stored server-side.

**Deferred security debt:** a universal offline `0000` PIN fallback still exists in `src/routes/login/+page.svelte` and is intentionally tracked as unchecked **`ST-14`** in `docs/features/route-fidelity-cleanup-tasks.md`. Do not remove it here without following the feature/tech-debt protocol; see §12.

---

## 6. AI Architecture

The AI service (`src/lib/services/ai/ai.service.ts`) uses a **provider chain with automatic fallback**:

```
1. RemoteGeminiProvider  — Gemini API, fast, requires internet
   ↓ (if unavailable or fails)
2. LocalWebLLMProvider   — WebLLM via WebGPU, fully offline, requires initial 1–4GB model download
```

`isAvailable()` is called before each provider attempt. The service exposes `structureIntake(transcript)` which takes a voice/text transcript and returns structured patient intake fields.

**AI safety rule (non-negotiable):** The AI structures intake data and surfaces suggestions. It never writes a diagnosis, prescription, or triage decision autonomously. Every AI output requires a human to review and confirm before it is saved to the database. The `<AiDisclaimer>` component must appear on every screen that displays AI output.

**Planned: local fine-tuned model**
The R&D milestone funds fine-tuning MedGemma 4B using QLoRA on clinical override data (cases where a doctor corrected the AI's initial suggestion). The resulting quantized model (<4GB) will run via `@mlc-ai/web-llm` with a WebGPU backend, replacing the cloud Gemini call for intake structuring. No audio or patient data leaves the device. See `docs/AI-Features-Implementation-Plan.md` for the full AI feature checklist.

---

## 7. Networking, mDNS & LAN Routing

When the server detects it is running against a local database (`DATABASE_URL` starts with `file:`/`libsql:` or ends in `.db`), it broadcasts itself on the LAN via `bonjour-service` in `src/hooks.server.ts`:

```ts
bonjour.publish({
	name: 'ClinicFlow Master Server',
	type: 'http',
	port,
	host: 'clinicflow.local',
	txt: { version: '1', app: 'clinicflow' }
});
```

Tablets on the same Wi-Fi network resolve `clinicflow.local` on `/connect` (scanning ports `27341`, `27342`, `5173`, `3000`, `8080`, `80`, `4173`), with a manual IP fallback. The selected origin is saved as `clinicflow_server_url` in `localStorage`; `src/hooks.client.ts` rewrites `/_app/remote/` fetches to that origin so clinical reads/writes reach the clinic server. Vite dev/preview enable `server.host` and `allowedHosts` for LAN and `clinicflow.local` access.

CORS in `hooks.server.ts` allows Tauri origins (`tauri://localhost`, `asset://localhost`) and localhost for dev.

**Planned:** dynamic local-vs-cloud routing — sync to the LAN server when available, fall back to the cloud node while in the field, then push down. Today the stored server URL is the single active target.

---

## 8. CI/CD Pipeline

The current workflows use **Vite+ / Node**, not a Bun-only flow:

### Build workflow (`.github/workflows/build.yml`)

Triggered by manual dispatch with `tag` / `prerelease` / `release_name` inputs (and by the release workflow). Uses `voidzero-dev/setup-vp`, `dtolnay/rust-toolchain`, Java + Android SDK, `vp install`, and `tauri-apps/tauri-action@v1` to produce **cross-platform** releases: Windows, macOS (aarch64 + x86_64), Linux (x86_64 + ARM), and Android APKs (aarch64, armv7, x86_64). Nightly builds use the `nightly` channel. A `update-nightly-pointer` job recreates the static `nightly` release/tag to always point at the latest build, and older nightly releases are pruned.

### Release workflow (`.github/workflows/release.yml`)

Runs `changesets/action@v2` (`pnpm run version` / `pnpm run release`) to version the package and open/update a "Version Packages" PR; after publishing it dispatches the Tauri build workflow with the new tag.

### Nightly workflow (`.github/workflows/nightly.yml`)

Scheduled + manual. Installs deps with pnpm, enters Changesets nightly pre-release mode, bumps a timestamped `…-nightly.YYYYMMDD` version, and triggers the build workflow.

### Android init workflow (`.github/workflows/init-android.yml`)

Manual `vp exec tauri android init`, opens a PR with the generated native project via `peter-evans/create-pull-request`.

### Secrets

The workflows reference only `secrets.GITHUB_TOKEN` (provided by GitHub Actions). Any platform signing/keystore configuration required for a signed APK is an environment/deployment concern and is not wired through repository secrets in the current workflows.

---

## 9. Development Setup

```bash
# Clone and install (Vite+)
git clone https://github.com/mudiageo/clinic-flow
cd clinic-flow
vp install

# Copy environment file
cp .env.example .env
# Fill in: DATABASE_URL, BETTER_AUTH_SECRET, GEMINI_API_KEY, etc.

# Run development server
vp dev

# Type check
vp check          # svelte-check + service-worker check

# Lint (format + Oxlint + Oxvelte)
pnpm lint

# Tests
vp test           # unit tests (vite-plus/test)
```

**Local SQLite dev:** set `DATABASE_URL=file:./local.db` to run against a local SQLite file without Postgres — the ORM switches automatically. If setup, runtime, or package-manager behaviour looks wrong, run `vp env doctor` and include its output when asking for help.

Back-end scripts (`db:push`, `db:seed`, `db:generate`, `db:migrate`, `db:studio`) are declared in `package.json` and run through `vp`/`vpx`.

---

## 10. Engineering Conventions

| Rule                            | Detail                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component file names            | kebab-case only: `patient-card.svelte`, not `PatientCard.svelte`                                                                                        |
| Icons                           | `@lucide/svelte` exclusively. Never `lucide-svelte`.                                                                                                    |
| Date formatting                 | Use `#lib/utils/date.ts` (Intl API). Never `date-fns`.                                                                                                  |
| Imports / aliases               | Use `#lib/*` and generated SvelteKit aliases; not `$lib/*`.                                                                                             |
| Env access                      | Use `$app/env/private` and `$app/env`; not `$env/static/private`.                                                                                       |
| Database access from components | Never use Dexie directly. Always use stores from `#lib/state/`.                                                                                         |
| Server logic                    | Always in `#lib/remote/*.remote.ts` (or `src/routes/sync/sync.remote.ts`). Never in `+page.server.ts`.                                                  |
| Svelte 5 dynamic components     | Use `<variable.Component />` not `<svelte:component this={...}>`                                                                                        |
| State                           | Svelte 5 runes only (`$state`, `$derived`, `$effect`). No Svelte 4 stores.                                                                              |
| Realtime                        | One shared `watchRealtimeSignals` stream only; never add per-table live streams for ordinary CRUD. Realtime is an accelerator, not the source of truth. |
| AI output                       | Always gated by a human confirmation step. Always show `<AiDisclaimer>`.                                                                                |
| UI components                   | Use `shadcn-svelte` and `more-shadcn-svelte` before building custom.                                                                                    |
| Tests                           | Unit tests via `vite-plus/test`; browser tests only when a browser runner is explicitly available.                                                      |
| New features                    | Must follow the Feature Implementation Protocol in `AGENTS.md` (permissions → AI safety → plan.md + tasks.md).                                          |

---

## 11. Adding a New Feature: Step-by-Step

1. **Define permissions** — which roles can access this? Can the superadmin lock it?
2. **Define AI safety** — does this feature involve AI? If yes, write the disclaimer text and the human-confirmation gate before touching code.
3. **Create `docs/features/<feature>-plan.md`** and `<feature>-tasks.md` (see `AGENTS.md`).
4. **Add a Dexie table** in `src/lib/local-db/db.ts` if you need local storage.
5. **Add a state store** in `src/lib/state/<feature>.svelte.ts` extending `LocalCollection<T>`.
6. **Add remote functions** in `src/lib/remote/<feature>.remote.ts` for server queries/mutations.
7. **Add Drizzle schema** in **both** `src/lib/server/db/schema.ts` and `src/lib/server/db/schema.sqlite.ts` if you need a server-side table.
8. **Create the route** under the appropriate role folder in `src/routes/(app)/`.
9. **Update the nav** in the `(app)` layout to show the link for the correct roles.
10. **Write unit tests** (`vite-plus/test`) covering the happy path and offline/conflict behaviour. Add browser tests only when a browser runner is explicitly available (no Chromium is assumed in this environment).
11. **Update support docs** in `src/routes/(marketing)/support/` so users know how to use it.

---

## 12. Known Technical Debt & Planned Work

| Item                                           | Priority | Status / Notes                                                                                                                                                     |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LAN sync path                                  | —        | **Implemented.** Local server sync now works via stored server URL + client interceptor + shared realtime hub. Kept here for historical continuity; see §3.3/§7.   |
| Field/cellular dynamic cloud routing           | Medium   | **Planned.** Today the server URL is a single fixed target; dynamic local-vs-cloud switching is designed, not built.                                               |
| Bun-compiled standalone binary / Tauri sidecar | Medium   | **Planned.** See `docs/Architecture-Implementation-Plan.md`, Part B and `docs/Technical-Implementation-Roadmap.md` Phase 1.                                        |
| Master Discovery Node & 6-digit provisioning   | Medium   | **Planned.** No provisioning/discovery registry exists in `src/` today.                                                                                            |
| HLCs / CRDT engine / dual-queue blobs          | Medium   | **Planned.** Current sync uses monotonic server versions + explicit conflicts, not HLC/CRDT merging.                                                               |
| Auth backdoor `pin === '0000'` (`ST-14`)       | High     | **Deferred, unchecked.** Remove the universal offline PIN fallback in `src/routes/login/+page.svelte`. Tracked in `docs/features/route-fidelity-cleanup-tasks.md`. |
| NHIS API integration                           | Medium   | UI exists, real API call not implemented.                                                                                                                          |
| DHIS2 push                                     | Medium   | Route exists, export not wired up.                                                                                                                                 |
| TypeScript `any` in Drizzle queries            | Low      | Pre-existing; several query destructuring patterns have implicit `any`.                                                                                            |
| Test coverage                                  | High     | Unit suite exists (`vite-plus/test`); no committed Playwright browser suite (no Chromium assumed).                                                                 |
| Local AI fallback model download UX            | Medium   | First-time WebLLM download is ~1–4GB with no progress UI.                                                                                                          |
