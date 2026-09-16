# Integration & Field Outreach Plan

## 1. Permissions Defined
- **DHIS2 Data Bridge:** Requires `manage:phc` (Local Admin) to export clinic-level data.
- **CHEW Field Mode:** Requires `manage:field` (CHEW, JCHEW roles).

## 2. AI Safety & Mitigations (CRITICAL)
- **DHIS2 Data Bridge:** DHIS2 is a strict national health information system. If AI is used to format, map, or summarize narrative reports for DHIS2, we MUST use a deterministic schema and include a strict `<AiDisclaimer>`. The admin must review the data payload before export to ensure no hallucinated patient data is submitted to the national database.
- **CHEW Field Mode:** Field workers operate in low-resource, offline environments. If AI (RxBrain or Dr. Assist) is used offline via a lightweight local model or cached rules, any `Red Flag` detection MUST trigger an un-dismissible, hardcoded alert instructing the CHEW to initiate an immediate physical referral to the PHC.

## 3. Implementation Details

### A. DHIS2 Data Bridge (Auto-Export)
- **Location:** `/admin/reports/dhis2`
- **Architecture:** We will create a client-side aggregator that reads from `patientStore`, `encounterStore`, and `vitalsStore`. It will map ClinicFlow's schema to a standard DHIS2 JSON payload (e.g., aggregating malaria cases by age/sex).
- **UI:** A one-click "Generate DHIS2 Payload" button that builds and downloads the `.json` file, alongside a preview table of the aggregated data.

### B. Dedicated "CHEW Field Mode" (Offline-First PWA)
- **Location:** `/field/*`
- **Architecture:** The app already utilizes Workbox for PWA caching and Dexie for the local database (`src/lib/local-db/db.ts`). We will build a dedicated offline-first workflow for CHEWs.
- **Features:** 
  - **Field Dashboard:** A simplified grid tailored for outreach.
  - **Offline Patient Registration:** Allow CHEWs to register new patients in the field (stored in Dexie `pendingSync` state).
  - **Outreach Logs:** Record immunizations or bednet distributions offline.
  - **Sync Indicator:** Leverage the existing `SyncIndicator.svelte` to show pending uploads when they return to an area with connectivity.

## 4. Required Files to Modify/Create
- `src/lib/config/permissions.ts` (Register `manage:field`)
- `src/lib/config/dashboard-modules.ts` (Register DHIS2 and Field routes)
- `src/routes/(app)/admin/reports/dhis2/+page.svelte` (DHIS2 Export Module)
- `src/routes/(app)/field/+layout.svelte` (Field specific sub-layout if needed, otherwise uses Universal App Shell)
- `src/routes/(app)/field/+page.svelte` (CHEW Field Dashboard)
- `src/routes/(app)/field/register/+page.svelte` (Offline Registration Form)
- `src/routes/(marketing)/support/dhis2/+page.svelte` (User documentation)
- `src/routes/(marketing)/support/field-mode/+page.svelte` (User documentation)
