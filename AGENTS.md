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

### 7. Feature Implementation Protocol

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
