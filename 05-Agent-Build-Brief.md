# ClinicFlow — Agent Build Brief

**Purpose of this document:** hand this directly to an AI coding agent (Claude Code, Cursor, etc.) as the operating spec for building ClinicFlow end-to-end. It assumes the agent has access to the four prior documents (`01-PRD.md`, `02-Architecture.md`, `03-Schema.md`, `04-Timeline.md`) in the same repo/context — **read those first**, this file governs *how to build*, those govern *what to build*.

---

## 0. Read This First — Critical Architectural Constraint

**Tauri's SvelteKit integration requires `@sveltejs/adapter-static`, which produces a fully static SPA build with no server runtime.** This means sveltekit remote functions, `+server.ts` API routes (sync push/pull, SMS dispatch worker) **cannot run inside the Tauri-packaged app itself.**

Resolve this as follows:
- The **SvelteKit server routes** (sync API, SMS worker, auth, remote functions ) run as a **separate deployed SvelteKit server** ( adapter-auto, set eng var Tauri to true if we want to use adapter static to build), either cloud-hosted or on a LAN-visible machine at the clinic (e.g. the reception PC running `node build`).
- The **Tauri kiosk app** is the static-adapter frontend build, configured to call that server's URL for all `/api/*` requests — exactly like a normal client-server web app. Offline behavior is unaffected because IndexedDB/Dexie writes never depend on this server being reachable (see `02-Architecture.md` §1).
- Do not attempt to bundle SvelteKit server routes inside the Tauri binary. This is the single most common mistake when combining Tauri + SvelteKit + a real backend — flag it in code review if it comes up.
- so we have the dame foundation. the only difference is the logic you'll add to choose the adapter in svelte config

---

## 1. Tech Stack — Exact Versions & Tools

| Layer | Tool | Notes |
|---|---|---|
| Meta-framework | SvelteKit + Svelte 5 (runes) | via `sv` CLI |
| Styling | Tailwind CSS v4 + shadcn-svelte | CLI-driven, CSS-variable theming |
| Server DB | PostgreSQL + Drizzle ORM | `sv add drizzle` |
| Local DB | Dexie.js (IndexedDB wrapper) | manual install, no official add-on |
| Auth | Better Auth | `sv add better-auth` |
| QR generation | `qrcode` (npm) | client-side canvas render |
| QR scanning | `qr-scanner` (npm) | webcam-based, WebWorker, framework-agnostic |
| Voice/AI | Google Gemini API | structured extraction from transcribed speech |
| TTS | Web Speech API (`speechSynthesis`) | native browser, no install |
| SMS | Termii API (primary) / Africa's Talking (fallback) | server-side dispatch only |
| Native packaging | Tauri v2 | requires `@sveltejs/adapter-static` |
| Package manager | pnpm | per established preference |

---

## 2. Project Initialization — Exact Commands

### 2.1 Scaffold SvelteKit with add-ons in one pass
```bash
pnpm dlx sv create clinicflow
```
When prompted:
- Template: **SvelteKit minimal**
- TypeScript: **Yes**
- Add-ons to select: **tailwindcss**, **drizzle**, **better-auth**, **eslint**, **prettier**

Or non-interactively, chain flags:
```bash
pnpm dlx sv create clinicflow --template minimal --types ts \
  --add tailwindcss --add "drizzle=database:postgresql+client:postgres.js+docker:yes" \
  --add better-auth --add eslint --add prettier --install pnpm

cd clinicflow
```

This single step gives you: Tailwind v4 wired in, a Drizzle+Postgres setup with Docker Compose for local Postgres, and a working Better Auth + Drizzle adapter with email/password auth scaffolded.

> Reference: https://svelte.dev/docs/cli/sv-create · https://svelte.dev/docs/cli/drizzle · https://svelte.dev/docs/cli/better-auth

### 2.2 Initialize shadcn-svelte
```bash
pnpm dlx shadcn-svelte@latest init
```
Prompts:
- Base color: pick one aligned to the PRD's triage color semantics — **Slate** or **Neutral** work well as a neutral base, since RED/AMBER/GREEN triage colors will be layered on top as custom semantic tokens (see §3 below), not the base palette itself.
- Global CSS file: `src/app.css` (or `src/routes/layout.css` if prompted, per your SvelteKit version — confirm against what `sv create` scaffolded)
- Import aliases: accept defaults (`$lib`, `$lib/components`, `$lib/components/ui`, `$lib/utils`, `$lib/hooks`)

