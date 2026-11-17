# Client / Server Field Mapping (compatibility shim)

> **This documents the compatibility shim at the sync boundary, not the desired end state.**
>
> `pushOperations()` in `src/routes/sync/sync.remote.ts` and `pullChanges()` handling in
> `src/lib/state/sync.svelte.ts` translate between two schemas that have drifted apart. The
> permanent fix is to rename the client fields/types in `src/lib/local-db/db.ts` and every
> component/store that uses them to match `src/lib/server/db/schema.ts`, then delete the shim.
> Treat this document as the lookup table for that later migration.

Client shapes: `src/lib/local-db/db.ts`. Server shapes: `src/lib/server/db/schema.ts`.

## A. Blocking mismatches

These drop required columns and make a push fail with `db-error`.

| Client entity   | Client field                       | Server field         | Transform                                                       |
| --------------- | ---------------------------------- | -------------------- | --------------------------------------------------------------- |
| `patients`      | `name`                             | `fullName`           | rename                                                          |
| `prescriptions` | `inventoryId`                      | `inventoryItemId`    | rename                                                          |
| `prescriptions` | `medicationName`                   | —                    | drop; resolved by joining `pharmacyInventory`                   |
| `prescriptions` | `dosage`                           | `dosageInstructions` | rename                                                          |
| `prescriptions` | `status: 'pending' \| 'dispensed'` | `dispensed: boolean` | `'dispensed' → true`, plus `dispensedAt` / `dispensedByStaffId` |
| `prescriptions` | `phcId`                            | —                    | drop; derived from encounter/patient                            |

## B. Timestamp representation

Client uses epoch milliseconds; server uses `Date`. `pushOperations` currently converts only
`dob`, `recordedAt`, `calledAt`, `completedAt`, `visitDate`, `dueDate`, `sentAt`, `dispensedAt`,
`createdAt`, `lmpDate`, `eddDate`. `pullChanges` currently converts only `dob`, `recordedAt`,
`calledAt`, `completedAt`, `visitDate`, `dueDate`, `sentAt`, `dispensedAt`, `createdAt`.

| Field                | Entity           | Push         | Pull    | Notes                        |
| -------------------- | ---------------- | ------------ | ------- | ---------------------------- |
| `scheduledAt`        | appointments     | missing      | missing | `Date` ↔ number              |
| `resultEnteredAt`    | labRequests      | missing      | missing | `Date` ↔ number              |
| `lmpDate`, `eddDate` | pregnancyRecords | ok           | missing | `Date` ↔ number              |
| `updatedAt`          | most entities    | not stripped | missing | client bookkeeping or `Date` |
| `serverUpdatedAt`    | patients         | stripped     | missing | LWW metadata                 |

## C. Client-only fields

Stripped on push or ignored by Drizzle:

`syncStatus` (all entities), `serverUpdatedAt`, `updatedAt`, `isNhis` (patients),
`isNhisBillable` (encounters), `createdAt` (encounters), `medicationName` / `status` / `phcId`
(prescriptions).

> Note: NHIS flags are entered client-side but have no server column. `/admin/nhis-claims`
> therefore has no server source of truth. Separate follow-up.

## D. Server-only fields

Never reach Dexie:

`estimatedAge`, `nextOfKinName` (patients), `preferences`, `createdAt` (staff), `isConfirmed`
(appointments), `dispensedAt`, `dispensedByStaffId` (prescriptions), `lgaDsoPhone` and all feature
flags (phcs).

Tables with no client counterpart: `permissions`, `devices`, `sms_inbox`, `audit_log`,
`sync_operations`, `uplink_config`, Better Auth `user` / `account` / `session` / `verification`,
`family_relationships`.

## E. Table / entity-type mapping

Client `syncLog.entityType` → server table:

| Client entityType   | Server table                                                    |
| ------------------- | --------------------------------------------------------------- |
| `patients`          | `patients`                                                      |
| `queueTickets`      | `queue_tickets`                                                 |
| `vitalsRecords`     | `vitals_records`                                                |
| `pharmacyInventory` | `pharmacy_inventory`                                            |
| `reminders`         | `reminders`                                                     |
| `triageRules`       | `triage_rules`                                                  |
| `prescriptions`     | `prescriptions`                                                 |
| `encounters`        | `encounters`                                                    |
| `labRequests`       | `lab_requests`                                                  |
| `restockRequests`   | `restock_requests`                                              |
| `appointments`      | `appointments`                                                  |
| `pregnancyRecords`  | `pregnancy_records`                                             |
| `staff`             | `staff`                                                         |
| `families`          | `families` (missing from `tableMap`; family writes do not sync) |

## F. The two sync-log objects are not mirrors

|          | Client `LocalSyncOperation`                                       | Server `sync_operations`                                                   |
| -------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| identity | `entityName`, `entityId`, `operation: INSERT \| UPDATE \| DELETE` | `entityType`, `entityId`, `operation: create \| update \| delete \| delta` |
| metadata | `status`, `retryCount`, `errorMessage`, `createdAt`               | `phcId`, `deviceId`, `payload`, `clientUpdatedAt`, `serverReceivedAt`      |

## Non-sync view drift (separate bug)

The low-stock sidebar badges in `src/routes/(app)/+layout.svelte` read `quantity` /
`reorderLevel`; the inventory model has `currentStock` / `lowStockThreshold`. Fixed as part of
the seed consolidation, tracked separately from the schema migration.

## Migration checklist (later)

- [ ] Rename `LocalPatient.name` → `fullName` and update all stores/components
- [ ] Align `LocalPrescription` with `prescriptions` (including boolean `dispensed`)
- [ ] Decide a single timestamp representation across client and server
- [ ] Add NHIS columns to the server schema (or remove the client fields)
- [ ] Decide whether `families` and `familyRelationships` sync
- [ ] Delete `toServerRow()` / `toClientRow()` and this document
