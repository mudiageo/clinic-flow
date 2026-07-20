## Phase 5: Pharmacy & Inventory Dashboard

### 1. Database & Stores Setup

- `[x]` Add `LocalRestockRequest` to Dexie schema (`src/lib/local-db/db.ts`).
- `[x]` Create `RestockStore` in `src/lib/state/restock-requests.svelte.ts`.
- `[x]` Register `restockRequests` in remote sync logic (`src/routes/sync/sync.remote.ts`).

### 2. Inventory Overview (`/pharmacy`)

- `[x]` Implement DataTable showing `pharmacyInventory`.
- `[x]` Add Status Badges based on threshold (In Stock, Low Stock, Out of Stock).
- `[x]` Add low stock Alert Banner.

### 3. Dispense Queue (`/pharmacy/dispense`)

- `[x]` Create live queue reading from `prescriptionStore` where status is `pending`.
- `[x]` Add 'Dispense' action that triggers confirmation dialog.
- `[x]` Implement atomic delta decrement for `pharmacyInventory` on dispense.

### 4. Inventory Management Forms

- `[x]` Build `/pharmacy/inventory/new` with Autocomplete for essential medicines.
- `[x]` Build `/pharmacy/inventory/[id]` to edit thresholds and make manual stock adjustments.

### 5. Restock Management (`/pharmacy/restock`)

- `[x]` Build Restock Data Table (Status: Pending, Acknowledged, Fulfilled).
- `[x]` Add functionality to create new restock requests.

### 6. Pharmacy Reports (`/pharmacy/reports`)

- `[x]` Build charts for Top dispensed medications and Near-expiry alerts.
