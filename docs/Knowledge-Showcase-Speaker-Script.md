# ClinicFlow — Pitch Speaker Script

**Deck:** [`Grant-Pitch-Deck.md`](./Grant-Pitch-Deck.md) — the already-submitted 12-slide deck for this event. Do not revise or resubmit it.
**Source of truth:** every slide below follows the deck's own headline and content, in order. This is a student grant pitch — present all 12 slides, including market, business model, milestones and budget.

---

## ⚡ 3-MINUTE VERSION — read only this section

Timings are cumulative.

- **[0:00] Slide 1 — ClinicFlow.** "ClinicFlow: an offline-first, AI-powered safety net for Nigeria's primary health centres. Problem, build, and ask — in three minutes."
- **[0:12] Slide 2 — The 97% Staffing Crisis.** "97% of PHCs across 16 states miss minimum staffing standards — a deficit of about 122,000 health workers. Staff are trapped writing the same encounter into several paper registers, then transcribing it into DHIS2 weeks later. That double-entry causes errors and delays outbreak detection."
- **[0:35] Slide 3 — Build AI. Solve Local.** "We digitize at the point of care. The app is 100% offline-first: records go to IndexedDB on the device, and tablets sync across a local router with no internet. That's the core idea."
- **[0:50] Slide 4 — Empowering the Frontline.** "Dr. Assist is our AI auto-scribe: a doctor types shorthand like 'fever 5 days' and gets a structured SOAP note and differential. Instant triage flags red, amber, and green the moment a nurse enters vitals. AI output is advisory — the health worker verifies it."
- **[1:10] Slide 5 — RxBrain & Outbreak Radar.** "RxBrain cross-checks prescriptions against vitals and age to flag dangerous interactions. Outbreak Radar scans chief complaints across local PHCs to spot clusters like cholera weeks before paper-to-DHIS2 transcription. Both are decision support, not autonomous action."
- **[1:30] Slide 6 — A Massive Unmet Need.** "Over 30,000 PHCs in Nigeria. Government and international partners are actively looking for digital health tools that actually work offline — that's the addressable need."
- **[1:40] Slide 7 — B2B SaaS for Public Health.** "Buyers are state ministries of health, LGAs, and NGOs. Pricing is ₦50,000 per PHC per month, covering licensing, cloud backup sync, and AI API costs."
- **[1:52] Slide 8 — The Perfect Point-of-Care Companion.** "DHIS2 and CommCare are strong on aggregated reporting but weak at bedside workflows; traditional EMRs need constant internet and power. ClinicFlow sits at the point of care and is designed to bridge clean data into DHIS2."
- **[2:05] Slide 9 — From Concept to Working Prototype.** "A working PWA and Tauri desktop app, built with SvelteKit, Dexie, local sync, and Gemini. Core workflows — registration, triage, pharmacy — are built and lab-tested."
- **[2:20] Slide 10 — The Next 8 Months.** "Months 1–2: hardware — tablets, routers, solar power banks. Months 3–4: AI safety testing and NHIS integration. Months 5–8: a live field pilot with training, deployment, and monitoring."
- **[2:35] Slide 11 — The ₦5,000,000 Ask.** "We're asking for ₦5 million: 28% equipment, 36% research and development, 30% operations and training, 6% compliance and privacy audits."
- **[2:48] Slide 12 — The Team.** "Our team brings offline-first architecture, generative AI, and Nigerian public health experience. Join us in transforming primary healthcare. Thank you."

---

## Delivery notes

- Follow the deck order exactly — all 12 slides. Do not skip the commercial slides; this is a grant pitch.
- Use the deck's own headline figures and wording. Don't invent new numbers.
- On slides 4 and 5, keep AI framed as **advisory decision support with human verification** — never a diagnosis or an autonomous action.
- If demoing: the live prototype backs slides 3, 4, 5, and 9. Keep it short; the deck is the story.

---

## Slide-by-slide detail (longer version)

### Slide 1 — Title Slide

**Headline:** ClinicFlow — An offline-first, AI-powered safety net for Nigeria's Primary Health Centres.
**Say:** "ClinicFlow is an offline-first, AI-powered safety net for Nigeria's primary health centres. I'll cover the problem, what we've built, and the ask."
**Visual:** logo beside the Nurse Vitals Dashboard screenshot.

### Slide 2 — The Broken Backbone of Healthcare

