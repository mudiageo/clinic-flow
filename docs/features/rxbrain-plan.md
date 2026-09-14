# Task 2: RxBrain (Smart Pharmacy & Drug Interactions)

## Objective
Provide real-time clinical safety checks at the point of dispensing. RxBrain cross-references the queued medications against the patient's vitals, age, and pregnancy status to detect contraindications, incorrect dosages, and dangerous drug interactions.

## Roles & Permissions
- **Access**: Pharmacist (Requires `dispense:medication` or `pharmacy` role).
- **Global Control**: Superadmins can force enable/disable this feature globally via platform settings.
- **Local Control**: Admins can enable/disable for their specific PHC if the Superadmin has not locked it.

## 🏥 AI Safety & Mitigations (CRITICAL)
As RxBrain handles pharmaceutical data, strict mitigations apply:
1. **Permanent UI Disclaimer**: The `<AiDisclaimer>` banner must be visible in the RxBrain panel.
2. **Advisory Only**: RxBrain CANNOT disable or block the "Dispense" button. The ultimate decision rests with the licensed pharmacist. It provides *warnings*, not blocks.
3. **Prompt Guardrails**: The system prompt must explicitly command the AI to analyze contraindications based ONLY on verified standard formularies (like the WHO Model List of Essential Medicines) and explicitly refuse to hallucinate interactions.

## Architecture & Data Flow
1. **Trigger**: When a pharmacist views a patient's dispense queue in `pharmacy/dispense`, they can click "Run RxBrain Analysis".
2. **Payload**: The client sends the patient's basic info (age, sex, pregnancy status), latest vitals, and the array of pending medications (with dosages) to the remote function.
3. **AI Provider**: `gemini-2.5-pro` (high reasoning capability required for drug interactions).
4. **Output Schema (JSON)**:
   - `interactions`: Array of potential drug-drug interactions.
   - `contraindications`: Array of patient-specific warnings (e.g., "Medication X is contraindicated due to pregnancy").
   - `dosageWarnings`: Array of dosage flags (e.g., "Dosage Y is too high for a pediatric patient").
   - `safeToDispense`: boolean (just an AI opinion, does not lock the UI).
5. **UI Rendering**: If warnings exist, highlight the specific prescription row with an amber/red warning icon and render a collapsible "Safety Report" panel.

## Files to Modify
- `src/lib/services/ai/ai.interface.ts`: Add `RxBrainResult` interface.
- `src/lib/services/ai/prompts.ts`: Add `rxBrain` system prompt.
- `src/routes/ai/ai.remote.ts`: Implement `getRxBrainAnalysis` remote command.
- `src/routes/(app)/pharmacy/dispense/+page.svelte`: Add the RxBrain analysis UI, loading state, and visualization.
