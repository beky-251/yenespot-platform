import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import { removeFavorite } from "./actions";

export const metadata = {
  title: "My Favorites | YeneSpot",
};

export const instant = false;

export default async function FavoritesPage() {
  const language = await getAppLanguage();
  const user = await requireRole(["customer"]);
  const supabase = await createClient();

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("id, business_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load your favorites.");
  }

  const businessIds = (favorites ?? []).map(
    (favorite) => favorite.business_id,
  );

  const { data: businesses } = businessIds.length
    ? await supabase
        .from("businesses")
        .select(
          "id, name, slug, city, neighborhood, description, average_rating, review_count, verified",
        )
        .in("id", businessIds)
        .eq("status", "approved")
    : { data: [] };

  const savedBusinesses = (businesses ?? []).map((business) => ({
    ...business,
    favoriteId: favorites?.find(
      (favorite) => favorite.business_id === business.id,
    )?.id,
  }));

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-green">
            Yene<span className="text-gold">Spot</span>
          </Link>

          <Link
            href="/profile"
            className="text-sm font-semibold text-green hover:text-gold"
          >
            {t(language, "My Profile", "መገለጫዬ")}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-gold">
            {t(language, "YOUR COLLECTION", "የእርስዎ ስብስብ")}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
            {t(language, "My Favorites", "የምወዳቸው")}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            {t(language, "All the local businesses you have saved in one place.", "ያስቀመጧቸውን የአካባቢ ንግዶች በአንድ ቦታ ይመልከቱ።")}
          </p>
        </div>

        {savedBusinesses.length === 0 ? (
          <section className="rounded-2xl border border-border bg-white px-6 py-16 text-center">
            <div className="text-5xl">♡</div>

            <h2 className="mt-5 text-xl font-bold text-navy">
              {t(language, "No favorites yet", "እስካሁን የተወደዱ ንግዶች የሉም")}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
              {t(language, "Explore YeneSpot and save businesses you would love to visit. They will appear here.", "YeneSpotን ያስሱ እና መጎብኘት የሚፈልጉዋቸውን ንግዶች ያስቀምጡ። እዚህ ይታያሉ።")}
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-green px-6 py-3 text-sm font-bold text-white transition hover:bg-navy"
            >
              {t(language, "Explore Businesses", "ንግዶችን ያስሱ")}
            </Link>
          </section>
        ) : (
          <>
            <p className="mb-5 text-sm font-medium text-muted">
              {savedBusinesses.length}{" "}
              {savedBusinesses.length === 1
                ? t(language, "saved business", "የተቀመጠ ንግድ")
                : t(language, "saved businesses", "የተቀመጡ ንግዶች")}
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {savedBusinesses.map((business) => (
                <article
                  key={business.id}
                  className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-navy">
                        {business.name}
                      </h2>

                      <p className="mt-1 text-sm text-muted">
                        {business.city}
                        {business.neighborhood
                          ? ` · ${business.neighborhood}`
                          : ""}
                      </p>
                    </div>

                    {business.verified && (
                      <span className="shrink-0 rounded-full bg-green/10 px-3 py-1 text-xs font-bold text-green">
                        {t(language, "Verified", "የተረጋገጠ")}
                      </span>
                    )}
                  </div>

                  {business.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
                      {business.description}
                    </p>
                  )}

                  <p className="mt-4 text-sm font-semibold text-gold">
                    ★ {Number(business.average_rating).toFixed(1)}
                    <span className="ml-2 font-normal text-muted">
                      ({business.review_count} {t(language, "reviews", "ግምገማዎች")})
                    </span>
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <Link
                      href={`/business/${business.slug}`}
                      className="rounded-xl bg-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-navy"
                    >
                      {t(language, "View Business", "ንግዱን ይመልከቱ")}
                    </Link>

                    {business.favoriteId && (
                      <form
                        action={async () => {
                          "use server";
                          await removeFavorite(business.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-sm font-semibold text-red-600 hover:text-red-800"
                        >
                          {t(language, "Remove", "አስወግድ")}
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}