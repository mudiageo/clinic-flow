# ClinicFlow: Comprehensive ₦30,000,000 Financial Budget & Spend Plan

*This document serves as the master financial operating plan for ClinicFlow's initial 12-month runway, covering the procurement, deployment, and operational phases of the 3-clinic pilot and AI R&D lab.*

---

## 1. Executive Financial Summary

The ₦30,000,000 grant is strictly allocated to cross the "Valley of Death" for hardware-enabled healthtech startups. Unlike pure SaaS companies, ClinicFlow requires heavy upfront Capital Expenditure (CapEx) to establish physical resilience (solar, edge servers) in infrastructure-poor environments. 

**Budget Allocation Ratios:**
*   **CapEx (Hardware & Solar):** 70% (₦21,000,000) - This includes the Central AI Lab, Mobile ML Workstation, and the tablet/solar ecosystems for the 3 pilot clinics.
*   **OpEx (Operations, APIs, Travel):** 23% (₦7,000,000) - Deployment logistics, API consumption, cloud hosting, and compliance.
*   **Contingency (Emergency Buffer):** 7% (₦2,000,000) - Reserved for hardware failure or currency/inflation shocks.

---

## 2. Phase 1 Deep Dive: R&D Infrastructure & Central AI Lab (₦15,000,000)

To transition from cloud-dependent APIs to 100% offline local LLMs (MedGemma) running via WebGPU, we must bring AI fine-tuning in-house. Renting cloud GPUs for continuous fine-tuning on highly sensitive, un-anonymized Nigerian medical data violates NDPA data sovereignty laws. Thus, local enterprise-grade compute is mandatory.

### 2.1 Central AI Lab Workstation (₦7,500,000)
This machine will be stationed in a secure facility (HQ) to train, quantize, and test open-weight models using QLoRA techniques.
*   **GPU:** NVIDIA GeForce RTX 4090 24GB VRAM. (Required to hold 4B-8B parameter models in memory during training). *Cost: ~₦3,800,000*
*   **CPU:** AMD Ryzen Threadripper PRO 5955WX or Intel Core i9-14900K. (Required for heavy data pre-processing of the NPHCDA datasets). *Cost: ~₦1,200,000*
*   **RAM:** 128GB DDR5 6000MHz. (Crucial for dataset caching and avoiding out-of-memory errors during model compilation). *Cost: ~₦700,000*
*   **Storage:** 4TB Gen5 NVMe M.2 SSD. (High read/write speeds required for checkpointing model weights). *Cost: ~₦600,000*
*   **Supporting Hardware:** 1200W 80+ Platinum PSU, E-ATX Motherboard, Liquid Cooling System (AIO), and a 3KVA Pure Sine Wave UPS for grid protection. *Cost: ~₦1,200,000*

