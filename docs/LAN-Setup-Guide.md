# LAN Setup Guide (Offline Clinic Mode)

> Status: verified 2026-11-19. Commands use the Vite+ toolchain (`vp`), and the discovery/transport below reflects what is implemented today. Items marked **Planned** are not yet shipped.

ClinicFlow is designed to work fully offline and synchronize data across multiple devices within the same clinic, even when there is no internet connection. To enable this, one computer in the clinic acts as the **Local Clinic Server** (previously called the "Local Relay Server").

## Prerequisites

- All clinic devices (tablets, kiosks, laptops) must be connected to the same local Wi-Fi network or router (an internet connection is not required).
- One main computer (the "Local Clinic Server") must have Node.js installed. **PostgreSQL is not required for offline LAN mode** — point `DATABASE_URL` at a local SQLite/libSQL file (for example `file:./local.db`). PostgreSQL is used for cloud deployments.

## Step 1: Start the Local Clinic Server

On the main computer, build and run the ClinicFlow SvelteKit backend, exposing it to the local network.

1. Build the backend:
   ```bash
   vp build
   ```
2. Start the server with a local database, binding it to all network interfaces (`0.0.0.0`) so other devices can reach it:
   ```bash
   DATABASE_URL=file:./local.db HOST=0.0.0.0 PORT=5173 vp preview
   ```
   mDNS advertising is enabled automatically when `DATABASE_URL` points at a local SQLite/libSQL database; the server publishes itself as `clinicflow.local`.
3. Find this computer's local IP address (e.g., `192.168.1.100`):
   - **Windows**: Run `ipconfig` and look for "IPv4 Address".
   - **Mac/Linux**: Run `ifconfig` or `ip a`.

## Step 2: Configure Client Devices

For all other devices (Nurse tablets, Doctor desktops, Pharmacy kiosks) running the PWA or Tauri app, point them to the Local Clinic Server:

1. Open `/connect` on the device. **Auto-detect** probes `http://clinicflow.local` on the standard ClinicFlow and dev ports (`27341`, `27342`, `5173`, `3000`, `8080`, `80`, `4173`); or choose **manual IP** and enter `http://192.168.1.100:5173`.
2. Connecting stores the selected origin as `clinicflow_server_url` in `localStorage` (and caches it for the service worker). `src/hooks.client.ts` then rewrites client remote-function calls under `/_app/remote/` to that origin, so clinical reads and writes reach the clinic server. There is no `PUBLIC_SYNC_SERVER_URL` environment variable to configure on devices.
3. The same stored URL is reused on subsequent launches; a device can be switched back to auto-detect from `/connect` at any time.

## How It Works

- The `syncStore` on each device appends local changes to a durable IndexedDB operation log and pushes them through the `pushOperations` remote function to the selected clinic server — with an immediate debounced flush plus 15–30 second reconciliation. Retried operations keep the same operation ID, so a lost response cannot double-apply a change.
- Server mutations write a durable outbox row and publish a minimal PHC-scoped wake-up signal. A **single** `watchRealtimeSignals` `query.live` connection per client receives that signal and pulls authorized records through cursor-based `pullChanges`. The app does **not** use Server-Sent Events, nor a separate live connection per table. Connection health and data freshness are reported as separate badges.
- Tenant scope is always derived from the signed-in server session, never from a client-supplied `phcId`.
- **Planned:** once the clinic has internet connectivity, the Local Clinic Server can push its durable changes up to the Client Node (cloud) and pull downstream updates. Dynamic local-vs-cloud routing and external replication are roadmap items, not current behaviour — see `docs/Architecture-Implementation-Plan.md`, Part B.

## Troubleshooting

- If a device cannot find the server, confirm both are on the same Wi-Fi, the server is running with a local `DATABASE_URL`, and the chosen port is reachable.
- Check both the connection badge and the data-freshness badge — `Live` does not mean records are current.
- See `docs/user-guides/realtime-sync.md` for conflict recovery and **Reconcile All Data**.
