# Realtime and Offline Sync

ClinicFlow keeps clinical and operational records durable while delivering updates to connected devices within seconds.

## How it works

- Changes are saved to the server database and durable sync log first.
- Connected devices receive a small PHC-scoped wake-up signal containing no patient data.
- Each device then retrieves authorized records through the cursor-based sync service and updates its offline cache.
- If a live signal is missed, automatic 15–30 second reconciliation and reconnect catch-up recover it.

ClinicFlow does not open a separate live connection for every table or screen. One shared connection wakes the normal sync engine for patients, encounters, vitals, labs, prescriptions, stock, appointments, reminders, families, and queue records.

Each committed PHC change receives a server-controlled version. Devices apply those versions in order and store the cursor atomically with the corresponding IndexedDB records. Retried local operations keep the same operation ID, so a lost response cannot apply a stock deduction or other mutation twice.

New records are always written under the signed-in user's PHC. The server treats the session as the authority for tenant scope and rewrites any stale or placeholder `phcId` carried by a client record, so an offline-created queue ticket or patient is filed under the correct PHC rather than being rejected.

## Offline behaviour

- Safe cached records remain available while the device is offline.
- Local changes are queued and pushed automatically after reconnection.
- A newer local change is not replaced by an older delayed server snapshot.
- Sync cursors are stored separately for each PHC.
- After the versioned-sync upgrade, ClinicFlow replays the durable PHC feed once. It does not delete pending local changes or clear the offline cache.

## Queue changes

Calling, completing, and marking a patient as no-show update the local queue immediately. The durable update is then synchronized to other connected devices. Completed and no-show tickets must not reappear because of an older cached snapshot.

## Connection and data states

ClinicFlow displays two independent states:

- **Connection** (`Live`, `Connecting`, `Stale`, or `Offline`) describes only the lightweight wake-up stream.
- **Data freshness** (`Current`, `Syncing`, `Stale data`, `Cached`, or `Sync error`) describes whether durable records completed push and catch-up.

`Live` alone does not mean records are current. Polling remains active as a recovery mechanism even when the live connection is healthy.

## Conflict recovery

When an edit is based on an older server version, ClinicFlow preserves the rejected local payload and immediately shows the authoritative server record. An administrator can open **Admin → Sync Engine** and either:

- **Retry Local Edit** against the current server version; or
- **Discard Local** to keep the server version.

Use **Reconcile All Data** to replay the PHC's durable change feed without clearing IndexedDB or deleting unsent local operations.

## Privacy and safety

Realtime signals contain only invalidation metadata. Patient names, clinic IDs, observations, results, and other clinical data are retrieved through the existing authenticated and PHC-scoped sync query.

This synchronization feature does not use AI or generate clinical recommendations.

## Troubleshooting

If changes do not appear on another device:

1. Confirm both devices are signed into the same PHC.
2. Check both the connection badge and the data-freshness badge.
3. Click the data-freshness badge to request an immediate reconciliation.
4. Allow one reconciliation interval after reconnecting.
5. Open **Admin → Sync Engine** to review pending operations or conflicts, or run **Reconcile All Data**.

Do not clear site data while offline if unsynchronized operations are pending.
