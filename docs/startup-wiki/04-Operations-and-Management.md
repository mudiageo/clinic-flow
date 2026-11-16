# ClinicFlow: Business Operations & Management

This document outlines the day-to-day operations required to keep ClinicFlow running, scale deployments, and manage the technical and field teams.

## 1. Field Deployment Operations (The "Clinic Rollout" Playbook)

Deploying to a new PHC (Primary Health Centre) must be a repeatable, military-grade process.

- **Pre-Deployment (Week -2):**
  - **Hardware Prep:** The COO purchases the tablets. The CTO flashes them with the MDM (Mobile Device Management) software, locking them to "Kiosk Mode." The latest compiled Bun Executable (Local Server) is loaded onto the clinic's master device.
  - **Site Survey:** An operations agent visits the PHC to determine where the solar panels and the Wi-Fi router will be physically installed (must reach the pharmacy and triage areas).
- **Deployment (Week 0):**
  - **Installation:** Solar installers mount the 1KVA inverter. The router is plugged into the solar battery circuit.
  - **Provisioning:** The IT officer connects the router to a hotspot, runs the Local Server, and enters the Provisioning Code to pull down the clinic's initial data (Partial Replication).
  - **Training:** 2 days of hands-on training for the OIC, Nurses, and CHEWs. Crucially, they are trained on how to handle the tablets (charging routines, cleaning).
- **Post-Deployment Support:**
  - **Tier 1 (Local OIC):** Handles basic issues (tablet dead, forgot PIN).
  - **Tier 2 (Remote Support):** The COO/Support team monitors the Master Dashboard. If a clinic hasn't synced to the Cloud Node in 48 hours, they call the OIC to investigate.

## 2. Engineering Operations (DevOps & Release Management)

- **Version Control:** All code is housed on GitHub. The `main` branch is locked. All features are built on `feature/` branches and merged via Pull Requests.
- **CI/CD Pipeline:**
  - When a release is tagged, GitHub Actions automatically builds the Cloud Node (deploying to Vercel).
  - Simultaneously, it compiles the `bun:sqlite` standalone binary for local servers and the Tauri Desktop apps for Windows/Linux.
- **OTA (Over-The-Air) Updates:** Pushing an update that changes the database schema is dangerous. The Cloud Node will flag the schema change, forcing the local clinic servers to pause syncing until the OIC clicks "Download Update" on their dashboard.

## 3. Financial Operations & Burn Rate Management

- **CapEx vs OpEx:** Capital Expenditure (Hardware, Solar, GPUs) is spent upfront from the grant. Operational Expenditure (Cloud hosting, APIs, Salaries, Travel) must be strictly budgeted monthly.
- **Runway:** The ₦30M grant provides roughly 12-14 months of runway. The CEO must begin pitching for Pre-Seed VC funding at Month 8, using the data from the 3-clinic pilot as proof of traction.
