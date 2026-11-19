import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import ApplicationActions from "./application-actions";

export const metadata = {
  title: "Business Applications | YeneSpot Admin",
  description: "Review business-owner applications on YeneSpot.",
};

export const instant = false;

export default async function BusinessApplicationsPage() {
  await requireRole(["admin", "super_admin"]);

  const supabase = await createClient();

  const { data: applications, error } = await supabase
    .from("business_owner_applications")
    .select(
      "id, business_name, description, phone, email, website, city, neighborhood, address, created_at, user_id, business_categories(name, name_am)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
            Yene<span className="text-gold">Spot</span>
            <span className="ml-2 text-sm font-semibold text-muted">
              Admin
            </span>
          </Link>

          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <Link
          href="/admin"
          className="text-sm font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
        >
          â† Back to admin dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold tracking-wider text-gold">
            ADMINISTRATION
          </p>

          <h1 className="mt-2 text-3xl font-bold text-navy">
            Business owner applications
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Review applications submitted by customers who want to list
            their businesses on YeneSpot.
          </p>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
            We could not load applications. Please refresh and try again.
          </div>
        ) : applications && applications.length > 0 ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-gold/20 bg-white p-5">
              <p className="text-sm text-muted">Pending applications</p>
              <p className="mt-1 text-3xl font-bold text-navy">
                {applications.length}
              </p>
            </div>

            {applications.map((application) => {
              const category = Array.isArray(application.business_categories)
                ? application.business_categories[0]
                : application.business_categories;

              return (
                <article
                  key={application.id}
                  className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                        PENDING REVIEW
                      </span>

                      <h2 className="mt-4 text-2xl font-bold text-navy">
                        {application.business_name}
                      </h2>

                      <p className="mt-2 text-sm text-muted">
                        {category?.name || "Uncategorized"}
                        {category?.name_am ? ` / ${category.name_am}` : ""}
                      </p>
                    </div>

                    <p className="text-xs text-muted">
                      Submitted{" "}
                      {new Date(application.created_at).toLocaleDateString(
                        "en-ET",
                      )}
                    </p>
                  </div>

                  {application.description && (
                    <p className="mt-5 text-sm leading-7 text-muted">
                      {application.description}
                    </p>
                  )}

                  <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold text-muted">PHONE</p>
                      <p className="mt-1 text-sm text-navy">
                        {application.phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-muted">EMAIL</p>
                      <p className="mt-1 text-sm text-navy">
                        {application.email || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-muted">CITY</p>
                      <p className="mt-1 text-sm text-navy">
                        {application.city}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-muted">
                        NEIGHBORHOOD
                      </p>
                      <p className="mt-1 text-sm text-navy">
                        {application.neighborhood || "Not provided"}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-bold text-muted">ADDRESS</p>
                      <p className="mt-1 text-sm text-navy">
                        {application.address || "Not provided"}
                      </p>
                    </div>

                    {application.website && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-bold text-muted">WEBSITE</p>
                        <a
                          href={application.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-sm font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                        >
                          {application.website}
                        </a>
                      </div>
                    )}
                  </div>

                  <p className="mt-5 break-all text-xs text-muted">
                    Applicant ID: {application.user_id}
                  </p>

                  <ApplicationActions applicationId={application.id} />
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-navy">
              No pending applications
            </h2>
            <p className="mt-2 text-sm text-muted">
              New business-owner applications will appear here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}