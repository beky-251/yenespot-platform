import Link from "next/link";

export const metadata = {
  title: "Access Denied | YeneSpot",
};

export const instant = false;

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="text-5xl font-bold text-gold">403</div>

        <h1 className="mt-5 text-2xl font-bold text-navy">
          Access Denied
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted">
          You do not have permission to access this page.
          Please sign in with an account that has the required access.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-xl bg-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          >
            Back to Homepage
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-navy transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          >
            Sign In
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted">
          Â©YeneSpot
        </p>
      </section>
    </main>
  );
}