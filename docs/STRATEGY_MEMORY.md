# ClinicFlow: Strategic & Architectural Decisions Log

*This document serves as a persistent memory of high-level strategic decisions, architectural shifts, and workflow agreements made during agentic pairing sessions. (Excludes standard feature documentation and minor bug fixes).*

---

## 1. Architectural Patterns (Svelte 5 & SvelteKit)

### Svelte Error Boundaries over {#await} blocks
*   **Decision:** We mandate the use of `<svelte:boundary>` instead of inline `{#await}` blocks for handling async data fetching in UI components, adhering to the SvelteKit PWA Builder skill.
*   **Implementation:** Parent route files (e.g., `+page.svelte`) act solely as boundaries, exposing `{#snippet pending()}` (Skeleton loaders) and `{#snippet failed()}` (Error states). The actual data fetching is done in child components (e.g., `profile-content.svelte`) using **Top-Level `await`** in the `<script>` tag.
*   **Rationale:** This completely resolves the Svelte 5 `Cannot bind to constant` compiler errors (which occur when trying to `bind:` to destructured variables from an `{#await}` block) by allowing us to resolve the data into reactive `$state()` variables first.

### SvelteKit Experimental Commands
*   **Decision:** We export `.command` variants alongside `.form` actions in our remote files (e.g., `permissions.remote.ts`) when mutations need to be triggered directly via JS (like a UI toggle) without full form submission wrappers.
*   **Rationale:** Prevents Svelte 5 `derived_inert` warnings that occur when iterating experimental forms inside `{#each}` loops.

---

## 2. CI/CD & GitHub Actions

### Workflow Dispatch Permissions (403 Fix)
*   **Decision:** All GitHub workflows (e.g., `release.yml`, `nightly.yml`) that trigger downstream builds via `github.rest.actions.createWorkflowDispatch` (using `actions/github-script`) MUST explicitly include the `actions: write` permission in their job configuration.
*   **Rationale:** Without this scope, GitHub Actions returns a `403 Resource not accessible by integration` error, breaking the automated Tauri cross-platform build triggers on new releases.

---

## 3. Product Positioning & Grant Strategy

### "Clinic Management System" over "EMR"
*   **Decision:** In public-facing grants and pitches, ClinicFlow is framed as a "Clinic Management System" or "Clinical Decision Support System" rather than a strict "EMR".
*   **Rationale:** The term "EMR" brings heavy compliance expectations (HL7/FHIR interoperability), which are explicitly out of scope for v1.

### The DHIS2 "Companion" Narrative
*   **Decision:** DHIS2 is framed as the "ecosystem standard for aggregation," not a competitor. ClinicFlow is positioned as the real-time "point-of-care companion" that feeds into DHIS2.
*   **Rationale:** This prevents alienating public health officials who mandate DHIS2. We solve the DHIS2 "Double-Entry Trap" (where exhausted staff write on paper wards first, then manually transcribe online weeks later) by capturing data natively at the point of care.

### Broadening the User Persona
*   **Decision:** Expanded the primary user narrative beyond just CHEWs and Nurses to heavily feature **Officers in Charge (OICs)** and **visiting doctors**.
*   **Rationale:** OICs suffer the most from the DHIS2 reporting burden, and doctors suffer from the manual SOAP note documentation burden across multiple registers.

---

## 4. Post-Grant Execution Principles

### Hardware Resilience (MDM Kiosk Mode)
*   **Decision:** Any tablets procured for PHC pilots must be locked down using Mobile Device Management (MDM) software (Kiosk Mode).
*   **Rationale:** Prevents clinic staff from installing personal apps (WhatsApp, YouTube) which drain the critical battery life and consume storage required for the offline-first IndexedDB.

### Human-in-the-Loop AI Logging
*   **Decision:** All AI suggestions (Dr. Assist, RxBrain) that are manually overridden by clinicians must be securely logged.
*   **Rationale:** Provides the empirical data needed to fine-tune the Gemini prompts for higher accuracy in the specific Nigerian clinical context, while ensuring IRB ethical compliance.
