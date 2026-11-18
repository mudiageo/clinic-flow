# Platform Announcements — Implementation Plan

**Status:** Completed
**Created:** 2026-11-17

## Objective

Replace the mocked `/superadmin/announcements` page with a durable, audited, realtime announcement system. A Superadmin can publish an announcement to all active staff, all clinic administrators, or one PHC. Matching staff receive it in the existing notification centre, can read or acknowledge it, and retain access after disconnects or restarts.

## Permissions

- **Publish/manage:** `superadmin` through the existing `requireSuperadmin()` server guard and `manage:platform` navigation permission.
- **Read:** any authenticated, active staff member whose server-derived role/PHC matches the announcement audience.
- **Targeting:** PHC, role, and staff identity are derived from `getRequestEvent().locals`; the client cannot select its own recipient identity.
- **Local Admins:** read targeted announcements only in this release. A later feature may add PHC-only publishing behind a dedicated permission and Superadmin feature lock.
- **Critical notices:** cannot be hidden by local PHC feature toggles. Acknowledgement is recorded when required.

## AI Safety

This feature does **not** use AI. No message is generated, summarized, targeted, or published by AI. If AI drafting is added later, it must be labelled as AI-generated, reviewed by a human, and never auto-published.

Clinical/data-safety controls:

- Composer warns authors not to include patient-identifiable information.
- Content is plain text for the first release; no unsanitized Markdown/HTML.
- Critical announcements require acknowledgement and remain visible until acknowledged or expired.
- Realtime transport is never the source of truth; messages and receipts are durable and auditable.

## Architecture

The feature follows `AGENTS.md` §7 (Realtime Data Architecture):

```text
publish command -> DB commit + audit row -> realtime hub invalidation
watchAnnouncements query.live -> authorized DB snapshot -> hub wait -> re-query/yield
announcementStore -> IndexedDB cache -> notification centre/banner
30-second reconciliation + reconnect -> recover missed live invalidations
```

### Server database

Add mirrored PostgreSQL and SQLite tables:

1. `announcements`
   - `id`, `title`, `body`
   - `severity`: `info | warning | critical`
   - `audience`: `all | admins | phc`
   - nullable `targetPhcId`
   - `status`: `draft | scheduled | published | archived`
   - `requiresAcknowledgement`
   - optional action label/URL
   - scheduled, published, expiry, created, and updated timestamps
   - creator staff ID and recipient-count snapshot
2. `announcement_receipts`
   - composite key: announcement + staff
   - read and acknowledgement timestamps

Published content is immutable. Corrections are new announcements; old announcements may be archived.

### Remote functions

Create `src/lib/remote/announcements.remote.ts`:

- `getAnnouncementReach` — real active-staff count for an audience.
- `listPlatformAnnouncements` — Superadmin publication history.
- `getMyAnnouncements` — authenticated, server-filtered catch-up query.
- `watchAnnouncements` — `query.live` initial snapshot plus hub-driven invalidation and 30-second reconciliation.
- `publishAnnouncement` — validates, inserts, audits, then publishes an invalidation after commit.
- `archiveAnnouncement` — Superadmin-only soft removal from active recipients.
- `markAnnouncementRead` and `acknowledgeAnnouncement` — scoped to the current staff member.

### Shared realtime hub

Create `src/lib/server/realtime/hub.ts` with a provider-neutral interface. The first provider is an in-process, abortable topic hub for the current single-server deployment. Topics contain no PHI:

- `platform:announcements`
- `platform:announcements:admins`
- `phc:<id>:announcements`

The live query always re-reads authorized rows from the database after a signal. A 30-second reconciliation handles missed signals, scheduled announcements, external writes, and future multi-instance deployments until a distributed hub provider is configured.

### Client/offline state

Add `LocalAnnouncement` and `LocalAnnouncementReceipt` tables in Dexie and create `src/lib/state/announcements.svelte.ts`.

The store:

- exposes cached announcements immediately;
- owns the live resource lifecycle and connection/freshness state;
- merges snapshots idempotently;
- displays a toast/browser notification only once per announcement;
- queues read/acknowledgement operations while offline and flushes them on reconnect;
- keeps critical unacknowledged announcements available for a persistent banner.

Components never access Dexie directly.

### UI

- Rewrite `src/routes/(app)/superadmin/announcements/+page.svelte` with real compose, audience, PHC selection, reach estimate, history, archive, scheduling/expiry, and publication confirmation.
- Integrate durable announcements into `src/lib/components/app-sidebar.svelte` alongside ephemeral clinical notifications.
- Add `src/lib/components/announcement-banner.svelte` for critical notices.
- Initialize/clean up the store from `src/routes/(app)/+layout.svelte` after the authenticated session is established.
- Remove the false email-delivery claim. Email/SMS remain future delivery channels and will require provider queues and delivery logs.

## Validation

- Unit tests for audience predicates, status/time visibility, reach count, and receipt upserts.
- Realtime integration: two same-PHC clients update; wrong PHC/role gets no data.
- Offline/reconnect catch-up with no duplicated toast or lost receipt.
- Superadmin mutation authorization and ordinary-staff denial.
- Critical acknowledgement and expiry behavior.
- Confirm service worker does not cache streaming remote responses.
- `vp fmt --check .`, targeted tests, `pnpm check:sw`, and `vp build`.

## User-facing documentation

Create `docs/user-guides/platform-announcements.md` describing audiences, severity, scheduling, acknowledgement, offline delivery, and the prohibition on patient-identifiable information.
