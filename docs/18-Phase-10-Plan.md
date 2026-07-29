## Phase 10: Nigeria PHC Innovations Plan

### Overview
Phase 10 focuses on building specialized features tailored to the realities of Primary Healthcare Centers in Nigeria. These features are designed to handle maternal health, immunization tracking, localized disease outbreak detection, and communication workflows adapted to areas with low internet penetration but high mobile phone usage.

### Objectives
1. **Maternal Health Module**: Provide an end-to-end tracking system for pregnant women, managing ANC visits, generating expected delivery dates (EDD), and plotting labor progress via a digital Partogram.
2. **Digital Immunization Card**: Implement the WHO-compatible Nigerian immunization schedule, tracking vaccine statuses and automatically scheduling SMS reminders for upcoming doses.
3. **Nigerian Language Voice Input**: Expand the doctor's consultation voice intake to accurately transcribe and translate local languages (Pidgin, Hausa, Yoruba, Igbo) into structured clinical notes.
4. **Disease Outbreak Detection**: Build a background worker that monitors chief complaints and locations to automatically detect clusters of diseases (like Malaria or Cholera) and alert admins/superadmins.
5. **Two-Way SMS & Offline Referrals**: Expand the Termii SMS integration to handle inbound confirmations, and generate structured offline-capable PDF referral letters for transferring patients to secondary facilities.

### Technical Details

#### 1. Maternal Health Module
- Create new data structures to link patients to a `pregnancy_record`.
- Implement logic to calculate EDD from Last Menstrual Period (LMP).
- Build a visual timeline UI for ANC Visits (1-8).

#### 2. Digital Immunization Card
- Pre-seed a `vaccine_schedule` table with the standard Nigerian NPI (National Programme on Immunization) schedule.
- Implement a view in the patient profile that shows "Due", "Given", and "Overdue" vaccines.
- Add an "Export/Print" function for a physical card.

#### 3. Disease Outbreak Detection
- Add a new query in `superadmin.remote.ts` that groups recent encounters by `chiefComplaint` and `patient.community` / `patient.lga`.
- If a cluster threshold is reached (e.g., 5 cases of similar symptoms in 7 days in the same community), flag it in the Superadmin and Admin dashboards via an alert banner.

#### 4. Two-Way SMS
- Set up an inbound webhook endpoint `/api/sms/inbound` to receive payloads from Termii.
- Parse the message (e.g., checking for "CONFIRM" or "STOP") and update the corresponding appointment or reminder status in the local DB.
