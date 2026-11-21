---
'clinic-flow': minor
---

Finish the final route-fidelity wave by removing the remaining interactive stubs. Family pages now offer real Register Newborn and Add Relative dialogs that create/link patients with deterministic clinic IDs and no fabricated data. The notifications page saves a real, durable SMS preference gated by the PHC two-way SMS setting (staff SMS delivery remains Planned). Device connect now uses a real QR scanner, parses the admin pairing URL, requires an explicit confirmable device name, and shows the genuine pending status. Onboarding replaces fake progress and camera calibration with indeterminate database init bound to the real remote and real server-status verification; the dead seed checkbox is removed. Marketing pitch statistics are confirmed as static copy. The Admin & Superadmin Operations support guide documents all changed flows.
