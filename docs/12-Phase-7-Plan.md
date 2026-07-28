## Phase 7: Polish, PWA & Production Readiness

### Overview
Phase 7 will focus on transforming ClinicFlow from a web app into a robust Progressive Web Application (PWA) capable of running reliably offline. We will also implement a real authentication layer, harden the synchronization engine, and prepare the application for production deployment.

### Objectives
1. **PWA Integration**: Configure `vite-plugin-pwa` to enable offline asset caching, app installation (manifest), and service worker setup.
2. **Authentication**: Replace mock authentication with a real auth provider (e.g., Supabase Auth or Lucia) and integrate it with our local Dexie stores (clearing data on logout).
3. **Sync Engine Hardening**: Improve the background sync engine with conflict resolution UI, exponential backoff for failed operations, and toast notifications for sync status.
4. **End-to-End Testing & QA**: Add crucial Playwright E2E tests for the offline flow (Triage -> Appointment -> Sync) and polish UI/UX for mobile views.
5. **Deployment Preparation**: Optimize build settings, set up environment variables, and configure CI/CD for deployment (e.g., Vercel).

### Technical Details

#### 1. PWA & Offline Support
- Install `vite-plugin-pwa`.
- Create a `manifest.webmanifest` and high-quality icon assets.
- Configure the service worker to cache routes (`/`, `/admin`, `/nurse`) and static assets, while excluding API routes (`/api/*`).
- Add an "Install App" prompt component for mobile users.

#### 2. Authentication
- Setup authentication schema in Drizzle (Users, Sessions).
- Create login/signup screens (`/login`, `/signup`).
- Protect routes using SvelteKit's `hooks.server.ts` to redirect unauthenticated users.
- Connect local Dexie storage to the authenticated user's ID (to support multi-user local storage safely, or clear DB on logout).

#### 3. Sync Hardening
- Implement a Sync Conflict Resolution UI (showing server version vs. local version).
- Refine `sync.remote.ts` to handle complex edge cases (e.g., deleting an entity that hasn't synced yet).
- Add visual, non-intrusive syncing indicators to the header (spinning icon when syncing, error icon with tooltip on failure).

#### 4. Deployment
- Create `Vercel` adapter configuration.
- Secure API endpoints and Drizzle database connections.
- Ensure all TypeScript checks and ESLint rules pass.
