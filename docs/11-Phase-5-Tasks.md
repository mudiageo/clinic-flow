## Phase 5: Pharmacy & Inventory Dashboard

### 1. Database & Stores Setup
- `[ ]` Add `LocalRestockRequest` to Dexie schema (`src/lib/local-db/db.ts`).
- `[ ]` Create `RestockStore` in `src/lib/state/restock-requests.svelte.ts`.
- `[ ]` Register `restockRequests` in remote sync logic (`src/routes/sync/sync.remote.ts`).

### 2. Inventory Overview (`/pharmacy`)
- `[ ]` Implement DataTable showing `pharmacyInventory`.
- `[ ]` Add Status Badges based on threshold (In Stock, Low Stock, Out of Stock).
- `[ ]` Add low stock Alert Banner.

### 3. Dispense Queue (`/pharmacy/dispense`)
- `[ ]` Create live queue reading from `prescriptionStore` where status is `pending`.
- `[ ]` Add 'Dispense' action that triggers confirmation dialog.
- `[ ]` Implement atomic delta decrement for `pharmacyInventory` on dispense.

### 4. Inventory Management Forms
- `[ ]` Build `/pharmacy/inventory/new` with Autocomplete for essential medicines.
- `[ ]` Build `/pharmacy/inventory/[id]` to edit thresholds and make manual stock adjustments.

### 5. Restock Management (`/pharmacy/restock`)
- `[ ]` Build Restock Data Table (Status: Pending, Acknowledged, Fulfilled).
- `[ ]` Add functionality to create new restock requests.

### 6. Pharmacy Reports (`/pharmacy/reports`)
- `[ ]` Build charts for Top dispensed medications and Near-expiry alerts.
