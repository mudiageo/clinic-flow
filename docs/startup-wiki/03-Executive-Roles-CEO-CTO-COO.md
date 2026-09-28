# ClinicFlow: Executive Roles & Management Structure

A startup fails if everyone tries to do everything. The founding team must have strict domains of authority.

## Chief Executive Officer (CEO) - The Visionary & Closer
**Primary Metric:** Capital in the bank and signed State contracts.
*   **Fundraising:** Writing grant applications, pitching to VCs, and managing the ₦30M budget burn rate.
*   **B2G Sales:** Navigating the massive bureaucracy of the State Ministries of Health. The CEO is the one sitting in the OIC's office convincing them to adopt the software.
*   **Product Vision:** Defining the roadmap. The CEO decides *what* we build (e.g., "We need NHIS billing to sell to private clinics").

## Chief Technology Officer (CTO) - The Architect
**Primary Metric:** 100% Uptime, Zero Data Loss, AI Accuracy.
*   **Architecture:** Building the edge-to-cloud CRDT sync engine, configuring the mDNS, and managing the SQLite-to-Postgres abstraction.
*   **AI Infrastructure:** Running the Central AI Lab. The CTO is responsible for fine-tuning MedGemma and ensuring the WebGPU local LLM doesn't crash the clinical tablets.
*   **Security:** Enforcing NDPA encryption standards and managing the tablet MDM (Kiosk mode) fleet. The CTO decides *how* we build it.

## Chief Operating Officer (COO) - The Field General
**Primary Metric:** Successful Clinic Deployments & User Adoption.
*   **Logistics:** The COO buys the tablets, hires the solar installers, and physically drives the routers to the rural clinics.
*   **Training & Support:** Creating the training manuals in local dialects. When a nurse calls at 2:00 PM saying the tablet is frozen, the COO answers the phone.
*   **Compliance:** Managing the paperwork for the CAC, NITDA, and the IRB Ethical clearances.

## Chief Medical Officer (CMO) - *Crucial Addition*
*   **Clinical Safety:** A licensed doctor who reviews every "hallucination" the AI makes. They are legally responsible for verifying that the RxBrain drug-interaction rules match NPHCDA guidelines.
