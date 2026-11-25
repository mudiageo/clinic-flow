# ClinicFlow Design System — "Paper & Ink"

## Brief

- **Who & Context**: Frontline nurses, doctors, pharmacy technicians, CHEWs, and facility admins in Nigerian Primary Health Centres (PHCs). Devices: Android tablets (nurse triage stations), Windows desktops (doctor/admin desks), low-end shared phones (field workers), Tauri v2 kiosk packaging. Bright tropical indoor lighting, intermittent grid power, often fully offline on a local LAN mesh (`clinicflow.local`). Glove or touch use on tablets.
- **Locale**: `en-NG`, ₦ currency, dd/mm/yyyy dates, 12h clock.
- **Personality Sentence**: Warm, dependable, and unhurried — the app feels familiar and trustworthy, not like foreign IT.
- **Anti-goals**: Generic SaaS defaults (blue primary, gray cards, identical KPI tiles), emoji greetings, decorative gradients, busy animations, color-only triage indicators.

---

## Concept: "Paper & Ink"

The design metaphor is the **paper patient folder and numbered queue ticket** — surfaces that every PHC worker already knows. Warm off-white ground (like paper), deep indigo signal (like ink), numbered ticket stubs for queue cards, and ruled lines for data tables. Clear and immediately legible in bright tropical light.

- **Metaphor**: Paper patient folder · numbered queue ticket · rubber-stamp status marks · ruled columns
- **Signature (5 words)**: Torn-edge ticket stubs, warm paper
- **Why**: Answers the essential PHC shift question — _"Who is here, what do they need, and what do I do next?"_ — in a visual language every frontline worker already recognises. Warmth without frivolity.
- **What it is not**: A Western hospital EMR, a WhatsApp clone, a generic dashboard

---

## Skin: Warm Paper

### Rationale

Warm off-white paper ground. Deep indigo signal. Terracotta for warnings. Ambulance red for critical triage only. Neutrals are sand-tinted — they feel like paper, not a monitor. The sidebar is a deep indigo panel, like an ink-coloured folder divider.

### OKLCH Palette

| Token                          | Light value             | Dark value              | Role                |
| ------------------------------ | ----------------------- | ----------------------- | ------------------- |
| `--background`                 | `oklch(0.975 0.008 75)` | `oklch(0.14 0.01 240)`  | Warm paper ground   |
| `--foreground`                 | `oklch(0.16 0.015 55)`  | `oklch(0.95 0.005 75)`  | Ink on paper        |
| `--card`                       | `oklch(1 0.004 75)`     | `oklch(0.19 0.01 240)`  | Elevated warm white |
| `--card-foreground`            | `oklch(0.16 0.015 55)`  | `oklch(0.95 0.005 75)`  | Card text           |
| `--popover`                    | `oklch(1 0.004 75)`     | `oklch(0.19 0.01 240)`  | Popover             |
| `--popover-foreground`         | `oklch(0.16 0.015 55)`  | `oklch(0.95 0.005 75)`  | Popover text        |
| `--primary`                    | `oklch(0.38 0.16 265)`  | `oklch(0.72 0.14 265)`  | Deep indigo signal  |
| `--primary-foreground`         | `oklch(0.99 0 0)`       | `oklch(0.99 0 0)`       | Text on indigo      |
| `--secondary`                  | `oklch(0.93 0.015 75)`  | `oklch(0.25 0.01 240)`  | Sand surface        |
| `--secondary-foreground`       | `oklch(0.3 0.03 265)`   | `oklch(0.85 0.01 265)`  | Text on sand        |
| `--muted`                      | `oklch(0.94 0.01 75)`   | `oklch(0.22 0.01 240)`  | Muted fill          |
| `--muted-foreground`           | `oklch(0.52 0.015 55)`  | `oklch(0.6 0.01 240)`   | Subdued text        |
| `--accent`                     | `oklch(0.92 0.025 75)`  | `oklch(0.27 0.015 265)` | Hover fill          |
| `--accent-foreground`          | `oklch(0.25 0.1 265)`   | `oklch(0.9 0.01 265)`   | Text on accent      |
| `--destructive`                | `oklch(0.56 0.22 27)`   | `oklch(0.65 0.2 27)`    | Red alert/delete    |
| `--border`                     | `oklch(0.86 0.012 75)`  | `oklch(1 0 0 / 10%)`    | Ruling lines        |
| `--input`                      | `oklch(0.86 0.012 75)`  | `oklch(1 0 0 / 12%)`    | Input border        |
| `--ring`                       | `oklch(0.38 0.16 265)`  | `oklch(0.72 0.14 265)`  | Focus ring          |
| `--sidebar`                    | `oklch(0.19 0.02 265)`  | `oklch(0.12 0.015 265)` | Deep indigo sidebar |
| `--sidebar-foreground`         | `oklch(0.95 0.005 265)` | `oklch(0.95 0.005 265)` | Sidebar text        |
| `--sidebar-primary`            | `oklch(0.72 0.14 265)`  | `oklch(0.72 0.14 265)`  | Active nav          |
| `--sidebar-primary-foreground` | `oklch(0.99 0 0)`       | `oklch(0.99 0 0)`       | Active nav text     |
| `--sidebar-accent`             | `oklch(0.28 0.04 265)`  | `oklch(0.22 0.03 265)`  | Sidebar hover       |
| `--sidebar-accent-foreground`  | `oklch(0.95 0.005 265)` | `oklch(0.95 0.005 265)` | Sidebar hover text  |
| `--sidebar-border`             | `oklch(1 0 0 / 12%)`    | `oklch(1 0 0 / 10%)`    | Sidebar dividers    |

