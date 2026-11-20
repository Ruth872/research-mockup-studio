# Backlog

Items found during the Phase 0–4 work that are outside the phase in progress.
Each entry names where it was found and the phase it most likely belongs to.

## Security and privacy

- **Rotate secrets that were publicly served.** Until the Phase 0 Apache lockdown,
  the root `.env` (`JWT_SECRET`, `DB_PASS`, `ML_SERVICE_API_KEY`) returned 200 to
  any client that could reach this machine. If those values were real, rotate them.
  *(Phase 3, but do it as soon as possible.)*
- **Legacy staff accounts with a documented default password.** `backend/db.sql`
  seeds `admin`, `clinician1` and `nurse1` with the bcrypt hash of a password written
  in a comment beside it. If that script was loaded into the XAMPP MySQL database,
  those accounts exist with a known password. Disable them or drop the legacy tables
  when the PHP endpoints are removed. *(Phase 3)*
- ~~**`patients.php` exposes every patient to any signed-in role.**~~ Done 2026-10-26:
  all 20 legacy PHP files in `backend/` were deleted (recoverable from git history).
  The legacy MySQL database `tele_triage_system` and its seeded staff accounts remain
  until it is dropped.
- **`backend/.htaccess` previously sent `Access-Control-Allow-Origin: *` with
  credentials** for every PHP file. Removed in Phase 0; check that no PHP code still
  sets it if any endpoint is ever re-enabled. *(Phase 3)*
- **`backend/.env` does not exist.** FastAPI is running on its built-in defaults.
  Confirm which settings are in use and whether the startup check rejects a
  placeholder `JWT_SECRET`. *(Phase 3: fail fast on missing settings)*
- **Chat quick replies include prescribing language** ("I am prescribing an
  antibiotic and fever reducer…") in `src/pages/AIChat.tsx`. Live chat is deferred
  by the scope document; remove it with the chat UI. *(Phase 2)*

- **Patients receive the clinician's internal notes.** `GET /cases` returns
  `doctor_notes` to the patient who owns the case. Whether patients should see
  clinician notes verbatim is a clinical decision for the facility lead; until then,
  consider a separate patient-facing message. *(Clinical review, before any pilot)*

- ~~**Sessions end after 15 minutes (admins: 10).**~~ Done 2026-10-26: a 401 now
  triggers one shared `POST /auth/refresh` and the request is retried; the user is
  signed out only if the refresh token is rejected. Still open: tokens remain in
  `sessionStorage`. *(Phase 3)*

## Triage model (found 2026-10-26)

- **The model's accuracy is unknown for real patients.** The Random Forest in
  `backend/model/triage_model.pkl` scores 100% on the held-out test set, but the
  dataset is synthetic (`synthetic=True`, `not_clinically_validated`), every symptom
  combination has exactly one label, and 98% of test combinations also appear in
  training. The model has learned the generator's rules, so the score says nothing
  about real-world performance. Before any pilot: have clinicians triage a set of
  realistic cases independently and measure agreement, above all how many urgent
  cases the model rates lower (under-triage). *(Clinical review, before any pilot)*
- **Duration and reported severity do not affect the rating.** The patient's answers
  are stored and shown to clinicians, but they are not model features, and the
  synthetic labels do not depend on them. A patient reporting "Severe" with mild-sounding
  symptoms can be rated Low. Whether severity should raise the rating is a clinical rule
  for the facility lead to decide. *(Clinical review)*
- **Symptom-checker duration options differ from the dataset's** ("1-3 days" vs
  "1 day", "2 days"…). Harmless while duration is unused; align them if it becomes a
  feature. *(With the item above)*

## Health details on the assessment (added 2026-10-26)

- **Child danger signs force High urgency.** A WHO IMCI general danger sign reported
  for a child under five (cannot drink or breastfeed, vomits everything, convulsions,
  lethargic or unconscious) marks the case as an emergency and High, like the
  emergency symptoms. Confirm with the facility clinical lead, along with the advice
  shown to the parent. *(Clinical review, before any pilot)*
- **No other intake rules change the rating.** Pregnancy, temperature, conditions and
  allergies are shown to clinicians only (allergies and pregnancy also as queue
  badges). Rules such as "pregnant with bleeding" or "temperature ≥ 39 °C in an infant"
  need clinical approval before they raise urgency. *(Clinical review)*
- **The condition list is a starting set** (HIV, TB, diabetes, hypertension, asthma,
  sickle cell, epilepsy, heart and kidney disease). Review it with the clinical lead.

## Medical record sharing (added 2026-10-26)

- **Confirm the consent wording and the 7-day period** with the facility's
  data-protection lead and clinical lead; Zambia's Data Protection Act (2021) treats
  health data as sensitive. *(Before any pilot)*
- **Patients learn of a request only inside the app** (portal notice and Health Record
  page). An SMS or email alert needs a provider decision. *(Later phase)*
- **No document uploads** (lab results, scans): they need secure storage, size limits
  and virus scanning. *(Later phase)*
- **Each time the record is displayed counts as a view**, so reopening the tab adds a
  log entry. Accurate, but the log can grow quickly. *(Phase 2)*

## Appointments (added 2026-10-26)

- **No reminders.** Patients see appointments in the portal only; SMS reminders the day
  before would reduce missed visits but need a provider. *(Later phase)*
- **No clinic opening hours or rooms.** Any future time within a year can be booked,
  including nights and weekends; the only check is the clinician's own overlap.
  Add opening hours and room capacity before patient self-booking. *(Later phase)*
