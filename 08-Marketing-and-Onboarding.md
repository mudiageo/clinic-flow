# ClinicFlow Marketing & Onboarding Specifications

## 1. Marketing Website

The root route (`/`) will serve as the public face of ClinicFlow, demonstrating its capabilities for rural Primary Healthcare Centers.

- **Audience:** Government officials, NGO directors, and PHC heads.
- **Key Messaging:** "Offline-First Hospital Management for Rural Clinics".
- **Call to Actions:**
  - Register your PHC.
  - Download the ClinicFlow Kiosk App (Windows/Android).

## 2. Registration & Onboarding

PHCs need a self-serve onboarding flow.

- **Form Fields:**
  - Clinic/PHC Name, State, LGA
  - Admin Name, Admin Email, Admin Password
- **Behavior:**
  - For demo day, registration provides instant access.
  - Submitting the form creates the PHC record and the Admin User record, then automatically authenticates the user and directs them to the operations dashboard.

## 3. Download Portal

To deploy ClinicFlow to kiosk machines, clinics need to download the packaged Tauri app.

- **Page:** `/download` will showcase the system requirements and feature download buttons.
- **API Resolution:** The download links will point to an internal endpoint (e.g., `/api/download?os=windows`). This endpoint will fetch the latest release artifacts from the GitHub repository using the GitHub Releases API, allowing the frontend to dynamically point to the correct files without hardcoding URLs.

## 4. Software Makers Dashboard (Super Admin)

We (the makers) need a way to see which clinics have registered on the platform.

- **Page:** `/superadmin`
- **Features:**
  - Lists all registered PHCs on the server.
  - Shows the number of staff and patients registered under each PHC.
  - In the future, this will be where registrations are approved or denied (currently instant-approval for demo purposes).
