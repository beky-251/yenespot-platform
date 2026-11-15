import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import BusinessList from "./business-list";

export const metadata = {
  title: "Business Management | YeneSpot Admin",
  description: "Manage and moderate business listings on YeneSpot.",
};

export const instant = false;

export default async function AdminBusinessesPage() {
  await requireRole(["admin", "super_admin"]);

  const supabase = await createClient();

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, description, phone, email, website, address, city, neighborhood, status, verified, average_rating, review_count, created_at, business_categories(name, name_am)",
    )
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green">
            Yene<span className="text-gold">Spot</span>
            <span className="ml-2 text-sm font-semibold text-muted">
              Admin
            </span>
          </Link>

          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <Link
          href="/admin"
          className="text-sm font-semibold text-green hover:underline"
        >
          &larr; Back to admin dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold tracking-wider text-gold">
            ADMINISTRATION
          </p>

          <h1 className="mt-2 text-3xl font-bold text-navy">
            Business management
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Review business listings, manage their approval status, and verify
            trusted businesses on YeneSpot.
          </p>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
            We could not load business listings. Please refresh and try again.
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total businesses",
                  value: businesses?.length ?? 0,
                },
                {
                  label: "Pending review",
                  value:
                    businesses?.filter((item) => item.status === "pending")
                      .length ?? 0,
                },
                {
                  label: "Approved",
                  value:
                    businesses?.filter((item) => item.status === "approved")
                      .length ?? 0,
                },
                {
                  label: "Verified",
                  value:
                    businesses?.filter((item) => item.verified).length ?? 0,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-gold/20 bg-white p-5"
                >
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-navy">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <BusinessList businesses={businesses ?? []} />
          </>
        )}
      </div>
    </main>
  );
}
