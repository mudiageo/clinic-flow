## Phase 9: Marketing & Onboarding Tasks

### 1. Landing Page (`/`)
- `[ ]` Update `hooks.server.ts` to ensure `/` is public and does not redirect to `/login` automatically.
- `[ ]` Build the Hero section with a strong value proposition and call-to-actions.
- `[ ]` Build the Features grid highlighting Offline-First, Queue Management, and Local Data.
- `[ ]` Implement responsive design and micro-animations for scroll events.
- `[ ]` Add global SEO meta tags (Title, Description) in `<svelte:head>`.

### 2. Registration Wizard (`/register`)
- `[ ]` Create `src/routes/register/+page.svelte`.
- `[ ]` Build a multi-step UI (using a step indicator/progress bar).
- `[ ]` Step 1: Admin user details form (Name, Email, Password with validation).
- `[ ]` Step 2: PHC details form (Clinic Name, State, LGA).
- `[ ]` Step 3: Success state with direct links to `/download` and `/login`.
- `[ ]` Connect forms to `registerAction` in `auth.remote.ts`.
- `[ ]` Add comprehensive client-side validation using `valibot` or standard HTML5 attributes before submission.

### 3. Download Portal (`/download`)
- `[ ]` Create `src/routes/download/+page.svelte`.
- `[ ]` Add platform-specific download cards (Windows, macOS, Linux) with appropriate icons.
- `[ ]` Include a brief "Installation Guide" or "Getting Started" section for the desktop app.

### 4. Polish & E2E Testing
- `[ ]` Write a Playwright E2E test covering the `/register` flow from start to finish.
- `[ ]` Verify mobile responsiveness for all public pages.
- `[ ]` Audit accessibility (ARIA labels, contrast ratios) on the marketing pages.
