# Tele-Triage (KabwataCare)

A research prototype of a tele-triage workflow for a primary-care clinic in Zambia.
Patients submit symptoms, a model gives an advisory urgency rating, and clinicians take,
review and close each case with a full audit trail. Use synthetic data only; see
[docs/phase-1-scope-and-architecture.md](docs/phase-1-scope-and-architecture.md).

- Frontend: React, Vite, TypeScript, Tailwind (this folder).
- API: FastAPI, SQLAlchemy, Alembic in [backend/](backend/). Its README covers the API in detail.

## First-time setup (Windows)

```powershell
npm install
cd backend
py -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
cd ..
npm run create-admin
```

`npm run create-admin` creates the database if needed and prompts for the first
administrator's name, email and password (12–72 characters). It runs only once;
pass `-- --force` to add another administrator later.

## Run it

```powershell
npm run dev:all
```

This starts the API on http://127.0.0.1:8010 and the app on http://localhost:8080.
To run them in separate terminals, use `npm run dev:api` and `npm run dev`.

If a page says "The Tele-Triage API is not running", the API is stopped: start it with
`npm run dev:api`.

## Who signs in where

| Role | How the account is created | Sign in at |
|---|---|---|
| Administrator | `npm run create-admin` (first one), then by another admin | **Staff & admin sign in** (`/staff/login`) |
| Doctor, nurse | An administrator, under **Manage Staff**. They get a temporary password and must change it at first sign-in. | **Staff & admin sign in** (`/staff/login`) |
| Patient | Self-registration at **Register** (`/patient/signup`) | **Patient sign in** (`/patient/login`) |

Staff cannot register themselves; there is no public way to create an administrator.

## Checks

```powershell
npm run typecheck
npm run lint
npm test
cd backend; .\.venv\Scripts\python -m pytest
```

Known issues and deferred work are tracked in [docs/backlog.md](docs/backlog.md).
