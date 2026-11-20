# Case vocabulary

One set of names is used by the FastAPI service, the database and the frontend.
The backend definitions are authoritative: `CaseStatus` in
`backend/app/models/case.py`, the transitions in
`backend/app/services/case_workflow.py`, and the urgency values in
`backend/app/schemas/prediction.py`. The frontend types in `src/lib/triageApi.ts`
mirror them.

## Case status

| Value | Meaning |
|---|---|
| `pending` | Submitted and waiting for a clinician. No one is assigned. |
| `assigned` | A clinician has taken or been given the case and has not started the review. |
| `in_review` | The assigned clinician is reviewing the case. |
| `closed` | The review is finished and the outcome is recorded in the clinical notes. Read-only until a doctor reopens it. |

Allowed changes: `pending → assigned` (only by assigning), `assigned → in_review`,
`in_review → closed` (notes required), `assigned/in_review → pending` (doctor only;
clears the assignee), `closed → in_review` (doctor only; reason required).

## Urgency

`urgency` is the **model's preliminary rating**, never a clinical decision. It is set
once at submission and is not edited afterwards.

| Value | Meaning |
|---|---|
| `High` | The model rated the case urgent, or an emergency symptom was reported (emergency symptoms always force `High`). |
| `Medium` | The model suggests a scheduled visit. |
| `Low` | The model suggests home management. |
| `Doctor review` | The model could not produce a rating (for example the model file failed to load); a clinician must assess the case. |

The queue orders cases `High`, `Doctor review`, `Medium`, `Low`, then newest first.

## Legacy PHP values

The retired PHP endpoints used a different vocabulary. Use this mapping if any legacy
records ever need to be read or migrated.

| Legacy field | Legacy value | Current equivalent |
|---|---|---|
| `urgency_level` | `Attend Now` | urgency `High` |
| `urgency_level` | `Attend Within 1-2 Days` | urgency `Medium` |
| `urgency_level` | `Manage at Home` | urgency `Low` |
| `followed_up` | `0` | status `pending` (no clinician involvement was recorded) |
| `followed_up` | `1` | status `closed`, with `follow_up_notes` as the clinical notes |
| staff `role` | `Clinical Officer`, `Clinic-In-Charge` | `doctor` |
| staff `role` | `Nurse` | `nurse` |
| staff `role` | `Administrator` | `admin` |

Checked on 2026-10-22: the legacy MySQL database `tele_triage_system` contains no
triage data (`triage_submissions`, `triage_records` and `sessions` are empty), so no
migration was needed. It does contain three seeded `staff_users` accounts with a
documented default password; see `docs/backlog.md`.
