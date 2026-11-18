# Platform Announcements — Tasks

## Planning and safety

- [x] Define Superadmin and recipient permissions
- [x] Define AI safety (no AI) and patient-data safeguards
- [x] Define durable-first realtime architecture

## Database and server

- [x] Add PostgreSQL announcement and receipt schema
- [x] Add SQLite announcement and receipt schema
- [x] Generate PostgreSQL and SQLite migrations
- [x] Add the shared provider-neutral realtime hub
- [x] Add audience/status query helpers
- [x] Add announcement queries, live query, and commands
- [x] Add audit records for publish/archive actions

## Client and offline behavior

- [x] Add Dexie announcement/cache tables
- [x] Add typed announcement state store
- [x] Add live connect/disconnect and 30-second reconciliation
- [x] Add offline read/acknowledgement queue and reconnect flush
- [x] Prevent duplicate user notifications

## UI

- [x] Replace the mocked Superadmin announcement page
- [x] Use real reach estimates and publication history
- [x] Add audience PHC selection and confirmation
- [x] Integrate announcements into the notification centre
- [x] Add critical-announcement banner and acknowledgement
- [x] Initialize and clean up announcement state in app layout

## Tests and documentation

- [x] Test audience isolation, scheduling/expiry, and receipts
- [x] Test permissions and cross-PHC denial
- [x] Test realtime delivery and reconnect catch-up
- [x] Verify live responses are not service-worker cached
- [x] Create `docs/user-guides/platform-announcements.md`
- [x] Add a Changeset
- [x] Run formatting, targeted tests, service-worker check, and build
