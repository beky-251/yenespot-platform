import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HomeHeaderControls from "./components/home-header-controls";

const categories = [
  {
    name: "Coffee Shops", nameAm: "የቡና ቤቶች",
    slug: "coffee-shops",
    icon: "☕",
    description: "Coffee and buna", descriptionAm: "ቡና እና ቡና ሥነ ሥርዓት",
  },
  {
    name: "Restaurants", nameAm: "ምግብ ቤቶች",
    slug: "restaurants",
    icon: "🍽️",
    description: "Great places to eat", descriptionAm: "ጥሩ ምግብ የሚያገኙባቸው ቦታዎች",
  },
  {
    name: "Hotels", nameAm: "ሆቴሎች",
    slug: "hotels",
    icon: "🏨",
    description: "Places to stay", descriptionAm: "የሚቆዩባቸው ቦታዎች",
  },
  {
    name: "Bakeries", nameAm: "ዳቦ ቤቶች",
    slug: "bakeries",
    icon: "🥐",
    description: "Freshly baked", descriptionAm: "ትኩስ የተጋገሩ ምግቦች",
  },
  {
    name: "Shopping", nameAm: "ግብይት",
    slug: "shopping",
    icon: "🛍️",
    description: "Explore local shops", descriptionAm: "አካባቢያዊ ሱቆችን ያስሱ",
  },
  {
    name: "Beauty & Wellness", nameAm: "ውበት እና ጤና",
    slug: "beauty-wellness",
    icon: "✨",
    description: "Beauty and wellness services", descriptionAm: "የውበት እና የጤና አገልግሎቶች",
  },
];

const benefits = [
  {
    number: "01",
    title: "Search locally", titleAm: "በአካባቢዎ ይፈልጉ",
    description:
      "Find businesses by name, category and location without wasting time.", descriptionAm: "ጊዜ ሳያባክኑ ንግዶችን በስም፣ በምድብ እና በአካባቢ ይፈልጉ።",
    icon: "⌕",
  },
  {
    number: "02",
    title: "Discover more", titleAm: "ተጨማሪ ያግኙ",
    description:
      "Explore local places, compare options and find something new.", descriptionAm: "አካባቢያዊ ቦታዎችን ያስሱ፣ አማራጮችን ያወዳድሩ እና አዲስ ነገር ያግኙ።",
    icon: "✦",
  },
  {
    number: "03",
    title: "Choose confidently", titleAm: "በእርግጠኝነት ይምረጡ",
    description:
      "Business information and customer reviews will help you make decisions.", descriptionAm: "የንግድ መረጃዎች እና የደንበኞች ግምገማዎች ውሳኔ እንዲያደርጉ ይረዱዎታል።",
    icon: "✓",
  },
];

export const instant = false;

