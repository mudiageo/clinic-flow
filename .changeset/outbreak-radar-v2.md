---
"clinic-flow": minor
---

**Feature:** Outbreak Radar v2 (Epidemiological Forecasting)

Rebuilt the Outbreak Detection system to use Gemini 2.5 Pro for deep multi-signal analysis.
- **Pre-alerts**: Detects exponential growth patterns before they hit the 5-case threshold.
- **Multi-signal**: Correlates chief complaints, labs, prescriptions, and high-fever vital clusters.
- **Stock Impact**: Warns if projected demand will exhaust pharmacy supplies.
- **IDSR generation**: Pre-populates the weekly Nigerian notifiable diseases report.
- **LGA Escalation**: One-click SMS dispatch to the Local Government Area DSO via Termii.
- The rule-based threshold engine remains active as an offline safety baseline.
