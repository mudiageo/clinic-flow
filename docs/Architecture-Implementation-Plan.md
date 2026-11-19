# ClinicFlow: Multi-Tier Architecture & Sync Implementation Plan

This document details the technical implementation of our Multi-Tiered "Edge-to-Cloud" architecture. It outlines how we ship local servers to clinics, manage zero-config networking, and handle the deep complexities of offline-first synchronization.

## 1. The Architectural Hierarchy

*   **Tier 1: Master Discovery Node (ClinicFlow HQ)**
    *   *Role:* A lightweight registry mapping `provisioning_codes` to specific Client Nodes. Holds zero patient data (PII).
*   **Tier 2: Client Node (e.g., FMoH Cloud Server)**
    *   *Role:* The main PostgreSQL database for a specific client. Hosts the Superadmin dashboard (Outbreak Radar, DHIS2 export).
*   **Tier 3: Local Clinic Server (The Edge Hub)**
    *   *Role:* A local machine running a Bun-compiled standalone executable or a Tauri Sidecar. It uses a lightweight **SQLite** database to act as the "mini-cloud" for that specific clinic.
*   **Tier 4: The Client PWA (Tablets)**
    *   *Role:* The SvelteKit frontend installed on Android tablets using IndexedDB (Dexie).

---

## 2. Server Deployment & Delivery Options

We cannot expect rural clinic IT staff to configure Node.js or PostgreSQL. We ship the Local Clinic Server using two zero-configuration methods, both utilizing our existing SvelteKit backend logic compiled via Bun adapters:

1.  **The Tauri Sidecar (For Desktop Workstations):** The compiled SvelteKit/Bun binary is bundled inside the ClinicFlow Tauri desktop app. When the OIC opens the desktop app, the local sync server silently spins up in the background.
2.  **The Standalone Executable (For Headless/Mini PCs):** A single, dependency-free `.exe` or Linux binary (compiled via `bun build`). The admin drops it on a machine, runs it, and it hosts the SQLite DB and sync engine instantly.

---

## 3. Zero-Config Networking & Device Enrollment

### mDNS & IP Fallback
Tablets must find the Local Server without manual configuration. The Local Server broadcasts itself over the clinic's Wi-Fi router using **mDNS (Multicast DNS)** (e.g., `http://clinicflow.local`). The PWA automatically detects this. If the router's mDNS fails, the UI provides a fallback to manually type the direct IP address (e.g., `192.168.1.100`).

### The Setup & Enrollment Flow
When a clinic is first set up, the router is connected to the internet. 
1.  **Provisioning:** The admin opens the newly installed Local Server and enters a 6-digit Provisioning Code.
2.  **Partial Replication:** The Local Server connects to the Client Node (Cloud) and downloads *only* the data relevant to that specific PHC into its local SQLite database (preventing data bloat).
3.  **Tablet Lockdown:** Tablets connect to the Local Server via Wi-Fi. The Welcome screen locks them to the clinic, downloading the encrypted staff roster. Authentication is now 100% local.

---

## 4. Advanced Sync Mechanics & Edge Cases

The PWA dynamically routes data. If mDNS/Local IP is available, it syncs to the Local Server. If out in the field on cellular data, it syncs directly to the Cloud Node (which then pushes down to the Local Server). To ensure data integrity, we implement five critical safeguards:

1.  **Hybrid Logical Clocks (HLCs):** We do not rely on tablet system clocks (`Date.now()`), which often reset when batteries die. HLCs ensure our CRDT (Conflict-Free Replicated Data Type) engine correctly sequences events even with severe clock drift.
2.  **Schema Versioning & OTA Updates:** The sync payload includes an `app_version`. If a local clinic is offline for weeks and misses a schema update (e.g., a new database column), the Cloud Node rejects the sync to prevent corruption, forcing the Tauri app to download an Over-The-Air (OTA) update first.
3.  **Dual-Queue Syncing:** Heavy payloads (images of lesions) are placed in a low-priority background queue with resumable chunking. Lightweight clinical JSON (vitals, prescriptions) stays on a high-priority queue to ensure critical data isn't blocked by a slow 3G photo upload.
4.  **Clinical Conflict Resolution:** If two offline nurses edit the same allergy list, the CRDT merges them mathematically. However, this is flagged in an "Audit Inbox" on the OIC's dashboard for human clinical verification, ensuring medical safety.