> Reference: https://www.shadcn-svelte.com/docs/installation/sveltekit · https://www.shadcn-svelte.com/docs/cli

### 2.3 Add required shadcn-svelte components
Add incrementally as modules are built, but the core set needed across nearly every screen:
```bash
pnpm dlx shadcn-svelte@latest add button card dialog badge input label \
  select tabs table data-table toast sonner separator avatar \
  dropdown-menu form skeleton progress alert
```
Add more later as needed (`calendar`, `command`, `sheet`, etc.) with the same `add` command — don't over-install upfront.

---

## 3. Theming — shadcn-svelte CSS Variables for Triage Colors

shadcn-svelte theming works entirely through CSS custom properties layered with `@theme inline` in your global CSS (Tailwind v4 convention — **no `tailwind.config.js` color edits**, no hardcoded hex classes anywhere in components). This directly supports the PRD's requirement that triage color-coding be semantic and consistent app-wide.

In `src/app.css`, after the shadcn-svelte-generated `:root` and `.dark` blocks, add semantic triage tokens following the same pattern shadcn-svelte uses for its own tokens:

```css
:root {
  --triage-red: oklch(0.58 0.22 27);
  --triage-red-foreground: oklch(0.98 0.01 27);
  --triage-amber: oklch(0.77 0.16 70);
  --triage-amber-foreground: oklch(0.28 0.07 70);
  --triage-green: oklch(0.64 0.15 145);
  --triage-green-foreground: oklch(0.98 0.02 145);
}

.dark {
  --triage-red: oklch(0.5 0.2 27);
  --triage-red-foreground: oklch(0.98 0.01 27);
  --triage-amber: oklch(0.6 0.15 70);
  --triage-amber-foreground: oklch(0.99 0.02 70);
  --triage-green: oklch(0.5 0.13 145);
  --triage-green-foreground: oklch(0.98 0.02 145);
}

@theme inline {
  --color-triage-red: var(--triage-red);
  --color-triage-red-foreground: var(--triage-red-foreground);
  --color-triage-amber: var(--triage-amber);
  --color-triage-amber-foreground: var(--triage-amber-foreground);
  --color-triage-green: var(--triage-green);
  --color-triage-green-foreground: var(--triage-green-foreground);
}
```

This makes `bg-triage-red`, `text-triage-red-foreground`, etc. available as first-class Tailwind utility classes, usable directly on shadcn `Badge` components:
```svelte
<Badge class="bg-triage-red text-triage-red-foreground">URGENT</Badge>
```

> Reference: https://www.shadcn-svelte.com/docs/theming — follow the exact "Adding new colors" pattern shown there; do not invent a different mechanism.

**POS-style sizing note:** shadcn-svelte's default component sizing is desktop-app-density, not kiosk-touch density. Override touch targets via Tailwind utility overrides at the call site (e.g. `class="h-14 text-lg px-8"` on `Button`) rather than editing the generated component source, so `shadcn-svelte update` remains safe to run later.

---

## 4. Database Layer

### 4.1 Server schema
Copy `03-Schema.md`'s full `schema.ts` content into `src/lib/server/db/schema.ts` (the Drizzle add-on will have scaffolded this file's location already — check `src/lib/server/db/` and `drizzle.config.ts`).

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

> Reference: https://orm.drizzle.team/docs/get-started-postgresql · https://svelte.dev/docs/cli/drizzle

### 4.2 Local (Dexie) schema
```bash
pnpm add dexie
```
Implement exactly as specified in `02-Architecture.md` §1.2 (`src/lib/local-db/db.ts`). Dexie has no official Svelte integration — the `liveQuery()` → Svelte 5 rune bridge pattern in `02-Architecture.md` §3.2 is the correct approach; implement it as written.

> Reference: https://dexie.org/docs/Tutorial/Getting-started · https://dexie.org/docs/liveQuery()

### 4.3 Better Auth wiring to `staff` table
Better Auth's own `sv add better-auth` scaffold generates its core `user`/`session` tables. Extend — do not replace — with the `staff` table from `03-Schema.md`, linked via `staff.authUserId → user.id`. Add a Better Auth plugin/hook that reads `staff.role` into the session object so route guards can check role without an extra query per request.

