---
'clinic-flow': minor
---

Make cross-device sync version-ordered, idempotent, freshly queried, self-reconciling, and explicit about durable data freshness. New records are scoped to the signed-in PHC so offline-created patients and queue tickets are no longer rejected as tenant mismatches.
