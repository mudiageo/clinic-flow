# AI Features Implementation Plan (Part 1)

This document serves as the detailed blueprint for the AI builder agent to implement the headline AI features in ClinicFlow.
*Note: Checkboxes [ ] will be updated to [x] as features are completed.*

### 👑 Global Feature Control Hierarchy
**For all features listed below, the following enablement/restriction hierarchy applies:**
- **Superadmins** have global authority. They can enable, restrict, or force-lock any AI feature across the entire platform or for specific PHCs.
- **Local Admins** can toggle these features on/off for their specific PHC and grant/revoke access for individual staff members, *provided a Superadmin has not locked the setting globally*.

### 🏥 AI Safety in Healthcare Context (MANDATORY)
**Because ClinicFlow operates in a clinical environment, the following AI safety rules apply to ALL features:**
1. **Prominent Disclaimers:** Every AI-powered UI must permanently display the `<AiDisclaimer>` alert, clearly stating the feature is experimental and not a substitute for clinical judgment.
2. **Human-in-the-Loop:** AI must *never* autonomously write to a patient's medical record, alter a triage score silently, or prescribe medication. It can only *suggest*; a qualified human (Nurse/Doctor) must explicitly click to approve and insert the data.
3. **Risk Mitigation:** All AI prompt engineering must include strict boundaries (e.g., instructing the LLM to prioritize red-flag emergency referrals over attempting uncertain diagnoses).

---

## [x] 1. 🧠 Dr. Assist (AI Clinical Decision Support)
**Objective**: Provide real-time differential diagnoses, test suggestions, and treatment plans based on Nigerian PHC context.
**Permissions**: 
- **Roles**: Doctors only (requires `view:medical_records` and `create:encounter` permissions).
- **Control**: Superadmin can globally toggle this feature on/off for the entire PHC. Admin can revoke/grant AI access to specific doctors if needed.
**Files to Modify**:
- `src/routes/ai/ai.remote.ts`: Add `getClinicalDecisionSupport(vitals, chiefComplaint)` command.
- `src/lib/services/ai/prompts.ts`: Add `clinicalDSS` prompt. Contextualize it to use WHO PHC guidelines and Nigeria's essential medicines list.
- `src/lib/services/ai/ai.interface.ts`: Add `ClinicalDSSResult` interface.
- `src/routes/(app)/doctor/consult/[id]/+page.svelte`: Add "AI Assist" Tab and results cards.

## [ ] 2. 💊 RxBrain (AI Smart Prescription Assistant)
**Objective**: Suggest first-line medications from *current* inventory with age/weight appropriate dosages.
**Permissions**:
- **Roles**: Doctors only (requires `prescribe:medication` permission).
- **Control**: Admins can configure if the AI is allowed to suggest out-of-stock items or strict inventory-only.
**Files to Modify**:
- `src/routes/ai/ai.remote.ts`: Add `getSmartPrescription` command.
- `src/lib/services/ai/prompts.ts`: Add `smartPrescription` prompt.
- `src/routes/(app)/doctor/consult/[id]/+page.svelte`: Add "AI Suggest Meds" button in "rx" tab.

## [ ] 3. 📝 AI SOAP Note Generator
**Objective**: Restructure raw notes into subjective, objective, assessment, and plan format.
**Permissions**:
- **Roles**: Doctors only (requires `view:medical_records` permission).
**Files to Modify**:
- `src/routes/ai/ai.remote.ts`: Add `generateSOAPNote` command.
- `src/lib/services/ai/prompts.ts`: Add `soapNote` prompt.
- `src/routes/(app)/doctor/consult/[id]/+page.svelte`: Add "Generate SOAP Note" button.

## [ ] 4. 🤖 Patient Risk Stratification
**Objective**: Generate a 0-100 risk score and category badge for prioritized triaging.
**Permissions**:
- **Roles**: Nurses and Doctors (requires `view:patient_records`).
- **Control**: Admin can toggle whether Risk Scores are visible to all staff or restricted to Doctors/Supervisors.
**Files to Modify**:
- `src/routes/ai/ai.remote.ts`: Add `getPatientRiskScore`.
- `src/lib/components/queue-ticket-card.svelte`: Add an AI Risk Badge.
- `src/routes/(app)/nurse/vitals/+page.svelte`: Fetch score upon saving vitals.
- `src/lib/local-db/db.ts`: Update `LocalQueueTicket` schema.

## [ ] 5. 📊 Outbreak Radar (Epidemiology Forecast)
**Objective**: Analyze 30-day data for disease threats and intervention recommendations.
**Permissions**:
- **Roles**: Admins and Superadmins only (requires `view:reports`).
- **Control**: Superadmins have a cross-PHC view; local Admins only see their specific PHC data.
**Files to Modify**:
- `src/routes/ai/ai.remote.ts`: Add `getEpidemiologyForecast`.
- `src/routes/(app)/admin/+page.svelte`: Add `Card` widget for "Outbreak Radar".

## [ ] 6. 📅 AI Smart Reminder Scheduler
**Objective**: Suggest optimal follow-up dates based on consultation context.
**Permissions**:
- **Roles**: Nurses, Doctors, Admins (requires `manage:appointments` permission).
**Files to Modify**:
- `src/routes/ai/ai.remote.ts`: Add `getOptimalReminder`.
- `src/routes/(app)/nurse/reminders/new/+page.svelte`: Add "AI Auto-Schedule" button.

## [ ] 7. 📈 AI Report Narrative
**Objective**: Generate a plain-English LGA-ready summary of the month's stats.
**Permissions**:
- **Roles**: Admins only (requires `view:reports` and `manage:phc` permissions).
**Files to Modify**:
- `src/routes/ai/ai.remote.ts`: Add `generateMonthlyReportNarrative`.
- `src/routes/(app)/admin/reports/+page.svelte`: Add "Generate AI Summary" button.

## [ ] 8. 🌡️ AI Triage Optimizer
**Objective**: Suggest threshold adjustments to admin based on historical triage performance.
**Permissions**:
- **Roles**: Admins only (requires `manage:triage_rules`).
- **Control**: Superadmins can force global threshold standards, locking this feature for local Admins.
**Files to Modify**:
- `src/routes/ai/ai.remote.ts`: Add `optimizeTriageRules`.
- `src/routes/(app)/admin/triage/+page.svelte`: Add "AI Analyze Thresholds" button.
