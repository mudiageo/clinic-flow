# ClinicFlow Handover Document

**Date:** July 2026
**Current Phase Completed:** Phase 4 (Doctor Dashboard & Lab Hub)
**Next Phase:** Phase 5 (Pharmacy & Inventory)

This document serves as context for any future development sessions or agent handovers. It summarizes the project's current state, architecture, and recent changes.

---

## 1. Project Architecture

- **Framework:** SvelteKit (Svelte 5)
- **UI & Styling:** Tailwind CSS, `shadcn-svelte`, and `more-shadcn-svelte`.
- **Database (Local-First):** Dexie.js (`src/lib/local-db/db.ts`).
- **Database (Remote Server):** PostgreSQL via Drizzle ORM (`src/lib/server/db/schema.ts`).
- **Sync Engine:**
  - Client-side data is managed by Svelte reactive stores (e.g., `queueStore`, `patientStore`) extending `LocalCollection` (`src/lib/state/local-collection.svelte.ts`).
  - The background sync engine (`src/lib/state/sync.svelte.ts`) periodically flushes `LocalSyncOperation` logs to the server via `pushOperations` and pulls updates via `pullChanges` in `src/routes/sync/sync.remote.ts`.
- **Date Handling:** We exclusively use the native **`Intl` API** for date formatting via utilities in `src/lib/utils/date.ts`. We **DO NOT** use `date-fns`.

---

## 2. Work Completed in Recent Sessions

### Phase 3: Nurse Dashboard & Triage

- Built the **Live Queue Board** (`/nurse`) with sorting by triage urgency (`unassigned`, `green`, `amber`, `red`).
- Implemented **Patient Registration** and **Vitals Entry** with automated algorithmic triage.
- Added **SMS Reminders** scheduling (`/nurse/reminders`).
- Set up **Granular Permissions** and a Superadmin audit dashboard.

### Phase 4: Doctor Dashboard & Lab

- **Doctor Consultation Queue (`/doctor`):** Custom queue list allowing doctors to start consultations.
- **Split-Panel Workspace (`/doctor/consult/[id]`):** A comprehensive consultation interface utilizing `shadcn`'s `Resizable` panes.
  - **Left Pane:** Patient demographics, sparkline vitals trends, and past encounter timelines.
  - **Right Pane:** Tabbed interface for Clinical Notes (with Voice Dictation/AI stub), Prescriptions builder, Lab Request form, and Referrals.
- **Lab Management Hub (`/doctor/lab`):** Data table for lab technicians/doctors to track pending, processing, and completed lab tests, along with a modal to enter findings.
- **Patient Directory (`/doctor/patients`):** Searchable directory leading to comprehensive patient clinical profiles (`/doctor/patients/[id]`).

### Core Infrastructure Additions

- Added `LocalEncounter` and `LocalLabRequest` to the Dexie schema and sync engine.
- Generated and applied Drizzle migrations for `lab_requests` and `encounters`.

---

## 3. Mandatory Guidelines (`AGENTS.md` Summary)

When continuing work, **you must abide by the rules in `AGENTS.md`**:

1. **Svelte MCP Server:** Use `list-sections` and `get-documentation` to fetch Svelte 5 documentation, and run `svelte-autofixer` on all components.
2. **Component Naming:** Always use `kebab-case` for component files.
3. **UI Components:** Always use `shadcn-svelte` or `more-shadcn-svelte`. Do not build custom UI if a component exists.
4. **Icons:** Use `@lucide/svelte` exclusively.
5. **Database Access:** Never use Dexie directly inside `.svelte` components. Always route reads and writes through `$lib/state/` stores.
6. **Date Formatting:** Exclusively use the native `Intl` API (`src/lib/utils/date.ts`). Do not use `date-fns`.

---

## 4. Next Steps (Phase 5: Pharmacy & Inventory)

The immediate next phase involves building out the **Pharmacy & Inventory Module**:

1. **Prescription Dispensing (`/pharmacy`):** A queue/list of pending prescriptions created by doctors that need to be dispensed by the pharmacist.
2. **Inventory Management (`/pharmacy/inventory`):** Interface to view current stock levels, update stock, and track expirations.
3. **Restock Requests:** Flow to request new stock when items fall below a certain threshold.

**To resume work:**

- Refer to `FEATURES.md` for the overarching project roadmap.
- Run `pnpm dev` to start the local development server.
- Review `AGENTS.md` before writing code.
