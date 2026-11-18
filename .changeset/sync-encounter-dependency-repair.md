---
'clinic-flow': patch
---

Fix vital-sign pushes by creating a durable encounter before vitals and queue tickets, ordering encounter parents ahead of their dependents, and backfilling tenant-safe encounters for legacy pending sync operations.
