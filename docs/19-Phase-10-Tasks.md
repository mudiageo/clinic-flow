## Phase 10: Nigeria PHC Innovations Tasks

### 10.1 Maternal Health Module
- `[ ]` Add `pregnancy_records` table to schema (LMP, EDD, status).
- `[ ]` Build ANC visit tracker UI in the patient profile.
- `[ ]` Implement EDD calculator logic.
- `[ ]` Create a digital Partogram UI for labor tracking.
- `[ ]` Auto-generate postnatal schedules upon delivery.

### 10.2 Digital Immunization Card
- `[ ]` Seed the database with the standard WHO/Nigerian immunization schedule.
- `[ ]` Build the Vaccine Status UI (Due | Given | Overdue) in the patient profile.
- `[ ]` Create a print-friendly offline layout for the immunization card.
- `[ ]` Tie vaccine administration to the background SMS reminder worker.

### 10.3 Nigerian Language Voice Input
- `[ ]` Add a `ChoiceBox` for language selection (English, Pidgin, Hausa, Yoruba, Igbo) in the Consultation view.
- `[ ]` Update the `aiService.structureIntake` prompt to handle translation from selected languages to structured English medical notes.
- `[ ]` Ensure the `AudioWave` animation provides clear feedback during recording.

### 10.4 Disease Outbreak Detection
- `[ ]` Write a server utility function `detectOutbreaks()` that aggregates encounters by complaint and location over a 7-day window.
- `[ ]` Expose the outbreak data via a new `query` remote function.
- `[ ]` Build an alert banner component that displays on the Admin and Superadmin dashboards if an outbreak threshold (e.g., ≥ 5 cases) is met.
- `[ ]` Build a Superadmin LGA-level heatmap (using a simple chart or map component).

### 10.5 Two-Way SMS & Referrals
- `[ ]` Create `/api/sms/inbound` endpoint to handle Termii webhook POST requests.
- `[ ]` Implement logic to parse "CONFIRM" / "STOP" commands and update appointment statuses.
- `[ ]` Build a structured referral letter generator in the Doctor's Consultation view.
- `[ ]` Implement PDF export for the referral letter.
