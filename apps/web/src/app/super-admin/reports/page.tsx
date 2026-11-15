import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export const metadata = {
  title: "Reports & Analytics | YeneSpot Super Admin",
  description: "Review live YeneSpot platform statistics and operational metrics.",
};

export const instant = false;

export default async function SuperAdminReportsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const [
    users,
    businesses,
    approvedBusinesses,
    pendingBusinesses,
    applications,
    pendingApplications,
    reviews,
    categories,
    administrators,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("business_owner_applications").select("id", { count: "exact", head: true }),
    supabase.from("business_owner_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("business_categories").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin"]),
  ]);

  const metrics = [
    { title: "Registered users", result: users, description: "Total user profiles" },
    { title: "Total businesses", result: businesses, description: "All business listings" },
    { title: "Approved businesses", result: approvedBusinesses, description: "Approved listings" },
    { title: "Pending businesses", result: pendingBusinesses, description: "Awaiting approval" },
    { title: "Owner applications", result: applications, description: "All submitted applications" },
    { title: "Pending applications", result: pendingApplications, description: "Awaiting administrator review" },
    { title: "Customer reviews", result: reviews, description: "Reviews submitted on the platform" },
    { title: "Active categories", result: categories, description: "Categories available for discovery" },
    { title: "Administrator roles", result: administrators, description: "Admin and super-admin role assignments" },
  ];

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green">
            Yene<span className="text-gold">Spot</span>
            <span className="ml-2 text-sm font-semibold text-muted">Super Admin</span>
          </Link>
          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <Link href="/super-admin" className="text-sm font-semibold text-green hover:underline">
          &larr; Back to super-admin dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold tracking-wider text-gold">SUPER ADMINISTRATION</p>
          <h1 className="mt-2 text-3xl font-bold text-navy">Reports &amp; Analytics</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Review current platform totals and operational activity from the YeneSpot database.
            Refresh this page to retrieve updated counts.
          </p>
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy">Platform metrics</h2>
              <p className="mt-1 text-sm text-muted">Live database counts available to the super-admin account.</p>
            </div>
            <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green">
              Read-only report
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <article key={metric.title} className="rounded-2xl border border-border bg-white p-5">
                <p className="text-sm font-medium text-muted">{metric.title}</p>
                <p className="mt-3 text-3xl font-bold text-navy">
                  {metric.result.error || metric.result.count === null
                    ? "Unavailable"
                    : metric.result.count.toLocaleString("en-US")}
                </p>
                <p className="mt-2 text-xs text-muted">{metric.description}</p>
                {metric.result.error && (
                  <p className="mt-2 text-xs text-red-600">Could not load this metric.</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gold/30 bg-white p-6">
          <h2 className="text-lg font-bold text-navy">Reporting coverage</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            These reports currently provide database totals, not historical trend analysis.
            Revenue, subscription performance, payment transactions, and financial reports
            are not included because a subscription and payment reporting system has not
            been configured.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            This page does not modify records, export data, or create scheduled reports.
            More advanced charts, date-range comparisons, and downloadable reports can be
            added when the required reporting data and workflows are available.
          </p>
        </section>
      </div>
    </main>
  );
}