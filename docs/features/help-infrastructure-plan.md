# Help & Documentation Infrastructure - Implementation Plan

## Overview
Build the foundational infrastructure required to host user-facing documentation, in-app contextual help, and support articles. This ensures all future features (like AI tools) have a standardized place for onboarding guides and tutorials.

## Roles & Permissions
- **Access**: Global. Support articles on the marketing site are public. In-app help is available to all authenticated roles.
- **Control**: No restrictions. Help features are always enabled to ensure users can access documentation.

## Architecture & Components

### 1. The Support Hub (Marketing Site)
- **Route**: `src/routes/(marketing)/support`
- **Layout**: `+layout.svelte` will include a sidebar navigation menu listing all available support categories (e.g., General, Nurse Guide, Doctor Guide, AI Features).
- **Article Wrapper**: A reusable `<SupportArticle>` component utilizing `@tailwindcss/typography` (`prose`, `prose-slate`) to automatically format Svelte content beautifully.
- *Note: Initially using native `+page.svelte` files for articles, with a planned future migration to `.md` via `mdsx`.*

### 2. Contextual In-App Help (Drawer)
- **Component**: `src/lib/components/GlobalHelpDrawer.svelte`
- **Trigger**: A "?" Help button added to the footer of the `AppSidebar` (visible across all roles).
- **Logic**: Reads the current route via `page.url.pathname`. If the user is on `/doctor/consult/[id]`, the drawer populates with quick-tips specific to consultations and links to the full support articles.

### 3. Inline Tooltips
- **Component**: `src/lib/components/ui/in-app-help.svelte`
- **Design**: A subtle, pulsing 'i' or '?' icon. On hover or tap, it displays a shadcn `Popover` or `Tooltip` with a brief explanation of the adjacent UI element.

## Files to Create/Modify
- `src/routes/(marketing)/support/+layout.svelte`
- `src/routes/(marketing)/support/+page.svelte` (Help Center Home)
- `src/lib/components/ui/support-article.svelte`
- `src/lib/components/ui/in-app-help.svelte`
- `src/lib/components/GlobalHelpDrawer.svelte`
- `src/lib/components/AppSidebar.svelte` (Add trigger button)
