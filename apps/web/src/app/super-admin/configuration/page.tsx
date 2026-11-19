import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { logout } from "@/app/auth/actions";

export const metadata = {
  title: "Platform Configuration | YeneSpot Super Admin",
  description: "Review YeneSpot platform policies and configuration status.",
};

export const instant = false;

const sections = [
  {
    title: "Language & Localization",
    status: "Supported",
    description:
      "YeneSpot currently supports English and Amharic. Language selection is stored as an individual user's preference; it is not a global platform setting.",
    details: ["English (en)", "Amharic (am)"],
  },
  {
    title: "Business Approval Policies",
    status: "Implemented",
    description:
      "Business owner applications are reviewed through the existing administration workflow. Authorized administrators can approve or reject applications.",
    details: [
      "Approval and rejection require an authorized administrator.",
      "Application decisions are handled by secured server-side actions.",
    ],
  },
  {
    title: "Review Policies",
    status: "Implemented",
    description:
      "Customers can submit one review per approved business they do not own. Reviews use a rating from 1 to 5.",
    details: [
      "Customers can update or delete their own reviews.",
      "Review visibility follows the database access policies.",
      "Database policies permit administrators to update or delete reviews; a dedicated admin moderation interface is not currently identified.",
    ],
  },
];

export default async function SuperAdminConfigurationPage() {
  await requireRole(["super_admin"]);

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
            Platform Configuration
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Review the platform&apos;s existing policies, supported languages, and
            configuration status.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold text-navy">{section.title}</h2>
                <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green">
                  {section.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                {section.description}
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
                {section.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
              {section.title === "Business Approval Policies" && (
                <Link
                  href="/admin/business-applications"
                  className="mt-4 inline-block text-sm font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                >
                  Open business applications &rarr;
                </Link>
              )}
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-gold/30 bg-white p-6">
          <h2 className="text-lg font-bold text-navy">
            Global settings status
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            No persisted global platform settings system has been identified
            in the current application. This page is informational and does
            not change platform settings. Editable global controls will require
            a separate design, authorization rules, and an approved database
            implementation.
          </p>
        </section>
      </div>
    </main>
  );
}
