You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Project Specific Rules:

### 1. Component Naming

ALL Svelte components you create MUST use kebab-case file names (e.g. `permission-editor.svelte`, `bottom-nav.svelte`, `app-sidebar.svelte`).

### 2. Using UI Components

You must generously use `shadcn-svelte` and `more-shadcn-svelte` components.

- Standard shadcn components can be added via `pnpx shadcn-svelte@latest add [component]`
- `more-shadcn-svelte` components MUST be added via the remote JSON registry: `pnpx shadcn-svelte@latest add https://more-shadcn.noair.fun/r/[component].json`
  Do not build custom UI components (like tables, docks, or inputs) if a shadcn or more-shadcn component already exists for it!

### 3. Icons Import Rule

We use `@lucide/svelte` exclusively. Do not import from `lucide-svelte`.

### 4. Database Access

Never use Dexie directly in components. Always use the stores defined in `#lib/state/` (e.g., `patientStore`, `queueStore`, `vitalsStore`) for reactive data binding.

### 5. Date Formatting

Do not use `date-fns` for formatting dates. Always use the native `Intl` API, preferably through the `#lib/utils/date.ts` utility functions.

### 6. Server Architecture & Data Fetching

**CRITICAL:** Do NOT use `+page.server.ts` or `+layout.server.ts` for server-side logic and data fetching. We use a Client-Server architecture utilizing SvelteKit's experimental **remote functions** (`import { query, command, form } from '$app/server'`).
All server-side queries and mutations MUST be defined in `#lib/remote/*.remote.ts` files, and imported directly into `+page.svelte` components. If you need data, write a `query` remote function. If you need mutations, write a `command` or a `form` remote function as appropriate.

### 7. Realtime Data Architecture

**CRITICAL:** Realtime delivery is an accelerator, never the source of truth. For durable data, the authoritative state MUST remain in the server database and, where offline access is required, in the appropriate IndexedDB store. A `query.live` stream only projects the latest server state to connected clients.

Official reference: <https://svelte.dev/docs/kit/remote-functions#query.live>

#### Choosing the Data Pattern

Use the least complex pattern that meets the requirement:

| Requirement                                                         | Required pattern                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| Data changes only on navigation or explicit user action             | Normal `query`                                         |
| Durable offline-first CRUD where a 15–30 second delay is acceptable | Existing push/pull sync                                |
| Ephemeral, non-critical state such as presence or progress          | `query.live` may be used alone                         |
| Durable data that must update connected clients quickly             | **Hybrid: database + local cache/sync + `query.live`** |

Clinical alerts, queue state, announcements, stock warnings, device status, and other operationally important data MUST use the hybrid pattern. They must never exist only in a live stream.

#### Application-Wide Near-Realtime Sync

**Do not create a separate `query.live` stream for every table or ordinary CRUD feature.** The default for patients, encounters, vitals, prescriptions, inventory, appointments, reminders, labs, families, and other replicated domain records is one multiplexed wake-up stream per authenticated client plus the existing cursor-based sync engine.

```text
local mutation
  -> IndexedDB + local sync log
  -> request an immediate sync (debounced)
  -> pushOperations

server mutation
  -> domain row + durable sync/outbox row in one transaction
  -> commit
  -> publish { scope, cursor/version } to phc:<phcId>:sync

single client watchRealtimeSignals query.live
  -> receives only a lightweight wake-up signal
  -> tells syncStore to pullChanges(lastCursor)
  -> syncStore applies batches to IndexedDB
  -> existing Dexie-backed domain stores update reactively

fallback
  -> configured 15–30 second sync polling and reconnect catch-up
```

Rules for the application-wide stream:

1. There should normally be **one** `watchRealtimeSignals` connection per signed-in client, not one connection per entity type. It may subscribe server-side to the authenticated user's PHC, platform-announcement, session/permission, and other authorized control topics.
2. The stream carries only invalidation metadata such as channel, entity type, cursor/version, and timestamp. Actual records are fetched through `pullChanges` or an authorized normal `query`.
3. Every durable server mutation must append a sync/outbox record in the same database transaction as the domain write. Publishing a live signal without a durable change record is forbidden.
4. After commit, publish one PHC-scoped wake-up signal. The client debounces bursts into one sync run; if a signal arrives during sync, set a `syncAgain` flag and pull again after the current batch.
5. Local mutations request an immediate debounced flush instead of waiting for the polling interval. `BroadcastChannel` may wake other tabs on the same device.
6. `pullChanges` remains cursor-based, idempotent, batched, and authoritative. It must drain all available batches and advance a monotonic cursor only after each batch is safely applied.
7. The polling interval remains mandatory as recovery for missed live signals, server restarts, multi-instance propagation delays, and offline devices.
8. A dedicated feature `query.live` is an exception reserved for genuinely high-frequency projections, non-durable ephemeral state, or special audience semantics that cannot use the shared PHC change feed. Document the reason in the feature plan.

