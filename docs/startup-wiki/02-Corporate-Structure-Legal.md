# ClinicFlow: Legal, Corporate Structure & Compliance Playbook

_This document serves as the master legal framework for transitioning ClinicFlow from a student project into a venture-backable, legally compliant HealthTech startup in Nigeria._

---

## 1. Entity Selection & Incorporation

You currently have "Mudiageo Technologies" registered as a Business Name (Enterprise). While acceptable for a solo agency, an Enterprise cannot issue shares. Therefore, it is legally impossible to accept Venture Capital (VC), distribute equity to early employees, or protect yourself from personal liability if an AI medical error occurs.

### 1.1 The Incorporation Action Plan

- **The Target Entity:** You must incorporate a **Private Limited Liability Company (LTD)** with the Corporate Affairs Commission (CAC).
- **Naming Strategy:** We recommend registering a completely new entity: **ClinicFlow HealthTech LTD**. You can keep Mudiageo Technologies as your personal holding or consulting company.
- **Liability Shield:** An LTD creates a corporate veil. If ClinicFlow is sued (e.g., a clinic claims the software caused data loss), the liability is restricted to the company's assets, protecting your personal bank accounts.
- **IP Assignment (Crucial):** Immediately upon incorporation, all founders must sign an **Intellectual Property Assignment Agreement**. This legally transfers the ownership of the ClinicFlow codebase from you (the individual) to ClinicFlow LTD. Investors will not fund you if the company doesn't legally own its code.

---

## 2. Equity Structuring & The Cap Table

To scale, you must divide the ownership of the company strategically. At incorporation, authorize **10,000,000 shares**.

### 2.1 Proposed Cap Table Breakdown

- **Founders' Equity (80% / 8,000,000 shares):**
  - Divided amongst you and any co-founders based on contribution.
  - **Vesting Schedule (Mandatory):** Founder shares must be subject to a **4-Year Vesting Schedule with a 1-Year Cliff**. If a co-founder quits after 6 months to get a corporate job, they walk away with 0% of the company. If they stay for 1 year, they earn 25%, and the rest vests monthly. This protects the company from "dead equity."
- **Employee Stock Ownership Plan - ESOP (10% / 1,000,000 shares):**
  - Reserved to attract top-tier engineering talent and clinical advisors. Because you cannot afford to pay Silicon Valley salaries, you will offer equity (e.g., offering your Chief Medical Officer 1% of the company).
- **Pre-Seed / Seed Investors (10% / 1,000,000 shares):**
  - Left unissued initially, reserved for the first VC funding round post-grant.

---

## 3. Data Privacy & Cybersecurity Compliance (NDPA)

Handling Patient Identifiable Information (PII) makes ClinicFlow subject to severe regulatory scrutiny under the **Nigeria Data Protection Act (NDPA)** and global HIPAA standards.

### 3.1 Data Protection Officer (DPO)

- By law, ClinicFlow must appoint a DPO responsible for handling data breach protocols and filing the annual NDPA audit with the Nigeria Data Protection Commission (NDPC).

### 3.2 Technical Compliance Architecture

To pass the NDPA Security Audit (budgeted in Phase 3), the software must mathematically prove data security:

- **Encryption at Rest (The Edge):** The local SQLite database running on the clinic's Bun server must use AES-256 encryption (via `sqlcipher` or encrypted `libSQL`). If a tablet or the local server is physically stolen from a rural clinic, the data remains unreadable.
- **Encryption in Transit:** All sync payloads traveling from the Local Server to the Cloud Node must be secured via TLS 1.3. (The planned design uses CRDT sync payloads — see `docs/Architecture-Implementation-Plan.md`, Part B; current sync transmits versioned JSON records over TLS.)
- **Zero-Knowledge AI:** When using Cloud APIs (Gemini) in Phase 1, all PII (names, phone numbers) must be scrubbed by the local server _before_ the payload is sent to Google. When transitioning to Phase 2 (Local MedGemma models), 100% of the data remains on-premise, guaranteeing compliance.

---

## 4. Clinical Ethics & IRB Clearance

Because ClinicFlow features AI that provides clinical decision support (Dr. Assist and RxBrain), you are walking a dangerous legal line between a "software tool" and a "medical device."

### 4.1 The Regulatory Classification

- If you market ClinicFlow as an "AI Doctor that diagnoses patients," you will be shut down by the Medical and Dental Council of Nigeria (MDCN) and NAFDAC.
- **The Pivot:** You must strictly market and legally define ClinicFlow as a **Clinical Decision Support System (CDSS)**. The software _suggests_, but the human doctor _decides_.

### 4.2 Institutional Review Board (IRB) Strategy

Before deploying the AI in a live clinic, you must submit a proposal to a State Teaching Hospital's IRB.

- **The Audit Trail:** Your IRB proposal will highlight the **Conflict Inbox / Override Log**. You will prove to the ethics board that every time the AI makes a drug suggestion, the human doctor must explicitly click "Approve," and if the doctor overrides the AI, it is permanently logged for safety reviews. This human-in-the-loop architecture is the only way to secure ethical clearance.

---

## 5. The Nigeria Startup Act (NSA)

Once incorporated, applying for the NSA label via the NITDA portal is your highest administrative priority.

### 5.1 Benefits to ClinicFlow

- **Pioneer Status (Tax Holiday):** ClinicFlow will be exempt from corporate income tax for up to 4 years, allowing you to reinvest all revenue directly into R&D and hardware procurement.
- **Government Procurement (B2G Advantage):** The NSA legally mandates that government ministries (like the State Ministry of Health) prioritize labeled startups for software procurement. This gives ClinicFlow a massive legal advantage over foreign EMRs when bidding for statewide rollout contracts.
