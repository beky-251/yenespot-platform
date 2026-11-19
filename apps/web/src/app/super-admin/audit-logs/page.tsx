import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export const metadata = {
  title: "Audit Logs | YeneSpot Super Admin",
  description: "Review administrative actions and changes recorded on YeneSpot.",
};

export const instant = false;

function formatAction(action: string) {
  return action
    .split(".")
    .map((part) => part.replaceAll("_", " "))
    .join(" · ");
}

function formatDetails(details: unknown) {
  if (!details || typeof details !== "object" || Object.keys(details).length === 0) {
    return "No additional details";
  }

  return JSON.stringify(details, null, 2);
}

export default async function SuperAdminAuditLogsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("id, actor_user_id, action, entity_type, entity_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
            Yene<span className="text-gold">Spot</span>
            <span className="ml-2 text-sm font-semibold text-muted">Super Admin</span>
          </Link>
          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <Link href="/super-admin" className="text-sm font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
          &larr; Back to super-admin dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold tracking-wider text-gold">SUPER ADMINISTRATION</p>
          <h1 className="mt-2 text-3xl font-bold text-navy">Audit Logs</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Review recorded administrative actions, including business application decisions,
            business status and verification changes, and administrator role changes.
          </p>
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy">Recent activity</h2>
              <p className="mt-1 text-sm text-muted">
                Showing the latest {logs?.length ?? 0} records, with a maximum of 50.
              </p>
            </div>
            <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green">
              Read-only log
            </span>
          </div>

          {error ? (
            <div role="alert" className="mt-4 rounded-2xl border border-gold/30 bg-white p-6">
              <h3 className="font-bold text-navy">Audit logs are not available yet</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                The audit log table may not have been created in the connected database.
                Apply the audit logs migration before using this page.
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-border bg-white p-6">
              <h3 className="font-bold text-navy">No audit records yet</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Administrative actions will appear here after audit logging is enabled.
                Earlier actions are not backfilled.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {logs.map((log) => (
                <article key={log.id} className="rounded-2xl border border-border bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold capitalize text-navy">
                        {formatAction(log.action)}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Date unavailable"}
                      </p>
                    </div>
                    <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold capitalize text-navy">
                      {log.entity_type.replaceAll("_", " ")}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-muted">Actor user ID</dt>
                      <dd className="mt-1 break-all text-navy">
                        {log.actor_user_id ?? "Unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-muted">Affected record ID</dt>
                      <dd className="mt-1 break-all text-navy">
                        {log.entity_id ?? "Unavailable"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted">Change details</p>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-cream p-3 text-xs leading-5 text-navy">
                      {formatDetails(log.details)}
                    </pre>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-gold/30 bg-white p-6">
          <h2 className="text-lg font-bold text-navy">Audit coverage</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Logging begins when the audit migration is applied. This page displays recorded
            events only; it does not reconstruct historical activity or allow records to be
            edited or deleted.
          </p>
        </section>
      </div>
    </main>
  );
}
