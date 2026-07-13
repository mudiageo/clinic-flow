# ClinicFlow UI/UX Design & Aesthetic Guidelines

This document outlines the visual criteria, styling guidelines, and engineering decisions implemented to elevate ClinicFlow from a boilerplate "AI-generated" look into a premium, modern, and highly interactive digital product. 

Use these principles as a reference for any future additions to the codebase.

---

## 1. Core Visual Pillars

### A. Semantic Theme Over Hardcoded Utilities
* **Anti-Pattern**: Using direct color utilities like `bg-slate-900`, `bg-teal-500`, `text-emerald-400`, or `border-rose-300`.
* **Standard**: Always map color classes to semantic CSS custom properties defined in `layout.css` (e.g. `bg-background`, `bg-primary`, `text-primary-foreground`, `border-border`, `bg-card`, `bg-destructive/10`).
* **Why**: This ensures visual consistency across all pages, keeps styles maintainable, and allows the Svelte `ModeWatcher` theme engine to toggle dark/light states cleanly without layout breakage.

### B. Perceptually Uniform Colors (OKLCH)
* **Anti-Pattern**: Using flat hex or standard RGB/HSL color spaces for theme declarations.
* **Standard**: Declare all colors using **OKLCH** in `layout.css`.
* **Why**: OKLCH distributes lightness and saturation uniformly across colors. For dark mode surfaces, this lets us tune bright branded teals (Primary) and ambers (Accent) that pop on slate backdrops without creating neon glare or muddy contrasts.

### C. Vector Vector Icons (Lucide) over Emojis
* **Anti-Pattern**: Using emojis (📋, 🔴, 🌡️, 🩺, 🖨️) as structural labels, status indicators, or action buttons.
* **Standard**: Use `@lucide/svelte` SVG icons styled with clean, uniform sizing (`size-4` or `size-5`) and muted color weights (`text-muted-foreground` or `text-primary`).
* **Why**: Emojis render differently across operating systems and browsers, resulting in an unpolished look. Lucide icons guarantee pixel-perfect vector rendering matching the app's geometric lines.

---

## 2. Micro-Interactions & Motion

A static interface feels dead. We utilize subtle CSS utilities and Svelte transitions to make interactions feel responsive and alive:

### A. Tactile Button Pressing
* **Utility**: `.btn-press` (`active:scale-95 transition-transform duration-100`)
* **Standard**: Apply `.btn-press` to all interactive buttons, icon buttons, and navigation links.
* **Why**: Mimics physical hardware feedback. Scaling down the element on press provides an instant confirmation of the click action.

### B. Elevated Card Hover
* **Utility**: `.card-hover` (`transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10`)
* **Standard**: Apply `.card-hover` to metrics cards, main content containers, and list blocks.
* **Why**: Provides spatial depth. Translating the card up by `2px` and adding a soft tinted shadow makes it clear that the container is an interactive surface.

### C. Staggered Entrance Animations
* **Utility**: `.animate-stagger` + Svelte transition directives.
* **Standard**: Apply staggered animation delays to table rows, stats grids, and stepper panels.
* **Why**: Prevents content from appearing all at once, which can feel harsh. Staggering elements sequentially creates a smooth, premium loading flow.

---

## 3. High-Fidelity Components

### A. Spotlight Card
* **Component**: `SpotlightCard`
* **Purpose**: Metric cards that track the user's cursor, casting a subtle radial glow behind the card border.
* **Why**: Elevates standard grid panels into high-end interactive surfaces.

### B. Shiny Button
* **Component**: `ShinyButton`
* **Purpose**: Calls-to-action (like "Call Next Patient") that require high visual weight.
* **Why**: Adds a CSS-driven gradient sweep highlight that loops indefinitely, guiding the user's eye to primary actions.

### C. Audio Wave Dictation
* **Component**: `AudioWave`
* **Purpose**: Interactive microphone feedback during dictation.
* **Why**: Animates a real-time height visualizer when recording is active, giving the doctor instant confidence that the voice model is listening.

---

## 4. Mobile Responsiveness & Container Control

### A. Responsive Grid Collapsing
* **Rule**: All multi-column designs must collapse gracefully on smaller viewports.
  - Metrics cards: `grid-cols-2 lg:grid-cols-4` (collapses to a compact 2x2 grid on mobile).
  - Workspaces: `grid-cols-1 lg:grid-cols-3` (splits to stack content panels on mobile).
* **Text Scaling**: Avoid fixed large texts (e.g. `text-5xl`). Use responsive font sizes like `text-2xl md:text-5xl`.

### B. Overflow and Scrolling Containment
* **Rule**: Tables, log queues, and large content lists must never extend past the screen viewport, forcing the main page to scroll.
* **Standard**: Wrap tables and lists in a structured **ScrollArea** container with a fixed or maximum height.
* **Why**: Controls scroll physics on mobile touch interfaces, keeping the header navigation anchored.
