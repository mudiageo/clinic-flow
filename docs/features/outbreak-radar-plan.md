# Task 5: Outbreak Radar (Epidemiology Forecast) — Architecture Plan

## 1. Feature Overview

Outbreak Radar is an AI-powered epidemiology intelligence panel on the Admin Dashboard. It upgrades the existing naive keyword `outbreakEngine` (which simply counts complaints containing "malaria" etc.) into a full AI-driven analysis system.

It analyses the last 30 days of de-identified encounter data, identifies disease clusters, computes trend trajectories (rising / stable / falling), forecasts the next 7-day case load, and generates actionable intervention recommendations tailored to the NPHCDA/LGA reporting context.

There are two tiers of the feature:

- **Local Admin View:** Analyses data for their own PHC only. Cannot see other PHCs.
- **Superadmin View:** Cross-PHC aggregate analysis across all registered facilities. Can compare PHCs and spot state-level threats (FUTURE — flagged in roadmap).

---

## 2. Permissions & Role Control

| Role | Access | Scope |
|---|---|---|
| `superadmin` | Full access | Cross-PHC (phase 2) |
| `admin` | Full access | Own PHC only |
| `doctor` | Read-only summary widget | Own PHC only |
| `nurse` | None | — |
| `receptionist` | None | — |

Permission gate: `view:reports`

Feature flag: `outbreakDetectionEnabled` (already exists on `phcs` schema — Superadmin can disable globally, local Admin cannot override a global lock).

---

## 3. AI Safety & Clinical Mitigations (CRITICAL)

### Clinical Risks
1. **False positive outbreak alert** — AI incorrectly flags routine seasonal fever as a Cholera cluster, causing unnecessary panic, incorrect resource allocation, and LGA escalation of a non-event.
2. **False negative** — AI misses a real emerging outbreak because case counts are low but rising exponentially.
3. **Hallucinated interventions** — AI recommends treatments or drugs that are not in the PHC formulary or are inappropriate for the local context.

### Required Guardrails

1. **The existing `outbreakEngine` threshold rules run FIRST.** AI analysis is a layer ON TOP — it never replaces the hard-coded 5-case/7-day community cluster rule. If the engine flags nothing, the AI still analyses trends but cannot override the engine's absence of an alert.
2. **All AI outputs are clearly marked "AI-Assisted Analysis"** with a visible `<AiDisclaimer>` component.
3. **AI never sends patient names, phone numbers, or clinic IDs** — only de-identified aggregate counts (e.g., `{ disease: "Malaria/Fever", community: "Agbarho", count: 38, weeklyTrend: [4,6,8,11,9] }`).
4. **Intervention suggestions are labelled as suggestions**, not instructions. UI copy: *"Consider discussing with your LGA Disease Surveillance Officer"* — not *"Administer X"*.
5. **AI confidence level** is requested and displayed (High / Medium / Low). Low-confidence outputs are greyed out with an additional warning.
6. **Manual override / dismiss** — Admin can dismiss/snooze any alert. Dismissals are logged in the audit log with reason.
7. **No automatic escalation** — the AI never sends alerts to the LGA automatically. The Admin must manually choose to export or share the report.

---

## 4. Data Contract (What We Send to Gemini)

All data is pre-aggregated and de-identified before leaving the browser:

```json
{
  "phcName": "Agbarho PHC",
  "lga": "Ughelli North",
  "state": "Delta",
  "analysisWindow": "2026-08-14 to 2026-09-14",
  "totalEncounters": 412,
  "diseaseGroups": [
    {
      "disease": "Malaria/Fever",
      "totalCases": 38,
      "weeklyBreakdown": [4, 6, 8, 11, 9],
      "affectedCommunities": ["Agbarho", "Okuokoko"],
      "ageGroups": { "under5": 12, "5to15": 8, "adult": 18 },
      "pregnantCases": 3
    }
  ]
}
```

**Explicitly excluded:** Patient names, IDs, phone numbers, addresses, staff names.

---

## 5. Architecture