Recommended handling by data class:

| Data class                                                                                      | Delivery pattern                                                                          |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Patients, encounters, vitals, labs, prescriptions, inventory, appointments, reminders, families | Shared realtime wake-up → regular cursor sync                                             |
| Settings, permissions, staff status, device approval                                            | Shared control signal → refresh the specific authorized query/session, plus durable audit |
| Queue calling/active waiting-room projection                                                    | Durable sync plus a dedicated live projection only when sub-second UI latency is required |
| Platform announcements and critical alerts                                                      | Durable records plus audience-aware live delivery and regular catch-up                    |
| Reports, dashboards, historical analytics                                                       | Normal query with explicit/server-driven refresh; not live by default                     |
| Presence, typing indicators, transient progress                                                 | Live-only is allowed because loss is acceptable                                           |

#### Canonical Realtime Flow

```text
form/command
  -> validate + authorize
  -> database transaction + audit/sync record
  -> commit
  -> publish a minimal invalidation to the shared realtime hub

query.live
  -> validate + authorize
  -> yield an initial authorized database snapshot
  -> subscribe to the authorized hub topic
  -> on invalidation, re-query authoritative data
  -> yield the new snapshot/version

domain state store
  -> exposes connection/freshness state
  -> updates its IndexedDB cache when required
  -> supplies reactive data to components

regular sync/catch-up query
  -> reconciles anything missed while disconnected
```

#### Remote Function Rules

1. Define new live functions in `#lib/remote/<domain>.remote.ts` using `query.live`. Name them `watch<Domain>` or `watch<Domain>Updates` so they are clearly distinguishable from ordinary queries.
2. Validate every client argument with Valibot. Run authentication, permission checks, and tenant scoping **inside the live query before its first yield**.
3. Derive `phcId`, `staffId`, role, and permissions from `getRequestEvent().locals`. Never trust a client-supplied PHC, user, role, audience, or topic.
4. Every live query MUST yield an initial value for SSR/hydration, then clean up all subscriptions/timers in `finally` when the client disconnects.
5. Treat live values as snapshots, not events. SvelteKit keeps only the latest pending value; `query.live` is explicitly **not an event log**. Anything that must never be missed belongs in the database/sync log.
6. For small bounded datasets, yield the complete authorized snapshot. For large or unbounded datasets, yield a lightweight version/cursor/invalidation and use an incremental normal `query` to retrieve changes.
7. Bound result sizes and use stable, validated cache-key arguments. Prefer one stream per domain/scope, not one stream per row.
8. Live queries have `connected` and `reconnect()`, but no `refresh()`. Use the correct API.
9. A mutation-time `.reconnect()` is a single-flight update delivered with that mutation response; it is useful for the **calling client**, but it is not cross-client pub/sub. Other devices must be notified through the shared realtime hub or eventually through regular sync.
10. When the mutation knows the exact active query key, reconnect it server-side after the commit. When query instances are selected dynamically by the client, use `.updates(...)` with server-side `requested(...)` and a strict finite limit.

#### Shared Realtime Hub

All cross-client invalidation MUST go through a provider-neutral server abstraction in `#lib/server/realtime/`; do not create ad-hoc `EventEmitter`, WebSocket, SSE, or database-listener implementations inside feature files.

- The hub contract is conceptually `publish(topic, signal)` plus an abortable `subscribe(topic)` async iterable.
- The local single-server provider may use an in-process hub.
- Multi-instance cloud deployments MUST use a distributed provider such as Redis/pub-sub or a database notification adapter.
- Feature code must not depend directly on PostgreSQL `LISTEN/NOTIFY`, because ClinicFlow also supports libSQL/SQLite.
- Topic names must be server-generated and tenant-scoped, for example `phc:<phcId>:queue`, `phc:<phcId>:announcements`, or `platform:announcements`.
- Signals must be minimal and contain no patient-identifiable or clinical data. Prefer `{ entityType, entityId, operation, version, occurredAt }`; the live query then re-reads authorized data from the database.
- Publish only **after** the database transaction commits. Coalesce bursty invalidations before re-querying.

#### Polling Policy

Do not implement tight `while (true)` database polling as the default realtime mechanism. It creates one repeating database workload per active live-query cache key.

- Prefer hub-driven invalidation plus regular sync reconciliation.
- Poll only when the upstream source cannot publish changes.
- A polling exception must document its latency requirement, query cost, indexes, interval, and expected connection count.
- No interval below five seconds without explicit approval. Reconciliation polling should normally be 30 seconds or longer, use backoff/jitter, emit only changed versions, and stop immediately when the iterator is cancelled.