### 2.2 Mobile ML Development Workstation (₦7,500,000)
The CTO requires a UNIX-based machine capable of compiling heavy Tauri cross-platform binaries (Windows/Linux) and running WebGPU tests locally while physically present in the rural clinics (where desktop workstations cannot go).
*   **Laptop Specifications:** Apple MacBook Pro 16-inch (M3 Max or M4 Max variant).
*   **Memory Configuration:** 128GB Unified Memory. (Apple's unified memory allows the GPU to access all 128GB, making it the most powerful mobile machine for running unquantized LLMs in the field).
*   **Storage:** 2TB SSD.

---

## 3. Phase 2 Deep Dive: Edge Hardware & Solar Resilience (₦6,000,000)

This capital funds the physical infrastructure required to operate the 3-Clinic Live Pilot independently of the national power grid and telecommunications infrastructure.

### 3.1 Tablet & Network Ecosystem (₦3,000,000)
Each of the 3 clinics receives a "Clinic in a Box" hardware package.
*   **Clinical Tablets:** 12x Samsung Galaxy Tab Active3 (or rugged Lenovo equivalents). 4 per clinic (Reception, Triage, Doctor, Pharmacy). *Cost: 12 @ ₦180,000 = ₦2,160,000*
*   **Protection & Mounting:** 12x Heavy-duty drop-proof cases with hand straps and desk stands. *Cost: ₦340,000*
*   **The Edge Hub (Routers):** 3x High-Range 4G Wi-Fi Routers (e.g., MikroTik or TP-Link Archer) to broadcast the local mDNS network. *Cost: 3 @ ₦100,000 = ₦300,000*
*   **MDM Licensing:** 12-month subscription to a Mobile Device Management platform (e.g., Scalefusion) to lock tablets into Kiosk Mode, preventing staff from downloading personal apps that drain battery and storage. *Cost: ₦200,000*

### 3.2 Solar Resilience Infrastructure (₦3,000,000)
Grid power in target LGAs averages 4-6 hours per day. Our hardware must run 24/7 to ensure sync engine uptime.
*   **Inverters:** 3x 1KVA Hybrid Solar Inverters. (Sufficient to power 4 tablet chargers and 1 router simultaneously). *Cost: 3 @ ₦300,000 = ₦900,000*
*   **Batteries:** 6x 12V 200AH Deep Cycle Tubular Batteries (2 per clinic in a 24V configuration). *Cost: 6 @ ₦250,000 = ₦1,500,000*
*   **Solar Panels & Installation:** 6x 300W Monocrystalline panels (2 per clinic), plus cabling, mounting racks, and professional installation labor. *Cost: ₦600,000*

---

## 4. Phase 3 Deep Dive: Operations, Compliance, & Runway (₦9,000,000)

This is the operational lifeblood of the startup. It covers the costs of deploying the hardware, training the users, maintaining the cloud synchronization, and securing legal operating rights in the healthcare space.

### 4.1 Cloud Infrastructure & APIs (₦2,000,000)
*   **Google Gemini API Credits (₦1,000,000):** Subsidizes the cost of *Dr. Assist* (auto-scribing) and *RxBrain* (drug interaction checks) during Phase 1, prior to the rollout of the local MedGemma models.
*   **Termii SMS API (₦500,000):** Covers transactional SMS costs for patient appointment reminders and automated immunization follow-ups across the 3 clinics for 12 months.
*   **Cloud Hosting (₦500,000):** Vercel Pro Team account (for the SvelteKit Client Node) and a managed PostgreSQL database (Neon or Supabase) for the Master Cloud Node storage.

### 4.2 Field Deployment & Staff Logistics (₦3,500,000)
*   **Deployment Travel (₦1,500,000):** Covers flights/transport, 7 days of accommodation, and per diems for the COO and engineering team to physically travel to the 3 distinct LGAs and oversee the solar/network installation.
*   **Training Workshops & Materials (₦500,000):** Printing of laminated visual training guides in local dialects (Pidgin/Hausa/Yoruba/Igbo depending on the region) for the CHEWs.
*   **Pilot Participation Stipends (₦1,500,000):** Compensating off-duty Nurses and OICs to attend the 2-day technical onboarding training without losing their daily wages.

### 4.3 Legal & Compliance (₦1,500,000)
*   **NDPA Security Audit (₦800,000):** Hiring a certified Data Protection Compliance Organization (DPCO) to audit ClinicFlow's Edge-to-Cloud architecture and issue an NDPA compliance certificate, proving patient data is secure.
*   **Company Incorporation & Licensing (₦400,000):** Upgrading from an Enterprise to a Private Limited Company (LTD) with the CAC, and registering for the Nigeria Startup Act (NSA) label.
*   **IRB Ethical Clearance (₦300,000):** Filing fees for the Institutional Review Board at a State Teaching Hospital to ethically clear our AI models for clinical decision support.

### 4.4 Emergency Hardware Buffer (₦2,000,000)
*   A strict, untouched contingency fund. If a rural clinic experiences a massive power surge that fries a router, or a tablet is stolen, this fund ensures immediate replacement (within 48 hours) without derailing the operational budget.

---

## 5. Next Round Trajectory (Post-12 Months)
The purpose of this ₦30M budget is strictly to achieve **Product-Market Fit (PMF)** in a controlled 3-clinic environment. 
By Month 10, ClinicFlow will possess empirical data proving that our Edge-to-Cloud architecture reduces DHIS2 transcription delays by 90% and successfully flags clinical errors via offline AI. With NDPA and IRB compliance secured, the CEO will utilize this data to raise a **$500,000 Pre-Seed VC Round** to fund statewide expansion and enterprise B2B sales to private urban hospitals.
