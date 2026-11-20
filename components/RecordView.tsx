import IntakeSummary from "@/components/IntakeSummary";
import type { DatedEntry, MedicalRecord } from "@/lib/triageApi";

const heading = "text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  assigned: "Assigned",
  in_review: "In review",
  closed: "Closed",
};

function Entries({ items, empty }: { items: DatedEntry[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-0.5 text-sm text-slate-800 dark:text-slate-200">
      {items.map((item, index) => (
        <li key={index}>{item.name}{item.year ? <span className="text-slate-500"> · {item.year}</span> : null}</li>
      ))}
    </ul>
  );
}

/** A patient's medical record, read-only. */
export default function RecordView({ record }: { record: MedicalRecord }) {
  const details = record.details;
  return (
    <div className="space-y-5">
      <IntakeSummary intake={record.health ? { health: record.health, visit: null } : null} />

      <section aria-label="Record details" className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:grid-cols-2">
        <div>
          <span className={heading}>Blood group</span>
          <p className="text-sm text-slate-800 dark:text-slate-200">{details?.blood_group ?? "Not recorded"}</p>
        </div>
        <div>
          <span className={heading}>Family history</span>
          <p className="text-sm text-slate-800 dark:text-slate-200">{details?.family_history ?? "Not recorded"}</p>
        </div>
        <div>
          <span className={heading}>Immunisations</span>
          <Entries items={details?.immunisations ?? []} empty="None recorded" />
        </div>
        <div>
          <span className={heading}>Operations and hospital stays</span>
          <Entries items={details?.procedures ?? []} empty="None recorded" />
        </div>
      </section>

      <section aria-label="Past assessments">
        <span className={heading}>Past assessments</span>
        {record.past_assessments.length === 0 ? (
          <p className="text-sm text-slate-500">None.</p>
        ) : (
          <ol className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
            {record.past_assessments.map((item) => (
              <li key={item.case_id} className="p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500">{item.case_id} · {new Date(item.created_at).toLocaleDateString()}</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{item.urgency} · {STATUS_LABELS[item.status] ?? item.status}</span>
                </div>
                <p className="mt-1 capitalize text-slate-800 dark:text-slate-200">{item.symptoms.join(", ")}</p>
                {item.clinician_notes && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Outcome: {item.clinician_notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
