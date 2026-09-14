# ClinicFlow Roadmap

## 🚀 Upcoming Features & Overhauls

### 1. Comprehensive Marketing Website Overhaul
We will completely revamp the marketing website to better convert visitors and explain our value proposition. This is not just a fresh coat of paint; it's a full structural and content overhaul.

**Scope of Overhaul:**
- **Design & Branding:** Implement a modern, professional, and trustworthy brand identity.
- **Content Strategy:** Rewrite copy to clearly articulate the "Offline-First" and "AI-Assisted" value props for rural Primary Healthcare Centers.
- **Site Structure & Navigation:** Reorganize the sitemap for better user flow (e.g., dedicated sections for Doctors, Nurses, and Pharmacists).
- **New Marketing Pages:**
  - `/features`: Deep dive into core capabilities (Smart Triage, RxBrain, Offline Sync).
  - `/pricing`: Transparent breakdown of how the open-source and hosted models work.
  - `/about`: Our mission to digitize healthcare in low-connectivity regions.
  - `/contact`: Dedicated lead capture for PHC admins.

### 2. 🤖 Global Persistent Clinical Copilot (Future Vision)
- **Concept:** A persistent AI assistant that "follows" the clinician across different tabs and patients.
- **State Management:** Use Svelte 5 global runes to maintain context and chat history across navigation.
- **Agentic Tools:** Grant the LLM function-calling capabilities to actively navigate the dashboard, queue prescriptions, and draft notes via natural language commands (e.g., *"Order a malaria test and prescribe 500mg Amoxicillin"*).

---

### 3. General UX & QoL Improvements (Pending)
- Add sorting/filtering capabilities to the Admin Dashboard tables.
- Implement a unified "Patient Timeline" view for doctors to easily scan historical encounters.
- Improve focus-states and keyboard navigation on the Kiosk registration forms to speed up Nurse intake.
- Provide a "Dark Mode Toggle" explicitly in the AppSidebar (currently relying on system preference).
