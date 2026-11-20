# Clinical Record Keeping: Immunizations and Cold Chain

This guide explains how to record vaccinations and refrigerator temperatures in ClinicFlow. Both records are **staff-entered**: ClinicFlow does not generate, guess, or infer clinical values for you.

> **Verify before clinical use.** Always check the physical register, the vaccine vial, and the fridge thermometer. ClinicFlow records are an aid to documentation, not a substitute for clinical judgement.

## Who can use these features

| Action                            | Required permission                   | Feature flag          |
| --------------------------------- | ------------------------------------- | --------------------- |
| View the immunization register    | Signed in to the PHC                  | `immunizationEnabled` |
| Record a vaccination              | `manage:immunization`                 | `immunizationEnabled` |
| View the cold-chain tracker       | `view:cold_chain`                     | `coldChainEnabled`    |
| Log a temperature                 | `manage:cold_chain`                   | `coldChainEnabled`    |
| View or edit vaccine batch/expiry | `view:inventory` / `manage:inventory` | —                     |

A Superadmin has global access. A local Admin can grant these permissions within their own PHC unless a Superadmin has locked the feature. If the feature flag is switched off, the action buttons are disabled and the server rejects any attempts to write those records.

## Record a vaccination

1. Open **Immunization (EPI)**.
2. Find the patient in the scheduled-appointment list using the search box. The list shows overdue, due-today, and upcoming appointments.
3. Select **Record vaccination**.
4. Enter:
   - **Vaccine name** — choose from the suggested EPI names or type the exact name on the vial.
   - **Dose number** — 1 to 4.
   - **Date administered** — the actual time the vaccine was given.
   - **Batch number** and **expiry date** — copy them from the vial. Leave blank if the vial has no readable label, and note this in the record.
   - **Route** and **notes** — optional.
5. Select **Save**. The appointment is closed and the vaccination appears under that patient's "Previously recorded" list.

Existing doses are never silently overwritten. If you entered something incorrectly, record a correction as a **new** entry and reference the original in the notes; the original remains visible in the register.

## Log a refrigerator temperature

1. Open **Pharmacy → Cold Chain Tracker**.
2. Select **Log Temperature**.
3. Enter the **fridge/unit label** (for example, the unit's asset tag), the **temperature in °C**, the **time of the reading**, and optional notes.
4. Select **Save**.

The tracker shows the latest reading with its time and the person who recorded it. A reading outside **2–8 °C** is flagged as an excursion warning, and a reading older than 24 hours is marked stale. **These are advisory only.** They do not delete stock, change vaccine records, or notify anyone automatically. A staff member must review the fridge and decide what action to take.

## Vaccine batch and expiry

Each vaccine stock card in the cold-chain tracker shows the batch number and expiry date recorded in pharmacy inventory. Items with no batch or expiry are shown as "Not recorded" — they are never filled in with plausible-looking values. An expired item is flagged with an **Expired** badge for manual review.

## Offline behaviour

Both records are saved on the device first and synchronized when a connection is available. A record marked **pending** is waiting to sync. If the device is offline, you can continue recording; nothing is lost when it reconnects. If you see a **conflict**, ask the PHC administrator to review it in the Sync Engine before making any clinical decision from that record.

## Safety rules

- Never record a temperature or vaccine detail you did not personally observe or transcribe from a physical source.
- Do not rely on ClinicFlow excursion warnings alone to determine whether vaccines are usable.
- Corrections are additive; keep the original record for audit.
- This feature does not use AI and does not give clinical recommendations.
