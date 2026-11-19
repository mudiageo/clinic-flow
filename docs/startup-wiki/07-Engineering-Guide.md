# ClinicFlow Engineering Guide
*Part of the Startup Foundation documentation. Living document — update as the architecture evolves.*
*Audience: new engineers, contractors, the founder reviewing their own decisions, grant/investor due diligence.*

---

## 1. What ClinicFlow Is (Engineering Perspective)

ClinicFlow is a **local-first, multi-device clinical workflow system** that runs primarily on a fleet of Android tablets inside a clinic's local Wi-Fi network. It has three runtime targets that share one codebase:

| Target | Runtime | Database | Who uses it |
|---|---|---|---|
| **PWA on tablets** | Browser (WebView via Tauri) | Dexie (IndexedDB) — local | CHEWs, nurses, doctors, pharmacy |
| **Edge server (local)** | Node.js / Bun binary | SQLite via `bun:sqlite` or `better-sqlite3` | One per clinic; tablets point to it |
| **Cloud node** | Node.js on Vercel | PostgreSQL (Neon / Supabase) | Sync, backup, superadmin |

The same SvelteKit application serves all three. The runtime environment is detected via `DATABASE_URL` (file path = edge/SQLite; postgres:// = cloud/PG) and `$env/static/private` flags.

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
│   │   ├── sync/           # Server-side sync endpoints (push/pull)
│   │   ├── connect/        # Device discovery / onboarding
│   │   ├── kiosk/          # Kiosk-mode waiting room display
│   │   ├── login/
│   │   ├── onboarding/     # First-run setup wizard
│   │   ├── welcome/
│   │   ├── waiting-room/
│   │   └── pitch/          # Demo / investor pitch pages (not clinical)
│   ├── lib/
│   │   ├── remote/         # All server-side logic (query / command / form)
│   │   ├── state/          # Svelte 5 runes-based reactive stores (Dexie)
│   │   ├── local-db/       # Dexie database initialisation (db.ts)
│   │   ├── server/         # Server-only: auth, DB schema, Drizzle, seed
│   │   │   ├── auth.ts     # Better Auth instance
│   │   │   └── db/
│   │   │       ├── schema.ts   # Drizzle ORM schema (shared across dialects)
│   │   │       ├── index.ts    # DB connection (dialect-aware)
│   │   │       └── seed.ts
│   │   ├── services/
│   │   │   └── ai/         # AI provider abstraction
│   │   │       ├── ai.service.ts       # Provider registry + fallback
│   │   │       ├── ai.interface.ts     # AIProvider interface
│   │   │       ├── prompts.ts
│   │   │       └── providers/
│   │   │           ├── remote-gemini.ts    # Gemini API (requires internet)
│   │   │           └── local-webllm.ts     # WebLLM via WebGPU (fully offline)
│   │   ├── components/     # Shared UI components
│   │   └── utils/          # date.ts, formatters, etc.
│   ├── hooks.server.ts     # mDNS broadcast, CORS, auth session
│   └── app.d.ts            # SvelteKit type augmentation
├── .github/workflows/
│   ├── build.yml           # Android APK + release
│   └── nightly.yml         # Nightly build schedule
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

The Dexie database is initialised in `src/lib/local-db/db.ts`. All table schemas are defined there. When you add a new entity, add a Dexie table here and a corresponding store in `src/lib/state/`.

### 3.2 Server: Drizzle ORM (dialect-aware)

The server database is accessed via **Drizzle ORM** with a dialect-switching connection layer:

| `DATABASE_URL` prefix | Dialect | Driver | Used in |
|---|---|---|---|
| `file:` or `.db` suffix | SQLite | `bun:sqlite` (or `better-sqlite3`) | Edge server binary, local dev |
| `postgres://` or `libsql:` | PostgreSQL | `pg` (or `@neondatabase/serverless`) | Vercel cloud, production |

The schema in `src/lib/server/db/schema.ts` is shared. Drizzle generates dialect-specific SQL at query time. **Never write raw SQL.** All queries go through Drizzle.

### 3.3 Sync Engine

The sync engine lives in `src/lib/state/sync.svelte.ts`. It:
1. Keeps a local **operation log** in IndexedDB (every create/update/delete is appended)
2. On a timer (default 15s, configurable in settings) or on `window.online` event, calls `pushOperations` to the server
3. Calls `pullChanges` to receive server-side changes since the last cursor
4. Uses a `BroadcastChannel` (`clinicflow_sync_channel`) to coordinate across browser tabs

Current limitation: the sync pushes only to the **cloud node** (Vercel). The local edge server sync path (LAN-only) is the next major engineering milestone.

---

## 4. Remote Functions — The Server-Side Pattern

**Do not use `+page.server.ts` or `+layout.server.ts`.** All server-side logic lives in `src/lib/remote/*.remote.ts` files and uses SvelteKit's experimental remote functions API:

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
  import { getPatient } from '$lib/remote/patients.remote';
  const patient = await getPatient(params.id);  // top-level await in Svelte 5
</script>
```

Remote files by domain:

| File | Covers |
|---|---|
| `admin.remote.ts` | PHC settings, staff management |
| `ai.remote.ts` | Server-side AI calls (when client AI unavailable) |
| `audit.remote.ts` | Audit log reads |
| `auth.remote.ts` | Login, session, password |
| `cloud-uplink.remote.ts` | Cloud sync triggers |
| `devices.remote.ts` | Device enrolment |
| `encounters.remote.ts` | Doctor consultations, diagnoses |
| `epidemiology.remote.ts` | Outbreak pattern queries (superadmin) |
| `export.remote.ts` | Data export (CSV, DHIS2) |
| `kiosk.remote.ts` | Waiting room display data |
| `lab-requests.remote.ts` | Lab orders and results |
| `patients.remote.ts` | Patient CRUD, search |
| `permissions.remote.ts` | Role and permission management |
| `pharmacy.remote.ts` | Dispensing, inventory, restock |
| `queue.remote.ts` | Queue operations (admit, call, complete) |
| `releases.remote.ts` | Version/release info |
| `reminders.remote.ts` | Appointment reminder CRUD |
| `server-status.remote.ts` | Health check, sync status |
| `settings.remote.ts` | System-wide settings |
| `setup.remote.ts` | First-run onboarding |
| `staff.remote.ts` | Staff profiles, invites |
| `superadmin.remote.ts` | Cross-PHC admin operations |

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

**Future: local fine-tuned model**
The R&D milestone funds fine-tuning MedGemma 4B using QLoRA on clinical override data (cases where a doctor corrected the AI's initial suggestion). The resulting quantized model (<4GB) will run via `@mlc-ai/web-llm` with a WebGPU backend, replacing the cloud Gemini call for intake structuring. No audio or patient data leaves the device.

---

## 7. Networking & mDNS

When the server detects it is running against a local database (`DATABASE_URL` starts with `file:` or ends in `.db`), it broadcasts itself on the local network via `bonjour-service` in `src/hooks.server.ts`:

```ts
bonjour.publish({
  name: 'ClinicFlow Master Server',
  type: 'http',
  port,
  host: 'clinicflow.local',
  txt: { version: '1', app: 'clinicflow' }
});
```

Tablets on the same Wi-Fi network resolve `clinicflow.local` automatically without any IP configuration. This is the zero-config networking feature — no IT staff needed to set up a clinic.

CORS is configured in `hooks.server.ts` to allow requests from Tauri origins (`tauri://localhost`, `asset://localhost`) as well as `localhost` for dev.

---

## 8. CI/CD Pipeline

### Build workflow (`.github/workflows/build.yml`)
Triggered by: version tags (`v*`), manual dispatch (with `prerelease` and `tag` inputs).

Steps:
1. Setup Bun, pnpm, Java, Android SDK
2. `pnpm install`
3. Build SvelteKit (`pnpm build`)
4. Tauri Android build (`tauri android build`)
5. Sign APK with keystore from GitHub Secrets
6. Create GitHub Release with the APK attached
7. `update-nightly-pointer` job: downloads assets from the new timestamped release, recreates the static `nightly` tag/release to always point to the latest build

### Nightly workflow (`.github/workflows/nightly.yml`)
Runs on a schedule. Pushes a `nightly-YYYYMMDD` tag to trigger the build workflow. Retention: 7 days (older nightly releases are deleted automatically).

### Secrets required
| Secret | Used for |
|---|---|
| `ANDROID_KEYSTORE` | APK signing (base64-encoded keystore) |
| `ANDROID_KEY_ALIAS` | APK signing |
| `ANDROID_KEY_PASSWORD` | APK signing |
| `ANDROID_STORE_PASSWORD` | APK signing |
| `RELEASE_PAT` | Cross-workflow dispatch (needs `repo` + `workflow` scope) |

---

## 9. Development Setup

```bash
# Clone and install
git clone https://github.com/mudiageo/clinic-flow
cd clinic-flow
pnpm install

# Copy environment file
cp .env.example .env
# Fill in: DATABASE_URL, BETTER_AUTH_SECRET, GEMINI_API_KEY, etc.

# Run development server
pnpm dev

# Run type check
pnpm exec svelte-check --tsconfig ./tsconfig.json

# Run tests (when they exist)
pnpm test
```

**SQLite local dev:** Set `DATABASE_URL=file:./local.db` to run against a local SQLite file without needing Postgres. The ORM switches automatically.

---

## 10. Engineering Conventions

| Rule | Detail |
|---|---|
| Component file names | kebab-case only: `patient-card.svelte`, not `PatientCard.svelte` |
| Icons | `@lucide/svelte` exclusively. Never `lucide-svelte`. |
| Date formatting | Use `$lib/utils/date.ts` (Intl API). Never `date-fns`. |
| Database access from components | Never use Dexie directly. Always use stores from `$lib/state/`. |
| Server logic | Always in `$lib/remote/*.remote.ts`. Never in `+page.server.ts`. |
| Svelte 5 dynamic components | Use `<variable.Component />` not `<svelte:component this={...}>` |
| State | Svelte 5 runes only (`$state`, `$derived`, `$effect`). No Svelte 4 stores. |
| AI output | Always gated by a human confirmation step. Always show `<AiDisclaimer>`. |
| UI components | Use `shadcn-svelte` and `more-shadcn-svelte` before building custom. |
| New features | Must follow the Feature Implementation Protocol in `AGENTS.md` (permissions → AI safety → plan.md + tasks.md). |

---

## 11. Adding a New Feature: Step-by-Step

1. **Define permissions** — which roles can access this? Can the superadmin lock it?
2. **Define AI safety** — does this feature involve AI? If yes, write the disclaimer text and the human-confirmation gate before touching code.
3. **Create `docs/features/<feature>-plan.md`** and `<feature>-tasks.md` (see `AGENTS.md`).
4. **Add a Dexie table** in `src/lib/local-db/db.ts` if you need local storage.
5. **Add a state store** in `src/lib/state/<feature>.svelte.ts` extending `LocalCollection<T>`.
6. **Add remote functions** in `src/lib/remote/<feature>.remote.ts` for server queries/mutations.
7. **Add Drizzle schema** in `src/lib/server/db/schema.ts` if you need a server-side table.
8. **Create the route** under the appropriate role folder in `src/routes/(app)/`.
9. **Update the nav** in the `(app)` layout to show the link for the correct roles.
10. **Write Playwright tests** covering the happy path and the offline scenario.
11. **Update support docs** in `src/routes/(marketing)/support/` so users know how to use it.

---

## 12. Known Technical Debt

| Item | Priority | Notes |
|---|---|---|
| LAN sync path | High | Sync currently goes cloud-only. Local edge server sync is planned. |
| NHIS API integration | Medium | UI exists, real API call not implemented. |
| DHIS2 push | Medium | Route exists, export not wired up. |
| TypeScript `any` in Drizzle queries | Low | Pre-existing; several query destructuring patterns have implicit `any`. |
| Test coverage | High | No Playwright test suite exists yet. |
| Local AI fallback model download UX | Medium | First-time WebLLM download is ~1–4GB with no progress UI. |
