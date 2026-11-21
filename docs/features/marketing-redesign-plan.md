# ClinicFlow Marketing Site — Design Overhaul Plan

## Problem Statement

The previous iteration added content without redesigning the visual system. Every page used
the same `SectionHeader` pattern (centred eyebrow → centred h2 → centred subheading → card
grid), producing a templated, AI-generated aesthetic. Issues:

- Every section looks identical regardless of its content type
- Typography is default Inter with no scale decisions — all text reads at the same visual weight
- Colour palette is a generic teal + amber — no brand personality
- All hero/section headings are centred — no asymmetric or editorial layouts
- No dark mode on the marketing pages
- Buttons are uniformly `rounded-full` — no typographic hierarchy in CTAs
- Gratuitous motion (hover on every card, fade-slide on each section)

---

## Design Direction

**Between editorial/linear and bold mission-driven. Light-first. Healthcare authority.**

Reference feel: how Linear, Resend, or Oxide Computer present serious technical products —
but grounded in Nigerian public health context rather than Silicon Valley SaaS.

---

## Token System

### Colour Tokens (Standard Tailwind & Shadcn Variables)

| Token                | Class                                       | OKLCH Light Value        | OKLCH Dark Value        | Semantic Purpose                                                   |
| -------------------- | ------------------------------------------- | ------------------------ | ----------------------- | ------------------------------------------------------------------ |
| `--primary`          | `bg-primary`, `text-primary`                | `oklch(0.46 0.14 162)`   | `oklch(0.6 0.14 162)`   | Authoritative medical emerald for primary actions, badges, accents |
| `--background`       | `bg-background`                             | `oklch(0.99 0.002 240)`  | `oklch(0.13 0.008 240)` | Clean cool off-white canvas (not muddy cream or stark #fff)        |
| `--foreground`       | `text-foreground`                           | `oklch(0.12 0.012 240)`  | `oklch(0.97 0 0)`       | High-contrast clinical ink (with subtle blue cast)                 |
| `--muted`            | `bg-muted`                                  | `oklch(0.965 0.004 240)` | `oklch(0.22 0.008 240)` | Subtle surface backgrounds, section dividers, code blocks          |
| `--muted-foreground` | `text-muted-foreground`                     | `oklch(0.48 0.01 240)`   | `oklch(0.65 0.01 240)`  | Secondary explanations, metadata, captions                         |
| `--border`           | `border-border`                             | `oklch(0.9 0.006 240)`   | `oklch(1 0 0 / 9%)`     | Structural hairlines and table rules                               |
| `--secondary`        | `bg-secondary`, `text-secondary-foreground` | `oklch(0.96 0.018 162)`  | `oklch(0.24 0.02 240)`  | Soft tinted emerald tags and secondary pills                       |
| `--card`             | `bg-card`, `text-card-foreground`           | `oklch(1 0 0)`           | `oklch(0.18 0.008 240)` | Elevated surfaces and comparison panels                            |

### Typography

- **One typeface only:** Inter Variable
- **Display:** `clamp(2.8rem, 5.5vw, 5rem)`, weight 800, letter-spacing `−0.03em`
  — compression is the brand character, not colour
- **Section headings:** `clamp(1.75rem, 2.5vw, 2.5rem)`, weight 700, tracking `−0.02em`
- **Body:** 1rem / 1.65 line-height, max 68ch line width enforced
- **Labels:** sentence-case only. No `ALL CAPS`. No tracked-out eyebrows above headings.

### Buttons

- **Primary CTA:** `rounded-md` (not `rounded-full`), weight 600, solid primary fill
- **Secondary CTA:** outlined, `rounded-md`
- **Text links:** no border, underline on hover — used for low-priority actions
- Removes the uniform `rounded-full` pills on every button

### Motion

- One orchestrated page-load fade on the homepage hero — nothing else auto-animates
- Hover transitions only on interactive elements (nav links, buttons) — not on content cards

---

## Layout Principles

1. **Never the same layout twice.** Each section picks from: full-bleed stripe, split (text |
   visual), asymmetric offset, editorial list, or contained card grid. The `SectionHeader`
   component is retired as a universal pattern.

2. **Left-aligned by default.** Centre alignment is used only for short isolated statements
   (pull-quotes, pricing callouts). Body content, feature lists, and inner-page titles are
   left-aligned.

3. **Section heading treatment varies by content type:**
   - Feature groups → large left-aligned number + heading, right-aligned description
   - Stats → big number dominates, label is small below
   - Testimonials / social proof → blockquote style with rule, no card border
   - CTA sections → single high-contrast full-bleed band, one line of copy

4. **Inner pages open with a page-title block**, not a `SectionHeader`. The title is large
   (display size), left-aligned, with a single sentence below it and a horizontal rule — like
   a chapter opening.

---

## Execution Scope

### Phase 1 — Foundation (do first, unblocks everything)

- [ ] Update design tokens in `layout.css`
- [ ] Rewrite `+layout.svelte` (marketing): nav refinement, footer tightening
- [ ] New shared components: `mk-page-title.svelte`, `mk-rule-heading.svelte`,
      `mk-feature-row.svelte`, `mk-stat-row.svelte`
- [ ] Retire uniform use of `section-header.svelte` (keep the file, change how it's used)

### Phase 2 — Homepage (master template)

- [ ] Hero: left-aligned display type + right panel (product context strip or key stat),
      not a centred text block
- [ ] Problem strip: horizontal scrolling stat row, not a 4-column card grid
- [ ] Features overview: editorial numbered list (desktop), accordion (mobile)
- [ ] Social proof: 2-col split — left is a large pull-quote, right is a compact fact list
- [ ] Pricing teaser: 3-col cards kept but restyled — sharp corners, cleaner hierarchy
- [ ] Final CTA band: full-bleed dark section with single headline and two buttons

### Phase 3 — High-traffic pages

- [ ] `/features` — page title block + tabbed/categorised feature rows
- [ ] `/pricing` — comparison table + FAQ, no duplicate card pattern from homepage
- [ ] `/about` — editorial timeline / story layout, not a card grid of team bios

### Phase 4 — Remaining pages

- [ ] Apply page-title block + consistent body layout to all other marketing pages
- [ ] Remove all instances of repeated `SectionHeader` pattern

---

## Anti-patterns to Remove

| Anti-pattern                                   | Fix                                              |
| ---------------------------------------------- | ------------------------------------------------ |
| `SectionHeader` on every section               | Each section gets its own heading treatment      |
| Gradient text on headlines                     | Weight + size contrast does the work             |
| `rounded-full` on all buttons                  | `rounded-md` primary, text-link for low-priority |
| `ALL CAPS` eyebrow labels                      | Sentence case throughout                         |
| Hover translate on every card                  | Remove — motion only on interactive elements     |
| Identical section padding everywhere           | Vary section rhythm: some tight, some generous   |
| Grid of identical rounded cards for everything | Mix list, split, table, and card layouts         |
| Centred everything                             | Left-align body content; centre only isolates    |

---

## Files to Change

```
src/routes/layout.css                              ← tokens (in progress)
src/routes/(marketing)/+layout.svelte              ← nav + footer
src/routes/(marketing)/+page.svelte                ← homepage full rewrite
src/routes/(marketing)/features/+page.svelte       ← phase 3
src/routes/(marketing)/pricing/+page.svelte        ← phase 3
src/routes/(marketing)/about/+page.svelte          ← phase 3
src/lib/components/marketing/section-header.svelte ← kept but constrained
src/lib/components/marketing/feature-card.svelte   ← restyled
src/lib/components/marketing/stat-tile.svelte      ← restyled
src/lib/components/marketing/mk-page-title.svelte  ← new
src/lib/components/marketing/mk-rule-heading.svelte ← new
src/lib/components/marketing/mk-feature-row.svelte  ← new
```
