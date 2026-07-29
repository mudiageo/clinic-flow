# ClinicFlow Demo Video Script (Expanded)

**Title**: ClinicFlow: Offline-First Healthcare for Rural PHCs
**Duration**: ~3-4 minutes

---

## Scene 1: The "Wow" Offline Registration (1 min)

**Goal:** Demonstrate the system's ability to seamlessly transition offline and continue functioning without disruption.

**Click-by-Click Action:**
1. Open the **Nurse Dashboard**. Point out the green "Online" indicator in the top right header.
2. **Turn off the device's Wi-Fi** (or toggle Chrome DevTools Network to "Offline").
3. Point out the sync status changing to "Offline" (red/amber indicator).
4. Click on **Patient Registry** -> **New Patient**.
5. Fill out the registration form for "Amina Abubakar". Click **Register**.
6. The system instantly routes to her profile and generates a QR code.

**Voiceover Narration:**
"In rural primary health centers across Nigeria, internet connectivity is never guaranteed. ClinicFlow was built from the ground up to handle this reality. When the connection drops, our local sync engine takes over. Notice how the status indicator changes to 'Offline'. But the work doesn't stop. Our nurses can register a new patient, like Amina here, and the system saves her record instantly to the local database, generating a QR code for rapid check-ins next time—all with zero internet."

---

## Scene 2: Smart Triage & Voice Intake (1 min)

**Goal:** Show triage logic working offline and then demonstrate the online AI capabilities.

**Click-by-Click Action:**
1. From Amina's profile, click **Record Vitals**.
2. Enter a critical temperature (e.g., `39.5°C`) and high blood pressure (`150/95`). Click **Save**.
3. Navigate to the **Nurse Queue Board**. Show Amina automatically moved to the "Red Alert" urgency column.
4. **Turn Wi-Fi back ON**. 
5. Point to the sync indicator as it flushes "Pending: 1... 0" and turns green.
6. Switch tabs to the **Doctor's Dashboard**. Click on Amina's name in the active queue to open the Consultation view.
7. Click the **Hold to Speak (Voice Intake)** button. Speak naturally: *"Patient presents with a high fever for three days and severe headaches."*
8. Let the AI structure the notes into the Chief Complaint and Symptoms fields.

**Voiceover Narration:**
"Even while completely offline, our smart rules engine evaluates vitals. Watch as we enter a high temperature—Amina is instantly flagged as 'Red Alert' and bumped to the top of the queue. When the internet returns, ClinicFlow silently pushes those offline records to the secure cloud. 
Now, as the Doctor takes over, we leverage AI to eliminate typing. By simply dictating the symptoms in English or local Nigerian languages, ClinicFlow automatically structures the clinical notes, saving doctors hours of paperwork every week."

---

## Scene 3: Multi-Device Sync & Pharmacy Dispensing (1 min)

**Goal:** Prove that devices on the same local network (or via the cloud) sync instantly.

**Click-by-Click Action:**
1. Set up a side-by-side view (or switch tabs quickly) of the **Doctor's Desk** and the **Pharmacy Dashboard**.
2. On the Doctor's Desk, add a prescription for "Artemether-Lumefantrine" and click **Complete Encounter**.
3. Immediately show the **Pharmacy Dashboard**—the prescription pops into the active dispense queue instantly.
4. Click **Dispense** on the Pharmacy side.
5. Navigate to the **Inventory** tab to show the stock level dropped precisely by the dispensed amount.

**Voiceover Narration:**
"In a busy clinic, coordination is key. As the doctor prescribes antimalarial medication and completes the encounter, that prescription instantly appears on the pharmacist's dashboard—no refreshing required. When the pharmacist dispenses the drug, ClinicFlow automatically deducts it from the local inventory. Our engine ensures that even if multiple staff members are working offline, stock levels are perfectly reconciled once they sync."

---

## Scene 4: Wrap Up & Automated Care (30 sec)

**Goal:** Highlight background automation and leave a lasting impression.

**Click-by-Click Action:**
1. Navigate to the **Superadmin System Health** dashboard. Show the queue of dispatched SMS messages.
2. Show a quick graphic or slide of a mobile phone receiving an SMS reminder.

**Voiceover Narration:**
"But ClinicFlow's job doesn't end when the patient leaves. Behind the scenes, the system automatically schedules and dispatches SMS reminders using Termii, ensuring patients return for critical immunizations and antenatal follow-ups. ClinicFlow isn't just a record system; it's a complete, offline-first digital infrastructure for rural healthcare. Thank you for watching."
