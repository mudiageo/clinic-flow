---
'clinic-flow': patch
---

Carry the selected patient from Patient Search into the Vitals station via `?patient=<local-id>`, pre-selecting them once the offline registry loads and advancing directly to the vitals step. Also correct the self-padded route opt-outs to use generated route IDs that include the `(app)` group.
