---
'clinic-flow': minor
---

Add durable, PHC-scoped clinical recordkeeping for immunizations and cold chain. Vaccination and refrigerator-temperature records are stored locally first and synchronized through the guarded push boundary, with server-authoritative permission and feature-flag checks, forced PHC/staff attribution, and payload validation. Adds vaccine batch/expiry tracking, real recording flows on the EPI and cold-chain pages, advisory excursion warnings, and read-only audit queries — with no fabricated clinical data or AI-generated values.
