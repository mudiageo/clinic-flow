# Help & Documentation Infrastructure - Task Tracker

## Pre-requisites
- [x] Ensure `docs/features/help-infrastructure-plan.md` is approved by user.

## Component Development
- [x] Build `SupportArticle.svelte` wrapper with Tailwind Typography classes.
- [x] Build `InAppHelp.svelte` using shadcn `Popover` or `Tooltip`.
- [x] Build `GlobalHelpDrawer.svelte` using shadcn `Sheet` (right-side drawer).

## Routing & Layouts
- [ ] Scaffold `src/routes/(marketing)/support/+layout.svelte` with a documentation sidebar.
- [ ] Scaffold `src/routes/(marketing)/support/+page.svelte` as the support home page.
- [ ] Create a dummy article at `src/routes/(marketing)/support/getting-started/+page.svelte` to test the layout.

## Integration
- [x] Update `$lib/components/AppSidebar.svelte` to include the Global Help trigger button in the footer.
- [x] Wire up route detection in `GlobalHelpDrawer` to show contextual links based on the active page.

## Finalization
- [x] Test the drawer and support layout responsively on mobile and desktop.
- [x] Create a main tracking entry for this in `docs/UX-QoL-Improvements-Plan.md` and check it off.
