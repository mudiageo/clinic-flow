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

Never use Dexie directly in components. Always use the stores defined in `$lib/state/` (e.g., `patientStore`, `queueStore`, `vitalsStore`) for reactive data binding.

### 5. Date Formatting

Do not use `date-fns` for formatting dates. Always use the native `Intl` API, preferably through the `$lib/utils/date.ts` utility functions.
