import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import UserList from "./user-list";

export const metadata = {
  title: "User Management | YeneSpot Super Admin",
  description: "View and manage customer and business-owner accounts.",
};

export const instant = false;

export default async function SuperAdminUsersPage() {
  await requireRole(["super_admin"]);

  const supabase = await createClient();

  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone, preferred_language, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

  const error = profilesError || rolesError;

  const roleByUserId = new Map(
    (roles ?? []).map((item) => [item.user_id, item.role]),
  );

  const users = (profiles ?? [])
    .map((profile) => ({
      ...profile,
      role: roleByUserId.get(profile.id) ?? "unknown",
    }))
    .filter(
      (profile) =>
        profile.role === "customer" || profile.role === "business_owner",
    );

  const customers = users.filter((user) => user.role === "customer").length;
  const businessOwners = users.filter(
    (user) => user.role === "business_owner",
  ).length;

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
            Yene<span className="text-gold">Spot</span>
            <span className="ml-2 text-sm font-semibold text-muted">
              Super Admin
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
          href="/super-admin"
          className="text-sm font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
        >
          &larr; Back to super-admin dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold tracking-wider text-gold">
            SUPER ADMINISTRATION
          </p>
          <h1 className="mt-2 text-3xl font-bold text-navy">
            User management
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            View customer and business-owner accounts, search user details,
            and review their account information.
          </p>
        </div>

        {error ? (
          <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
            We could not load user accounts. Please refresh and try again.
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total customers and owners", value: users.length },
                { label: "Customers", value: customers },
                { label: "Business owners", value: businessOwners },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-gold/20 bg-white p-5"
                >
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-navy">
                    {stat.value.toLocaleString("en-US")}
                  </p>
                </div>
              ))}
            </div>

            <UserList users={users} />
          </>
        )}
      </div>
    </main>
  );
}