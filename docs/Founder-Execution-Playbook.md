# ClinicFlow: Founder's Execution Playbook

This document is your blueprint for what happens *after* the grant hits your bank account. Building a HealthTech startup in Nigeria requires navigating complex public infrastructure, strict legal compliance, and hardware logistics. Here is your comprehensive guide to structuring the business, the team, and your expansion.

---

## 1. The Expansion Plan (The Milestone Roadmap)

Your expansion plan should be a natural continuation of the grant milestones, demonstrating a clear path from a single pilot to a nationwide standard.

*   **Months 1–4 (Grant Milestones 1 & 2): The Lab & Compliance Phase**
    *   Procure hardware (Tablets, Routers, Solar).
    *   Stress-test the LAN sync with fake high-volume data.
    *   Secure ethical clearances and lock down data privacy (NDPA compliance).
*   **Months 5–8 (Grant Milestone 3): The Single-Clinic Pilot**
    *   Deploy in **one** carefully selected Primary Health Centre (ideally peri-urban so you can monitor it easily).
    *   Goal: Prove that CHEWs will actually use it, and that the router/solar setup survives the environment.
*   **Months 9–12: The LGA Rollout (Land & Expand)**
    *   Use the success data from the single pilot to convince the Local Government Area (LGA) or a sponsoring NGO to fund a rollout to **5–10 PHCs** in the same district.
    *   Goal: Prove the *Outbreak Radar* works across multiple clinics.
*   **Months 12–24: The Private Sector Pivot**
    *   While public sector contracts are slow to close, private urban clinics have cash now. Expand the NHIS billing module into a full HMO claims system and sell ClinicFlow as a B2B SaaS to private hospitals struggling with power/internet outages.
*   **Months 24+: Statewide & Cross-Border**
    *   Pitch to a State Ministry of Health for a state-wide deployment.
    *   Begin expansion to other African nations that rely on DHIS2 (e.g., Ghana, Kenya, Rwanda).

---

## 2. Team Structure & Roles

You cannot build a HealthTech company with just software engineers. You need a balanced founding team.

*   **CEO / Product Lead (You):** 
    *   *Focus:* Product vision, pitching to NGOs and State Ministries, fundraising, and managing the overall pilot deployment.
*   **CTO / Lead Engineer:** 
    *   *Focus:* Hardcore engineering. Maintaining the offline-first Dexie architecture, handling LAN sync edge-cases, and managing the Gemini AI prompts and safety guardrails.
*   **Clinical Advisor / Chief Medical Officer (Part-Time):** 
    *   *Focus:* **Crucial.** You need a licensed Nigerian doctor to validate that *Dr. Assist* outputs and *RxBrain* rules actually align with NPHCDA guidelines. A tech team cannot legally or safely dictate medical rules.
*   **Operations & Field Manager:** 
    *   *Focus:* The person on the ground. They handle buying the tablets, setting up the solar inverters, fixing broken routers, and physically training the nurses and CHEWs.

---

## 3. Legal & Compliance (HealthTech Essentials)

Healthcare is highly regulated. You must protect the company from liability.

*   **Corporate & Startup Act:** Register the business with the CAC (Corporate Affairs Commission). Apply for the **Nigeria Startup Act** label, which grants massive tax breaks and helps with government procurement.
*   **NDPA (Nigeria Data Protection Act):** You are handling highly sensitive Patient Health Information (PHI). 
    *   *Action:* You must implement encryption-at-rest for the local tablet databases, and ensure your cloud database (PostgreSQL) is hosted in a compliant region. Add strict access logs.
*   **IRB Ethical Clearance:** Before deploying an AI that suggests medical diagnoses to real patients, you must get clearance from the State Ministry of Health or an Institutional Review Board (IRB) proving the AI is a "suggestion tool" and not a "replacement for a doctor."

---

## 4. Engineering & Hardware Strategy

*   **MDM (Mobile Device Management):** If you hand tablets to clinic staff, they *will* install WhatsApp, YouTube, and games, which will drain the battery and consume the storage. You must install MDM software (like Scalefusion or Google Workspace) to lock the tablets into "Kiosk Mode" so they can *only* run ClinicFlow.
*   **Human-in-the-Loop AI Logging:** Every time *Dr. Assist* makes a suggestion and a doctor overrides it, your system must securely log that override. This data is a goldmine for fine-tuning the AI later to be more accurate for the local demographic.

---

## 5. Marketing, Sales & Business Plan

Selling healthcare software requires two different playbooks depending on the buyer.

*   **B2G (Business to Government / NGOs):**
    *   *The Pitch:* Bureaucrats do not care about a beautiful UI. They care about **Data Visibility** and **Stopping Outbreaks**. 
    *   *How to sell:* Pitch the *DHIS2 Integration* and the *Outbreak Radar*. Show them how ClinicFlow eliminates their blind spots. Partner with NGOs (USAID, Bill & Melinda Gates Foundation) who have the budget to pay for the PHC deployments.
*   **B2B (Private Clinics & Hospitals):**
    *   *The Pitch:* Private clinic owners care about **Revenue** and **Stopping Leakage**.
    *   *How to sell:* Pitch the *Smart Pharmacy* (stopping staff from stealing drugs by tracking every dispense) and the *HMO Billing Module* (faster claims processing).

---

## 6. Financial Management (The ₦5M Grant)

*   **Separate CapEx from OpEx:** Keep the hardware money (CapEx - Tablets, Solar) strictly separated from operational money (OpEx - APIs, Travel). 
*   **Hardware Leasing:** As you expand, do not buy tablets outright for every clinic. Partner with a hardware financier (like a local bank or hardware-as-a-service provider) to lease the equipment to the clinics, reducing your upfront costs.
*   **The Next Fundraise:** The ₦5M grant is just to get you through the pilot. The moment the pilot is successful (Month 8), use the data (e.g., "We reduced patient wait times by 40% and caught 3 disease clusters early") to raise a **Pre-Seed VC round ($250k - $500k)** to fund the statewide expansion.
