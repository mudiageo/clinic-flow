# ClinicFlow Design System

## Brief

- **Who & Context**: Frontline nurses, Community Health Extension Workers (CHEWs), doctors, and pharmacy technicians in Nigerian Primary Health Centres (PHCs). Operating on battery-powered Android tablets and desktop intake desks, often in bright tropical ambient light, intermittent grid power, and completely offline local Wi-Fi.
- **Personality Sentence**: Authoritative, calm, and dependable — engineered to dissolve waiting-room chaos and alert critical cases without decorative noise.
- **Anti-goals**: Generic SaaS templates, four identical KPI boxes with icons in pastel circles, emoji greetings ("Good morning 👋"), color-only triage indicators, buried clinical actions.

## Concept

- **Chosen Concept**: "The Clinical Shift Board" (Ward Console + Clinical Calm)
- **Alternate Concepts**:
  1. _The Field Triage Ledger_: Dense Swiss-style tabular sheet for disaster/outbreak field response.
  2. _The Outreach Deck_: Single-patient touch stack optimized for community mobile immunization rounds.
- **Metaphor**: Shift handover whiteboard & emergency ops flight deck.
- **Signature**: Ticket-stub queue cards with live priority color pulses, wait estimates, and one-tap calling.
- **Why**: Answers the frontline health worker's essential shift question immediately: _"Who needs care next, and what do I need to know and do right now?"_

## Skin(s)

- **Skin**: Clinical Calm (Light default, high-contrast dark supported).
- **Palette Roles**: Deep medical emerald (`oklch(0.46 0.14 162)`), urgent red triage (`oklch(0.55 0.22 27)`), amber priority (`oklch(0.68 0.16 65)`), safe green (`oklch(0.62 0.17 145)`), clean border rules (`border-border`).
- **Typography**: Display/text paired with tabular monospace numerals for vital signs, queue tickets, and drug quantities.
- **Shape & Elevation**: Crisp 6px to 8px corner radii (`rounded-md`, `rounded-lg`), 1px structural hairline borders, zero blur clutter.

## Archetype(s)

- **Desktop**: Ward Console (Shift Header, Emergency Urgency Banner, Flow Ledger, Live Queue Stream, Station Launchpad).
- **Mobile/Tablet**: Dock + Feed (Thumb-reachable Quick Action Bar, category filter chips, expanded touch targets).

## Personality

- **Motion**: Snappy, functional (120ms easing).
- **Voice**: Clinical, concise, plain English with Nigerian healthcare conventions (`en-NG`, ₦ currency).
- **Icons**: Lucide clinical set (`@lucide/svelte`), consistent optical weights.

## Local-first UX

- **LAN Mesh Indicator**: Live feedback on `clinicflow.local` connection and peer discovery.
- **Sync Honesty**: Monotonic outbox count, health score %, and instant sync button.
- **Instant Reads**: Zero loading spinners on local Dexie data.

## Rollback

- Revert commit on `main` or restore `src/routes/(app)/dashboard/+page.svelte` from git history.
