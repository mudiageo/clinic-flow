# LAN Setup Guide (Offline Clinic Mode)

ClinicFlow is designed to work fully offline and synchronize data across multiple devices within the same clinic, even when there is no internet connection. To enable this, one computer in the clinic must act as the **Local Relay Server**.

## Prerequisites
- All clinic devices (tablets, kiosks, laptops) must be connected to the same local Wi-Fi network or router (an internet connection is not required).
- One main computer (the "Relay Server") must have Node.js and PostgreSQL installed.

## Step 1: Start the Relay Server
On the main computer, you need to run the ClinicFlow SvelteKit backend and expose it to the local network.

1. Build the backend:
   ```bash
   pnpm build
   ```
2. Start the server, binding it to all network interfaces (`0.0.0.0`) so other devices can reach it:
   ```bash
   HOST=0.0.0.0 PORT=5173 node build/index.js
   ```
3. Find this computer's local IP address (e.g., `192.168.1.100`):
   - **Windows**: Run `ipconfig` and look for "IPv4 Address".
   - **Mac/Linux**: Run `ifconfig` or `ip a`.

## Step 2: Configure Client Devices
For all other devices (Nurse tablets, Doctor desktops, Pharmacy kiosks) running the Tauri app or browser version, you need to point them to the Relay Server.

1. In the `.env` file of each device (or in the Tauri configuration if pre-packaging), set the sync server URL to the Relay Server's local IP:
   ```env
   PUBLIC_SYNC_SERVER_URL="http://192.168.1.100:5173"
   ```
2. When the Tauri app launches, it will use this URL to push and pull sync operations.

## How It Works
- The `SyncStore` on each device periodically pushes operations to `http://192.168.1.100:5173/api/sync`.
- The `LiveQueueStore` connects to the local server via Server-Sent Events (SSE) to receive real-time updates for the waiting room and pharmacy queues.
- When the main Relay Server eventually connects to the internet, it will sync its local PostgreSQL database to the cloud via external replication (if configured).