**Headline:** The 97% Staffing Crisis.
**Say:** "97% of PHCs across 16 states fail minimum staffing standards — a national deficit of 122,696 health workers. OICs, visiting doctors, and nurses are trapped in redundant physical registers — ANC, TB, General. Then data is transcribed into DHIS2 weeks later, causing errors and delaying outbreak detection."
**Visual:** icons for the 97% stat, missing files, overwhelmed OIC.

### Slide 3 — The Solution

**Headline:** Build AI. Solve Local.
**Say:** "We capture data instantly at the point of care. It's 100% offline-first using IndexedDB, and devices sync across a local battery-powered Wi-Fi router."
**If demoing:** show the app's local cache / sync state. Say "local router sync", not magic discovery.

### Slide 4 — AI Clinical Decision Support

**Headline:** Empowering the Frontline.
**Say:** "Dr. Assist is an AI auto-scribe: shorthand like 'fever 5 days' becomes a structured SOAP note and differential. Instant triage flags red, amber, and green the second vitals are entered. AI output is advisory; the health worker verifies it."
**If demoing:** Vitals & Triage — point to the Experimental AI Feature disclaimer, save vitals, show triage level and the AI risk badge.
**Guardrail:** the score does not replace the nurse's triage decision.

### Slide 5 — AI Patient Safety & Epidemiology

**Headline:** RxBrain & Outbreak Radar.
**Say:** "RxBrain cross-references prescriptions against vitals and age to prevent fatal interactions. Outbreak Radar scans chief complaints across local PHCs to detect clusters like cholera weeks before manual transcription. Both are advisory — any escalation is reviewed and sent by authorized staff."
**If demoing:** Admin → Outbreak Radar — point to the AI disclaimer, show rule alerts and staff-initiated escalation.
**Boundary:** describe DHIS2 reporting as a staff-initiated bridge, not auto-submit.

### Slide 6 — Market Size & Opportunity

**Headline:** A Massive Unmet Need.
**Say:** "Over 30,000 primary health centres in Nigeria alone. Government and international NGOs are actively seeking digital health transformation that works offline."
**Visual:** map of Nigeria, "30,000+ Potential Deployments".

### Slide 7 — Business Model

**Headline:** B2B SaaS for Public Health.
**Say:** "Buyers are state ministries of health, LGAs, and international NGOs. ₦50,000 per PHC per month covers licensing, cloud backup sync, and AI API costs."
**Visual:** pricing tiers / NGO-to-state deployment funnel.

### Slide 8 — The Ecosystem Fit (Why We Win)

**Headline:** The Perfect Point-of-Care Companion.
**Say:** "DHIS2 and CommCare are national standards for aggregated data but lack offline point-of-care workflows. Traditional EMRs need constant internet and grid power. ClinicFlow is the real-time point-of-care tool, designed to bridge clean data into DHIS2."
**Visual:** 2×2 matrix — high clinical utility, high offline capability.

### Slide 9 — Traction & Current Status

**Headline:** From Concept to Working Prototype.
**Say:** "A complete PWA and Tauri desktop app. SvelteKit 5, Dexie.js with IndexedDB, local sync, Gemini API. Core clinical workflows — registration, triage, pharmacy — are built and lab-tested."
**Visual:** app on an Android tablet in airplane mode.

### Slide 10 — Milestones & Project Plan

**Headline:** The Next 8 Months.
**Say:** "Months 1–2: hardware — tablets, routers, solar power banks. Months 3–4: rigorous AI safety testing and NHIS integration. Months 5–8: a live field pilot with training, deployment, and monitoring."

### Slide 11 — Detailed Use of Funds

**Headline:** The ₦5,000,000 Ask.
**Say:** "₦5 million total: 28% equipment and assets, 36% R&D including LLM credits and engineering, 30% operations and on-site training, 6% compliance and NDPA privacy audits."

### Slide 12 — The Team

**Headline:** Engineering the Future of Healthcare.
**Say:** "Our team brings deep expertise in offline-first web architecture, generative AI, and Nigerian public health workflows. Join us in transforming primary healthcare. Thank you."
**Visual:** team headshots / university logo, bold "Thank You" with contact info.

---

## Optional live-demo checklist (only if time allows)

- [ ] Vitals & Triage → Experimental AI Feature disclaimer → save vitals → triage level + AI risk badge.
- [ ] Admin → Outbreak Radar → AI disclaimer → rule alerts + staff-initiated escalation.
- [ ] Patient profile → Maternal Health & ANC → Log ANC Visit → recent list.