Existing polling-based live code is legacy and MUST NOT be copied into new features; migrate it to this pattern when that area is modified.

#### Client State and Offline Behaviour

1. Shared realtime domain data belongs in a typed class-based store under `#lib/state/`; components must not open their own sockets, access Dexie directly, or implement polling timers.
2. The store owns the live-query handle, cache/cursor, deduplication, and `connect()`/`disconnect()` lifecycle. It must disconnect on logout, PHC change, or when its owning layout/feature is destroyed.
3. Expose explicit freshness state such as `idle | connecting | live | stale | offline | error`, together with `lastUpdatedAt`. Do not infer server connectivity from `navigator.onLine` alone; use the live resource's `connected` state.
4. For hybrid data, render the local IndexedDB snapshot first, merge live snapshots idempotently, and run cursor-based catch-up on reconnect. Queue offline mutations/read receipts through the normal sync mechanism.
5. `BroadcastChannel` is allowed only for same-device cross-tab coordination. It is not a substitute for server-to-device realtime delivery.
6. When a stream disconnects, keep safe cached data visible but mark it stale. Clinical or operational screens must make stale/disconnected state obvious and must not imply that cached values are current.

#### Security, Safety, and Reliability

- Recheck authorization before each protected database re-read/emission for long-running streams, or terminate/reconnect the stream when session, role, permission, staff status, or PHC membership changes.
- Never leak one PHC's data through stream arguments, topic names, snapshots, logs, or error messages.
- Critical clinical alerts and platform announcements must be durable, auditable, replayable after reconnect, and explicitly acknowledged where required. They may not rely on transient toast delivery.
- AI-generated realtime alerts remain advisory and must follow the project's AI disclaimer and human-in-the-loop rules. Realtime speed must never bypass clinical review.
- Service workers MUST NOT cache live-query responses. Preserve and honor `Cache-Control: no-store`; exclude streaming remote-function requests from runtime caching rules.
- Implement error handling, reconnect/backoff behaviour, duplicate suppression, and bounded payloads. Never assume each emitted value will be observed.

#### Required Tests for Every Realtime Feature

- Initial authorized snapshot and SSR/hydration behaviour.
- Two connected clients receive a committed update.
- A client in another PHC or without permission receives nothing.
- Disconnect, offline mutation where applicable, reconnect, and catch-up with no lost durable data.
- Duplicate and burst invalidations remain idempotent and coalesced.
- Stream subscriptions/timers are cleaned up after navigation/logout.
- Permission revocation or staff deactivation stops future protected data.
- Live responses are not cached by the service worker.
- Regular sync/catch-up succeeds even when the live transport is unavailable.

### 8. Feature Implementation Protocol

**CRITICAL:** Before implementing ANY new feature, the agent MUST follow this exact workflow:

1. **Define Permissions:** Explicitly outline the roles and permissions required for the feature. Note that **Superadmins** have global authority to enable/restrict/lock features platform-wide, while local **Admins** can only toggle features for their specific PHC (if not locked by a Superadmin).
2. **Define AI Safety & Mitigations (CRITICAL):** If the feature uses AI, you MUST explicitly define the clinical risks, required UI disclaimers (e.g., the `<AiDisclaimer>` component), and human-in-the-loop guardrails to prevent hallucinations from causing patient harm. AI safety must be at the forefront of every healthcare feature.
3. **Generate Two Documents:** Create TWO separate markdown files in the `docs/features/` directory before writing any code:
   - `<feature-name>-plan.md`: A detailed architectural and implementation plan, including files to modify, logic to write, and the AI Safety mitigations.
   - `<feature-name>-tasks.md`: A strict checklist (`[ ]`) of tasks.
4. **Track Progress:** Update the `<feature-name>-tasks.md` file with `[x]` as you progress through the implementation.
5. **Update User-Facing Docs:** Once the code is working, you MUST create or update user-facing documentation (e.g., in-app `Walkthrough` components, tooltips, and guides/articles on the marketing/support website) explaining how to use the feature safely.
6. **Mark as Accomplished:** When the feature and its documentation are 100% complete, return to the main feature tracker (e.g., `docs/AI-Features-Implementation-Plan.md`) and update its main checkbox to `[x]` to indicate full accomplishment.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Linting

`pnpm lint` runs three tools:

- `vp fmt --check .` — Oxfmt formatting.
- `vp lint .` — Oxlint for JavaScript/TypeScript and the `<script>` blocks of Svelte files.
- `oxvelte lint src/` — Oxvelte for Svelte templates, styles and component semantics.

Svelte rule policy lives in `oxvelte.config.json`. Install the Oxvelte binary once with
`cargo install --git https://github.com/tolgaouz/oxvelte.git --locked`.

Type checking stays with `pnpm check` (svelte-check); Oxlint's `typeCheck` is disabled because
the project still has pre-existing type errors.
