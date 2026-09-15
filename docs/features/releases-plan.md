# Release Management System — Architecture Plan

## Overview
A fully automated, end-to-end release management system for ClinicFlow that integrates CI/CD, a dynamic download page, a release API, and a GitHub Releases-powered changelog.

---

## Components

### 1. CI/CD Pipeline (`/.github/workflows/`)
- **`build.yml`** (existing): Upgrade to support `release/*` branch naming convention, draft vs. published releases, and pre-release flag detection via semver tags (e.g. `v1.0.0-beta.1`).
- **`release.yml`** (new): A dedicated workflow that is manually triggered (or triggered on tag push `v*`). It:
  - Runs `pnpm version` to bump `package.json`.
  - Creates a signed Git tag (`v0.1.6`, `v1.0.0-beta.1`, etc.).
  - Triggers the full Tauri cross-platform build.
  - Publishes to GitHub Releases with proper pre-release flag.
  - Updates the `releases.json` registry file on the `main` branch automatically.

### 2. GitHub Releases as Source of Truth
All release metadata lives in GitHub Releases. The GitHub API (`https://api.github.com/repos/owner/repo/releases`) serves as the single source of truth for:
- Version numbers
- Release notes / changelogs (from GitHub Release body)
- Asset download URLs (direct links to `.exe`, `.dmg`, `.deb`, `.apk`)
- Pre-release flag
- Published date

### 3. Releases API Remote (`src/lib/remote/releases.remote.ts`)
A SvelteKit `query` remote function that:
- Fetches release data from the GitHub API.
- Parses and normalizes it: stable, beta, pre-release, older versions.
- Returns structured data to the download page.
- Caches aggressively (5 min TTL) to avoid GitHub API rate limits.

### 4. Download Page (`/download`) — Fully Dynamic
The existing static download page will be replaced with a fully dynamic page powered by the Releases API. Features:
- **Latest stable release** prominently shown with all platform buttons and real download URLs.
- **Beta / Pre-release** section (if any) with appropriate disclaimers.
- **Version History** accordion — shows all past releases with their platform links.
- **Server Download** section — dedicated card for the ClinicFlow Server package (Linux `.deb`/`.tar.gz` for self-hosting admins).

### 5. Releases Page (`/releases`) — New Marketing Page
A dedicated public changelog/release notes page showing all releases in reverse chronological order, with full rendered release body (markdown → HTML).

### 6. In-App Update Check
The settings store will query the latest GitHub release tag and compare it to the current app version (`import.meta.env.VITE_APP_VERSION`). If newer, it shows a non-intrusive badge in the sidebar.

---

## Workflow: How a New Release is Published

1. Developer merges features into `main`.
2. Developer runs `pnpm release:beta` or `pnpm release:stable`.
3. Script bumps `package.json` version, creates a tag, pushes to GitHub.
4. GitHub Actions `build.yml` detects the new tag and triggers Tauri cross-platform build.
5. All builds upload their artifacts to a GitHub Release (draft by default).
6. Developer reviews draft and publishes it (or it can auto-publish).
7. The `/download` page immediately reflects the new release.
