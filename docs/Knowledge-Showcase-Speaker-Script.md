# ClinicFlow — Knowledge Showcase Speaker & Demo Script

**Deck:** [`Grant-Pitch-Deck.md`](./Grant-Pitch-Deck.md) — the already-submitted 12-slide deck. Do not revise or resubmit it.
**Format:** 8–10 minute slide-keyed walkthrough with three short live-demo beats.
**Environment:** fresh database and Vercel deployment. Records shown are synthetic demo fixtures. This is a knowledge showcase of the architecture and workflow design — not a commercial pitch, not a clinical pitch, and not a claim of field readiness.

## Delivery notes

- Tone: technical, candid, and educational. Show what is implemented, what is advisory, and where the boundaries are.
- Some submitted slides are outside this knowledge showcase. They are acknowledged only as quick transitions so the script still follows the deck order.
- When an AI slide appears, point to the on-screen **Experimental AI Feature** disclaimer. Never describe AI output as a decision, diagnosis, or automated action.
- Do not claim broad on-device AI, a locked-down Android APK, universal zero-config discovery, DHIS2 auto-submit, or a live NHIS integration.
- Demo logins: `admin@clinic.com`, `doctor@clinic.com`, or `doctor.egor@clinic.com` (password `password123`).

---

## Slide 1 — Title Slide (“ClinicFlow”)

**Say:** “This is ClinicFlow, an offline-first clinic workflow prototype. Today I am using the submitted slides only as anchors to explain the engineering: local-first documentation, authoritative sync, and a deliberately advisory role for AI.”

**Show/do:** Open the deployed app and sign in as `doctor@clinic.com`. Land on **Operations Dashboard** or **Doctor Queue**.

**Boundary:** Call it a working prototype, not a deployed clinical product.

---

## Slide 2 — The Broken Backbone of Healthcare (“The 97% Staffing Crisis”)

**Say:** “I am not going to expand the staffing statistics here. The engineering point on this slide is the double-entry burden: the same encounter is written into several paper registers and later transcribed into a national reporting portal. That creates delay, duplication, and transcription error. That is the workflow shape the prototype models.”

**Show/do:** Stay on the slide briefly, then move on. No live action.

**Boundary:** Treat the headline statistic as deck context; do not present new or independently verified claims.

---

## Slide 3 — The Solution (“Build AI. Solve Local.”)

**Say:** “The local-first design is the core idea. Records are written to IndexedDB first. Writes go into an offline sync log, and when connectivity is available the client pushes operations to the server and pulls authoritative changes back using a cursor. Devices can be pointed at a local server address from the connect flow; that is a configurable path, not magic discovery.”

**Show/do:** Open **Settings** or the sync indicator and point out local cache / sync state. If online, trigger or observe a sync cycle.

**Boundary:** Say “local server address”, not “zero-config discovery”.

---

## Slide 4 — AI Clinical Decision Support (“Empowering the Frontline”)

**Say:** “Two different mechanisms often get grouped together here. Instant triage is deterministic: rules evaluate entered vitals and assign red, amber, or green immediately. Dr. Assist is the experimental AI path: shorthand keywords can be turned into a structured note, and the result is always advisory. We made that boundary explicit in the UI with the shared AI disclaimer placed before the vitals fields and before the background risk score.”

**Show/do:** Go to **Vitals & Triage**. In step 2, point to the **Experimental AI Feature** banner before entering vitals. Save a demo patient's vitals and explain that the background risk score appears on the queue card only after the deterministic triage result. Point to the ⚡ AI Risk badge and its rationale tooltip.

**Guardrail:** “The score does not replace the nurse's triage decision. Staff verify the underlying vitals and the patient first.”

**Boundary:** Dr. Assist uses a hosted model with a narrow WebLLM fallback for structuring dictated intake; do not describe the whole app as running AI on-device.

---

## Slide 5 — AI Patient Safety & Epidemiology (“RxBrain & Outbreak Radar”)

**Say:** “RxBrain is an advisory medication-safety check. Outbreak Radar combines a local rules engine with an AI-assisted summary. The AI layer correlates de-identified aggregate signals and suggests actions; it does not automatically report to DHIS2 or instruct staff. The advisory banner is shown on the radar page, the dashboard widget, and the support guide.”

