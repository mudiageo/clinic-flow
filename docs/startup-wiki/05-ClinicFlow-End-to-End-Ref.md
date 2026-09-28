# ClinicFlow: End-to-End Operational Reference

This is the master reference for how data flows through ClinicFlow from a patient walking in the door, to the State Ministry viewing an outbreak.

## 1. Patient Arrival & Registration (Reception)
*   **Actor:** Receptionist / Records Officer.
*   **Action:** Patient arrives. The officer searches for their ID on the tablet. If new, they create a profile.
*   **Network:** The tablet connects via Wi-Fi to the Local Server (`http://clinicflow.local`). The data is saved instantly to the local SQLite database.

## 2. Triage & Vitals (Nurse Station)
*   **Actor:** Triage Nurse / CHEW.
*   **Action:** The nurse calls the patient. They input Blood Pressure, Temperature, Weight, etc. 
*   **AI Engine:** The local rules-engine instantly calculates the risk score (Red, Amber, Green).
*   **Network:** Data syncs over LAN to the Local Server. The Doctor's tablet updates in real-time.

## 3. Consultation (Doctor / OIC)
*   **Actor:** Medical Officer / OIC.
*   **Action:** The doctor reviews the vitals. They use **Dr. Assist** (voice-to-text or short keywords) to generate a structured SOAP note. 
*   **AI Engine:** If the Local Server has an internet connection, it pings the Gemini API. If the clinic is running the Phase 2 local AI (MedGemma via WebGPU), the tablet processes the text locally.
*   **Prescription:** The doctor prescribes medication. **RxBrain** scans the prescription against the patient's age and vitals, throwing a red flag if a dangerous interaction is detected.

## 4. Pharmacy & Dispensing
*   **Actor:** Pharmacist / Dispenser.
*   **Action:** The patient walks to the pharmacy. The pharmacist's tablet already shows the prescribed drugs. They click "Dispense."
*   **Inventory:** The Local Server deducts the drugs from the local inventory count, preventing drug leakage/theft.

## 5. The Edge-to-Cloud Sync (Background)
*   **Actor:** The Local Server (Automated).
*   **Action:** At 5:00 PM, the router regains a 4G internet connection. The Local Server's headless sync engine wakes up.
*   **CRDT Merge:** It packages all the day's JSON records, attaches Hybrid Logical Clocks (HLCs) and schema versions, and pushes them to the **Client Node** (e.g., Edo State Cloud Server).

## 6. Aggregation & Outbreak Radar (State Ministry)
*   **Actor:** State Epidemiologist / Superadmin.
*   **Action:** They log into the Cloud Node from their office in the capital.
*   **Analytics:** The dashboard aggregates data from all synced PHCs. The Outbreak Radar highlights a sudden 400% spike in Diarrhea cases in Garki Ward, alerting them weeks before manual DHIS2 paper transcription would have.
