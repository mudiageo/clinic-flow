---
'clinic-flow': minor
---

Finish the admin/superadmin action and referral flows with durable, auditable behaviour. Adds PHC-scoped DHIS2 UID configuration and a durable NHIS claims manual-submission queue (with an opt-in private endpoint override, never a claimed public API), a real SMS test/dispatch adapter with clearly-labelled console mode, superadmin user/PHC deactivation and reset actions, real reminder dispatch, and a working doctor referral/SMS flow. Adds an advisory, read-only Nigerian HFR facility lookup for referrals, onboarding validation and admin review — with no console mode, no fabricated rows and no auto-write. All provider modes, console references and destructive actions are surfaced plainly to the user, and the Admin & Superadmin Operations support guide documents the flows.
