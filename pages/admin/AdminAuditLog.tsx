import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminAuditEntry, type PageResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const PAGE_SIZE = 25;

function describeDetails(entry: AdminAuditEntry) {
  return entry.details ? Object.entries(entry.details).map(([key, value]) => `${key}: ${String(value)}`).join(" · ") : "—";
}

export default function AdminAuditLog() {
  const isMobile = useIsMobile();
  const [result, setResult] = useState<PageResult<AdminAuditEntry> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setResult(await adminApi.auditLog(page, PAGE_SIZE));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the audit log.");
    }
  }, [page]);

  useEffect(() => { void load(); }, [load]);
  const pageCount = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
        <header>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Admin audit log</h1>
          <p className="mt-2 text-muted-foreground">Administrative account changes and the administrator who performed them.</p>
        </header>
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {!result ? <p role="status" className="p-6 text-sm text-muted-foreground">Loading audit events…</p> : result.items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No administrative actions have been recorded.</p>
          ) : isMobile ? (
            <ul className="divide-y divide-border">
              {result.items.map((entry) => (
                <li key={entry.id} className="space-y-1 p-4 text-sm">
                  <p className="font-medium capitalize text-foreground">{entry.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()} · {entry.actor_name ?? "Deleted account"}</p>
                  {entry.target_user_id !== null && <p className="text-xs text-muted-foreground">Target account #{entry.target_user_id}</p>}
                  <p className="break-words text-xs text-muted-foreground">{describeDetails(entry)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr><th className="px-5 py-3">When</th><th className="px-5 py-3">Administrator</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">Details</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.items.map((entry) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</td>
                      <td className="px-5 py-4"><span className="block font-medium text-foreground">{entry.actor_name ?? "Deleted account"}</span><span className="text-xs text-muted-foreground">{entry.actor_email ?? "—"}</span></td>
                      <td className="px-5 py-4 font-medium text-foreground">{entry.action.replace(/_/g, " ")}</td>
                      <td className="px-5 py-4 text-muted-foreground">{entry.target_user_id ?? "—"}</td>
                      <td className="max-w-sm px-5 py-4 text-xs text-muted-foreground">{describeDetails(entry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {result && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{result.total} events · Page {page} of {pageCount}</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button variant="outline" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
