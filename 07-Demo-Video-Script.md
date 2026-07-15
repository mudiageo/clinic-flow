# ClinicFlow Demo Video Script

**Title**: ClinicFlow: Offline-First Healthcare for Rural PHCs
**Duration**: ~3-4 minutes

## Scene 1: The "Wow" Offline Registration (1 min)

- **Visual**: Show the ClinicFlow registration screen. The network tab/status indicator shows 'Online'.
- **Action**: Physically disable Wi-Fi (or toggle airplane mode). The Sync Status indicator changes to 'Offline' and 'Pending: 0'.
- **Narration**: "In rural primary health centers, the internet is never guaranteed. ClinicFlow allows staff to keep working seamlessly when the connection drops."
- **Action**: Register a new patient entirely offline. The system instantly saves the record and generates a QR code card.
- **Narration**: "The patient is registered locally to IndexedDB with zero latency, and a QR card is generated instantly for rapid check-ins on their next visit."

## Scene 2: Smart Triage & Voice Intake (1 min)

- **Visual**: Switch to the Nurse Station view. Still offline.
- **Action**: Nurse enters critical vitals (e.g., Temp 39.5°C). The triage rules engine instantly flags the patient as RED/URGENT and bumps them to the top of the queue.
- **Narration**: "Our offline triage engine evaluates rules instantly, highlighting critical cases without needing a server."
- **Action**: Toggle Wi-Fi back ON. The Sync Status indicator quickly flushes the pending count to 0.
- **Narration**: "When the internet returns, all offline actions automatically sync to the server in the background without user intervention."
- **Action**: Doctor clicks the "Hold to Speak" Voice Intake button (now that we are online) to record the chief complaint. Gemini parses it into structured data.

## Scene 3: Multi-Device Sync & Pharmacy Dispensing (1 min)

- **Visual**: Side-by-side view of the Doctor's Desk and the Pharmacy Dispense screen (simulating two devices on the same network).
- **Action**: Doctor prescribes medication and saves the encounter. The Pharmacy screen updates instantly via our `LiveQueueStore`.
- **Narration**: "Using our remote sync engine, changes propagate instantly across local clinic devices."
- **Action**: Pharmacy staff taps 'Dispense'.
- **Narration**: "Dispensing correctly decrements stock levels using a delta-based merge strategy, preventing conflicts even if multiple devices are dispensing simultaneously."

## Scene 4: Wrap Up & Automated Care (30 sec)

- **Visual**: Admin dashboard showing low stock alerts and the upcoming scheduled SMS reminders.
- **Narration**: "Behind the scenes, ClinicFlow tracks low stock levels and automatically dispatches SMS reminders for immunizations using Termii, ensuring patients return for critical follow-up care."