> Reference: https://www.better-auth.com/docs/adapters/drizzle · https://svelte.dev/docs/cli/better-auth

---

## 5. Module-by-Module Build Notes

Build in the order specified in `04-Timeline.md`. Notes below fill gaps the PRD/architecture docs don't cover at implementation level.

### 5.1 QR Registration & Scanning
```bash
pnpm add qrcode qr-scanner
```
- **Generation:** use `qrcode`'s `toCanvas()` client-side, encode only `clinicId` (never PHI) as the QR payload — matches the PRD's explicit privacy requirement.
- **Scanning:** `qr-scanner` runs its decode in a Web Worker (bundler needs to serve `qr-scanner-worker.min.js` alongside it — with Vite this is automatic via `?url` import if not auto-detected; verify in dev before relying on it).
  ```ts
  import QrScanner from 'qr-scanner';
  const scanner = new QrScanner(videoEl, result => handleScan(result.data), { highlightScanRegion: true });
  scanner.start();
  ```
- Chosen over Svelte-specific QR wrapper libraries deliberately: most are unmaintained (last published 2–7 years ago per npm). `qr-scanner` is framework-agnostic, actively maintained, and benchmarked significantly more accurate than alternatives.

> Reference: https://www.npmjs.com/package/qr-scanner · https://www.npmjs.com/package/qrcode

### 5.2 Triage Rules Engine
Implement as a pure function reading the `triageRules` table (synced locally via Dexie), not hardcoded conditionals — this is a hard requirement from the PRD (Head of PHC must be able to edit thresholds without redeploy). Evaluate all active rules for the PHC on every vitals save, take the highest-urgency match.

