# Marketing Site Overhaul — Task Checklist

**Plan:** `docs/features/marketing-overhaul-plan.md`  
**Tracker:** Check off `[x]` as each task is completed.

---

## Phase 1 — Layout & Navigation

- [ ] Overhaul `+layout.svelte` — desktop nav with all links (Features, Pricing, Download, Releases, Support, About)
- [ ] Add mobile hamburger nav with slide-in drawer
- [ ] Replace footer with full 4-column footer including Mudiageo Technologies credit
- [ ] Add "Built in Nigeria 🇳🇬" and © line to footer bottom bar
- [ ] Create `src/lib/components/marketing/award-badge.svelte` reusable component
- [ ] Create `src/lib/components/marketing/stat-tile.svelte` reusable component

---

## Phase 2 — Home Page Overhaul (`/`)

- [ ] Hero — updated headline, subheadline, 2 CTAs, award badges (NextGen Top 5 + 3MTT 2nd)
- [ ] Problem Strip — 4 stat tiles (0/10 records officers, 76% power failures, 34 registers, 10hrs re-entry)
- [ ] Solution Overview — "One tablet. The whole clinic." role flow visual
- [ ] How It Works — polish existing 4-step stepper
- [ ] Feature Highlights — expand from 3 to 6 cards (add Outbreak Radar, LAN sync, Kiosk mode)
- [ ] AI Features Section — Dr. Assist, RxBrain, Outbreak Radar with `<AiDisclaimer>`
- [ ] Traction / Social Proof section
- [ ] Pricing Teaser section → links to `/pricing`
- [ ] CTA Band at bottom
- [ ] Footer (from layout)

---

## Phase 3 — New Pages

- [ ] `/features` — full module breakdown page
- [ ] `/pricing` — 4-tier pricing table + FAQ
- [ ] `/about` — Mudiageo Tech, founder, mission, recognition
- [ ] `/contact` — contact form + partnership CTA
- [ ] `/privacy` — NDPA-compliant privacy policy
- [ ] `/terms` — terms of service
- [ ] `/security` — security & data practices page

---

## Phase 4 — Backend

- [ ] `src/lib/remote/contact.remote.ts` — `form` remote for contact page submissions
- [ ] Wire contact form to email or store submissions in DB

---

## Phase 5 — QA & Polish

- [ ] All pages mobile-responsive at 375px, 768px, 1280px
- [ ] All internal links working (no dead hrefs)
- [ ] `<svelte:head>` with proper `<title>` and `<meta description>` on every page
- [ ] AI disclaimer on every page that mentions AI features
- [ ] Mudiageo Technologies credit in footer visible on all marketing pages
- [ ] No `npm` used anywhere — `pnpm` only
- [ ] Run `svelte-autofixer` on all new/modified Svelte files before shipping

---

## Phase 6 — Docs

- [ ] Update `support/getting-started/+page.svelte` to mention new `/pricing` and `/about` pages
- [ ] Add link to `/privacy` and `/terms` from the register flow
- [ ] Mark this feature as `[x]` in main feature tracker once all above is done
