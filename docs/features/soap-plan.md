# Task 3: SOAP Note Generator - Architecture Plan

## 1. Feature Description
An AI-powered "SOAP Note Generator" located in the Doctor's Consultation view (`/doctor/consult/[id]`). It takes the patient's dictated/typed chief complaint, associated symptoms, and current vitals, and automatically structures them into a standard Subjective, Objective, Assessment, and Plan (SOAP) format to speed up clinical documentation.

## 2. Permissions & Roles
- **Required Role:** `doctor` or staff with the `write:medical_records` permission.
- **Global Override:** Superadmins can globally enable/disable this feature platform-wide.

## 3. AI Safety & Clinical Mitigations (CRITICAL)
- **Clinical Risk:** The AI might hallucinate physical exam findings (e.g., "lungs clear to auscultation") that were never performed or dictated.
- **Guardrails (Human-in-the-loop):** 
  - The AI output will **only** populate an editable text area (`doctorNotes`). The doctor is forced to review and manually save the encounter.
  - The AI prompt will be strictly constrained: *"DO NOT hallucinate physical exam findings. If none are provided in the transcript, explicitly write 'Pending physical exam' in the Objective section."*
- **UI Disclaimers:** 
  - Must include a clear UI indicator next to the button that it's an AI-drafted note.
  - The existing `<AiDisclaimer>` component applies to the workspace.

## 4. Implementation Steps
1. **Prompt Design (`src/lib/services/ai/prompts.ts`):** Add a `generateSoapNote` prompt schema using `gemini-2.5-pro` for high clinical reasoning.
2. **Remote Command (`src/routes/ai/ai.remote.ts`):** Expose `generateSoap` command verifying permissions and executing the prompt.
3. **UI Integration (`src/routes/(app)/doctor/consult/[id]/+page.svelte`):** Add a "Generate SOAP Note 🪄" button above the Doctor Notes text area. Connect it to the remote command.
4. **Documentation:** Update the `dr-assist` support page to include a section on the new SOAP Note generator.
