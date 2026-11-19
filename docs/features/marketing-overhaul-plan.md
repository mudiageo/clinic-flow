# Marketing Site Overhaul — Architecture & Implementation Plan

**Feature:** Comprehensive ClinicFlow Marketing & Legal Site  
**Scope:** `src/routes/(marketing)/` route group  
**Goal:** Transform the current single-product landing page into a complete, professional product marketing site for ClinicFlow by Mudiageo Technologies.

---

## 1. Permissions & Access

All marketing routes are **fully public** — no authentication, no role checks.  
No admin-only content. Privacy and Terms pages are legally required for any user-data-handling SaaS.

---

## 2. AI Safety

No AI features in the marketing site. N/A.

---

## 3. Current State Audit

### What exists
| Route | Status | Notes |
|---|---|---|
| `/` | ✅ Exists | Hero + 3-card features + 4-step how-it-works. Generic SaaS template feel. No social proof, no pricing, no AI section, no Mudiageo branding. Footer says "ClinicFlow Open Source Initiative" (wrong). |
| `/download` | ✅ Exists | Functional — pulls from GitHub Releases API. Good quality. |
| `/releases` | ✅ Exists | Functional changelog. Good quality. |
| `/register` | ✅ Exists | Clinic registration flow. |
| `/support` | ✅ Exists | 6 guide sub-pages (Dr. Assist, RxBrain, Outbreak Radar, DHIS2, Field Mode, Getting Started). |
| `/features` | ❌ Missing | No dedicated features page |
| `/pricing` | ❌ Missing | No pricing page |
| `/privacy` | ❌ Missing | **Required by law (NDPA/NDPR)** |
| `/terms` | ❌ Missing | **Required for any SaaS** |
| `/security` | ❌ Missing | Important for health data trust |
| `/contact` | ❌ Missing | No contact route |
| `/about` | ❌ Missing | No about/company page |

### What needs overhaul
- **Layout (`+layout.svelte`):** Nav has no mobile menu, no `/features` or `/pricing` links, footer is incomplete and misbranded.
- **Home page (`+page.svelte`):** Missing: social proof/traction, AI features section, pricing teaser, Mudiageo Tech credit, competition wins, proper CTA flow.

---

## 4. New Route Structure

```
src/routes/(marketing)/
├── +layout.svelte          OVERHAUL — full nav + footer
├── +page.svelte            OVERHAUL — full marketing home
├── features/
│   └── +page.svelte        NEW — deep feature breakdown
├── pricing/
│   └── +page.svelte        NEW — pricing tiers & FAQ
├── privacy/
│   └── +page.svelte        NEW — NDPA-compliant privacy policy
├── terms/
│   └── +page.svelte        NEW — terms of service
├── security/
│   └── +page.svelte        NEW — security & data practices
├── contact/
│   └── +page.svelte        NEW — contact + partnership enquiries
├── about/
│   └── +page.svelte        NEW — Mudiageo Tech, founder story, mission
├── download/
│   └── +page.svelte        KEEP (functional)
├── releases/
│   └── +page.svelte        KEEP (functional)
├── register/
│   └── +page.svelte        KEEP
└── support/
    └── ...                 KEEP (all 6 guides)
```

---

## 5. Page-by-Page Specification

### `/` — Home Page (Overhaul)

**Sections (in order):**
1. **Nav** (from layout) — updated
2. **Hero** — Bold headline, subheadline, 2 CTAs (Get Started / Download), social proof badge (NextGen Top 5 + 3MTT 2nd)
3. **Problem Strip** — 4 stat tiles from verified data (0/10 medical records officers, 76% cite power failures, 34 avg registers/PHC, 10hrs DHIS2 re-entry/month)
4. **Solution Overview** — "One tablet. The whole clinic. No internet needed." — animated role flow: Nurse → Doctor → Pharmacy → Admin
5. **How It Works** — existing 4-step stepper (keep, polish)
6. **Feature Highlights** — 6 cards (Offline-first, AI Decision Support, Auto-triage, LAN sync, Kiosk mode, Outbreak Radar)
7. **AI Features Section** — Dr. Assist, RxBrain, Outbreak Radar, with AI disclaimer
8. **Traction / Social Proof** — Competition wins, hackathon, UNIBEN, verifiable stats
9. **Pricing Teaser** — Free pilot / ₦30k/PHC/month post-pilot, link to `/pricing`
10. **CTA Band** — "Ready to digitize your clinic?" → Get Started + Download
11. **Footer** (from layout) — updated

---

### `/features` — Features Deep Dive (New)

Full breakdown of every module:
- Patient Registration & Queue Management
- Vitals & Automated Triage (RAG system)
- Doctor Consultation Interface
- Prescription Management & Dispensing
- Immunisation Records
- ANC / Maternity Module
- Family Records
- Outbreak Radar
- DHIS2 Reporting
- SMS Appointment Reminders
- Role-Based Access (Nurse, Doctor, Pharmacy, Admin, Field, Maternity, Immunisation, Superadmin)
- AI: Dr. Assist + RxBrain + local WebLLM fallback
- LAN sync via mDNS / clinicflow.local
- Android & Windows Kiosk packaging (Tauri v2)
- Nightly CI builds (GitHub Actions)

