# Marketing Site Overhaul — Task Checklist

**Plan:** `docs/features/marketing-overhaul-plan.md`  
**Tracker:** Check off `[x]` as each task is completed.

---

## Phase 1 — Layout & Navigation

- [x] Overhaul `+layout.svelte` — desktop nav with dropdowns and all links (Features, Pricing, Solutions, Use Cases, Download, Support, About)
- [x] Add mobile hamburger nav with slide-in drawer
- [x] Replace footer with full 5-column footer including Mudiageo Technologies credit
- [x] Add "Built in Nigeria 🇳🇬" and © line to footer bottom bar
- [x] Create `src/lib/components/marketing/award-badge.svelte` reusable component
- [x] Create `src/lib/components/marketing/stat-tile.svelte` reusable component
- [x] Create `src/lib/components/marketing/section-header.svelte` reusable component
- [x] Create `src/lib/components/marketing/feature-card.svelte` reusable component
- [x] Create `src/lib/components/marketing/coming-soon.svelte` reusable placeholder component

---

## Phase 2 — Home Page Overhaul (`/`)

- [x] Hero — updated headline, subheadline, 3 CTAs, award badges (NextGen Top 5 + 3MTT 2nd)
- [x] Problem Strip — 4 stat tiles (0/10 records officers, 76% power failures, 34 registers, 10hrs re-entry)
- [x] Solution Overview — "One tablet. The whole clinic." role flow visual
- [x] How It Works — 5-step detailed clinic flow stepper
- [x] Feature Highlights — 6 cards (Offline-first, LAN sync, Auto-triage, Kiosk mode, Outbreak Radar, RBAC)
- [x] AI Features Section — Dr. Assist, RxBrain, Outbreak Radar with `<AiDisclaimer>`
- [x] Clinical Coverage — 12-module visual grid
- [x] Traction / Social Proof section (NextGen Top 5, 3MTT 2nd, verified tech stack)
- [x] Pricing Teaser section → links to `/pricing`
- [x] CTA Band at bottom
- [x] Footer (from layout)

---

## Phase 3 — Core Marketing & Legal Pages

- [x] `/features` — comprehensive feature catalog across clinical ops, intelligence, and edge infrastructure
- [x] `/pricing` — 3-tier pricing (Pilot, Public PHC ₦30k/mo, Private & NGO) + FAQ + institutional sales contact
- [x] `/about` — Mudiageo Tech, founder, UNIBEN 500L solo engineer story, mission, recognition
- [x] `/contact` — direct contact info + interactive inquiry dispatch
- [x] `/demo` — pilot application & walkthrough scheduling form
- [x] `/privacy` — comprehensive NDPA 2023-compliant privacy policy
- [x] `/terms` — terms of service with clinical AI disclaimer
- [x] `/security` — health data governance, local-first isolation, and responsible disclosure
- [x] `/cookies` — cookie and client storage policy under NDPA
- [x] `/system-requirements` — hardware specifications for tablets, workstations, routers, and solar inverters
- [x] `/open-source` — stack architecture, GitHub transparency, and contribution guide
- [x] `/roadmap` — phased development trajectory
- [x] `/changelog` — human-readable release notes
- [x] `/use-cases` — 4 realistic field scenarios (Immunization day, Rural CHEW, High-volume PHC, ANC night shifts)
- [x] `/solutions/state-governments` — procurement and DHIS2 benefits for State Ministries and SPHCDAs
- [x] `/solutions/ngos` — verified encounter data and M&E tracking for global health donors
- [x] `/solutions/private-clinics` — zero-latency workflows and RxBrain drug safety for private practices
- [x] `/support/faq` — comprehensive operational and governance FAQ
- [x] `/support/installation` — 3-step facility installation playbook
- [x] `/support/troubleshooting` — diagnostic guide for local Wi-Fi, mDNS, and kiosk mode

---

## Phase 4 — Backend

- [x] `src/lib/remote/contact.remote.ts` — `command` remote function for contact & pilot applications
- [x] Valibot schema validation for institutional leads

---

## Phase 5 — QA & Polish

- [x] All internal navigation links mapped to real routes (zero dead links or 404s)
- [x] `<svelte:head>` with proper `<title>` and `<meta description>` on every page
- [x] AI disclaimer embedded on pages featuring AI decision support
- [x] Mudiageo Technologies credit visible across layout footer
- [x] Committed incrementally to git