**Show/do:** Open **Admin → Outbreak Radar**. Point to the AI disclaimer near the header, then the rule-based alerts and the AI-assisted analysis block. Show the **Escalate to LGA DSO** panel as a staff-initiated action, not an automatic send.

**Guardrail:** “Any escalation is reviewed and sent by an authorized staff member.”

**Boundary:** SMS sending uses the configured provider path; describe it as staff-initiated, not autonomous public-health action.

---

## Slide 6 — Market Size & Opportunity (“A Massive Unmet Need”)

**Say:** “Transition slide. No market or commercial framing in this showcase. The only technical carry-over is that a point-of-care tool has to tolerate intermittent connectivity, low-power hardware, and task-shifting between cadres.”

**Show/do:** Advance quickly. No live action.

**Boundary:** Do not discuss market size, adoption, or traction.

---

## Slide 7 — Business Model (“B2B SaaS for Public Health”)

**Say:** “Transition slide. Buyers, pricing, and commercial model are outside this knowledge showcase.”

**Show/do:** Advance quickly. Optionally show the role switcher to illustrate role-based access only — not pricing or buyers.

**Boundary:** No commercial discussion.

---

## Slide 8 — The Ecosystem Fit (Why We Win) (“The Perfect Point-of-Care Companion”)

**Say:** “The useful technical distinction is between aggregated reporting tools and point-of-care tools. ClinicFlow is explored as the point-of-care layer: capture in the queue or at the bedside, keep an authoritative local record, and bridge clean data outward later. DHIS2 export and NHIS integration are not live auto-submit features.”

**Show/do:** Stay on the slide. Describe the current boundary rather than showing a non-existent integration.

**Boundary:** Do not demonstrate or imply DHIS2 auto-submission or a live NHIS connection.

---

## Slide 9 — Traction & Current Status (“From Concept to Working Prototype”)

**Say:** “This is the live part. The app is a SvelteKit PWA with a Tauri desktop build. Clinical records are written offline-first through typed stores and synced when a connection exists. We just wired the ANC visit action so it is a real record instead of a placeholder button.”

**Show/do:** Open a female patient with an active pregnancy → **Maternal Health & ANC** → **Log ANC Visit**. Enter visit number, date, BP, weight, fetal heart rate, and a short note. Point out the staff-entry verification notice, save, and show the visit appear in **Recent ANC visits**.

**Guardrail:** “This is a staff-entered record. It is verified against the physical ANC register; nothing is inferred or scored.”

**Boundary:** Prototype/PWA and Tauri desktop are real. Do not claim a locked-down Android kiosk APK or universal offline AI.

---

## Slide 10 — Milestones & Project Plan (“The Next 8 Months”)

**Say:** “Transition slide. Roadmap and field-pilot planning are outside this showcase; the demo is about what the prototype does now.”

**Show/do:** Advance quickly. No live action.

**Boundary:** Do not turn planned work into delivered work.

---

## Slide 11 — Detailed Use of Funds

**Say:** “Transition slide. Budget and funding are for a separate pitch, not this knowledge showcase.”

**Show/do:** Advance quickly. No live action.

**Boundary:** Do not discuss the budget, vendors, or funds received.

---

## Slide 12 — The Team (“Engineering the Future of Healthcare”)

**Say:** “To close: the takeaway is separation of concerns. Durable records live in the database and local cache; sync is cursor-based and authoritative; AI is an advisory layer with visible disclaimers and human verification. Thank you — I'm happy to walk through the architecture or the data flow in more detail.”

**Show/do:** Return to the app dashboard. Leave the AI disclaimer and the ANC recent-visits list visible if taking questions.

**Boundary:** End on the architecture lesson, not a clinical or commercial claim.

---

## Live-demo checklist

- [ ] Sign in to the fresh deployment with a demo account.
- [ ] Vitals & Triage → point to AI disclaimer → save vitals → show deterministic triage and AI risk badge.
- [ ] Admin → Outbreak Radar → point to AI disclaimer → show rule alerts and staff-initiated escalation.
- [ ] Patient profile → Maternal Health & ANC → Log ANC Visit → show the saved record in the recent list.
- [ ] State explicitly: synthetic demo data, advisory AI, human verification required.
