# Realtime and Offline Sync

ClinicFlow keeps clinical and operational records durable while delivering updates to connected devices within seconds.

## How it works

- Changes are saved to the server database and durable sync log first.
- Connected devices receive a small PHC-scoped wake-up signal containing no patient data.
- Each device then retrieves authorized records through the cursor-based sync service and updates its offline cache.
- If a live signal is missed, automatic 15–30 second reconciliation and reconnect catch-up recover it.

ClinicFlow does not open a separate live connection for every table or screen. One shared connection wakes the normal sync engine for patients, encounters, vitals, labs, prescriptions, stock, appointments, reminders, families, and queue records.

## Offline behaviour

- Safe cached records remain available while the device is offline.
- Local changes are queued and pushed automatically after reconnection.
- A newer local change is not replaced by an older delayed server snapshot.
- Sync cursors are stored separately for each PHC.

## Queue changes

Calling, completing, and marking a patient as no-show update the local queue immediately. The durable update is then synchronized to other connected devices. Completed and no-show tickets must not reappear because of an older cached snapshot.

## Connection states

The sync engine tracks whether its shared signal stream is connecting, live, stale, offline, or in error. Polling remains active as a recovery mechanism even when the live connection is healthy.

## Privacy and safety

Realtime signals contain only invalidation metadata. Patient names, clinic IDs, observations, results, and other clinical data are retrieved through the existing authenticated and PHC-scoped sync query.

This synchronization feature does not use AI or generate clinical recommendations.

## Troubleshooting

If changes do not appear on another device:

1. Confirm both devices are signed into the same PHC.
2. Check the sync indicator and network connection.
3. Allow one reconciliation interval after reconnecting.
4. Open **Admin → Sync Engine** to review pending operations or conflicts.

Do not clear site data while offline if unsynchronized operations are pending.
