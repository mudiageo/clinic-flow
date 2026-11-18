# Integration & Field Outreach Plan

**Status:** Completed — durable outreach log

## 1. Permissions Defined

- **DHIS2 Data Bridge:** Requires `manage:phc` (Local Admin) to export clinic-level data.
- **CHEW Field Mode:** Requires `use:field_mode` for the field dashboard.
- **Outreach Log:** Requires `manage:outreach` to create and view PHC-scoped outreach records. CHEW, JCHEW, CHO, EHO, local Admin, and other roles receive this only through the existing role/permission policy.
- **Tenant boundary:** The PHC and recording staff identity come from the authenticated session. Clients cannot choose another PHC or staff identity.
- **Administration:** Local Admins may grant/revoke `manage:outreach` only within their PHC. Superadmins retain global permission-policy authority and may restrict the capability platform-wide; they do not receive access to a PHC's outreach records without a PHC assignment.

## 2. AI Safety & Mitigations (CRITICAL)

- **DHIS2 Data Bridge:** DHIS2 is a strict national health information system. If AI is used to format, map, or summarize narrative reports for DHIS2, we MUST use a deterministic schema and include a strict `<AiDisclaimer>`. The admin must review the data payload before export to ensure no hallucinated patient data is submitted to the national database.
- **CHEW Field Mode:** Field workers operate in low-resource, offline environments. If AI (RxBrain or Dr. Assist) is used offline via a lightweight local model or cached rules, any `Red Flag` detection MUST trigger an un-dismissible, hardcoded alert instructing the CHEW to initiate an immediate physical referral to the PHC.
- **Outreach Log:** This increment uses no AI and makes no diagnosis or clinical recommendation. Records are deterministic staff-entered aggregate counts. The form must not collect patient names, clinic IDs, phone numbers, free-text clinical histories, or other patient-identifiable data. The UI must state that urgent findings require immediate referral and must be documented in the patient's clinical record, not only in an outreach log.

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

### C. Durable Outreach Log

- **Location:** `/field/outreach`
- **Data model:** A PHC-scoped `outreach_records` table stores activity type, community, occurrence time, aggregate household/person/service counts, optional non-identifying notes, recorder, and timestamps.
- **Offline model:** Dexie v9 caches `outreachRecords`. `OutreachStore extends LocalCollection` owns reactive access and writes through the existing local sync log; components never access Dexie directly.
- **Sync model:** Outreach records use the existing shared realtime wake-up and cursor sync. They do not add a dedicated `query.live` stream. The server sync boundary enforces PHC scope, `manage:outreach`, and the authenticated recorder identity.
- **UI:** A shadcn-based aggregate log form, PHC summaries, recent records, and explicit pending/conflict sync state. No fake seed rows are shown.
- **Reliability:** Local records remain visible offline. Existing polling and reconnect catch-up remain authoritative if live wake-ups are unavailable.
- **Files:** Update both Drizzle schemas/migrations, `src/lib/local-db/db.ts`, sync adapters/boundary, session staff identity, add `src/lib/state/outreach.svelte.ts`, and create `src/routes/(app)/field/outreach/+page.svelte`.
- **Tests:** Validate deterministic store helpers, fixture/schema compatibility, tenant/permission rejection at the sync boundary where practical, a clean SQLite migration, the configured PostgreSQL migration, lint, type diagnostics for touched files, and production build.

## 4. Required Files to Modify/Create

- `src/lib/config/permissions.ts` (Register `manage:field`)
- `src/lib/config/dashboard-modules.ts` (Register DHIS2 and Field routes)
- `src/routes/(app)/admin/reports/dhis2/+page.svelte` (DHIS2 Export Module)
- `src/routes/(app)/field/+layout.svelte` (Field specific sub-layout if needed, otherwise uses Universal App Shell)
- `src/routes/(app)/field/+page.svelte` (CHEW Field Dashboard)
- `src/routes/(app)/field/register/+page.svelte` (Offline Registration Form)
- `src/routes/(marketing)/support/dhis2/+page.svelte` (User documentation)
- `src/routes/(marketing)/support/field-mode/+page.svelte` (User documentation)
