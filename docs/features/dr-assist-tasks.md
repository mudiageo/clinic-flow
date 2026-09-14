# Dr. Assist - Task Tracker

## Pre-requisites
- [ ] Ensure `docs/features/dr-assist-plan.md` is approved by user.

## Backend / Logic
- [ ] Define `ClinicalDSSResult` interface in `src/lib/services/ai/ai.interface.ts`.
- [ ] Write the `clinicalDSS` system prompt in `src/lib/services/ai/prompts.ts`.
- [ ] Implement `getClinicalDecisionSupport` remote command in `src/routes/ai/ai.remote.ts`.
- [ ] Add permission checks (Superadmin/Admin/Doctor) inside the remote command.

## Frontend / UI
- [ ] Add "AI Assist" tab trigger to `/doctor/consult/[id]/+page.svelte`.
- [ ] Build the "AI Assist" tab content area.
- [ ] Wire up the "Run AI Analysis" button to call the remote command and handle loading states.
- [ ] Render the AI results (differentials, tests, treatments) beautifully using shadcn Cards/Badges.
- [ ] Implement the "Insert into Notes" functionality for AI suggestions.

## Finalization
- [ ] Test the feature end-to-end.
- [ ] Mark this feature as `[x]` in `docs/AI-Features-Implementation-Plan.md`.
