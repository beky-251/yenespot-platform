import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { logout } from "@/app/auth/actions";

export const metadata = {
  title: "Security & Roles | YeneSpot Super Admin",
  description: "Review YeneSpot authentication, access roles, and database security.",
};

export const instant = false;

const roles = [
  { name: "Customer", description: "Discovers businesses, manages favorites, and submits reviews." },
  { name: "Business Owner", description: "Manages their own business information and related content." },
  { name: "Administrator", description: "Handles authorized platform administration and business operations." },
  { name: "Super Administrator", description: "Accesses the super-admin dashboard and privileged administration tools." },
];

const protections = [
  {
    title: "Authentication",
    description: "The application uses Supabase authentication and verifies the current user on the server before protected operations.",
    details: [
      "Unauthenticated users are redirected to the login page.",
      "The server-side authentication layer retrieves the authenticated user.",
    ],
  },
  {
    title: "Role-based route protection",
    description: "The authorization layer checks a user's assigned role before granting access to protected application routes.",
    details: [
      "Protected pages specify which roles are allowed.",
      "Users without an allowed role are redirected to the unauthorized page.",
      "The application recognizes customer, business_owner, admin, and super_admin roles.",
    ],
  },
  {
    title: "Database row-level security",
    description: "Row-level security (RLS) policies restrict which records users can read or modify, based on ownership and authorization.",
    details: [
      "RLS is enabled on the core application tables.",
      "User profiles and role records have ownership and administrator access policies.",
      "Business and related records use ownership and administrator checks.",
      "Review and favorite policies restrict access to permitted records.",
    ],
  },
  {
    title: "Database privileges",
    description: "Table grants and default privileges limit database operations available to anonymous and authenticated users.",
    details: [
      "Anonymous users have read access to selected public business content.",
      "Authenticated users receive table permissions appropriate to application operations.",
      "Notification updates are limited to is_read and read_at.",
      "Default table, sequence, and function privileges are revoked from anon and authenticated roles.",
    ],
  },
];

export default async function SuperAdminSecurityPage() {
  await requireRole(["super_admin"]);

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
          <h1 className="mt-2 text-3xl font-bold text-navy">Security &amp; Roles</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Review application roles, authentication safeguards, database permissions, and access-control implementation.
          </p>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-navy">Application roles</h2>
          <p className="mt-1 text-sm text-muted">The four roles recognized by the application authorization layer.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {roles.map((role) => (
              <article key={role.name} className="rounded-2xl border border-border bg-white p-5">
                <h3 className="font-bold text-navy">{role.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{role.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">Authentication &amp; database protections</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {protections.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-navy">{item.title}</h3>
                  <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green">
                    Implemented
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
                  {item.details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6">
          <h2 className="text-lg font-bold text-navy">Role management safeguards</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            The administrator management workflow includes a database function designed to allow only super administrators to promote customers to administrators or demote administrators to customers. The function rejects other target roles, checks that the target account exists and has exactly one role, and locks the target profile while changing its role.
          </p>
          <div className="mt-4 rounded-xl border border-gold/30 bg-cream p-4">
            <p className="text-sm font-bold text-navy">Production deployment pending</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              The manage_administrator_role database migration exists in the local project but has not been applied to the production Supabase database. Role changes through this workflow therefore depend on an approved database migration deployment.
            </p>
          </div>
          <Link href="/super-admin/admins" className="mt-4 inline-block text-sm font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
            Open Admin Management &rarr;
          </Link>
        </section>

        <section className="mt-8 rounded-2xl border border-gold/30 bg-white p-6">
          <h2 className="text-lg font-bold text-navy">Security monitoring status</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This page documents existing access controls. It does not perform security scans, monitor suspicious activity, change permissions, or configure security settings. A dedicated audit log and security-monitoring implementation has not yet been established here.
          </p>
        </section>
      </div>
    </main>
  );
}