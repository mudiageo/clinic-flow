---
"clinic-flow": minor
---

**Permission-Composable Dashboard System**

Implemented a granular, permission-based dashboard architecture replacing rigid role-based layouts.

- **Universal Dashboard**: `/dashboard` dynamically assembles a grid of tiles (e.g., Triage Board, Lab Requests, Cold Chain) based strictly on individual staff permissions.
- **Permission Editor**: A new UI at `/admin/permissions` allowing OICs/Admins to manually grant or revoke specific modules for any staff member, overriding their base role defaults. Includes a "Reset to Defaults" function and real-time visual diffing.
- **Role Defaults Config**: Built `$lib/config/role-defaults.ts` which automatically assigns standard permission sets to all 10 NPHCDA roles (CHEW, Nurse, Midwife, OIC, etc.).
- **Server-Side Security**: Integrated active permissions into `event.locals` and refactored the central route guard to strictly enforce access to all UI paths.
- **New Role Views**: Built foundational UI layouts for CHEW Field Mode (`/field`), Maternity Ward Board (`/maternity`), Cold Chain Tracker (`/pharmacy/cold-chain`), and EPI Immunization (`/immunization`).