### 5.3 AI Voice Intake (Gemini)
```bash
pnpm add @google/genai
```
- Record via `MediaRecorder` API on Hold-to-Speak press/release.
- Send audio (or client-side transcript if using a separate STT step) to a **server route** (`/api/ai/structure-intake`) that calls Gemini with a structured-extraction prompt — **never call the Gemini API directly from the client**; the API key must stay server-side.
- Prompt Gemini to return strict JSON (chief complaint, duration, associated symptoms, detected language) — instruct it explicitly to output only JSON, no prose, no markdown fences, and parse defensively per your own established pattern of stripping ```json fences before `JSON.parse`.
- This route requires connectivity; on failure, the UI must fall back to manual text entry with zero friction — never block the encounter on AI availability.

> Reference: https://ai.google.dev/gemini-api/docs

### 5.4 Web Speech API Announcements
No install — native browser API. Test voice availability per-browser/OS at kiosk setup time; `speechSynthesis.getVoices()` is asynchronous and unreliable on first call, so wait for the `voiceschanged` event before populating the language selector, not just on mount.

> Reference: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

### 5.5 SMS Reminders (Termii)
Server-side only, in the sync worker / cron route (`/api/cron/dispatch-reminders`), never client-side (API key protection, and clinic devices may be offline anyway).

```ts
// Termii send — POST https://api.ng.termii.com/api/sms/send
const res = await fetch('https://api.ng.termii.com/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: env.TERMII_API_KEY,
    to: reminder.recipientPhone,       // format: 234XXXXXXXXXX
    from: env.TERMII_SENDER_ID,
    sms: reminder.label,               // keep ≤160 chars, see PRD §5
    type: 'plain',
    channel: 'generic',
  }),
});
```
- Use the **DND route** (`channel: "dnd"`) instead of `generic` for reliability if the Termii account has it activated — the generic route is blocked for MTN numbers 8PM–8AM and can silently fail delivery, which is unacceptable for a health reminder use case. Flag this as a config decision for Mudia to confirm with Termii support before demo day if timelines allow; default to `generic` with this caveat documented if not resolved.
- Africa's Talking is the fallback provider — implement behind the same `provider` field on the `reminders` table (already in schema) so switching is a config change, not a code change.

> Reference: https://developers.termii.com/messaging-api · https://developers.africastalking.com/docs/sms/overview

### 5.6 Sync Engine
Implement exactly per `02-Architecture.md` §2 — push/pull endpoints, delta-based stock updates, LWW + urgency-override conflict resolution. This is the highest-risk, highest-payoff module; do not shortcut it, and test the "cut Wi-Fi mid-session" scenario continuously during Phase 2–4, not just at the end.

### 5.7 Tauri Kiosk Packaging
```bash
pnpm add -D @sveltejs/adapter-static
pnpm add -D @tauri-apps/cli
pnpm tauri init
```
- add logo to choose between `adapter-auto` and  `adapter-static` in `svelte.config.js`:
  ```js
  
  export default {
    kit: { adapter: adapter({ fallback: 'index.html' }) },
  };
  ```
- Add `src/routes/+layout.ts` with `export const ssr = false;` to permit `window`-dependent Tauri APIs.
- Set `frontendDist: "../build"` in `src-tauri/tauri.conf.json`.
- Configure kiosk lock (fullscreen, no chrome, disabled context menu) via `tauri.conf.json` window config — `"fullscreen": true`, `"decorations": false`, `"resizable": false`.
- Build: `pnpm tauri build`.

> Reference: https://v2.tauri.app/start/frontend/sveltekit/ (this is the authoritative current guide — SvelteKit 2.20+/Svelte 5 accurate as of the doc)

---

## 6. Environment Variables Checklist

```
DATABASE_URL=              # Postgres connection string
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GEMINI_API_KEY=            # server-only, never exposed to client
TERMII_API_KEY=            # server-only
TERMII_SENDER_ID=
AFRICASTALKING_API_KEY=    # server-only, fallback provider
AFRICASTALKING_USERNAME=
PUBLIC_SYNC_SERVER_URL=    # the LAN/cloud server the Tauri app calls for /api/*
```

---

## 7. Definition of Done (per module)

Before marking any module in `04-Timeline.md` complete, the agent should verify against the **Acceptance Criteria** stated for that module in `01-PRD.md` — every module section there ends with explicit, testable criteria. Treat those as the actual spec; this document is the *how*, that one is the *what/when-is-it-correct*.

---

## 8. Reference Index

| Topic | URL |
|---|---|
| Svelte CLI (`sv create`, add-ons) | https://svelte.dev/docs/cli/sv-create |
| Svelte 5 runes | https://svelte.dev/docs/svelte/what-are-runes |
| SvelteKit docs | https://svelte.dev/docs/kit |
| Drizzle + SvelteKit add-on | https://svelte.dev/docs/cli/drizzle |
| Drizzle ORM (Postgres) | https://orm.drizzle.team/docs/get-started-postgresql |
| Better Auth add-on | https://svelte.dev/docs/cli/better-auth |
| Better Auth + Drizzle | https://www.better-auth.com/docs/adapters/drizzle |
| shadcn-svelte install (SvelteKit) | https://www.shadcn-svelte.com/docs/installation/sveltekit |
| shadcn-svelte CLI | https://www.shadcn-svelte.com/docs/cli |
| shadcn-svelte theming | https://www.shadcn-svelte.com/docs/theming |
| Dexie.js | https://dexie.org/docs/Tutorial/Getting-started |
| Dexie liveQuery | https://dexie.org/docs/liveQuery() |
| qr-scanner | https://www.npmjs.com/package/qr-scanner |
| qrcode (generation) | https://www.npmjs.com/package/qrcode |
| Gemini API | https://ai.google.dev/gemini-api/docs |
| Web Speech API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |
| Termii messaging API | https://developers.termii.com/messaging-api |
| Africa's Talking SMS | https://developers.africastalking.com/docs/sms/overview |
| Tauri v2 + SvelteKit | https://v2.tauri.app/start/frontend/sveltekit/ |
| Tailwind CSS v4 | https://tailwindcss.com/docs |

---

## 9. Explicit Guardrails for the Agent

- **Never hardcode triage thresholds in component logic** — always read from the `triageRules` table.
- **Never call Gemini or Termii/Africa's Talking directly from client code** — server routes only primarily with remote functions query, command, form, query.live, query.batch, keys never shipped to the browser bundle.
- **Never let a write path assume connectivity** — every mutation goes to Dexie first, full stop, per `02-Architecture.md` §1.3.
- **Never overwrite `pharmacy_inventory.current_stock` via naive last-write-wins** — delta-based only, per `02-Architecture.md` §2.5.
- **Never hand-edit generated shadcn-svelte component files** in `$lib/components/ui/` for one-off sizing — override via className at the call site so `shadcn-svelte update` stays safe.
- **Never assume the Tauri build has a working server** — all `/api/*` calls target `PUBLIC_SYNC_SERVER_URL`, which is a separately-deployed Node-adapter SvelteKit instance, not the static Tauri bundle itself.
