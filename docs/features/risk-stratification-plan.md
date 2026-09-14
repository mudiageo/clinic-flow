# Task 4: Patient Risk Stratification - Architecture Plan

## 1. Feature Description
An AI-powered risk scoring system that analyzes a patient's vitals, age, sex, and chief complaint to generate a 0-100 "Deterioration Risk Score". This score is appended to their queue ticket and displayed visually on the Nurse's Queue Board, providing an extra dimension of triaging beyond the hardcoded Red/Amber/Green threshold rules.

## 2. Permissions & Roles
- **Required Role:** `nurse`, `doctor`, or staff with the `view:medical_records` permission.
- **Global Override:** Superadmins can globally enable/disable AI scoring. Local Admins can toggle if scores are visible to Nurses or restricted only to Doctors.

## 3. AI Safety & Clinical Mitigations (CRITICAL)
- **Clinical Risk:** The AI might under-score a critically ill patient, leading to delayed care.
- **Guardrails (Human-in-the-loop & Rule override):** 
  - **Rule Supremacy:** The AI score is strictly secondary. The hardcoded, WHO-aligned physiological Triage Rules (e.g., Temp > 39.5 = RED) *always* dictate the primary queue order and triage color. The AI score is merely a supplementary badge.
  - **Explainability:** The AI must output a short "rationale" string explaining *why* it gave that score, which will be visible on hover/click.
- **UI Disclaimers:** 
  - Risk badges will have a tooltip indicating "AI-Assisted Score".

## 4. Implementation Steps
1. **Database Update:** Update the `queueTickets` schema in `src/lib/server/db/schema.ts` to include `aiRiskScore` (integer) and `aiRiskRationale` (text). Run database migrations (or update local DB stores).
2. **Prompt Design (`src/lib/services/ai/prompts.ts`):** Add a `riskStratification` prompt schema.
3. **Remote Command (`src/routes/ai/ai.remote.ts`):** Expose `getPatientRiskScore` command.
4. **UI Integration - Vitals Form (`src/routes/(app)/nurse/vitals/+page.svelte`):** After the nurse saves vitals, trigger the AI command in the background and update the queue ticket.
5. **UI Integration - Queue Board:** Update `queue-ticket-card.svelte` (or equivalent queue UI) to display the score badge (e.g., 🔥 85/100).
