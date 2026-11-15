import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import ProfileForm from "./profile-form";
import PhotoGallery from "./photo-gallery";

export const metadata = {
  title: "Business Profile | YeneSpot",
  description: "Update your business information on YeneSpot.",
};

export const instant = false;

export default async function BusinessProfilePage() {
  const language = await getAppLanguage();
  const user = await requireRole(["business_owner"]);
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: photos } = business
    ? await supabase
        .from("business_photos")
        .select("*")
        .eq("business_id", business.id)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green">
            Yene<span className="text-gold">Spot</span>
          </Link>

          <Link
            href="/business/dashboard"
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy"
          >
            {t(language, "Back to dashboard", "ወደ ዳሽቦርድ ተመለስ")}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <section className="rounded-2xl bg-green p-8 text-white sm:p-10">
          <p className="text-sm font-medium text-white/70">
            {t(language, "BUSINESS MANAGEMENT", "የንግድ አስተዳደር")}
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            {t(language, "Business Profile", "የንግድ መገለጫ")}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
            {t(
              language,
              "Keep your business information accurate so customers can learn more about your business.",
              "ደንበኞች ስለ ንግድዎ ተጨማሪ መረጃ እንዲያገኙ የንግድዎን መረጃ ትክክለኛ እና ወቅታዊ ያድርጉ።",
            )}
          </p>
        </section>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
            {t(
              language,
              "We could not load your business profile. Please try again.",
              "የንግድ መገለጫዎን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
            )}
          </div>
        ) : business ? (
          <>
            <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
              <div className="border-b border-border pb-5">
                <h2 className="text-xl font-bold text-navy">
                  {t(language, "Edit business information", "የንግድ መረጃን ያርትዑ")}
                </h2>

                <p className="mt-2 text-sm text-muted">
                  {t(
                    language,
                    "Fields marked with * are required.",
                    "* ምልክት ያላቸው መስኮች መሞላት አለባቸው።",
                  )}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  <span className="rounded-full bg-gold/10 px-3 py-2 font-semibold capitalize text-gold">
                    {t(language, "Listing:", "ዝርዝር:")}{" "}
                    {t(
                      language,
                      business.status,
                      business.status === "pending"
                        ? "በመጠባበቅ ላይ"
                        : business.status === "approved"
                          ? "ጸድቋል"
                          : business.status === "rejected"
                            ? "ውድቅ ተደርጓል"
                            : business.status === "suspended"
                              ? "ታግዷል"
                              : business.status,
                    )}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-2 font-semibold text-gray-600">
                    {business.verified
                      ? t(language, "Verified", "የተረጋገጠ")
                      : t(language, "Not verified", "ያልተረጋገጠ")}
                  </span>
                </div>
              </div>

              <ProfileForm business={business} />
            </section>

            <PhotoGallery businessId={business.id} photos={photos ?? []} />
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-white p-8 text-center">
            <h2 className="text-lg font-bold text-navy">
              {t(language, "No business found", "ምንም ንግድ አልተገኘም")}
            </h2>

            <p className="mt-2 text-sm text-muted">
              {t(
                language,
                "There is no business listing associated with your account yet.",
                "እስካሁን ከመለያዎ ጋር የተያያዘ የንግድ ዝርዝር የለም።",
              )}
            </p>
          </div>
        )}

        <footer className="mt-12 border-t border-border py-6 text-center text-sm text-muted">
          © 2026 YeneSpot.{" "}
          {t(
            language,
            "Empowering local businesses.",
            "የአካባቢ ንግዶችን ማበረታታት።",
          )}
        </footer>
      </div>
    </main>
  );
}