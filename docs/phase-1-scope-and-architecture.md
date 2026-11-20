# Phase 1: Scope and Architecture

## Decisions

- **End-of-week target:** a controlled staging demo by Sunday, October 25, 2026, on the current Windows/XAMPP machine, using synthetic data. This is not a resilient hospital deployment or approval for production use or real patient data.
- **First release workflow:** patient intake and triage submission through persisted case, clinician queue, assignment, review, disposition, and an audit trail.
- **Backend owner:** FastAPI is the canonical API for this workflow. The PHP endpoints are legacy and must not remain a second writer for the same cases after migration.
- **Data ownership:** use one database and SQLAlchemy/Alembic migrations for the canonical workflow. Keep SQLite for local development/tests; target the XAMPP MySQL instance for staging, after verifying the SQLAlchemy driver, connection settings, and migrations.
- **Clinical role of the model:** advisory only. A qualified clinician remains responsible for assessment and disposition. Emergency language and escalation behavior require facility approval.
- **Clinical context:** a Zambian clinic; the facility clinical lead is the approval role. The specific lead and applicable local protocols still need confirmation.

## Acceptance Criteria

1. An authenticated patient can submit a triage assessment and receive a stable case reference.
2. The assessment is persisted and linked to the authenticated patient; retries do not silently create duplicate cases.
3. Authorized clinical staff can see, filter, assign, review, and update the case disposition.
4. Patients cannot access another patient's case; staff permissions are enforced by the API, not only by the UI.
5. Case creation, assignment, and clinical disposition changes have a timestamped audit history.
6. The frontend and FastAPI use one documented request/response contract; no mock data is presented as live workflow data.
7. Automated tests cover the patient-to-clinician workflow, authorization boundaries, and migration setup; a staging smoke test passes with synthetic data.

## Not in This Release

Appointment scheduling, referrals, medication/lab workflows, billing, admissions/discharge, EHR integration, and autonomous AI decision-making are deferred. They need separate requirements and validation.

**Change, 2026-10-26 (health details, records, appointments):** the product owner approved, in this order:
1. *Health details on the assessment* (done): allergies, long-term conditions, regular medicines and weight are saved to the patient's profile; temperature, medicines taken, pregnancy and child danger signs apply to one assessment. Everything submitted with an assessment is shared with the clinicians reviewing that case and stored with the case as submitted.
2. *Medical record, private to the patient* (done): clinicians see it only after the patient approves a request tied to one case. Approved access covers the clinician who asked and the clinician assigned to the case, ends 7 days after the case closes, and can be withdrawn; every view is logged and visible to the patient, and every decision is in the case history. No emergency access without approval in this release.
3. *Appointments* (done): booked by a clinician from a case (closed cases included), in person or by phone; the patient confirms, asks for another time, or cancels; a new time needs confirming again; one clinician cannot be double-booked; clinicians record attended or missed after the start time. Every change is in the case history. No patient self-booking in this release.

**Change, 2026-10-26:** at the product owner's request, case messaging between the patient and the clinicians responsible for a case is now in scope, so clinicians can ask for information they need to assess the case. It is text only, linked to one case, read-only once the case is closed, and shows patients that it is not for emergencies. The emergency wording still needs the facility clinical lead's approval.

## Release Gates

- The facility clinical lead confirms the workflow, triage language, and emergency escalation instructions against the clinic's applicable Zambian protocols.
- The staging MySQL driver, connection settings, and migrations are verified; secrets and HTTPS are configured; synthetic-data backup/restore is tested; and an operational owner is identified.
- Any real-patient pilot requires separate clinical, privacy, security, and operational approval; passing staging checks alone is insufficient.