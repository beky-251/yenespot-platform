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
            {t(language, "Back to home", "ወደ መነሻ ተመለስ")}
          </Link>
        </div>
      </header>

      <section className="bg-[#173B35] px-5 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#D5A642]">
            {t(language, "Discover local businesses", "የአካባቢዎን ንግዶች ያግኙ")}
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            {t(language, "Find your next favorite place.", "ቀጣዩን ተወዳጅ ቦታዎን ያግኙ።")}
          </h1>

          <p className="mt-3 text-sm text-white/75">
            {t(language, "Explore businesses in Jimma and beyond.", "በጅማና በሌሎች አካባቢዎች ያሉ ንግዶችን ይመልከቱ።")}
          </p>

          <form
            action="/search"
            method="GET"
            className="mt-8 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2 lg:grid-cols-7"
          >
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t(language, "Business name or keyword", "የንግድ ስም ወይም ቁልፍ ቃል")}
              className="min-w-0 rounded-xl border border-[#E8E6DF] px-4 py-3 text-sm text-[#172B3A] outline-none focus:border-[#173B35] md:col-span-2"
            />

            <select
              name="category"
              defaultValue={selectedCategory}
              className="min-w-0 w-full rounded-xl border border-[#E8E6DF] px-4 py-3 text-sm text-[#172B3A] outline-none"
            >
              <option value="">{t(language, "All categories", "ሁሉም ምድቦች")}</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="city"
              defaultValue={city}
              placeholder={t(language, "City", "ከተማ")}
              className="min-w-0 w-full rounded-xl border border-[#E8E6DF] px-4 py-3 text-sm text-[#172B3A] outline-none focus:border-[#173B35]"
            />

            <input
              type="text"
              name="neighborhood"
              defaultValue={neighborhood}
              placeholder={t(language, "Neighborhood", "ሰፈር")}
              className="min-w-0 w-full rounded-xl border border-[#E8E6DF] px-4 py-3 text-sm text-[#172B3A] outline-none focus:border-[#173B35]"
            />

            <button
              type="submit"
              className="rounded-xl bg-[#D5A642] px-6 py-3 font-bold text-[#172B3A] transition hover:bg-[#E5BC62]"
            >
              {t(language, "Search businesses", "ንግዶችን ፈልግ")}
            </button>

            <Link
              href="/search"
              className="flex items-center justify-center rounded-xl border border-[#E8E6DF] px-5 py-3 text-sm font-semibold text-[#173B35]"
            >
              {t(language, "Clear filters", "ማጣሪያዎችን አጽዳ")}
            </Link>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#172B3A]">
              {query
                ? `${t(language, "Results for", "የፍለጋ ውጤቶች") } "${query}"`
                : t(language, "Explore businesses", "ንግዶችን ያስሱ")}
            </h2>

            <p className="mt-2 text-sm text-[#747C80]">
              {filteredBusinesses.length}{" "}
              {t(language, "businesses found", "ንግዶች ተገኝተዋል")}
            </p>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-[#173B35] hover:underline"
          >
            {t(language, "Explore categories", "ምድቦችን ያስሱ")}
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center text-red-700">
            {t(language, "We could not load businesses. Please try again.", "ንግዶችን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።")}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D5A642] bg-white px-6 py-16 text-center">
            <h3 className="text-xl font-bold text-[#172B3A]">
              {t(language, "No businesses found", "ምንም ንግድ አልተገኘም")}
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#747C80]">
              {t(language, "Try another business name, category, city, or neighborhood.", "ሌላ የንግድ ስም፣ ምድብ፣ ከተማ ወይም ሰፈር ይሞክሩ።")}
            </p>

            <Link
              href="/search"
              className="mt-6 inline-block rounded-xl bg-[#173B35] px-6 py-3 text-sm font-bold text-white"
            >
              {t(language, "Clear search", "ፍለጋውን አጽዳ")}
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
                      {t(language, "Verified", "የተረጋገጠ")}
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
                        ? ` · ${business.neighborhood}`
                        : ""}
                    </span>

                    <span className="whitespace-nowrap text-sm font-semibold text-[#B98526]">
                      ★ {Number(business.average_rating).toFixed(1)} (
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