# Dr. Assist (AI Clinical Decision Support) - Implementation Plan

## Overview
Dr. Assist provides real-time differential diagnoses, test suggestions, and treatment plans based on Nigerian PHC context, directly inside the Doctor Consultation view.

## Roles & Permissions
- **Access**: Doctors (Requires `view:medical_records` and `create:encounter`).
- **Global Control**: Superadmins can force enable/disable this feature globally via platform settings.
- **Local Control**: Admins can enable/disable for their specific PHC if the Superadmin has not locked it.

## 🏥 AI Safety & Mitigations
Because Dr. Assist provides clinical suggestions, the following guardrails MUST be implemented:
1. **Permanent UI Disclaimer**: The `<AiDisclaimer>` banner must be visible at all times within the AI Assist tab.
2. **First-Time Consent**: Doctors must acknowledge a legal/safety modal before using the feature for the first time.
3. **Strict Human-in-the-Loop**: The AI only returns a JSON payload; it cannot save to the DB. The Doctor must read the suggestion and manually click "Insert into Notes".
4. **Prompt Guardrails**: The system prompt must explicitly command the AI to prioritize identifying emergency "Red Flags" over guessing diagnoses.

## Architecture & Data Flow
1. **Trigger**: Doctor clicks "Run AI Analysis" in the consultation UI.
2. **Payload**: The client sends the patient's current `vitals` and the `chiefComplaint` text to the server.
3. **Server**: The remote function `getClinicalDecisionSupport` processes the payload using `@google/genai`.
4. **Prompt Context**: The AI prompt is strictly instructed to follow WHO PHC guidelines and Nigeria's essential medicines list.
5. **Response**: A structured `ClinicalDSSResult` JSON containing `differentials`, `suggestedTests`, `treatments`, and `redFlags`.
6. **UI**: Displayed as cards in the "AI Assist" tab. Doctor can click "Insert into Notes" to append the text to their consultation notes.

## Files to Modify

1. **`src/lib/services/ai/ai.interface.ts`**
   - Add `ClinicalDSSResult` interface.

2. **`src/lib/services/ai/prompts.ts`**
   - Add `clinicalDSS` system prompt and prompt builder.

3. **`src/routes/ai/ai.remote.ts`**
   - Import necessary utilities.
   - Define `getClinicalDecisionSupport = command(...)` returning the structured JSON.
   - Implement permission checks (Superadmin lock check + Admin toggle check + Doctor role check).

4. **`src/routes/(app)/doctor/consult/[id]/+page.svelte`**
   - Add "AI Assist" to the `TabsList`.
   - Create `TabsContent value="ai-assist"`.
   - Add `runAiAssist()` function to call the remote command.
   - Add loading skeleton states.
   - Map over the response data to render differential diagnoses, tests, and treatments.
   - Implement "Insert into Notes" button logic.
