## Phase 7: Polish, PWA & Production Readiness — Tasks

### 1. PWA & Service Worker Integration
- `[ ]` Install `vite-plugin-pwa` and configure in `vite.config.ts`.
- `[ ]` Generate and add PWA icons and `manifest.webmanifest`.
- `[ ]` Implement caching strategies for routes and static assets.
- `[ ]` Create an "Install App" banner/button component for mobile users.

### 2. Authentication & Authorization
- `[ ]` Install and configure an authentication provider (e.g. Supabase Auth or Lucia).
- `[ ]` Build `/login` and `/signup` UI pages.
- `[ ]` Implement `hooks.server.ts` to protect `/admin`, `/nurse`, and `/pharmacy` routes based on user roles.
- `[ ]` Update Dexie database initialization to bind to the authenticated user and clear on logout.

### 3. Sync Engine Hardening
- `[ ]` Add exponential backoff logic for failed `syncOperations` in `local-db/sync.ts`.
- `[ ]` Create a Conflict Resolution UI dialog (showing Server Version vs. Local Version) for merge conflicts.
- `[ ]` Add global sync status indicator with error tooltips in `+layout.svelte`.
- `[ ]` Ensure deleted items that haven't been synced are properly handled without throwing foreign key errors.

### 4. UI Polish & Mobile Optimization
- `[ ]` Add loading skeleton states for tables and dashboard widgets.
- `[ ]` Audit responsive design on all pages (ensure tables are horizontally scrollable on small screens).
- `[ ]` Standardize error boundary pages (`+error.svelte`) and 404 pages.

### 5. Testing & Deployment
- `[ ]` Write end-to-end (E2E) tests with Playwright for the critical offline visit flow (Triage -> Appointment).
- `[ ]` Configure Vercel adapter (`@sveltejs/adapter-vercel`) in `svelte.config.js`.
- `[ ]` Secure environment variables (database connection strings, Termii API keys) for production.
