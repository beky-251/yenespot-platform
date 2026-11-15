import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import { logout } from "@/app/auth/actions";
import ApplicationForm from "./application-form";

export const metadata = {
  title: "Apply as a Business Owner | YeneSpot",
  description: "Register your business on YeneSpot.",
};

export const instant = false;

export default async function BusinessApplicationPage() {
  const language = await getAppLanguage();
  const user = await requireRole(["customer"]);
  const supabase = await createClient();

  const [{ data: categories, error: categoryError }, { data: applications }] =
    await Promise.all([
      supabase
        .from("business_categories")
        .select("id, name, name_am")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("business_owner_applications")
        .select(
          "id, business_name, status, rejection_reason, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  const application = applications?.[0] ?? null;

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green">
            Yene<span className="text-gold">Spot</span>
          </Link>

          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy">
              {t(language, "Sign out", "ውጣ")}
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
        <Link
          href="/profile"
          className="text-sm font-semibold text-green hover:underline"
        >
          {t(language, "← Back to customer dashboard", "← ወደ ደንበኛ ዳሽቦርድ ተመለስ")}
        </Link>

        <section className="mt-6 rounded-2xl bg-green p-8 text-white sm:p-10">
          <p className="text-sm font-semibold tracking-wider text-white/70">
            {t(language, "GROW YOUR BUSINESS WITH YENESPOT", "ንግድዎን በYENESPOT ያሳድጉ")}
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {t(language, "Become a YeneSpot business owner", "የYeneSpot ንግድ ባለቤት ይሁኑ")}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            {t(language, "Bring your business online, help local customers discover you, and grow your visibility in Jimma and beyond.", "ንግድዎን በመስመር ላይ ያቅርቡ፣ የአካባቢ ደንበኞች እንዲያገኙዎት ያግዙ እና በጅማና ከዚያም በላይ የንግድዎን ታይነት ያሳድጉ።")}
          </p>
        </section>

        {application?.status === "pending" ? (
          <section className="mt-8 rounded-2xl border border-gold/30 bg-white p-7">
            <div className="inline-flex rounded-full bg-gold/10 px-4 py-2 text-xs font-bold text-gold">
              {t(language, "APPLICATION UNDER REVIEW", "ማመልከቻው በግምገማ ላይ ነው")}
            </div>

            <h2 className="mt-5 text-2xl font-bold text-navy">
              {application.business_name}
            </h2>

            <p className="mt-3 text-sm leading-7 text-muted">
              {t(language, "Your application has been received successfully. Our administration team will review your information.", "ማመልከቻዎ በተሳካ ሁኔታ ደርሶናል። የአስተዳደር ቡድናችን መረጃዎን ይገመግማል።")}
            </p>

            <p className="mt-5 text-sm text-muted">
              {t(language, "Submitted:", "የቀረበበት ቀን:")}{" "}
              {new Date(application.created_at).toLocaleDateString("en-ET")}
            </p>
          </section>
        ) : (
          <>
            {application?.status === "rejected" && (
              <section className="mt-8 rounded-2xl border border-red-200 bg-white p-7">
                <div className="inline-flex rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700">
                  {t(language, "PREVIOUS APPLICATION REJECTED", "የቀድሞው ማመልከቻ ውድቅ ተደርጓል")}
                </div>

                <h2 className="mt-4 text-xl font-bold text-navy">
                  {application.business_name}
                </h2>

                <p className="mt-3 text-sm leading-7 text-muted">
                  {t(language, "You can review the feedback below and submit a new application with updated information.", "ከታች ያለውን አስተያየት ተመልክተው በተዘመነ መረጃ አዲስ ማመልከቻ ማቅረብ ይችላሉ።")}
                </p>

                {application.rejection_reason && (
                  <div className="mt-4 rounded-xl bg-red-50 p-4">
                    <p className="text-xs font-bold text-red-700">
                      {t(language, "ADMINISTRATOR FEEDBACK", "የአስተዳዳሪ አስተያየት")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-red-800">
                      {application.rejection_reason}
                    </p>
                  </div>
                )}
              </section>
            )}

            <section className="mt-8">
              {categoryError ? (
                <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
                  {t(language, "We could not load business categories. Please refresh the page and try again.", "የንግድ ምድቦችን መጫን አልተቻለም። እባክዎ ገጹን አድስተው እንደገና ይሞክሩ።")}
                </div>
              ) : categories && categories.length > 0 ? (
                <ApplicationForm categories={categories} />
              ) : (
                <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted">
                  {t(language, "No active business categories are currently available. Please contact the YeneSpot team.", "በአሁኑ ጊዜ ንቁ የንግድ ምድቦች የሉም። እባክዎ የYeneSpot ቡድንን ያነጋግሩ።")}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-12 border-t border-border py-6 text-center text-sm text-muted">
          © YeneSpot. {t(language, "Empowering local businesses.", "የአካባቢ ንግዶችን ማበረታታት።")}
        </footer>
      </div>
    </main>
  );
}