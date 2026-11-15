import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { logout } from "@/app/auth/actions";

export const metadata = {
  title: "Subscriptions & Payments | YeneSpot Super Admin",
  description: "Review subscription and payment configuration.",
};

export const instant = false;

const items = [
  {
    title: "Subscription Plans",
    status: "Not configured",
    description: "Subscription tiers, pricing, billing periods, and plan limits have not been configured.",
  },
  {
    title: "Payment Provider",
    status: "Not connected",
    description: "No payment provider integration has been configured.",
  },
  {
    title: "Transactions",
    status: "Not available",
    description: "Transaction records will appear here after secure payment processing is implemented.",
  },
  {
    title: "Payment History",
    status: "Awaiting integration",
    description: "Payment history and downloadable transaction reports are not available yet.",
  },
];

export default async function SuperAdminSubscriptionsPage() {
  await requireRole(["super_admin"]);

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green">
            Yene<span className="text-gold">Spot</span>
            <span className="ml-2 text-sm font-semibold text-muted">
              Super Admin
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
          href="/super-admin"
          className="text-sm font-semibold text-green hover:underline"
        >
          &larr; Back to super-admin dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold tracking-wider text-gold">
            SUPER ADMINISTRATION
          </p>
          <h1 className="mt-2 text-3xl font-bold text-navy">
            Subscriptions & Payments
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Review subscription plans, payment integration, and transaction
            management. Payment processing has not yet been configured.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <section
              key={item.title}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold text-navy">{item.title}</h2>
                <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                {item.description}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-gold/30 bg-white p-6">
          <h2 className="text-lg font-bold text-navy">Implementation status</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            The application does not currently have an identified subscription
            or payment database implementation. Before accepting payments, we
            must define subscription plans, choose a supported payment provider,
            and implement verified server-side payment processing.
          </p>
        </section>
      </div>
    </main>
  );
}