### 5a. Prompt (`src/lib/services/ai/prompts.ts`)
New `epidemiologyForecast` schema:
- System prompt: NPHCDA-aware, disease surveillance context for rural Nigerian PHCs
- Instructs AI to output structured JSON: `{ outbreaks, forecast, interventions, confidence }`

### 5b. Remote Function (`src/routes/ai/ai.remote.ts`)
New `getEpidemiologyForecast` command:
- Permission gate: `view:reports`
- Reads 30-day data from `encounterStore` + `patientStore` on the client → aggregates it → sends de-identified bundle
- Returns structured `ForecastResult`

### 5c. Outbreak Store Upgrade (`src/lib/state/outbreaks.svelte.ts`)
- Keep existing `outbreakEngine.alerts` (rule-based, always runs)
- Add `aiAnalysis` state (`ForecastResult | null`)
- Add `isAnalysing` boolean
- Add `lastAnalysedAt` timestamp
- Add `runAiAnalysis()` async method
- Add `dismissAlert(id, reason)` method

### 5d. Admin Dashboard Widget (`src/routes/(app)/admin/+page.svelte`)
- New **Outbreak Radar card** with:
  - Rule-based alerts from `outbreakEngine.alerts` (always visible, labelled "Threshold Alert")
  - AI forecast section (lazy — only loads when Admin clicks "Run AI Analysis")
  - Trend sparklines per disease group (last 5 weeks)
  - Intervention suggestions with `<AiDisclaimer>`
  - "Export Report" button → generates a plain-text LGA-ready summary

### 5e. Dedicated Outbreak Radar Page (`src/routes/(app)/admin/outbreak-radar/+page.svelte`)
- Full-page drill-down view
- Disease-by-disease breakdown
- Community heat map table (community × disease count matrix)
- AI confidence indicator
- Alert history / dismissed alerts log
- Export to PDF / plain text

---

## 6. Files to Create/Modify

| File | Action |
|---|---|
| `src/lib/services/ai/prompts.ts` | Add `epidemiologyForecast` schema |
| `src/routes/ai/ai.remote.ts` | Add `getEpidemiologyForecast` command |
| `src/lib/state/outbreaks.svelte.ts` | Upgrade with AI state, `runAiAnalysis()`, dismiss |
| `src/routes/(app)/admin/+page.svelte` | Add Outbreak Radar card widget |
| `src/routes/(app)/admin/outbreak-radar/+page.svelte` | New full-page drill-down (create) |
| `src/routes/(marketing)/support/outbreak-radar/+page.svelte` | New support article (create) |
| `docs/AI-Features-Implementation-Plan.md` | Check off Task 5 |
| `docs/features/outbreak-radar-tasks.md` | Track task progress |
| `.changeset/*.md` | Add changeset before merging |

---

## 7. AI Output Contract

The AI returns strictly typed JSON:

```json
{
  "confidence": "high" | "medium" | "low",
  "outbreaks": [
    {
      "id": "malaria-agbarho",
      "disease": "Malaria",
      "status": "rising" | "stable" | "falling",
      "severity": "critical" | "warning" | "watch",
      "weeklyCases": [4, 6, 8, 11, 9],
      "forecastNextWeek": 13,
      "affectedCommunities": ["Agbarho"],
      "atRiskGroups": ["Children under 5", "Pregnant women"],
      "summary": "Malaria cases in Agbarho have risen 175% over 4 weeks..."
    }
  ],
  "interventions": [
    {
      "priority": "urgent" | "routine",
      "action": "Consider distributing insecticide-treated nets (ITNs) to households in Agbarho community.",
      "rationale": "Rising malaria cases with 12/38 cases in children under 5 suggests environmental exposure."
    }
  ],
  "lgaSummary": "One sentence suitable for LGA Disease Surveillance Officer report."
}
```

---

## 8. Support Documentation Plan

- `/support/outbreak-radar` — "Understanding the Outbreak Radar" guide covering:
  - What it does / what it does NOT do
  - How to interpret severity levels
  - How to export the LGA report
  - Limitations and AI disclaimer
  - When to contact the LGA Disease Surveillance Officer
