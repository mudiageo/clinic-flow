# ClinicFlow: Technical Architecture & Detailed Budget Breakdown

## 1. Technical Architecture Overview

ClinicFlow is engineered specifically to bypass the two greatest hurdles in rural Nigerian healthcare: **lack of internet** and **unreliable power**.

### Core Technologies

- **Frontend & PWA:** Built with SvelteKit 5 and compiled as an installable Progressive Web App (PWA).
- **Offline-First Database:** We utilize **Dexie.js (IndexedDB)** for instantaneous local reads and writes. The app functions flawlessly with zero internet connectivity.
- **LAN Synchronization:** Devices within the clinic synchronize data locally over a standard Wi-Fi router (which does not need an active internet uplink) using CRDT-inspired conflict resolution.
- **AI Integrations (Dr. Assist & RxBrain):** When internet _is_ available (even briefly via a mobile hotspot), ClinicFlow securely interfaces with the **Google Gemini API** to provide clinical decision support and drug safety checks.

---

## 2. Extremely Detailed Project Budget (₦5,000,000)

_Note: The budget has been rigorously evaluated to ensure absolute resilience during a 6-month live PHC pilot. We have factored in the critical necessity of solar backup power for our local LAN hardware, as well as the API consumption costs required for the AI safety features._

### Milestone 1: Hardware Procurement & Infrastructure Setup

**Total Allocated: ₦1,400,000 (28%)**
To run an offline-first system, the clinic requires localized hardware that can survive grid power failures.

- **Tablets & Peripherals (₦800,000):**
  - 4x Android Tablets (₦150k each) = ₦600,000. Used by the Receptionist, Nurse Station, Doctor's Desk, and Pharmacy.
  - Protective rugged cases and screen protectors = ₦100,000.
  - 4x Desktop stands = ₦100,000.
- **Networking Infrastructure (₦100,000):**
  - 1x High-Range Local Wi-Fi Router (Tp-Link or similar) = ₦50,000.
  - Cat6 Cabling and setup accessories = ₦50,000.
- **Solar Power & Inverter Setup (₦500,000):**
  - 1x 1KVA Inverter + 12V 100AH Battery = ₦350,000.
  - 2x 150W Solar Panels + Installation = ₦150,000. (Guarantees the router and tablets remain powered throughout the clinic's operating hours during grid outages).

### Milestone 2: Cloud Infrastructure, AI APIs & Integration

**Total Allocated: ₦1,800,000 (36%)**
Funding the software dependencies, cloud syncing, and AI intelligence for an 8-month runway.

- **Google Gemini API Credits (₦800,000):**
  - Estimated processing of 5,000+ medical LLM prompts per month across the pilot phase. This covers Dr. Assist (SOAP note generation) and RxBrain (pharmacological drug interaction safety checks).
- **Termii SMS API Credits (₦300,000):**
  - Cost for automated antenatal/immunization patient reminders and LGA outbreak alerts (approx ₦5 per SMS for 60,000 SMS messages over the pilot period).
- **Cloud Hosting & Database (₦400,000):**
  - Vercel Pro Tier hosting (₦60,000) + PostgreSQL cloud database (₦340,000) for the central sync server where clinics back up data when the internet is restored.
- **Data Protection & Compliance Audit (₦300,000):**
  - Legal and technical consultation to ensure the system architecture strictly complies with the Nigeria Data Protection Act (NDPA) for handling sensitive patient health information (PHI).

### Milestone 3: Live Pilot Deployment & Training (Logistics)

**Total Allocated: ₦1,800,000 (36%)**
The logistical costs of taking the software from the lab to a live rural PHC.

- **Staff Training Workshops (₦600,000):**
  - Venue rental/refreshments for 3 days of training = ₦150,000.
  - Printed training manuals and visual aids = ₦50,000.
  - Stipends/allowances for off-duty OICs, Nurses, and CHEWs attending the workshop = ₦400,000.
- **Travel & Deployment Logistics (₦500,000):**
  - Transportation (Flights/Fuel) for the engineering team to the pilot State (e.g. Kebbi or Edo) = ₦250,000.
  - Accommodation and feeding for the team for 7 days during initial deployment = ₦250,000.
- **Emergency Buffer & Maintenance (₦700,000):**
  - Reserved exclusively for immediate hardware replacements (e.g., replacing a broken tablet screen, replacing a faulty router) or unforeseen technical interventions required during the 6-month pilot window.

---

**Total Grant Request: ₦5,000,000**
