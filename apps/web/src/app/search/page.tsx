import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";

export const instant = false;

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    neighborhood?: string;
  }>;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const language = await getAppLanguage();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const selectedCategory = params.category ?? "";
  const city = params.city?.trim() ?? "";
  const neighborhood = params.neighborhood?.trim() ?? "";

  const supabase = await createClient();

  const [{ data: categories }, { data: businesses, error }] =
    await Promise.all([
      supabase
        .from("business_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      (() => {
        let request = supabase
          .from("businesses")
          .select(
            "id, name, slug, description, city, neighborhood, average_rating, review_count, verified, category_id",
          )
          .eq("status", "approved")
          .order("average_rating", { ascending: false })
          .limit(100);

        if (query) {
          request = request.or(
            `name.ilike.%${query.replace(/[%_,]/g, " ")}%,description.ilike.%${query.replace(/[%_,]/g, " ")}%`,
          );
        }

        if (city) {
          request = request.ilike("city", `%${city}%`);
        }

        if (neighborhood) {
          request = request.ilike(
            "neighborhood",
            `%${neighborhood}%`,
          );
        }

        return request;
      })(),
    ]);

  let filteredBusinesses = businesses ?? [];

  if (selectedCategory) {
    const category = categories?.find(
      (item) => item.slug === selectedCategory,
    );

    filteredBusinesses = category
      ? filteredBusinesses.filter(
          (business) => business.category_id === category.id,
        )
      : [];
  }

  const businessIds = filteredBusinesses.map(
    (business) => business.id,
  );

  const { data: photos } =
    businessIds.length > 0
      ? await supabase
          .from("business_photos")
          .select("business_id, image_url, is_cover, sort_order")
          .in("business_id", businessIds)
          .order("is_cover", { ascending: false })
          .order("sort_order", { ascending: true })
      : { data: [] };

  const coverPhotos = new Map<string, string>();

  for (const photo of photos ?? []) {
    if (!coverPhotos.has(photo.business_id)) {
      coverPhotos.set(photo.business_id, photo.image_url);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <header className="border-b border-[#E8E6DF] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-[#173B35]">
            YeneSpot
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-[#173B35] hover:underline"
          >
            {t(language, "Back to home", "Ã¡â€¹Ë†Ã¡â€¹Â° Ã¡Ë†ËœÃ¡Å ÂÃ¡Ë†Â» Ã¡â€°Â°Ã¡Ë†ËœÃ¡Ë†Ë†Ã¡Ë†Âµ")}
          </Link>
        </div>
      </header>

      <section className="bg-[#173B35] px-5 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#D5A642]">
            {t(language, "Discover local businesses", "Ã¡â€¹Â¨Ã¡Å Â Ã¡Å Â«Ã¡â€°Â£Ã¡â€°Â¢Ã¡â€¹Å½Ã¡Å â€¢ Ã¡Å â€¢Ã¡Å’ÂÃ¡â€¹Â¶Ã¡â€°Â½ Ã¡â€¹Â«Ã¡Å’ÂÃ¡Å â„¢")}
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            {t(language, "Find your next favorite place.", "Ã¡â€°â‚¬Ã¡Å’Â£Ã¡â€¹Â©Ã¡Å â€¢ Ã¡â€°Â°Ã¡â€¹Ë†Ã¡â€¹Â³Ã¡Å’â€¦ Ã¡â€°Â¦Ã¡â€°Â³Ã¡â€¹Å½Ã¡Å â€¢ Ã¡â€¹Â«Ã¡Å’ÂÃ¡Å â„¢Ã¡ÂÂ¢")}
          </h1>

          <p className="mt-3 text-sm text-white/75">
            {t(language, "Explore businesses in Jimma and beyond.", "Ã¡â€°Â Ã¡Å’â€¦Ã¡Ë†â€ºÃ¡Å â€œ Ã¡â€°Â Ã¡Ë†Å’Ã¡Ë†Å½Ã¡â€°Â½ Ã¡Å Â Ã¡Å Â«Ã¡â€°Â£Ã¡â€°Â¢Ã¡â€¹Å½Ã¡â€°Â½ Ã¡â€¹Â«Ã¡Ë†â€° Ã¡Å â€¢Ã¡Å’ÂÃ¡â€¹Â¶Ã¡â€°Â½Ã¡Å â€¢ Ã¡â€¹Â­Ã¡Ë†ËœÃ¡Ë†ÂÃ¡Å Â¨Ã¡â€°Â±Ã¡ÂÂ¢")}
          </p>

          <form
            action="/search"
            method="GET"
            className="mt-8 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2 lg:grid-cols-7"
          >
            <input
              type="search"
              name="q"
              aria-label={t(language, "Business name or keyword", "Ã¡â€¹Â¨Ã¡Å â€¢Ã¡Å’Ã¡â€¹Âµ Ã¡Ë†ÂµÃ¡Ë† Ã¡â€¹Ë†Ã¡â€¹Â­Ã¡Ë† Ã¡â€°Ã¡Ë†Ã¡ Ã¡â€°Æ’Ã¡Ë†")}
              defaultValue={query}
              placeholder={t(language, "Business name or keyword", "Ã¡â€¹Â¨Ã¡Å â€¢Ã¡Å’ÂÃ¡â€¹Âµ Ã¡Ë†ÂµÃ¡Ë†Â Ã¡â€¹Ë†Ã¡â€¹Â­Ã¡Ë†Â Ã¡â€°ÂÃ¡Ë†ÂÃ¡ÂÂ Ã¡â€°Æ’Ã¡Ë†Â")}
              className="min-w-0 rounded-xl border border-[#E8E6DF] px-4 py-3 text-sm text-[#172B3A] outline-none focus:border-[#173B35] focus-visible:ring-2 focus-visible:ring-[#173B35] focus-visible:ring-offset-2 md:col-span-2"
            />

            <select
              name="category"
              aria-label={t(language, "Business category", "Ã¡Ë†Ã¡â€¹ÂµÃ¡â€°Â¥ Ã¡Ë†Ã¡â€¹ÂµÃ¡â€°Â¥")}
              defaultValue={selectedCategory}
              className="min-w-0 w-full rounded-xl border border-[#E8E6DF] px-4 py-3 text-sm text-[#172B3A] outline-none focus-visible:ring-2 focus-visible:ring-[#173B35] focus-visible:ring-offset-2"
            >
              <option value="">{t(language, "All categories", "Ã¡Ë†ÂÃ¡Ë†â€°Ã¡Ë†Â Ã¡Ë†ÂÃ¡â€¹ÂµÃ¡â€°Â¦Ã¡â€°Â½")}</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="city"
              aria-label={t(language, "City", "Ã¡Å Â¨Ã¡â€°Â°Ã¡Ë†â€º")}
              defaultValue={city}
              placeholder={t(language, "City", "Ã¡Å Â¨Ã¡â€°Â°Ã¡Ë†â€º")}
              className="min-w-0 w-full rounded-xl border border-[#E8E6DF] px-4 py-3 text-sm text-[#172B3A] outline-none focus:border-[#173B35] focus-visible:ring-2 focus-visible:ring-[#173B35] focus-visible:ring-offset-2"
            />

            <input
              type="text"
              name="neighborhood"
              aria-label={t(language, "Neighborhood", "Ã¡Ë†Â°Ã¡Ë†Ã¡Ë†Â­")}
              defaultValue={neighborhood}
              placeholder={t(language, "Neighborhood", "Ã¡Ë†Â°Ã¡ÂË†Ã¡Ë†Â­")}
              className="min-w-0 w-full rounded-xl border border-[#E8E6DF] px-4 py-3 text-sm text-[#172B3A] outline-none focus:border-[#173B35] focus-visible:ring-2 focus-visible:ring-[#173B35] focus-visible:ring-offset-2"
            />

            <button
              type="submit"
              className="rounded-xl bg-[#D5A642] px-6 py-3 font-bold text-[#172B3A] transition hover:bg-[#E5BC62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173B35] focus-visible:ring-offset-2"
            >
              {t(language, "Search businesses", "Ã¡Å â€¢Ã¡Å’ÂÃ¡â€¹Â¶Ã¡â€°Â½Ã¡Å â€¢ Ã¡ÂË†Ã¡Ë†ÂÃ¡Å’Â")}
            </button>

            <Link
              href="/search"
              className="flex items-center justify-center rounded-xl border border-[#E8E6DF] px-5 py-3 text-sm font-semibold text-[#173B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173B35] focus-visible:ring-offset-2"
            >
              {t(language, "Clear filters", "Ã¡Ë†â€ºÃ¡Å’Â£Ã¡Ë†ÂªÃ¡â€¹Â«Ã¡â€¹Å½Ã¡â€°Â½Ã¡Å â€¢ Ã¡Å Â Ã¡Å’Â½Ã¡â€¹Â³")}
            </Link>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#172B3A]">
              {query
                ? `${t(language, "Results for", "Ã¡â€¹Â¨Ã¡ÂÂÃ¡Ë†Ë†Ã¡Å’â€¹ Ã¡â€¹ÂÃ¡Å’Â¤Ã¡â€°Â¶Ã¡â€°Â½") } "${query}"`
                : t(language, "Explore businesses", "Ã¡Å â€¢Ã¡Å’ÂÃ¡â€¹Â¶Ã¡â€°Â½Ã¡Å â€¢ Ã¡â€¹Â«Ã¡Ë†ÂµÃ¡Ë†Â±")}
            </h2>

            <p className="mt-2 text-sm text-[#747C80]">
              {filteredBusinesses.length}{" "}
              {t(language, "businesses found", "Ã¡Å â€¢Ã¡Å’ÂÃ¡â€¹Â¶Ã¡â€°Â½ Ã¡â€°Â°Ã¡Å’Ë†Ã¡Å ÂÃ¡â€°Â°Ã¡â€¹â€¹Ã¡Ë†Â")}
            </p>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-[#173B35] hover:underline"
          >
            {t(language, "Explore categories", "Ã¡Ë†ÂÃ¡â€¹ÂµÃ¡â€°Â¦Ã¡â€°Â½Ã¡Å â€¢ Ã¡â€¹Â«Ã¡Ë†ÂµÃ¡Ë†Â±")}
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center text-red-700">
            {t(language, "We could not load businesses. Please try again.", "Ã¡Å â€¢Ã¡Å’ÂÃ¡â€¹Â¶Ã¡â€°Â½Ã¡Å â€¢ Ã¡Ë†ËœÃ¡Å’Â«Ã¡Å â€¢ Ã¡Å Â Ã¡Ë†ÂÃ¡â€°Â°Ã¡â€°Â»Ã¡Ë†Ë†Ã¡Ë†ÂÃ¡ÂÂ¢ Ã¡Å Â¥Ã¡â€°Â£Ã¡Å Â­Ã¡â€¹Å½ Ã¡Å Â¥Ã¡Å â€¢Ã¡â€¹Â°Ã¡Å’Ë†Ã¡Å â€œ Ã¡â€¹Â­Ã¡Ë†Å¾Ã¡Å Â­Ã¡Ë†Â©Ã¡ÂÂ¢")}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D5A642] bg-white px-6 py-16 text-center">
            <h3 className="text-xl font-bold text-[#172B3A]">
              {t(language, "No businesses found", "Ã¡Ë†ÂÃ¡Å â€¢Ã¡Ë†Â Ã¡Å â€¢Ã¡Å’ÂÃ¡â€¹Âµ Ã¡Å Â Ã¡Ë†ÂÃ¡â€°Â°Ã¡Å’Ë†Ã¡Å ËœÃ¡Ë†Â")}
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#747C80]">
              {t(language, "Try another business name, category, city, or neighborhood.", "Ã¡Ë†Å’Ã¡Ë†â€¹ Ã¡â€¹Â¨Ã¡Å â€¢Ã¡Å’ÂÃ¡â€¹Âµ Ã¡Ë†ÂµÃ¡Ë†ÂÃ¡ÂÂ£ Ã¡Ë†ÂÃ¡â€¹ÂµÃ¡â€°Â¥Ã¡ÂÂ£ Ã¡Å Â¨Ã¡â€°Â°Ã¡Ë†â€º Ã¡â€¹Ë†Ã¡â€¹Â­Ã¡Ë†Â Ã¡Ë†Â°Ã¡ÂË†Ã¡Ë†Â­ Ã¡â€¹Â­Ã¡Ë†Å¾Ã¡Å Â­Ã¡Ë†Â©Ã¡ÂÂ¢")}
            </p>

            <Link
              href="/search"
              className="mt-6 inline-block rounded-xl bg-[#173B35] px-6 py-3 text-sm font-bold text-white"
            >
              {t(language, "Clear search", "Ã¡ÂÂÃ¡Ë†Ë†Ã¡Å’â€¹Ã¡â€¹ÂÃ¡Å â€¢ Ã¡Å Â Ã¡Å’Â½Ã¡â€¹Â³")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/business/${business.slug}`}
                className="group overflow-hidden rounded-2xl border border-[#E8E6DF] bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-52 bg-[#E8E6DF]">
                  {coverPhotos.has(business.id) ? (
                    <Image
                      src={coverPhotos.get(business.id)!}
                      alt={business.name}
                      fill
                      unoptimized
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-[#173B35]">
                      Y
                    </div>
                  )}

                  {business.verified && (
                    <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700 shadow">
                      {t(language, "Verified", "Ã¡â€¹Â¨Ã¡â€°Â°Ã¡Ë†Â¨Ã¡Å’â€¹Ã¡Å’Ë†Ã¡Å’Â ")}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#172B3A] group-hover:text-[#173B35]">
                    {business.name}
                  </h3>

                  {business.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#747C80]">
                      {business.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm text-[#747C80]">
                      {business.city}
                      {business.neighborhood
                        ? ` Ã‚Â· ${business.neighborhood}`
                        : ""}
                    </span>

                    <span className="whitespace-nowrap text-sm font-semibold text-[#B98526]">
                      Ã¢Ëœâ€¦ {Number(business.average_rating).toFixed(1)} (
                      {business.review_count})
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}