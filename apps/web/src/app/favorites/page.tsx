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
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
            Yene<span className="text-gold">Spot</span>
          </Link>

          <Link
            href="/profile"
            className="text-sm font-semibold text-green hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          >
            {t(language, "My Profile", "áˆ˜áŒˆáˆˆáŒ«á‹¬")}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-gold">
            {t(language, "YOUR COLLECTION", "á‹¨áŠ¥áˆ­áˆµá‹Ž áˆµá‰¥áˆµá‰¥")}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">
            {t(language, "My Favorites", "á‹¨áˆá‹ˆá‹³á‰¸á‹")}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            {t(language, "All the local businesses you have saved in one place.", "á‹«áˆµá‰€áˆ˜áŒ§á‰¸á‹áŠ• á‹¨áŠ áŠ«á‰£á‰¢ áŠ•áŒá‹¶á‰½ á‰ áŠ áŠ•á‹µ á‰¦á‰³ á‹­áˆ˜áˆáŠ¨á‰±á¢")}
          </p>
        </div>

        {savedBusinesses.length === 0 ? (
          <section className="rounded-2xl border border-border bg-white px-6 py-16 text-center">
            <div className="text-5xl">â™¡</div>

            <h2 className="mt-5 text-xl font-bold text-navy">
              {t(language, "No favorites yet", "áŠ¥áˆµáŠ«áˆáŠ• á‹¨á‰°á‹ˆá‹°á‹± áŠ•áŒá‹¶á‰½ á‹¨áˆ‰áˆ")}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
              {t(language, "Explore YeneSpot and save businesses you would love to visit. They will appear here.", "YeneSpotáŠ• á‹«áˆµáˆ± áŠ¥áŠ“ áˆ˜áŒŽá‰¥áŠ˜á‰µ á‹¨áˆšáˆáˆáŒ‰á‹‹á‰¸á‹áŠ• áŠ•áŒá‹¶á‰½ á‹«áˆµá‰€áˆáŒ¡á¢ áŠ¥á‹šáˆ… á‹­á‰³á‹«áˆ‰á¢")}
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-green px-6 py-3 text-sm font-bold text-white transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            >
              {t(language, "Explore Businesses", "áŠ•áŒá‹¶á‰½áŠ• á‹«áˆµáˆ±")}
            </Link>
          </section>
        ) : (
          <>
            <p className="mb-5 text-sm font-medium text-muted">
              {savedBusinesses.length}{" "}
              {savedBusinesses.length === 1
                ? t(language, "saved business", "á‹¨á‰°á‰€áˆ˜áŒ  áŠ•áŒá‹µ")
                : t(language, "saved businesses", "á‹¨á‰°á‰€áˆ˜áŒ¡ áŠ•áŒá‹¶á‰½")}
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
                          ? ` Â· ${business.neighborhood}`
                          : ""}
                      </p>
                    </div>

                    {business.verified && (
                      <span className="shrink-0 rounded-full bg-green/10 px-3 py-1 text-xs font-bold text-green">
                        {t(language, "Verified", "á‹¨á‰°áˆ¨áŒ‹áŒˆáŒ ")}
                      </span>
                    )}
                  </div>

                  {business.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
                      {business.description}
                    </p>
                  )}

                  <p className="mt-4 text-sm font-semibold text-gold">
                    â˜… {Number(business.average_rating).toFixed(1)}
                    <span className="ml-2 font-normal text-muted">
                      ({business.review_count} {t(language, "reviews", "áŒáˆáŒˆáˆ›á‹Žá‰½")})
                    </span>
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <Link
                      href={`/business/${business.slug}`}
                      className="rounded-xl bg-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                    >
                      {t(language, "View Business", "áŠ•áŒá‹±áŠ• á‹­áˆ˜áˆáŠ¨á‰±")}
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
                          className="text-sm font-semibold text-red-600 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                        >
                          {t(language, "Remove", "áŠ áˆµá‹ˆáŒá‹µ")}
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