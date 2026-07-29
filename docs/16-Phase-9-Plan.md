## Phase 9: Marketing & Onboarding Plan

### Overview
Phase 9 transitions ClinicFlow from an internal tool into a publicly available platform. It introduces a marketing landing page to showcase the system's capabilities, a self-serve registration wizard for new clinics, and a portal to download the desktop application binaries for offline use.

### Objectives
1. **Public Landing Page (`/`)**: A modern, highly aesthetic, responsive landing page highlighting ClinicFlow's features, offline-first architecture, and "local-first" philosophy. 
2. **Registration Wizard (`/register`)**: A seamless multi-step onboarding flow for new administrators to register their clinic, set up their initial super-admin account, and provision their initial database instance.
3. **Download Portal (`/download`)**: A dedicated page for users to download OS-specific desktop binaries (Windows, macOS, Linux) built via Tauri.

### Technical Details

#### 1. Landing Page (`/`)
- Remove the existing redirect from `/` to `/login` if present in `hooks.server.ts`.
- Build a responsive layout with a Hero section, Features grid, Architecture explanation (Local-First), and clear CTAs.
- Ensure the design adheres to the "Rich Aesthetics" guidelines (vibrant colors, micro-animations, glassmorphism where appropriate).
- Use `shadcn-svelte` components generously.

#### 2. Registration Wizard (`/register`)
- Implement a multi-step form:
  - Step 1: Admin Account Creation (Name, Email, Password).
  - Step 2: Clinic/PHC Setup (Name, State, LGA).
  - Step 3: Success & Next Steps (Link to Download Desktop App).
- Connect the form to the existing `registerAction` remote function in `auth.remote.ts`.
- Ensure error handling and loading states are polished.

#### 3. Download Portal (`/download`)
- Create a simple, clean UI offering downloads for different platforms.
- Can use static links to GitHub Releases or S3 buckets if applicable, or placeholder links if binaries are still being compiled.

#### 4. SEO & Performance
- Add custom `<title>` and `<meta>` description tags to all public pages.
- Ensure optimal Lighthouse scores for the landing page (lazy load images, minimize initial bundle).
