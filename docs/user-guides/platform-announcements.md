# Platform Announcements

Platform Announcements let ClinicFlow Superadmins send durable in-app notices to staff across one or more clinic workflows.

## Publishing an announcement

1. Sign in as a Superadmin.
2. Open **Platform Management → Announcements**.
3. Choose the audience:
   - **All active staff** — every active ClinicFlow staff account.
   - **Clinic Admins and OICs** — active staff with the Admin or Officer in Charge role.
   - **Specific PHC** — all active staff assigned to the selected PHC.
4. Choose a severity:
   - **Information** — ordinary operational information.
   - **Warning** — important information that needs attention.
   - **Critical** — shown as a persistent banner and always requires acknowledgement.
5. Enter a subject and concise message.
6. Optionally set a publication time, expiry, and safe action link.
7. Review the real reach estimate, select **Publish now** or **Schedule announcement**, and confirm.

## Patient-data safety

Never include patient names, clinic IDs, phone numbers, diagnoses, results, or other patient-identifiable information. Use the appropriate patient or clinical workflow for patient-specific communication.

Announcements are plain text. They are not generated or reviewed by AI.

## Recipient experience

- Connected staff receive an in-app notification in realtime.
- Staff who are offline receive the announcement after reconnecting.
- Previously received announcements remain available from the sidebar notification centre while offline.
- Any announcement marked **Acknowledgement required** includes an **Acknowledge** button in the notification centre, regardless of severity.
- Critical announcements remain visible as a banner until the staff member acknowledges them.
- A **Cached** indicator means the device is displaying the last stored copy and has not confirmed a current server connection.

## Scheduling and expiry

Scheduled announcements become visible at the selected local date and time. Expired or archived announcements disappear from recipient notification centres but remain in Superadmin publication history and audit records.

## Delivery history

The publication history shows:

- audience and publication status;
- creator and publication/scheduled time;
- recipient estimate;
- number of staff who have read the message;
- acknowledgement count when required.

Read and acknowledgement counts update in realtime while the Superadmin history page is open.

Published content is immutable for audit safety. If information is incorrect, archive the announcement and publish a corrected message.

## Delivery channels

This release provides in-app delivery only. It does not claim email or SMS delivery. Those channels require separate provider configuration, retry queues, and delivery logs.
