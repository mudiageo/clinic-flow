# UX & QoL Improvements Plan (Part 2)

This document provides the detailed, step-by-step blueprint for the QoL and UX enhancements outside of the main AI features. 
*Note: Checkboxes [ ] will be updated to [x] as features are completed.*

## [x] 📚 Foundation Task 0: Help & Documentation Infrastructure
**Permissions**: Global visibility.
- **Support Hub (`/support`)**: Layout wrapper and routing established.
- **Global Help Drawer**: Contextual right-side drawer added to AppSidebar.
- **Inline Tooltips**: Reusable `<InAppHelp>` component created.

## [ ] 🏥 1. Nurse Station
**Permissions**: Visible to users with `nurse` role or `record:vitals` permission.
- **Patient Search (`/nurse/search/+page.svelte`)**: Build full page, reactive filtering.
- **Queue Animations (`/nurse/+page.svelte`)**: Add `animate:flip` and `transition:slide`.
- **Vitals Post-Triage Summary (`/nurse/vitals/+page.svelte`)**: Show final triage result card before submission.
- **Duplicate Queue Warning**: Warn if patient is already in active queue.

## [ ] 👨‍⚕️ 2. Doctor Dashboard
**Permissions**: Visible to users with `doctor` role or `view:medical_records` permission.
- **Real Encounter History (`/doctor/consult/[id]/+page.svelte`)**: Replace demo data with `encounterStore` data.
- **Patient Profile (`/doctor/patients/[id]/+page.svelte`)**: Scaffold route, add tabs for Demographics, Encounters, Vitals, Prescriptions.
- **Lab Module (`/doctor/lab/+page.svelte`)**: Implement `DataTable` for lab requests.
- **Auto-save & Keyboard Shortcuts**: Auto-save notes to `localStorage` every 30s; `Ctrl+S` shortcut.

## [ ] 💊 3. Pharmacy
**Permissions**: Visible to users with `pharmacy` role or `dispense:medication` / `manage:inventory` permissions.
- **Sidebar Badges**: Show pending prescriptions count.
- **Low Stock Badge**: Show items below `lowStockThreshold`.
- **Expiry Tracking**: Highlight items expiring in < 30 days.

## [ ] 📊 4. Admin Dashboard (`/admin/+page.svelte`)
**Permissions**: Visible to users with `admin` role or `view:reports` permission.
- **Fix Duplicate Triage Card**: Replace duplicate block with "System Alerts".
- **NumberTicker**: Wrap around KPI values.
- **Live Staff Indicator**: Map active staff to green-dotted Avatars.
- **System Alerts Widget**: Actionable alerts for sync, low stock, outbreaks.

## [ ] 🌐 5. Global UX
**Permissions**: Applies globally to all authenticated users.
- **Skeleton Loaders**: Implement `skeleton-row` and `skeleton-card`.
- **Empty States**: Replace generic "No data" with illustrated components.
- **Confirm Dialogs**: Require confirmation for destructive actions.
- **Sync Toasts**: Friendly toast notifications when background sync completes.
- **Mobile Consultation**: Responsive stacking for left/right panes.
