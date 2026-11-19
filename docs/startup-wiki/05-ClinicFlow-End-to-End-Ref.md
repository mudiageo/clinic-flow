# ClinicFlow: End-to-End Operational Reference

> **Status:** verified 2026-11-19. This is the **intended end-to-end flow**. The 5:00 PM 4G batch, CRDT/HLC merge, and local MedGemma AI described below are **target-state (Planned)** — see `docs/Architecture-Implementation-Plan.md` for what is implemented today and `docs/user-guides/realtime-sync.md` for current sync behaviour.

This is the master reference for how data flows through ClinicFlow from a patient walking in the door, to the State Ministry viewing an outbreak.

## 1. Patient Arrival & Registration (Reception)

- **Actor:** Receptionist / Records Officer.
- **Action:** Patient arrives. The officer searches for their ID on the tablet. If new, they create a profile.
- **Network:** The tablet connects via Wi-Fi to the Local Server (`http://clinicflow.local`). The record is written immediately to the tablet's IndexedDB (Dexie) offline cache, then synchronized to the Local Server's local SQLite database over the LAN.

## 2. Triage & Vitals (Nurse Station)

- **Actor:** Triage Nurse / CHEW.
- **Action:** The nurse calls the patient. They input Blood Pressure, Temperature, Weight, etc.
- **AI Engine:** The local rules-engine instantly calculates the risk score (Red, Amber, Green). This is advisory only and requires human confirmation.
- **Network:** Data syncs over LAN to the Local Server. The Doctor's tablet updates in real-time through the shared wake-up stream.

## 3. Consultation (Doctor / OIC)

- **Actor:** Medical Officer / OIC.
- **Action:** The doctor reviews the vitals. They use **Dr. Assist** (voice-to-text or short keywords) to generate a structured SOAP note.
- **AI Engine:** With an internet connection, the Gemini API is used; the current offline fallback is WebLLM running in the browser via WebGPU. **Planned:** the Phase 2 local AI (MedGemma 4B via WebGPU, fine-tuned with QLoRA) will process the text entirely on the tablet, with no data leaving the device. See `docs/startup-wiki/07-Engineering-Guide.md`, §6.
- **Prescription:** The doctor prescribes medication. **RxBrain** scans the prescription against the patient's age and vitals, throwing a red flag if a dangerous interaction is detected. It remains advisory and never blocks the pharmacist's override.

## 4. Pharmacy & Dispensing

- **Actor:** Pharmacist / Dispenser.
- **Action:** The patient walks to the pharmacy. The pharmacist's tablet already shows the prescribed drugs. They click "Dispense."
- **Inventory:** The Local Server deducts the drugs from the local inventory count, preventing drug leakage/theft.

## 5. The Edge-to-Cloud Sync (Background)

- **Actor:** The Local Server (Automated).
- **Action (current):** Changes are pushed continuously through the durable sync engine — an immediate debounced flush plus 15–30 second reconciliation — and each committed PHC change receives a monotonic server version. There is no once-a-day batch.
- **Conflict handling (current):** Devices pull changes with a version cursor and resolve conflicts explicitly (Retry Local / Discard Local from Admin → Sync Engine). Realtime signals carry only invalidation metadata; patient records are fetched through the authenticated, PHC-scoped sync query.
- **Planned target:** at 5:00 PM the router regains a 4G connection and the Local Server's headless sync engine wakes up to batch the day's records. **CRDT Merge:** it packages the day's JSON records, attaches **Hybrid Logical Clocks (HLCs)** and schema versions, and pushes them to the **Client Node** (e.g., Edo State Cloud Server). This is the original design, not current behaviour.

## 6. Aggregation & Outbreak Radar (State Ministry)

- **Actor:** State Epidemiologist / Superadmin.
- **Action:** They log into the Cloud Node from their office in the capital.
- **Analytics:** The dashboard aggregates data from all synced PHCs. The Outbreak Radar highlights a sudden 400% spike in Diarrhea cases in Garki Ward, alerting them weeks before manual DHIS2 paper transcription would have.
