# ClinicFlow: Technical Implementation Roadmap

This document outlines the step-by-step engineering plan to build the Multi-Tier Edge-to-Cloud architecture, incorporating the zero-config local server, CRDT sync, and SQLite edge storage.

## Phase 1: The Local Server Executable & SQLite

### 1.1 The SvelteKit Bun Adapter

To ship the local server as a zero-dependency standalone executable, we cannot just run `bun build --compile` on a standard SvelteKit output because it fails to bundle static assets (CSS/images) properly.

- **Action:** We will use a dedicated adapter like **`svelte-smol`** (or a heavily configured `svelte-adapter-bun` wrapper) in our `svelte.config.js`. This specifically intercepts the SvelteKit build process, bundles the assets, and compiles the entire app into a single, double-clickable binary for Windows/Linux.

### 1.2 Edge Database (SQLite)

- **Action:** Integrate `libSQL` (Turso's SQLite fork) or `better-sqlite3`.
- **Implementation:** When the compiled Bun binary runs on the clinic admin's PC, it generates a local `clinicflow_data.db` file in the same directory. All SvelteKit remote functions (`.command`, `.query`) running on the local server will read/write to this SQLite file.

## Phase 2: Zero-Config Discovery & Enrollment

### 2.1 mDNS (Multicast DNS) Implementation

- **Action:** Use a Bun-compatible mDNS library (like `multicast-dns`).
- **Implementation:** Upon startup, the Local Server binary broadcasts itself as `http://clinicflow.local`. The tablets are programmed to attempt a fetch to this address first. If it resolves, they set their active sync target to the Local Server.

### 2.2 The Provisioning Flow

- **Implementation:** Create a `/provision` route in the PWA. The IT officer enters the 6-digit code. The PWA sends this to the Master Node (Vercel), which returns the specific Client Node URL (e.g., `fmoh.clinicflow.com`). The PWA saves this to `localStorage` and triggers the initial downward sync from the Cloud to the Local SQLite DB.

## Phase 3: The CRDT Sync Engine

### 3.1 Hybrid Logical Clocks (HLCs)

- **Action:** Do not use `Date.now()` for any sync logic.
- **Implementation:** Implement an HLC library (or write a custom utility). Every database record created on the tablet includes an HLC timestamp (`{ physicalTime, counter, nodeId }`). This guarantees correct conflict resolution even if a tablet's battery dies and its clock resets to 1970.

### 3.2 Sync Payload & Schema Versioning

- **Action:** Every sync request from the Local Server to the Cloud Node must include `x-app-version: 1.2.0` in the headers.
- **Implementation:** In the SvelteKit hooks (`hooks.server.ts`), intercept incoming syncs. If the Cloud Node is on `1.3.0` and the Local Server is on `1.2.0`, return a `426 Upgrade Required` status. The Local Server will pause syncing and alert the OIC to download the new executable.

## Phase 4: Dual-Queue Syncing

- **Implementation:** In the PWA, create two IndexedDB stores for the sync outbox:
  1.  `queue_critical`: JSON data (vitals, triage, text).
  2.  `queue_blobs`: Base64 or Blob data (images/audio).
- **Logic:** A Web Worker constantly monitors `navigator.onLine`. It attempts to drain `queue_critical` first. Only when `queue_critical` is completely empty does it begin uploading the heavy blobs, ensuring a slow 3G connection doesn't block life-saving vitals data.

## Phase 5: Clinical Conflict Resolution UI

- **Implementation:** When the CRDT engine resolves a conflict (e.g., two offline edits to the same patient's allergy list), it flags the record with `requires_audit: true`.
- **UI:** Create an `/audit` route in the SvelteKit app visible only to the OIC/Doctor. They must review the mathematically merged record and click "Approve Clinical State" to remove the flag.
