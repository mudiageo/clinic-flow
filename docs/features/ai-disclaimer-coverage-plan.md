# AI Disclaimer Coverage — Feature Plan

## Objective

Add the existing `<AiDisclaimer>` component to the two AI paths identified in the pitch audit:

1. the nurse vitals workflow that produces an AI risk score and rationale; and
2. the Outbreak Radar surfaces that display AI-assisted epidemiological analysis.

This is an AI advisory disclaimer, not a synthetic-data banner. The already-submitted deck is not being changed.

## Permissions

- No new permissions. The disclaimer is visible to any user who can reach the hosting page.
- It does not enable, disable, or unlock AI features. Superadmin locks and local Admin feature toggles remain authoritative.

## AI safety and mitigations

- Use the shared `src/lib/components/ui/ai-disclaimer.svelte` component so wording stays consistent with Dr. Assist, RxBrain, and marketing AI pages.
- The disclaimer must appear **before** the AI-generated value or analysis it qualifies, not only after it.
- It states the output is experimental, informational/research-only, may make severe mistakes, and is not a substitute for professional clinical judgment.
- Human-in-the-loop: staff must independently verify AI risk scores and Outbreak Radar suggestions against the patient, source register, and surveillance data before any clinical or public-health action.
- Existing page-specific explanatory copy (for example the Outbreak Radar “AI-Assisted Analysis” blue alert) may remain, but the shared disclaimer makes the minimum safety language explicit.

## Placement

### Nurse vitals AI-risk path

- Import `AiDisclaimer` in `src/routes/(app)/nurse/vitals/+page.svelte`.
- Render it in Step 2 (Vitals), immediately above the vitals fields / live triage result and before saving triggers the background `getPatientRiskScore()` call.
- Keep it compact enough for the two-step form.

### Outbreak Radar pages

- Import and render `AiDisclaimer` in `src/routes/(app)/admin/outbreak-radar/+page.svelte` near the page header, before the radar tabs/analysis content.
- Import and render `AiDisclaimer` in `src/routes/(app)/admin/+page.svelte` directly above the AI Outbreak Radar widget, so the dashboard preview is also labelled.
- Replace the hand-built blue AI disclaimer block in `src/routes/(marketing)/support/outbreak-radar/+page.svelte` with the shared component, preserving the guide's adjacent explanatory paragraph about Gemini and de-identified data.

## Validation

- Svelte autofixer clean on every touched `.svelte` file.
- No new diagnostics versus baseline `225 errors and 23 warnings in 64 files`.
- `<AiDisclaimer>` imports are present only where the AI output is visible.
- Speaker script mentions the disclaimers during the relevant slide walkthroughs.