async function HomeContent() {
  await connection();
  const cookieStore = await (await import("next/headers")).cookies();
  const language = cookieStore.get("yenespot_app_language")?.value === "am" ? "am" : "en";
  const t = (english: string, amharic: string) => language === "am" ? amharic : english;
  const supabase = await createClient();

  // Load approved businesses for the homepage.
  const { data: featuredBusinesses } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, description, city, neighborhood, average_rating, review_count, verified",
    )
    .eq("status", "approved")
    .order("average_rating", { ascending: false })
    .limit(6);

  // Load photos belonging to the featured businesses.
  const businessIds = (featuredBusinesses ?? []).map(
    (business) => business.id,
  );

  const { data: businessPhotos } =
    businessIds.length > 0
      ? await supabase
          .from("business_photos")
          .select("business_id, image_url, is_cover, sort_order")
          .in("business_id", businessIds)
          .order("is_cover", { ascending: false })
          .order("sort_order", { ascending: true })
      : { data: [] };

  // Select one preferred photo for each business.
  const coverPhotos = new Map<string, string>();

  for (const photo of businessPhotos ?? []) {
    if (!coverPhotos.has(photo.business_id)) {
      coverPhotos.set(photo.business_id, photo.image_url);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-cream">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green text-xl font-bold text-white">
              Y
            </span>

            <span className="text-2xl font-extrabold tracking-tight text-navy">
              Yene<span className="text-green">Spot</span>
              <span className="ml-1 text-gold">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-charcoal lg:flex">
            <a href="#categories" className="transition hover:text-green">
              {t("Explore", "ያስሱ")}
            </a>

            <a href="#featured" className="transition hover:text-green">
              {t("Featured", "ተለይተው የቀረቡ")}
            </a>

            <a href="#how-it-works" className="transition hover:text-green">
              {t("How it works", "እንዴት እንደሚሰራ")}
            </a>
          </nav>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <span className="hidden items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm font-medium text-charcoal lg:flex">
              <span>📍</span>
              Jimma, Ethiopia
            </span>

            <a
              href="#business"
              className="whitespace-nowrap rounded-lg bg-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy sm:px-5 sm:py-3 sm:text-sm"
            >
              {t("For businesses", "ለንግዶች")}
            </a>
            <HomeHeaderControls initialLanguage={language} />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute -right-40 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-green/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 md:grid-cols-2 md:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-green/10 bg-white px-4 py-2 text-sm font-semibold text-green shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gold" />
              {t("YOUR CITY. YOUR DISCOVERIES.", "ከተማዎ። ግኝቶችዎ።")}
            </div>

            <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.12] tracking-tight text-navy sm:text-6xl lg:text-7xl">
              {t("Discover the", "ያግኙ")}
              <span className="block text-green">{t("best around", "በአካባቢዎ ያሉ ምርጥ ቦታዎች")}</span>
              <span className="relative inline-block">
                {t("you.", "እርስዎ አጠገብ።")}
                <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-gold/70" />
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-muted">
              {t("Your guide to local businesses in Jimma. Find coffee shops, restaurants, hotels and the places that make your city special.", "በጅማ የሚገኙ አካባቢያዊ ንግዶችን የሚያስተዋውቅዎ መመሪያ። የቡና ቤቶችን፣ ምግብ ቤቶችን፣ ሆቴሎችን እና ከተማዎን ልዩ የሚያደርጉ ቦታዎችን ያግኙ።")}

            </p>

            {/* Search */}
            <form
              action="/search"
              method="GET"
              className="mt-10 flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-xl shadow-navy/5 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <span className="text-2xl text-muted" aria-hidden="true">
                  ⌕
                </span>

                <input
                  type="search"
                  name="q"
                  placeholder={t("Search businesses, places...", "ንግዶችን፣ ቦታዎችን ይፈልጉ...")}
                  aria-label={t("Search businesses", "ንግዶችን ይፈልጉ")}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-navy outline-none placeholder:text-muted"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-green px-8 py-4 font-semibold text-white transition hover:bg-navy"
              >
                {t("Search businesses", "ንግዶችን ይፈልጉ")}
              </button>
            </form>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2">
                <span className="text-gold">✓</span>
                {t("Discover local places", "አካባቢያዊ ቦታዎችን ያግኙ")}
              </span>

              <span className="flex items-center gap-2">
                <span className="text-gold">✓</span>
                {t("Explore by category", "በምድብ ያስሱ")}
              </span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="relative rounded-[2rem] bg-green p-6 shadow-2xl shadow-green/20 sm:p-9">
              <div className="absolute right-7 top-7 h-28 w-28 rounded-full border border-white/10" />
              <div className="absolute right-12 top-12 h-16 w-16 rounded-full border border-white/10" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold tracking-widest text-white/70">
                    {t("EXPLORE YOUR CITY", "ከተማዎን ያስሱ")}
                  </span>

                  <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
                    YENESPOT
                  </span>
                </div>

                <h2 className="mt-14 max-w-xs text-4xl font-bold leading-tight text-white sm:text-5xl">
                  {t("Your next", "የሚቀጥለው")}
                  <span className="block text-gold">{t("favorite place", "ተወዳጅ ቦታዎ")}</span>
                  {t("is closer.", "በቅርብዎ ይገኛል።")}
                </h2>

                <p className="mt-5 max-w-xs leading-7 text-white/70">
                  {t("Discover the people, places and businesses that make Jimma unique.", "ጅማን ልዩ የሚያደርጉትን ሰዎች፣ ቦታዎች እና ንግዶች ያግኙ።")}

                </p>

                <div className="mt-12 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4">
                    <span className="text-3xl">☕</span>
                    <p className="mt-3 font-bold text-navy">{t("Coffee & buna", "ቡና እና ቡና ሥነ ሥርዓት")}</p>
                    <p className="mt-1 text-xs text-muted">{t("Find your spot", "የሚወዱትን ቦታ ያግኙ")}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <span className="text-3xl">🍽️</span>
                    <p className="mt-3 font-bold text-navy">{t("Restaurants", "ምግብ ቤቶች")}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t("Discover flavors", "ጣዕሞችን ያግኙ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -right-4 rounded-2xl border border-border bg-white px-5 py-4 shadow-xl sm:-right-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-xl">
                    📍
                  </span>

                  <div>
                    <p className="text-xs text-muted">{t("Starting in", "የሚነሳ ቦታ")}</p>
                    <p className="font-bold text-navy">Jimma, Ethiopia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-6 -top-7 -z-10 h-full w-full rounded-[2rem] border-2 border-gold/40" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-green">
                {t("Explore categories", "ምድቦችን ያስሱ")}
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                {t("What are you looking for?", "ምን እየፈለጉ ነው?")}
              </h2>

              <p className="mt-3 max-w-xl leading-7 text-muted">
                From your morning coffee to your next weekend stay, {t("discover local places in one spot.", "ከጠዋት ቡናዎ እስከ የሳምንት መጨረሻ ቆይታዎ ድረስ ያሉ አካባቢያዊ ቦታዎችን በአንድ ቦታ ያግኙ።")}
              </p>
            </div>

            <span className="text-sm font-semibold text-green">
              {t("10 business categories", "10 የንግድ ምድቦች")}
            </span>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/search?category=${category.slug}`}
                className="group rounded-2xl border border-border bg-cream p-5 transition duration-200 hover:-translate-y-1 hover:border-green/30 hover:bg-white hover:shadow-lg"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm transition group-hover:bg-green/5">
                  {category.icon}
                </span>

                <h3 className="mt-5 font-bold text-navy">
                  {language === "am" ? category.nameAm : category.name}
                </h3>

                <p className="mt-1 text-xs leading-5 text-muted">
                  {language === "am" ? category.descriptionAm : category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured businesses */}
      <section id="featured" className="py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-green">
              {t("Local discoveries", "አካባቢያዊ ግኝቶች")}
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              {t("Featured businesses", "ተለይተው የቀረቡ ንግዶች")}
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted">
              {t("Discover places worth visiting in your city.", "በከተማዎ ውስጥ ሊጎበኙ የሚገቡ ቦታዎችን ያግኙ።")}
            </p>
          </div>

          <div className="mt-10">
            {featuredBusinesses && featuredBusinesses.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredBusinesses.map((business) => {
                  const coverPhoto = coverPhotos.get(business.id);

                  return (
                    <Link
                      key={business.id}
                      href={`/business/${business.slug}`}
                      className="group overflow-hidden rounded-2xl border border-border bg-white transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative h-52 bg-cream">
                        {coverPhoto ? (
                          <Image
                            src={coverPhoto}
                            alt={business.name}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl font-bold text-green">
                            Y
                          </div>
                        )}

                        {business.verified && (
                          <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-green shadow">
                            {t("✓ Verified", "✓ የተረጋገጠ")}
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-xl font-bold text-navy transition group-hover:text-green">
                          {business.name}
                        </h3>

                        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted">
                          {business.description ||
                            "Discover this local business on YeneSpot."}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-sm text-muted">
                            📍{" "}
                            {[business.neighborhood, business.city]
                              .filter(Boolean)
                              .join(", ")}
                          </span>

                          <span className="whitespace-nowrap text-sm font-semibold text-gold">
                            ★{" "}
                            {Number(
                              business.average_rating ?? 0,
                            ).toFixed(1)}

                            <span className="ml-1 font-normal text-muted">
                              ({business.review_count ?? 0})
                            </span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-green/30 bg-white px-6 py-14 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cream text-3xl">
                  🏪
                </span>

                <h3 className="mt-5 text-xl font-bold text-navy">
                  {t("Local businesses are coming soon", "አካባቢያዊ ንግዶች በቅርቡ ይቀርባሉ")}
                </h3>

                <p className="mx-auto mt-3 max-w-lg leading-7 text-muted">
                  {t("Approved business listings will appear here when they are available.", "የተፈቀዱ የንግድ ዝርዝሮች ሲዘጋጁ እዚህ ይታያሉ።")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-green">
              {t("Simple discovery", "ቀላል ፍለጋ")}
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              {t("Find your place in three steps", "በሶስት ደረጃዎች ቦታዎን ያግኙ")}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.number}
                className="rounded-2xl border border-border bg-cream p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold tracking-widest text-gold">
                    {benefit.number}
                  </span>

                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green text-2xl text-white">
                    {benefit.icon}
                  </span>
                </div>

                <h3 className="mt-7 text-xl font-bold text-navy">
                  {language === "am" ? benefit.titleAm : benefit.title}
                </h3>

                <p className="mt-3 leading-7 text-muted">
                  {language === "am" ? benefit.descriptionAm : benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Business call to action */}
      <section id="business" className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-navy px-7 py-12 sm:px-14 sm:py-16">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold">
                {t("For local businesses", "ለአካባቢያዊ ንግዶች")}
              </p>

              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                {t("Help more people discover your business.", "ብዙ ሰዎች ንግድዎን እንዲያውቁ ያግዙ።")}
              </h2>

              <p className="mt-5 max-w-lg leading-7 text-white/70">
                {t("YeneSpot is being built to connect local businesses with customers searching for places and services in their city.", "YeneSpot በከተማቸው ውስጥ ቦታዎችንና አገልግሎቶችን ከሚፈልጉ ደንበኞች ጋር አካባቢያዊ ንግዶችን ለማገናኘት እየተዘጋጀ ነው።")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
              <span className="text-4xl">🌱</span>

              <h3 className="mt-4 text-xl font-bold text-white">
                {t("Growing together, starting in Jimma.", "ከጅማ ጀምረን አብረን እናድግ።")}
              </h3>

              <p className="mt-3 leading-7 text-white/70">
                {t("Our business registration and owner dashboard will be introduced as the platform develops.", "መድረኩ እያደገ ሲሄድ የንግድ ምዝገባና የባለቤቶች ዳሽቦርድ ይቀርባሉ።")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-extrabold tracking-tight text-navy">
              Yene<span className="text-green">Spot</span>
              <span className="text-gold">.</span>
            </p>

            <p className="mt-2 text-sm text-muted">
              {t("Discover local. Support local.", "አካባቢያዊውን ያግኙ። አካባቢያዊውን ይደግፉ።")}
            </p>
          </div>

          <p className="text-sm text-muted">
            {t("© YeneSpot. All rights reserved.", "© YeneSpot። መብቱ በሕግ የተጠበቀ ነው።")}
          </p>

          <p className="text-sm font-medium text-green">
            {t("Made for Ethiopia 🇪🇹", "ለኢትዮጵያ የተሰራ 🇪🇹")}
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
