# Task 5: Outbreak Radar — Implementation Tasks (v2)

## Phase 1: AI Prompts & Backend

- [x] Add `epidemiologyForecast` prompt schema to `src/lib/services/ai/prompts.ts`
- [x] Add `getEpidemiologyForecast` command to `src/routes/ai/ai.remote.ts`
  - [x] Permission gate: `view:reports`
  - [x] Check `outbreakDetectionEnabled` feature flag
  - [x] Aggregate multi-signal data client-side (encounters, labs, prescriptions, vitals)
  - [x] Compute seasonal baseline (same-week last year) per disease group
  - [x] Strip all PII before sending
  - [x] Parse and validate typed `ForecastResult` from Gemini response

## Phase 2: Store Upgrade

- [x] Upgrade `src/lib/state/outbreaks.svelte.ts`
  - [x] Keep existing rule-based `alerts` getter intact
  - [x] Add `aiAnalysis: ForecastResult | null` state
  - [x] Add `isAnalysing: boolean` state
  - [x] Add `lastAnalysedAt: number | null` state
  - [x] Add `dismissedAlerts: Map<string, { reason: string; ts: number }>` state
  - [x] Add multi-signal aggregation helper (encounters + labs + prescriptions + vitals)
  - [x] Add seasonal baseline computation helper (same-week prior year)
  - [x] Add `async runAiAnalysis()` method
  - [x] Add `dismissAlert(id, reason)` method (writes to audit log)
  - [x] Add `markInterventionImplemented(interventionId, date)` method
  - [x] Add `interventionOutcomes: Record<string, { implementedAt: number; casesAfter?: number[] }>` state

## Phase 3: Admin Dashboard Widget

- [ ] Add Outbreak Radar card to `src/routes/(app)/admin/+page.svelte`
  - [ ] Show rule-based alerts from `outbreakEngine.alerts` (always visible, labelled "Threshold Alert")
  - [ ] Show pre-alert summary count (rising trends not yet at threshold)
  - [ ] "Run AI Analysis" button (lazy, not auto-triggered)
  - [ ] Loading skeleton with spinner during analysis
  - [ ] Disease severity cards (Critical / Warning / Watch) with weekly trend sparkline
  - [ ] `<AiDisclaimer>` above all AI content
  - [ ] AI confidence badge (High / Medium / Low)
  - [ ] Stock impact summary ("X drugs may run low next week")
  - [ ] "View Full Outbreak Radar" link → `/admin/outbreak-radar`
  - [ ] "Copy LGA Summary" button (copies `lgaSummary` to clipboard)

## Phase 4: Full Outbreak Radar Page

- [ ] Create `src/routes/(app)/admin/outbreak-radar/+page.svelte`
  - [ ] Disease outbreak cards (severity + trend + forecast + at-risk groups)
  - [ ] Pre-alert section (early warning, lower urgency styling)
  - [ ] Community × Disease spread matrix table
  - [ ] Per-disease 5-week trend sparklines with seasonal baseline overlay
  - [ ] AI intervention suggestions list with priority badges and "Mark Implemented" button
  - [ ] Stock impact forecast table (drug / projected demand / current stock / will run out)
  - [ ] IDSR report preview section with "Copy as Text" and "Print" buttons
  - [ ] LGA DSO SMS panel — compose and send via Termii
  - [ ] `<AiDisclaimer>` prominently displayed
  - [ ] Dismissed alerts section with reason log
  - [ ] Feedback outcomes section (post-intervention case trend)

## Phase 5: PHC Settings for LGA DSO

- [ ] Add `lgaDsoPhone` field to PHC settings page (`src/routes/(app)/admin/settings/+page.svelte`)
- [ ] Add `lgaDsoPhone` to `phcs` DB schema and local settings store

## Phase 6: Navigation

- [ ] Add "Outbreak Radar" link to Admin sidebar nav group

## Phase 7: Support Documentation

- [ ] Create `src/routes/(marketing)/support/outbreak-radar/+page.svelte`
  - [ ] Section: What is Outbreak Radar?
  - [ ] Section: The two layers — Rule-based alerts vs. AI analysis
  - [ ] Section: Understanding severity levels (Critical / Warning / Watch / Pre-Alert)
  - [ ] Section: Reading the community spread matrix
  - [ ] Section: Using the stock impact forecast
  - [ ] Section: Generating and submitting the IDSR / LGA report
  - [ ] Section: Sending an SMS to your LGA Disease Surveillance Officer
  - [ ] Section: Important limitations and AI safety disclaimer
  - [ ] Section: When to call the State Epidemiologist directly
- [ ] Add "Outbreak Radar" link card to `/support` index page

## Phase 8: Changeset & Tracker

- [ ] Add `.changeset/*.md` describing the feature (minor bump)
- [ ] Check off Task 5 in `docs/AI-Features-Implementation-Plan.md`
- [ ] Delete this tasks file