- **Times are shown in each device's time zone.** Correct while staff and patients are in
  Zambia; a device set to another zone would show a different clock time. *(Phase 5)*

## Case messaging (added 2026-10-26)

- **Delivery is by polling** (every 5 s in an open conversation, 12 s in the queue,
  30 s on My Assessments), not WebSockets. Fine for a pilot; revisit under load.
  *(Phase 5: performance)*
- **Read receipts are per side, not per person:** any clinician who opens the
  conversation marks the patient's messages read for all staff. *(Phase 2)*
- **No notification outside the app.** Patients only see a reply when they open the
  portal; SMS or email alerts need a separate decision and provider. *(Later phase)*
- **Message sending is not rate limited.** *(Phase 3)*

## Clinical workflow (found in Phase 1)

- **Coded disposition.** Closing a case requires free-text notes only. Add a coded
  disposition (e.g. home care / clinic visit / emergency referral) once the clinical
  lead approves the categories and wording. *(Clinical review)*
- ~~**Open case dialog is not refreshed by the 12-second queue poll.**~~ Done
  2026-10-26: the poll now updates the open case. Unsaved notes are kept unless
  another clinician changed the saved notes.

## Setup

- **API auto-reload is unreliable on this machine.** After backend code changes,
  `npm run dev:api` kept serving the old routes; restart it after backend changes.
  *(Phase 5: developer setup)*

- **Vite serves any `.html` file under the project root**, even with
  `server.fs.allow` (Vite 5.4.19). Today that is only `index.html` and the public build
  `dist/index.html`. Never store sensitive output as HTML in this repo (for example a
  coverage report), or upgrade Vite and re-run `scripts/check-web-exposure.sh --vite`.
  *(Phase 3)*
- ~~**Port 8000 is shared with another project.**~~ Done 2026-10-26: the API runs on
  port 8010 (`npm run dev:api`) and the Vite proxy targets it; a stopped API now
  shows a readable 503 instead of a bare 500.

- **MySQL timestamps must be UTC.** `created_at` uses the database's `NOW()`; SQLite
  stores UTC, but MySQL uses the session time zone. `/analytics` (and the audit trail)
  assume naive UTC, so pin the staging connection to `time_zone = '+00:00'`. *(Phase 4)*
- **Analytics computes in Python.** `/analytics` loads the window's cases and every
  case's status-change events into memory; fine for staging volumes, revisit with
  indexes or SQL aggregation under load. *(Phase 5: performance)*
- **Patient flow measures added 2026-10-29.** `/analytics` now also reports waiting
  time (submission to first assignment), time in review (first assignment to final
  closure), the longest current wait, arrivals by hour, open and closed cases per
  clinician, and appointment outcomes with an attendance rate. Days and hours are
  counted in `CLINIC_TIMEZONE` (default `Africa/Lusaka`), no longer UTC. Also done:
  median waiting time per urgency level, and de-identified CSV exports
  (`/analytics/export?kind=cases|daily`): no names, contact details, symptoms or
  notes; ages as bands; cells that a spreadsheet would run as formulas are escaped.

- ~~**`backend/.env.example` admin email cannot sign in.**~~ Done 2026-10-26: the
  example uses `example.com` and `create_admin` validates the address as login does.

## Frontend

- ~~**Lint is not clean.**~~ Done 2026-10-26: `eslint src` reports 0 errors. The 8
  remaining warnings are `react-refresh/only-export-components` in shadcn files and
  `AuthContext`. *(Phase 5: CI gate)*

- **Unreferenced files:** `src/pages/Dashboard.tsx`, `src/pages/Index.tsx` (Lovable
  placeholder) and `src/lib/triageML.ts` are not imported anywhere. Delete after
  confirmation. *(Phase 2)*
- **Silent failures:** `StaffDashboard` swallows the stats request error
  (`// Silently fail`) and has no loading state. *(Phase 2: loading/empty/error states)*
- **Patient Records has no backend.** `api.getPatients` deliberately rejects until a
  FastAPI staff patient endpoint exists. *(Phase 2)*
- **TypeScript strictness is uneven.** `tsconfig.app.json` is strict, while the root
  `tsconfig.json` disables `strictNullChecks` and `noImplicitAny` (it only affects
  editors). Align them. *(Phase 5)*
- **Two lockfiles:** `bun.lock`/`bun.lockb` and `package-lock.json`. Pick one package
  manager. *(Phase 5)*
- **Large bundle:** Vite warns about chunks over 500 kB. *(Phase 5: performance)*

## Backend

- **Legacy Python service:** `backend/app.py` and `backend/test_chat_flow.py` duplicate
  the FastAPI app with a JSON-file store (`cases_store.json`). Retire with the legacy
  PHP endpoints. *(Phase 3)*
- **Separate `ml_service/`** defaults its API key to a hard-coded string. Decide
  whether it is still used. *(Phase 3)*
- **Deprecation warnings in tests:** Starlette's `HTTP_422_UNPROCESSABLE_ENTITY`, the
  `httpx` test-client warning, and slowapi's `asyncio.iscoroutinefunction`. *(Phase 5)*

## Repository

- ~~Archive the nested copy and stray scripts.~~ Done 2026-10-22: moved to
  `C:\xampp\_archive\research-mockup-studio-main_2026-10-22\`, outside the web root.
- ~~**README is still the Lovable template.**~~ Done 2026-10-26.
- **Serving the built frontend:** if staging serves `dist/` through Apache, the
  deny-by-default rule needs an explicit allow for that directory only. *(Phase 4)*
