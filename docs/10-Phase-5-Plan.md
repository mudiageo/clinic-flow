# Phase 5: Pharmacy & Inventory Dashboard

This phase implements the Pharmacy module, empowering pharmacists to dispense medications prescribed by doctors, track stock levels, and request restocks when supplies are low.

## User Review Required

> [!IMPORTANT]
> Since this phase requires several new tables and UI components, please review the architecture plan. Specifically, the strategy for syncing delta updates for inventory levels using `BroadcastChannel` and background sync.

## Proposed Changes

### Database & State Stores

#### [MODIFY] [db.ts](file:///c:/Users/mudiageo/projects/clinic-flow/src/lib/local-db/db.ts)

- Add `LocalRestockRequest` interface to Dexie.
- Register `restockRequests` table in the local DB for offline-first support.

#### [NEW] [restock-requests.svelte.ts](file:///c:/Users/mudiageo/projects/clinic-flow/src/lib/state/restock-requests.svelte.ts)

- Create a `RestockStore` extending `LocalCollection` to handle client-side queries for pending/fulfilled restock requests.

#### [MODIFY] [sync.remote.ts](file:///c:/Users/mudiageo/projects/clinic-flow/src/routes/sync/sync.remote.ts)

- Register `restockRequests` in the `tableMap` to ensure they sync properly with PostgreSQL.

---

### Pharmacy UI Module

#### [MODIFY] [+page.svelte](<file:///c:/Users/mudiageo/projects/clinic-flow/src/routes/(app)/pharmacy/+page.svelte>)

- Upgrade the current basic page to an **Inventory Overview** Data Table.
- Display stock levels, with visual `Badge`s (In Stock, Low Stock, Out of Stock) and `Progress` bars.
- Add an `Alert` banner for critically low stock items.

#### [NEW] [+page.svelte](<file:///c:/Users/mudiageo/projects/clinic-flow/src/routes/(app)/pharmacy/dispense/+page.svelte>)

- **Dispense Queue:** A live queue of pending `prescriptions` created by doctors.
- Include a dispense button that opens a confirmation dialog.
- Upon dispensing, decrement the `pharmacyInventory` local stock via delta operation and mark the prescription as dispensed.

#### [NEW] [+page.svelte](<file:///c:/Users/mudiageo/projects/clinic-flow/src/routes/(app)/pharmacy/inventory/new/+page.svelte>)

- **Add Item Form:** Uses autocomplete to suggest common Nigerian essential medicines (Antimalarial, ARV, Vaccines, etc.).

#### [NEW] [+page.svelte](<file:///c:/Users/mudiageo/projects/clinic-flow/src/routes/(app)/pharmacy/inventory/[id]/+page.svelte>)

- **Edit Item:** Allow pharmacists to edit stock thresholds and manually correct discrepancies.

#### [NEW] [+page.svelte](<file:///c:/Users/mudiageo/projects/clinic-flow/src/routes/(app)/pharmacy/restock/+page.svelte>)

- **Restock Requests:** A table to track requests sent to LGA/Central Supply, showing status (Pending, Acknowledged, Fulfilled).

## Verification Plan

### Automated Tests

- No new automated tests are required at this stage.

### Manual Verification

- Create a test patient, run them through the Doctor flow (`/doctor/consult/[id]`) and add 2 medications.
- Log in to the Pharmacy Dispense dashboard (`/pharmacy/dispense`) and verify the prescriptions appear in the queue.
- Dispense the prescriptions and verify that the local inventory count accurately decrements, and the change syncs back to PostgreSQL without conflicts.
