# Task 5: Outbreak Radar — Implementation Tasks

## Phase 1: AI Backend

- [ ] Add `epidemiologyForecast` prompt schema to `src/lib/services/ai/prompts.ts`
  - System prompt must reference NPHCDA disease surveillance context
  - Must instruct AI to output structured JSON only
  - Must include confidence level output
- [ ] Add `getEpidemiologyForecast` remote command to `src/routes/ai/ai.remote.ts`
  - Permission gate: `view:reports`
  - Check `outbreakDetectionEnabled` feature flag on PHC settings
  - Aggregate 30-day encounter + patient data client-side
  - Strip all PII before sending (names, IDs, phone numbers)
  - Send de-identified disease cluster bundle to Gemini 2.5 Pro
  - Parse and return typed `ForecastResult`

## Phase 2: Store Upgrade

- [ ] Upgrade `src/lib/state/outbreaks.svelte.ts`
  - Keep existing rule-based `alerts` getter unchanged (never remove)
  - Add `aiAnalysis: ForecastResult | null` state
  - Add `isAnalysing: boolean` state
  - Add `lastAnalysedAt: number | null` state
  - Add `dismissedAlerts: Set<string>` state
  - Add `async runAiAnalysis()` method (calls remote function)
  - Add `dismissAlert(id: string, reason: string)` method

## Phase 3: Admin Dashboard Widget

- [ ] Add Outbreak Radar card to `src/routes/(app)/admin/+page.svelte`
  - Show rule-based cluster alerts from `outbreakEngine.alerts` (always visible)
  - Label rule-based alerts clearly as "Threshold Alert (Rule-based)"
  - Add "Run AI Analysis" button (lazy — not auto-triggered on page load)
  - Show loading skeleton during AI analysis
  - On AI result: render disease cards with severity badge, trend sparkline (5-week), and forecast
  - Show `<AiDisclaimer>` component above all AI-generated content
  - Show AI confidence badge (High / Medium / Low)
  - Add "View Full Report" link → `/admin/outbreak-radar`
  - Add "Export LGA Summary" button → copies `lgaSummary` text to clipboard

## Phase 4: Full Outbreak Radar Page

- [ ] Create `src/routes/(app)/admin/outbreak-radar/+page.svelte`
  - Full disease-by-disease breakdown cards
  - Community × Disease count matrix table
  - Per-disease weekly trend sparkline charts
  - At-risk group breakdown (under 5, pregnant women, adults)
  - AI intervention suggestions list with priority badges
  - `<AiDisclaimer>` prominently displayed
  - Alert dismiss workflow (with reason input — logged to audit)
  - Dismissed alerts history section
  - Export section: plain-text LGA report preview + copy button

## Phase 5: Navigation

- [ ] Add "Outbreak Radar" link to Admin sidebar nav

## Phase 6: Support Documentation

- [ ] Create `src/routes/(marketing)/support/outbreak-radar/+page.svelte`
  - Section: "What is the Outbreak Radar?"
  - Section: "How it works" (rule-based layer + AI layer explained separately)
  - Section: "Understanding severity levels" (Critical / Warning / Watch)
  - Section: "How to export the LGA report"
  - Section: "Important limitations and AI disclaimer"
  - Section: "When to escalate to your LGA Disease Surveillance Officer"
- [ ] Add "Outbreak Radar" link to `/support` index page

## Phase 7: Changeset & Tracker

- [ ] Add `.changeset/*.md` file describing the feature
- [ ] Check off Task 5 in `docs/AI-Features-Implementation-Plan.md`
- [ ] Delete this tasks file
