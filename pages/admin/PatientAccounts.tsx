import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminApi, type PageResult, type PatientSummary } from "@/lib/api";

const PAGE_SIZE = 25;
const inputClass = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function PatientAccounts() {
  const [result, setResult] = useState<PageResult<PatientSummary> | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setResult(await adminApi.patients(search, page, PAGE_SIZE));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load patient accounts.");
    }
  }, [page, search]);

  useEffect(() => { void load(); }, [load]);
  const pageCount = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
        <header>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Patient accounts</h1>
          <p className="mt-2 text-muted-foreground">Registered patients. Only account details are shown; assessments and medical information are not available to administrators.</p>
        </header>
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-end sm:px-6">
            <p className="flex-1 text-sm text-muted-foreground">{result?.total ?? 0} patient accounts</p>
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput); }}>
              <input aria-label="Search patients" placeholder="Search name or email" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className={inputClass} />
              <Button type="submit" variant="outline">Search</Button>
            </form>
          </div>
          {!result ? <p role="status" className="p-6 text-sm text-muted-foreground">Loading patients…</p> : result.items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No patient accounts match this search.</p>
          ) : (
            <ul className="divide-y divide-border">
              {result.items.map((patient) => (
                <li key={patient.id} className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{patient.full_name}</p>
                    <p className="break-all text-sm text-muted-foreground">{patient.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground sm:w-48">Registered {new Date(patient.created_at).toLocaleDateString()}</p>
                  <span className={`text-sm sm:w-20 sm:text-right ${patient.is_active ? "text-safe" : "text-muted-foreground"}`}>{patient.is_active ? "Active" : "Inactive"}</span>
                </li>
              ))}
            </ul>
          )}
          {result && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-sm text-muted-foreground sm:px-6">
              <span>Page {page} of {pageCount}</span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <Button variant="outline" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
