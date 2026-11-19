import Link from "next/link";
import { connection } from "next/server";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import PasswordForm from "@/app/profile/password-form";

export const metadata = {
  title: "Super Admin Dashboard | YeneSpot",
};

export const instant = false;

export default async function SuperAdminDashboardPage() {
  await connection();
  const user = await requireRole(["super_admin"]);
  const supabase = await createClient();

  const [
    profilesResult,
    adminRolesResult,
    businessesResult,
    pendingBusinessesResult,
    approvedBusinessesResult,
    applicationsResult,
    reviewsResult,
    categoriesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin"]),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("business_owner_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("business_categories").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const stats = [
    { title: "Registered users", count: profilesResult.error ? null : profilesResult.count, description: "User profiles on YeneSpot" },
    { title: "Admin role assignments", count: adminRolesResult.error ? null : adminRolesResult.count, description: "Admin and super-admin roles" },
    { title: "Total businesses", count: businessesResult.error ? null : businessesResult.count, description: "All business listings" },
    { title: "Pending businesses", count: pendingBusinessesResult.error ? null : pendingBusinessesResult.count, description: "Awaiting approval" },
    { title: "Approved businesses", count: approvedBusinessesResult.error ? null : approvedBusinessesResult.count, description: "Visible business listings" },
    { title: "Pending applications", count: applicationsResult.error ? null : applicationsResult.count, description: "Business-owner applications" },
    { title: "Customer reviews", count: reviewsResult.error ? null : reviewsResult.count, description: "Reviews submitted on the platform" },
    { title: "Active categories", count: categoriesResult.error ? null : categoriesResult.count, description: "Categories available for discovery" },
  ];

  const sections = [
    ["Admin Management", "Manage administrator accounts and permissions."],
    ["Business Management", "Oversee all registered businesses."],
    ["User Management", "Manage customers and business owners."],
    ["Subscriptions & Payments", "Oversee plans, subscriptions, and transactions."],
    ["Platform Configuration", "Manage global platform settings."],
    ["Security & Roles", "Review access roles and platform security."],
    ["Reports & Analytics", "Monitor platform activity and performance."],
    ["Audit Logs", "Review important administrative activities."],
  ];

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
            Yene<span className="text-gold">Spot</span>
            <span className="ml-2 text-xs font-semibold text-muted">SUPER ADMIN</span>
          </Link>
          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <section className="rounded-2xl bg-navy p-8 text-white sm:p-10">
          <p className="text-sm font-medium text-white/70">SUPER ADMINISTRATION</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">YeneSpot Control Center</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            Manage the entire YeneSpot platform, oversee administrators,
            control platform settings, and monitor business operations.
          </p>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy">Platform overview</h2>
              <p className="mt-1 text-sm text-muted">Live counts from the YeneSpot database.</p>
            </div>
            <p className="text-xs text-muted">Refresh the page to update statistics.</p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.title} className="rounded-2xl border border-border bg-white p-5">
                <p className="text-sm font-medium text-muted">{stat.title}</p>
                <p className="mt-3 text-3xl font-bold text-navy">
                  {stat.count === null ? "?" : stat.count.toLocaleString("en-US")}
                </p>
                <p className="mt-2 text-xs text-muted">{stat.description}</p>
                {stat.count === null && (
                  <p className="mt-2 text-xs text-red-600">Could not load this statistic.</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">Platform administration</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6">
                <h3 className="font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                {title === "Admin Management" ? (
                  <Link href="/super-admin/admins" className="mt-4 inline-block text-xs font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
                    Manage accounts &rarr;
                  </Link>
                ) : title === "Business Management" ? (
                  <Link href="/admin/businesses" className="mt-4 inline-block text-xs font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
                    Manage businesses &rarr;
                  </Link>
                ) : title === "User Management" ? (
                  <Link href="/super-admin/users" className="mt-4 inline-block text-xs font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
                    Manage users &rarr;
                  </Link>
                ) : title === "Subscriptions & Payments" ? (
                  <Link href="/super-admin/subscriptions" className="mt-4 inline-block text-xs font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
                    Manage subscriptions &rarr;
                  </Link>
                ) : title === "Platform Configuration" ? (
                  <Link href="/super-admin/configuration" className="mt-4 inline-block text-xs font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
                    Configure platform &rarr;
                  </Link>
                ) : title === "Security & Roles" ? (
                  <Link href="/super-admin/security" className="mt-4 inline-block text-xs font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
                    Review security &rarr;
                  </Link>
                ) : title === "Reports & Analytics" ? (
                  <Link href="/super-admin/reports" className="mt-4 inline-block text-xs font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
                    View reports &rarr;
                  </Link>
                ) : title === "Audit Logs" ? (
                  <Link href="/super-admin/audit-logs" className="mt-4 inline-block text-xs font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
                    Review audit logs &rarr;
                  </Link>
                ) : (
                  <p className="mt-4 text-xs font-semibold text-gold">Coming soon</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 text-sm text-muted">Signed in as: {user.email}</p>

        <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">Change Password</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Update your account password. You must enter your current password to continue.
          </p>
          <div className="max-w-xl">
            <PasswordForm />
          </div>
        </section>

        <footer className="mt-12 border-t border-border py-6 text-center text-sm text-muted">
          ? YeneSpot Super Administration.
        </footer>
      </div>
    </main>
  );
}
