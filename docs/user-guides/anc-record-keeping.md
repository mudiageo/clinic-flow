# Recording ANC Visits

The maternal health tracker on a patient profile now has a working **Log ANC Visit** action.

## Before you start

- The patient must have an **active pregnancy** in the tracker. If none is shown, use **Log New Pregnancy** first.
- Your role must have `manage:anc` and the PHC must have **Maternal Health** enabled. Otherwise the button is disabled with an explanatory tooltip.
- If AI features are enabled, the app-wide AI advisory banner still applies. ANC visit recording itself does **not** use AI.

## Record a visit

1. Open the patient's profile and find **Maternal Health & ANC**.
2. Select **Log ANC Visit**.
3. Enter the visit date. The other fields are optional:
   - ANC visit number (1–8)
   - Systolic and diastolic blood pressure
   - Weight, fetal heart rate and fundal height
   - Free-text notes (maximum 500 characters)
4. Read the staff-entry notice: **“Staff-entered record. Verify against the physical ANC register before clinical use.”**
5. Select **Save ANC Visit**.

The record is written to the local IndexedDB cache immediately and queued for sync. The **Recent ANC visits** list under the action buttons updates straight away, even if the device is offline.

## Safety and verification

- Every value is entered by a staff member. ClinicFlow does not infer, score or interpret ANC measurements.
- The record is documentation only. It is not a diagnosis, risk assessment or treatment recommendation.
- A midwife, nurse or doctor must verify the entry against the physical ANC register and the patient before it is used for care or reporting.
- Correct errors through the normal clinical-record correction process; do not rely on an unverified saved value.
