# Task 5: Outbreak Radar (Epidemiology Forecast) — Architecture Plan v2

## 1. Feature Overview

Outbreak Radar is an AI-powered epidemiology intelligence panel on the Admin Dashboard. It upgrades the existing naive keyword `outbreakEngine` into a full multi-signal AI-driven analysis system with early warning, seasonal baselines, pharmacy impact forecasting, IDSR report generation, and LGA SMS escalation.

Two tiers:
- **Local Admin:** Analyses own PHC only
- **Superadmin (Phase 2):** Cross-PHC aggregate view across all registered facilities

---

## 2. Permissions & Role Control

| Role | Access | Scope |
|---|---|---|
| `superadmin` | Full access + Cross-PHC view | All PHCs |
| `admin` | Full access | Own PHC only |
| `doctor` | Read-only summary widget | Own PHC only |
| `nurse` | None | — |
| `receptionist` | None | — |

Permission gate: `view:reports`
Feature flag: `outbreakDetectionEnabled` (already on `phcs` schema)

---

## 3. AI Safety & Clinical Mitigations (CRITICAL)

### Clinical Risks
1. **False positive** — AI flags routine seasonal fever as a Cholera cluster, causing panic, incorrect resource allocation, and premature LGA escalation.
2. **False negative** — AI misses an early exponential growth pattern because absolute case counts are still low.
3. **Hallucinated interventions** — AI recommends drugs or treatments not in the PHC formulary.
4. **Over-reliance** — Admin dismisses their own clinical judgment and blindly follows AI output.

### Guardrails
1. The existing rule-based `outbreakEngine` (5 cases / 7 days threshold) **always runs first and independently**. The AI is a second layer — it can add nuance but never suppress a rule-based alert.
2. All AI outputs carry a visible `<AiDisclaimer>` component and are labelled **"AI-Assisted Analysis — Not a Clinical Diagnosis"**.
3. AI never receives patient names, IDs, phone numbers, or addresses — only de-identified aggregate counts and metadata.
4. Intervention suggestions are framed as **"Consider…"** — never imperative commands.
5. AI confidence level (High / Medium / Low) is displayed. Low-confidence outputs are greyed out with an additional caution badge.
6. **No automatic LGA escalation** — Admin must explicitly choose to send the SMS or export the report.
7. Dismissed alerts are logged in the audit log with reason. If a dismissed alert later crosses a higher threshold, the system surfaces a respectful re-notification.
8. Stock impact forecast is clearly labelled as **an estimate** based on projected case load.

---

## 4. Multi-Signal Data Contract (What We Send to Gemini)

All data is pre-aggregated and de-identified client-side before the remote function call.

```typescript
interface OutbreakAnalysisInput {
  phcName: string;        // "Agbarho PHC"
  lga: string;            // "Ughelli North"
  state: string;          // "Delta"
  analysisWindow: string; // "2026-08-14 to 2026-09-14"
  totalEncounters: number;

  // Primary signal: complaint-based clusters
  diseaseGroups: {
    disease: string;
    totalCases: number;
    weeklyBreakdown: number[];   // 5 weeks, most recent last
    samePeriodLastYear?: number; // seasonal baseline comparison
    affectedCommunities: string[];
    ageGroups: { under5: number; age5to15: number; adult: number; elderly: number };
    pregnantCases: number;
    communitySpreadSequence?: string[]; // communities in order of first case
  }[];

  // Secondary signal: lab results
  labSignals: {
    testType: string;            // "Malaria RDT", "Typhoid Widal"
    positiveCount: number;
    totalTested: number;
    weeklyPositives: number[];   // 5 weeks
  }[];

  // Tertiary signal: prescription anomalies
  rxSignals: {
    drug: string;                // "Artemether-Lumefantrine"
    weeklyDispensed: number[];   // 5 weeks
    currentStockLevel: number;
    lowStockThreshold: number;
  }[];

  // Quaternary signal: vitals cluster anomalies
  vitalsSignals: {
    anomalyType: string;         // "High Fever Cluster (≥38.5°C)"
    weeklyCount: number[];
    affectedCommunities: string[];
  }[];

  // Pharmacy stock for impact forecasting
  currentStockLevels: {
    drug: string;
    currentStock: number;
    unit: string;
    lowStockThreshold: number;
  }[];
}
```

---

## 5. AI Output Contract

