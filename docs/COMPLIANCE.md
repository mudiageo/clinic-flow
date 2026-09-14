# ClinicFlow: Compliance & Safety Architecture

As a healthcare application operating in Primary Health Centres (PHCs), ClinicFlow is designed with strict adherence to both clinical guidelines and data privacy regulations. This document outlines our compliance frameworks and systemic safeguards.

## 1. Regulatory Compliance (Data Privacy)

### NDPR (Nigeria Data Protection Regulation) Compliance
ClinicFlow processes Personally Identifiable Information (PII) and highly sensitive health data. To comply with NDPR:
- **Explicit Consent:** Patients must explicitly consent to digital record-keeping and SMS communications (e.g., Termii SMS reminders).
- **Data Minimization:** Only data strictly necessary for clinical care and public health reporting is collected.
- **Right to Erasure:** The system supports logical deletion (soft deletes) to maintain relational integrity while masking PII upon valid request.

### Global Security Principles (HIPAA-Aligned)
While operating primarily in Nigeria, the architecture aligns with global HIPAA security standards:
- **Role-Based Access Control (RBAC):** Strict segregation of duties. A receptionist cannot view doctor notes; a pharmacy tech cannot alter vitals.
- **Immutable Audit Trails:** Every clinical action (prescribing, diagnosing, triaging) is logged in the `audit_log` table with timestamps and staff IDs to ensure medicolegal accountability.
- **Encryption in Transit:** All synchronization between the local PHC server and the central cloud uplink utilizes TLS 1.3 encryption.

## 2. Clinical Compliance

### NPHCDA & WHO Guidelines
- **Triage Protocols:** Automated triage scoring (Green, Amber, Red) is based on standardized clinical thresholds for vitals (e.g., detecting hypertension or extreme fever).
- **Maternal & Child Health:** Reminders for Antenatal Care (ANC) and Immunizations align strictly with the National Primary Health Care Development Agency (NPHCDA) schedules.

### AI Safety in Healthcare
- **Human-in-the-Loop:** AI features (like Dr. Assist) are restricted to *advisory* roles. AI cannot autonomously write to a patient's medical record or prescribe medication without explicit human authorization.
- **Red Flag Prioritization:** AI prompts are strictly engineered to abort standard diagnoses and flag emergencies if critical vitals or symptoms are detected.
- **UI Disclaimers:** All AI interfaces feature permanent, un-dismissible warnings indicating the experimental nature of the tool.

## 3. Systemic Safeguards & Known Architectural Challenges

To ensure operational safety in low-resource environments, the following technical safeguards are documented:

1. **Offline Data at Rest (The "Stolen Tablet" Risk):** 
   - *Challenge:* ClinicFlow uses IndexedDB (Dexie) for offline capabilities. If a tablet is stolen, local data is at risk.
   - *Mitigation:* Forced logout protocols flush the local database. Future roadmap includes full AES-256 local IndexedDB encryption via WebCrypto API.
2. **Offline Sync Conflicts:**
   - *Challenge:* Multiple offline devices editing the same patient record concurrently.
   - *Mitigation:* The system utilizes a "Last-Write-Wins" timestamp mechanism via the `sync_operations` table to resolve remote merges safely.
3. **AI Hallucinations:**
   - *Challenge:* Large Language Models (LLMs) can invent treatments or diagnoses.
   - *Mitigation:* Use of high-tier reasoning models (`gemini-2.5-pro`) bound by strict system prompts demanding adherence to WHO primary care guidelines, backed by mandatory doctor verification.
