# Working with Demo Data

ClinicFlow ships with a **synthetic fixture catalogue** for local development and demos. All names, phone numbers and clinical events are invented — none are real patients.

> **Never seed a production deployment.** The seeder refuses to run unless `DATABASE_URL` points at `localhost` / `127.0.0.1`. The `--force-remote` override exists only for controlled staging environments.

## The three demo clinics

| Slug          | Clinic                            | What it demonstrates                                     |
| ------------- | --------------------------------- | -------------------------------------------------------- |
| `oredo`       | Oredo Primary Health Centre       | Reference site: ~45 patients, full pharmacy, labs, ANC   |
| `ikpoba-okha` | Ikpoba-Okha Primary Health Centre | ANC-heavy, low stock, NHIS tracking enabled              |
| `egor`        | Egor Primary Health Centre        | Minimal rural team + a 5-case diarrhoea outbreak cluster |

Every clinic has the full set of triage rules, queue tickets, encounters, vitals, prescriptions, reminders and appointments. IDs are deterministic, so seeding the same clinic twice never creates duplicates.

## Server seed (Postgres)

```bash
# All three clinics
pnpm db:seed

# One clinic only
pnpm db:seed -- --phc=egor

# Replace a clinic's previous fixture rows before reseeding
pnpm db:seed -- --phc=egor --reset
```

The `--reset` flag deletes **only** rows belonging to the fixture catalogue. Records created through the UI are left alone.

Demo logins (password `password123` for all):

- `doctor@clinic.com`, `nurse@clinic.com`, `reception@clinic.com`, `pharmacy@clinic.com`, `admin@clinic.com`
- Per-site accounts use the slug, e.g. `doctor.egor@clinic.com`

## Browser seed (Admin Settings)

Admins can open **Settings → Demo Data → Seed Demo Data** to load the same fixture set into the local IndexedDB cache. This is useful for offline demos and for testing the UI without a server round-trip.

- The browser seed is scoped to the PHC you connected to via `/connect` or `/onboarding`.
- It is idempotent: clicking it twice updates the same records instead of duplicating them.
- It also removes rows left behind by the old `PHC-DEMO` seeder.

**Settings → Reset Local Database** clears the cache and the sync cursor, so the next sign-in pulls a fresh copy from the server.

## How server data reaches the browser

Seeded rows are written to the server's `sync_operations` table with a device id of `clinicflow-seed`. Any browser signed in to that PHC pulls them on its next sync cycle. The sync boundary translates between the older client field names and the current server schema (documented in `docs/data-model/client-server-field-mapping.md`); that shim will be removed once the client schema migration is done.

## AI advisory disclaimers in the demo

AI features are labelled with the shared `<AiDisclaimer>` component wherever an AI output is shown:

- **Vitals & Triage** — before the background AI risk score runs and appears on queue tickets.
- **Outbreak Radar** — on the admin Outbreak Radar page, on the Operations Dashboard widget, and in the support guide.

These notices state that AI output is experimental and advisory, may make serious mistakes, and must be verified by staff. They are not synthetic-data labels; the synthetic-data warning is this guide.

## Troubleshooting

- **No patients in the UI after seeding** — make sure you connected to one of the three demo clinics so `clinicflow_phc_id` is set, then wait for one sync cycle (or trigger a manual sync).
- **Duplicate-looking rows** — run `pnpm db:seed -- --phc=<slug> --reset` and then reset the local database in Admin Settings.
- **`DATABASE_URL is not set`** — the `pnpm db:seed` script loads `.env` automatically; check that the file exists.