### Triage Tokens (always with text + icon — never colour alone)

```css
--triage-red: oklch(0.56 0.22 27); /* Critical */
--triage-amber: oklch(0.72 0.17 65); /* Priority */
--triage-green: oklch(0.6 0.16 145); /* Routine */
```

### Non-colour Tokens

```css
--font-display: 'Inter Variable', system-ui, sans-serif;
--font-text: 'Inter Variable', system-ui, sans-serif;
--font-mono: 'JetBrains Mono Variable', 'Courier New', monospace;
--radius: 0.625rem; /* 10px */
--radius-inner: 0.375rem; /* 6px */
--radius-pill: 9999px;
--border-width: 1px;
--control-h: 2.75rem; /* 44px touch target */
/* Motion — personality: calm */
--dur-1: 100ms;
--dur-2: 180ms;
--dur-3: 320ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Archetype

### Desktop (≥1024px): Workbench with Deep Indigo Sidebar

- **Left sidebar** (240px collapsed to 56px icon rail) — deep indigo background, light text
- **Content area** — warm paper `--background`, edge-to-edge, no extra card wrapping
- **No separate top header bar on desktop** — the sidebar is the chrome; page title is a large heading inside the scroll area
- **Status bar** in sidebar footer: sync badge, user avatar
- **Command palette** (`Ctrl+K`) for power navigation

### Tablet (640–1023px): Workbench Light

- Sidebar collapses to icon rail by default
- Touch targets min 48px

### Phone (<640px): Dock (Bottom Tab Bar)

- No sidebar. Five bottom tabs (Home + 4 role-priority items)
- Collapsing header with page title
- Sheets for forms and quick actions (not modals)

---

## Personality: Calm

- **Motion**: Calm — exits at 100ms, enters at 180–320ms, ease-out or spring. No bouncy loops.
- **Voice**: Matter-of-fact, plain English with Nigerian PHC conventions. Never exclamation points except milestones.
- **Pressed states**: Button scales to 0.97 on press, 100ms.
- **Hover**: 80ms background tint, `(hover: hover)` only.
- **Toasts**: Bottom-center on phone (above tab bar), bottom-left on desktop.

---

## Signature Component: Queue Ticket Stub

The single most used surface in ClinicFlow. Looks like a numbered paper queue ticket:

```
╔═══════════════════════════════════╗
║ ● RED   #042  Adaeze Okonkwo  F/34 ║   ← triage dot + label text, ticket number, name, age/sex
║ Chest pain · 14 mins waiting      ║   ← chief complaint · wait time (amber if >10min)
║ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ║   ← perforated divider (dashed border)
║  [Start Consult]  [Flag Priority] ║   ← one-tap primary action
╚═══════════════════════════════════╝
```

- Left border: 4px solid triage colour
- Background: `--card` (warm white)
- Ticket number: tabular-nums, monospace, `--muted-foreground`
- Wait time: turns amber at >10min, red at >30min — with text label not just colour
- Torn edge: `border-bottom: 1px dashed var(--border)` with slight background texture

---

## Shell: Deep Indigo Sidebar

- Background: `oklch(0.19 0.02 265)` (deep indigo)
- Logo: `HeartPulse` icon in an indigo circle
- Nav items: ghost-white at rest, filled highlight on active, hover tint
- Section labels: uppercase micro-text, subdued
- Footer: avatar + name + sync indicator + notification bell
- On collapse: icon rail with tooltips

---

## Key Pages

### Dashboard — "Today's Work"

- **Three-zone layout**: alert strip (critical items only) → queue overview (left 60%) → quick launch (right 40%)
- No KPI grid. Live queue counts in compact rows.

### Nurse / Triage Queue

- Full-width ticket stub list, ordered by triage priority then wait time
- Sticky header with queue count + "Call Next" primary button

### Doctor Consultation Queue

- Same ticket-stub pattern, stub shows: ticket # · patient name · chief complaint from triage

### Pharmacy — "The Dispensary Counter"

- Two-panel: pending dispense queue + drug search
- Inventory is a table with zebra striping and inline actions

### Patient Record

- Full-bleed indigo header band with patient name, DOB, record number
- Tabbed content below: Encounters · Vitals · Prescriptions · Family · Immunizations

---

## Local-First UX

- **Sync badge** in sidebar footer: green (synced), amber (queued), red (error). Click → sync sheet.
- **No spinners for local Dexie reads** — data appears immediately
- **Stale state**: muted border + "Last seen Xm ago" label
- **Offline-capable**: the app opens and all queues render without network

---

## Accessibility & Inclusivity

- Contrast: `--foreground` on `--background` ≥ 7:1 in light mode (clinical outdoor)
- Triage: colour + filled dot icon + text label — never colour alone
- Touch targets: 44px minimum; primary actions 48px on tablet
- Reduced motion: fades only, all durations → 10ms

---

## Rollback

Revert to commit `92d4057` on `main` to restore previous design.