```typescript
interface ForecastResult {
  confidence: 'high' | 'medium' | 'low';
  generatedAt: string; // ISO timestamp

  outbreaks: {
    id: string;                                          // e.g. "malaria-agbarho"
    disease: string;
    status: 'rising' | 'stable' | 'falling';
    severity: 'critical' | 'warning' | 'watch' | 'pre-alert';
    weeklyCases: number[];
    forecastNextWeek: number;
    forecastConfidenceRange: [number, number];           // e.g. [10, 16]
    affectedCommunities: string[];
    spreadHypothesis?: string;                           // e.g. "Possible waterborne source"
    atRiskGroups: string[];
    summary: string;                                     // 2-3 sentence plain English
  }[];

  preAlerts: {                                           // Rising trends NOT yet at threshold
    disease: string;
    growthPattern: string;                               // e.g. "Doubling every 2 weeks"
    currentCases: number;
    projectedThresholdDate: string;                      // ISO date
    affectedCommunities: string[];
    summary: string;
  }[];

  interventions: {
    priority: 'urgent' | 'routine';
    linkedDisease: string;
    action: string;
    rationale: string;
    estimatedStockNeeded?: string;                       // e.g. "26 ACT courses"
    stockSufficient?: boolean;
  }[];

  stockImpactForecast: {
    drug: string;
    projectedDemandNextWeek: number;
    currentStock: number;
    willRunOut: boolean;
    daysUntilStockout?: number;
  }[];

  idsr: {
    weekNumber: number;
    reportingPeriod: string;
    notifiableDiseases: {
      disease: string;
      confirmedCases: number;
      suspectedCases: number;
      deaths: number;
      action: string;                                    // "Investigate", "Continue surveillance"
    }[];
    narrativeSummary: string;                            // LGA-DSO ready paragraph
  };

  lgaSummary: string;                                   // Single paragraph for SMS / clipboard
}
```

---

## 6. Architecture & Files

| File | Action |
|---|---|
| `src/lib/services/ai/prompts.ts` | Add `epidemiologyForecast` prompt schema |
| `src/routes/ai/ai.remote.ts` | Add `getEpidemiologyForecast` command |
| `src/lib/state/outbreaks.svelte.ts` | Upgrade with AI state, multi-signal aggregation, dismiss, feedback |
| `src/routes/(app)/admin/+page.svelte` | Add Outbreak Radar card widget |
| `src/routes/(app)/admin/outbreak-radar/+page.svelte` | New full-page drill-down |
| `src/routes/(marketing)/support/outbreak-radar/+page.svelte` | Support article |
| `docs/AI-Features-Implementation-Plan.md` | Check off Task 5 |

---

## 7. Enhancements Beyond Original Scope

### 7a. Multi-Signal Intelligence
- Lab results (positive RDT/Widal counts per week)
- Prescription anomalies (unusual drug dispensing spikes)
- Vitals clusters (fever clusters by community, even without complaint text)
- Age/pregnancy distribution per disease group

### 7b. Seasonal Historical Baseline
- `outbreakEngine` tracks rolling 52-week complaint data per disease group
- "38 Malaria cases this week vs. 9 same week last year → 322% above baseline" is shown alongside AI analysis

### 7c. Pre-Alert / Early Warning (Before Threshold)
- Separate AI `preAlerts[]` output for rising trends not yet at threshold
- Exponential growth pattern detection (doubling pattern detection)
- Lower-urgency "Watch" UI tier — visible only to Admin, no panic-level styling

### 7d. Stock Impact Forecasting
- AI forecasts next-week drug demand per outbreak
- Cross-references current pharmacy stock levels
- Flags if projected demand exceeds current stock
- "You will need ~26 ACT courses next week. You currently have 14 — consider restocking."

### 7e. IDSR Report Generation
- AI pre-populates Nigeria IDSR Week Report format (notifiable diseases table + narrative)
- Admin reviews and confirms before sending/printing
- Copy to clipboard or print as formatted text

### 7f. LGA DSO SMS Escalation
- "Send Alert to LGA DSO" button
- Uses existing Termii SMS integration
- Sends the `lgaSummary` text to a configurable LGA DSO phone number (set in PHC settings)
- Logged in audit trail with timestamp

### 7g. Feedback Loop
- Admin can mark interventions as "Implemented" with a date
- System tracks case counts for 2 weeks after intervention
- If cases drop ≥30%, shows "Intervention appears effective"
- If admin dismisses an alert that later escalates → respectful re-notification

### 7h. Cross-PHC Superadmin View (Phase 2)
- Superadmin sees aggregate disease burden across all PHCs in the LGA
- Anonymous PHC benchmarking ("Your PHC: 38 cases. LGA median: 12 cases.")
- Cross-PHC spread detection (same disease appearing in adjacent PHCs in sequence)
- State-level IDSR aggregate generation

---

## 8. Support Documentation Plan

`/support/outbreak-radar` article covering:
- What Outbreak Radar is and what it is NOT
- Rule-based alerts vs. AI-assisted analysis — the two layers explained
- Understanding severity levels (Critical / Warning / Watch / Pre-Alert)
- How to read the community spread matrix
- How to use the stock impact forecast
- How to generate and send the IDSR / LGA report
- How to escalate to your LGA DSO via SMS
- Limitations and AI disclaimer
- When to call the State Epidemiologist