---

### `/pricing` — Pricing (New)

**Tiers:**
| Tier | Price | For |
|---|---|---|
| Pilot | Free | Approved partner PHCs during grant pilot period |
| Public PHC | ₦30,000/facility/month | State/LGA agency contract (EDSPHCDA) |
| Private Clinic | Contact us | Higher rate; direct billing |
| NGO/Donor Programme | Contact us | Custom deployment & support |

FAQ section: What's included? Who owns the data? What happens if internet is down? Can we self-host?

---

### `/privacy` — Privacy Policy (New)

NDPA (Nigeria Data Protection Act 2023) compliant. Must cover:
- What data is collected (patient demographics, clinical notes, vitals, prescriptions)
- Where it is stored (IndexedDB locally on device; PostgreSQL cloud on sync)
- Who can access it (role-based; clinic staff only; no third-party sale)
- Gemini API data handling (audio/text sent for AI features; anonymisation policy)
- Data subject rights under NDPA
- Retention policy
- Contact: privacy@mudiageotech.com (or appropriate contact)
- Effective date + version

---

### `/terms` — Terms of Service (New)

- Acceptance of terms
- Use restrictions (clinical use only, no unauthorised access)
- Liability disclaimer (not a substitute for clinical judgment)
- AI disclaimer (AI outputs are decision support, not diagnosis)
- Intellectual property
- Termination
- Governing law: Federal Republic of Nigeria
- Contact

---

### `/security` — Security (New)

- Encryption at rest (IndexedDB + SQLite + PostgreSQL)
- Encryption in transit (TLS)
- Role-based access control
- Audit logging
- Responsible disclosure / bug report contact
- NDPA compliance roadmap

---

### `/about` — About (New)

- ClinicFlow mission statement
- The problem we're solving (brief)
- Mudiageo Technologies credit — "Built by Mudiageo Technologies, a software company based in Benin City, Nigeria"
- Founder: Mudiaga Arharhire, Computer Engineering 500L, UNIBEN
- Recognition: NextGen Top 5, 3MTT 2nd place
- Open source contribution note
- Link to Mudiageo Tech website

---

### `/contact` — Contact (New)

- General enquiries email
- Partnership / pilot programme CTA form (name, email, PHC name, LGA, state, message)
- Uses SvelteKit remote `form` function
- No login required

---

## 6. Layout Overhaul Spec

### Nav (desktop)
Logo | Features | Pricing | Support | Download | Releases | About | [Sign In] [Get Started →]

### Nav (mobile)
Hamburger → slide-in drawer with same links + Sign In + Get Started

### Footer (full)
**Column 1:** ClinicFlow logo + tagline + Mudiageo Technologies credit  
**Column 2:** Product links (Features, Pricing, Download, Releases)  
**Column 3:** Company links (About, Contact, Support)  
**Column 4:** Legal links (Privacy Policy, Terms of Service, Security)  
**Bottom bar:** © 2026 Mudiageo Technologies. All rights reserved. | Built in Nigeria 🇳🇬

---

## 7. Design System Notes

- **Keep:** existing shadcn-svelte components, Tailwind classes, dark/light theme support
- **Upgrade:** Add `btn-press` micro-interaction to all primary CTAs consistently
- **Social proof:** Use a consistent "award badge" component for NextGen and 3MTT wins
- **AI disclaimer:** Any page mentioning AI features uses the `<AiDisclaimer>` component
- **Icons:** `@lucide/svelte` only
- **Typography:** existing font stack — no changes needed
- **Mobile:** All new pages must be fully responsive; test at 375px, 768px, 1280px

---

## 8. Files to Create / Modify

| File | Action |
|---|---|
| `src/routes/(marketing)/+layout.svelte` | Overhaul — mobile nav, full footer |
| `src/routes/(marketing)/+page.svelte` | Overhaul — 11-section home |
| `src/routes/(marketing)/features/+page.svelte` | New |
| `src/routes/(marketing)/pricing/+page.svelte` | New |
| `src/routes/(marketing)/privacy/+page.svelte` | New |
| `src/routes/(marketing)/terms/+page.svelte` | New |
| `src/routes/(marketing)/security/+page.svelte` | New |
| `src/routes/(marketing)/about/+page.svelte` | New |
| `src/routes/(marketing)/contact/+page.svelte` | New |
| `src/lib/remote/contact.remote.ts` | New — form submission handler |
| `src/lib/components/marketing/award-badge.svelte` | New — reusable competition win badge |
| `src/lib/components/marketing/stat-tile.svelte` | New — problem stat display component |

---

## 9. No Server-Side Pages

Per architecture rules: **no `+page.server.ts`**. All data fetching via remote functions in `$lib/remote/`. The contact form uses a `form` remote function.
