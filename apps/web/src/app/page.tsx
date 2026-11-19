import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HomeHeaderControls from "./components/home-header-controls";

const categories = [
  {
    name: "Coffee Shops", nameAm: "á‹¨á‰¡áŠ“ á‰¤á‰¶á‰½",
    slug: "coffee-shops",
    icon: "â˜•",
    description: "Coffee and buna", descriptionAm: "á‰¡áŠ“ áŠ¥áŠ“ á‰¡áŠ“ áˆ¥áŠ áˆ¥áˆ­á‹“á‰µ",
  },
  {
    name: "Restaurants", nameAm: "áˆáŒá‰¥ á‰¤á‰¶á‰½",
    slug: "restaurants",
    icon: "ðŸ½ï¸",
    description: "Great places to eat", descriptionAm: "áŒ¥áˆ© áˆáŒá‰¥ á‹¨áˆšá‹«áŒˆáŠ™á‰£á‰¸á‹ á‰¦á‰³á‹Žá‰½",
  },
  {
    name: "Hotels", nameAm: "áˆ†á‰´áˆŽá‰½",
    slug: "hotels",
    icon: "ðŸ¨",
    description: "Places to stay", descriptionAm: "á‹¨áˆšá‰†á‹©á‰£á‰¸á‹ á‰¦á‰³á‹Žá‰½",
  },
  {
    name: "Bakeries", nameAm: "á‹³á‰¦ á‰¤á‰¶á‰½",
    slug: "bakeries",
    icon: "ðŸ¥",
    description: "Freshly baked", descriptionAm: "á‰µáŠ©áˆµ á‹¨á‰°áŒ‹áŒˆáˆ© áˆáŒá‰¦á‰½",
  },
  {
    name: "Shopping", nameAm: "áŒá‰¥á‹­á‰µ",
    slug: "shopping",
    icon: "ðŸ›ï¸",
    description: "Explore local shops", descriptionAm: "áŠ áŠ«á‰£á‰¢á‹«á‹Š áˆ±á‰†á‰½áŠ• á‹«áˆµáˆ±",
  },
  {
    name: "Beauty & Wellness", nameAm: "á‹á‰ á‰µ áŠ¥áŠ“ áŒ¤áŠ“",
    slug: "beauty-wellness",
    icon: "âœ¨",
    description: "Beauty and wellness services", descriptionAm: "á‹¨á‹á‰ á‰µ áŠ¥áŠ“ á‹¨áŒ¤áŠ“ áŠ áŒˆáˆáŒáˆŽá‰¶á‰½",
  },
];

const benefits = [
  {
    number: "01",
    title: "Search locally", titleAm: "á‰ áŠ áŠ«á‰£á‰¢á‹Ž á‹­áˆáˆáŒ‰",
    description:
      "Find businesses by name, category and location without wasting time.", descriptionAm: "áŒŠá‹œ áˆ³á‹«á‰£áŠ­áŠ‘ áŠ•áŒá‹¶á‰½áŠ• á‰ áˆµáˆá£ á‰ áˆá‹µá‰¥ áŠ¥áŠ“ á‰ áŠ áŠ«á‰£á‰¢ á‹­áˆáˆáŒ‰á¢",
    icon: "âŒ•",
  },
  {
    number: "02",
    title: "Discover more", titleAm: "á‰°áŒ¨áˆ›áˆª á‹«áŒáŠ™",
    description:
      "Explore local places, compare options and find something new.", descriptionAm: "áŠ áŠ«á‰£á‰¢á‹«á‹Š á‰¦á‰³á‹Žá‰½áŠ• á‹«áˆµáˆ±á£ áŠ áˆ›áˆ«áŒ®á‰½áŠ• á‹«á‹ˆá‹³á‹µáˆ© áŠ¥áŠ“ áŠ á‹²áˆµ áŠáŒˆáˆ­ á‹«áŒáŠ™á¢",
    icon: "âœ¦",
  },
  {
    number: "03",
    title: "Choose confidently", titleAm: "á‰ áŠ¥áˆ­áŒáŒ áŠáŠá‰µ á‹­áˆáˆ¨áŒ¡",
    description:
      "Business information and customer reviews will help you make decisions.", descriptionAm: "á‹¨áŠ•áŒá‹µ áˆ˜áˆ¨áŒƒá‹Žá‰½ áŠ¥áŠ“ á‹¨á‹°áŠ•á‰ áŠžá‰½ áŒáˆáŒˆáˆ›á‹Žá‰½ á‹áˆ³áŠ” áŠ¥áŠ•á‹²á‹«á‹°áˆ­áŒ‰ á‹­áˆ¨á‹±á‹Žá‰³áˆá¢",
    icon: "âœ“",
  },
];

export const instant = false;

async function HomeContent() {
  await connection();
  const cookieStore = await (await import("next/headers")).cookies();
  const language = cookieStore.get("yenespot_app_language")?.value === "am" ? "am" : "en";
  const t = (english: string, amharic: string) => language === "am" ? amharic : english;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
          <Link href="/" className="flex items-center">
            <Image
              src="/brand/yenespot-horizontal-dark.svg"
              alt="YeneSpot - Discover Your Place"
              width={240}
              height={72}
              priority
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-charcoal lg:flex">
            <a href="#categories" className="transition hover:text-green">
              {t("Explore", "á‹«áˆµáˆ±")}
            </a>

            <a href="#featured" className="transition hover:text-green">
              {t("Featured", "á‰°áˆˆá‹­á‰°á‹ á‹¨á‰€áˆ¨á‰¡")}
            </a>

            <a href="#how-it-works" className="transition hover:text-green">
              {t("How it works", "áŠ¥áŠ•á‹´á‰µ áŠ¥áŠ•á‹°áˆšáˆ°áˆ«")}
            </a>
          </nav>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <span className="hidden items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm font-medium text-charcoal lg:flex">
              <span>ðŸ“</span>
              Jimma, Ethiopia
            </span>

            <a
              href="#business"
              className="whitespace-nowrap rounded-lg bg-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy sm:px-5 sm:py-3 sm:text-sm"
            >
              {t("For businesses", "áˆˆáŠ•áŒá‹¶á‰½")}
            </a>
            <HomeHeaderControls initialLanguage={language} isLoggedIn={Boolean(user)} />
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
              {t("YOUR CITY. YOUR DISCOVERIES.", "áŠ¨á‰°áˆ›á‹Žá¢ áŒáŠá‰¶á‰½á‹Žá¢")}
            </div>

            <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.12] tracking-tight text-navy sm:text-6xl lg:text-7xl">
              {t("Discover the", "á‹«áŒáŠ™")}
              <span className="block text-green">{t("best around", "á‰ áŠ áŠ«á‰£á‰¢á‹Ž á‹«áˆ‰ áˆáˆ­áŒ¥ á‰¦á‰³á‹Žá‰½")}</span>
              <span className="relative inline-block">
                {t("you.", "áŠ¥áˆ­áˆµá‹Ž áŠ áŒ áŒˆá‰¥á¢")}
                <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-gold/70" />
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-muted">
              {t("Your guide to local businesses in Jimma. Find coffee shops, restaurants, hotels and the places that make your city special.", "á‰ áŒ…áˆ› á‹¨áˆšáŒˆáŠ™ áŠ áŠ«á‰£á‰¢á‹«á‹Š áŠ•áŒá‹¶á‰½áŠ• á‹¨áˆšá‹«áˆµá‰°á‹‹á‹á‰…á‹Ž áˆ˜áˆ˜áˆªá‹«á¢ á‹¨á‰¡áŠ“ á‰¤á‰¶á‰½áŠ•á£ áˆáŒá‰¥ á‰¤á‰¶á‰½áŠ•á£ áˆ†á‰´áˆŽá‰½áŠ• áŠ¥áŠ“ áŠ¨á‰°áˆ›á‹ŽáŠ• áˆá‹© á‹¨áˆšá‹«á‹°áˆ­áŒ‰ á‰¦á‰³á‹Žá‰½áŠ• á‹«áŒáŠ™á¢")}

            </p>

            {/* Search */}
            <form
              action="/search"
              method="GET"
              className="mt-10 flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-xl shadow-navy/5 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <span className="text-2xl text-muted" aria-hidden="true">
                  âŒ•
                </span>

                <input
                  type="search"
                  name="q"
                  placeholder={t("Search businesses, places...", "áŠ•áŒá‹¶á‰½áŠ•á£ á‰¦á‰³á‹Žá‰½áŠ• á‹­áˆáˆáŒ‰...")}
                  aria-label={t("Search businesses", "áŠ•áŒá‹¶á‰½áŠ• á‹­áˆáˆáŒ‰")}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-navy outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-green px-8 py-4 font-semibold text-white transition hover:bg-navy"
              >
                {t("Search businesses", "áŠ•áŒá‹¶á‰½áŠ• á‹­áˆáˆáŒ‰")}
              </button>
            </form>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2">
                <span className="text-gold">âœ“</span>
                {t("Discover local places", "áŠ áŠ«á‰£á‰¢á‹«á‹Š á‰¦á‰³á‹Žá‰½áŠ• á‹«áŒáŠ™")}
              </span>

              <span className="flex items-center gap-2">
                <span className="text-gold">âœ“</span>
                {t("Explore by category", "á‰ áˆá‹µá‰¥ á‹«áˆµáˆ±")}
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
                    {t("EXPLORE YOUR CITY", "áŠ¨á‰°áˆ›á‹ŽáŠ• á‹«áˆµáˆ±")}
                  </span>

                  <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
                    YENESPOT
                  </span>
                </div>

                <h2 className="mt-14 max-w-xs text-4xl font-bold leading-tight text-white sm:text-5xl">
                  {t("Your next", "á‹¨áˆšá‰€áŒ¥áˆˆá‹")}
                  <span className="block text-gold">{t("favorite place", "á‰°á‹ˆá‹³áŒ… á‰¦á‰³á‹Ž")}</span>
                  {t("is closer.", "á‰ á‰…áˆ­á‰¥á‹Ž á‹­áŒˆáŠ›áˆá¢")}
                </h2>

                <p className="mt-5 max-w-xs leading-7 text-white/70">
                  {t("Discover the people, places and businesses that make Jimma unique.", "áŒ…áˆ›áŠ• áˆá‹© á‹¨áˆšá‹«á‹°áˆ­áŒ‰á‰µáŠ• áˆ°á‹Žá‰½á£ á‰¦á‰³á‹Žá‰½ áŠ¥áŠ“ áŠ•áŒá‹¶á‰½ á‹«áŒáŠ™á¢")}

                </p>

                <div className="mt-12 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4">
                    <span className="text-3xl">â˜•</span>
                    <p className="mt-3 font-bold text-navy">{t("Coffee & buna", "á‰¡áŠ“ áŠ¥áŠ“ á‰¡áŠ“ áˆ¥áŠ áˆ¥áˆ­á‹“á‰µ")}</p>
                    <p className="mt-1 text-xs text-muted">{t("Find your spot", "á‹¨áˆšá‹ˆá‹±á‰µáŠ• á‰¦á‰³ á‹«áŒáŠ™")}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <span className="text-3xl">ðŸ½ï¸</span>
                    <p className="mt-3 font-bold text-navy">{t("Restaurants", "áˆáŒá‰¥ á‰¤á‰¶á‰½")}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t("Discover flavors", "áŒ£á‹•áˆžá‰½áŠ• á‹«áŒáŠ™")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -right-4 rounded-2xl border border-border bg-white px-5 py-4 shadow-xl sm:-right-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-xl">
                    ðŸ“
                  </span>

                  <div>
                    <p className="text-xs text-muted">{t("Starting in", "á‹¨áˆšáŠáˆ³ á‰¦á‰³")}</p>
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
                {t("Explore categories", "áˆá‹µá‰¦á‰½áŠ• á‹«áˆµáˆ±")}
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                {t("What are you looking for?", "áˆáŠ• áŠ¥á‹¨áˆáˆˆáŒ‰ áŠá‹?")}
              </h2>

              <p className="mt-3 max-w-xl leading-7 text-muted">
                From your morning coffee to your next weekend stay, {t("discover local places in one spot.", "áŠ¨áŒ á‹‹á‰µ á‰¡áŠ“á‹Ž áŠ¥áˆµáŠ¨ á‹¨áˆ³áˆáŠ•á‰µ áˆ˜áŒ¨áˆ¨áˆ» á‰†á‹­á‰³á‹Ž á‹µáˆ¨áˆµ á‹«áˆ‰ áŠ áŠ«á‰£á‰¢á‹«á‹Š á‰¦á‰³á‹Žá‰½áŠ• á‰ áŠ áŠ•á‹µ á‰¦á‰³ á‹«áŒáŠ™á¢")}
              </p>
            </div>

            <span className="text-sm font-semibold text-green">
              {t("10 business categories", "10 á‹¨áŠ•áŒá‹µ áˆá‹µá‰¦á‰½")}
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
              {t("Local discoveries", "áŠ áŠ«á‰£á‰¢á‹«á‹Š áŒáŠá‰¶á‰½")}
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              {t("Featured businesses", "á‰°áˆˆá‹­á‰°á‹ á‹¨á‰€áˆ¨á‰¡ áŠ•áŒá‹¶á‰½")}
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted">
              {t("Discover places worth visiting in your city.", "á‰ áŠ¨á‰°áˆ›á‹Ž á‹áˆµáŒ¥ áˆŠáŒŽá‰ áŠ™ á‹¨áˆšáŒˆá‰¡ á‰¦á‰³á‹Žá‰½áŠ• á‹«áŒáŠ™á¢")}
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
                            {t("âœ“ Verified", "âœ“ á‹¨á‰°áˆ¨áŒ‹áŒˆáŒ ")}
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
                            ðŸ“{" "}
                            {[business.neighborhood, business.city]
                              .filter(Boolean)
                              .join(", ")}
                          </span>

                          <span className="whitespace-nowrap text-sm font-semibold text-gold">
                            â˜…{" "}
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
                  ðŸª
                </span>

                <h3 className="mt-5 text-xl font-bold text-navy">
                  {t("Local businesses are coming soon", "áŠ áŠ«á‰£á‰¢á‹«á‹Š áŠ•áŒá‹¶á‰½ á‰ á‰…áˆ­á‰¡ á‹­á‰€áˆ­á‰£áˆ‰")}
                </h3>

                <p className="mx-auto mt-3 max-w-lg leading-7 text-muted">
                  {t("Approved business listings will appear here when they are available.", "á‹¨á‰°áˆá‰€á‹± á‹¨áŠ•áŒá‹µ á‹áˆ­á‹áˆ®á‰½ áˆ²á‹˜áŒ‹áŒ áŠ¥á‹šáˆ… á‹­á‰³á‹«áˆ‰á¢")}
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
              {t("Simple discovery", "á‰€áˆ‹áˆ ááˆˆáŒ‹")}
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              {t("Find your place in three steps", "á‰ áˆ¶áˆµá‰µ á‹°áˆ¨áŒƒá‹Žá‰½ á‰¦á‰³á‹ŽáŠ• á‹«áŒáŠ™")}
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
                {t("For local businesses", "áˆˆáŠ áŠ«á‰£á‰¢á‹«á‹Š áŠ•áŒá‹¶á‰½")}
              </p>

              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                {t("Help more people discover your business.", "á‰¥á‹™ áˆ°á‹Žá‰½ áŠ•áŒá‹µá‹ŽáŠ• áŠ¥áŠ•á‹²á‹«á‹á‰ á‹«áŒá‹™á¢")}
              </h2>

              <p className="mt-5 max-w-lg leading-7 text-white/70">
                {t("YeneSpot is being built to connect local businesses with customers searching for places and services in their city.", "YeneSpot á‰ áŠ¨á‰°áˆ›á‰¸á‹ á‹áˆµáŒ¥ á‰¦á‰³á‹Žá‰½áŠ•áŠ“ áŠ áŒˆáˆáŒáˆŽá‰¶á‰½áŠ• áŠ¨áˆšáˆáˆáŒ‰ á‹°áŠ•á‰ áŠžá‰½ áŒ‹áˆ­ áŠ áŠ«á‰£á‰¢á‹«á‹Š áŠ•áŒá‹¶á‰½áŠ• áˆˆáˆ›áŒˆáŠ“áŠ˜á‰µ áŠ¥á‹¨á‰°á‹˜áŒ‹áŒ€ áŠá‹á¢")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
              <span className="text-4xl">ðŸŒ±</span>

              <h3 className="mt-4 text-xl font-bold text-white">
                {t("Growing together, starting in Jimma.", "áŠ¨áŒ…áˆ› áŒ€áˆáˆ¨áŠ• áŠ á‰¥áˆ¨áŠ• áŠ¥áŠ“á‹µáŒá¢")}
              </h3>

              <p className="mt-3 leading-7 text-white/70">
                {t("Our business registration and owner dashboard will be introduced as the platform develops.", "áˆ˜á‹µáˆ¨áŠ© áŠ¥á‹«á‹°áŒˆ áˆ²áˆ„á‹µ á‹¨áŠ•áŒá‹µ áˆá‹áŒˆá‰£áŠ“ á‹¨á‰£áˆˆá‰¤á‰¶á‰½ á‹³áˆ½á‰¦áˆ­á‹µ á‹­á‰€áˆ­á‰£áˆ‰á¢")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Image
              src="/brand/yenespot-horizontal-dark.svg"
              alt="YeneSpot - Discover Your Place"
              width={200}
              height={60}
              className="h-8 w-auto"
            />

            <p className="mt-2 text-sm text-muted">
              {t("Discover local. Support local.", "áŠ áŠ«á‰£á‰¢á‹«á‹Šá‹áŠ• á‹«áŒáŠ™á¢ áŠ áŠ«á‰£á‰¢á‹«á‹Šá‹áŠ• á‹­á‹°áŒá‰á¢")}
            </p>
          </div>

          <p className="text-sm text-muted">
            {t("Â© YeneSpot. All rights reserved.", "Â© YeneSpotá¢ áˆ˜á‰¥á‰± á‰ áˆ•áŒ á‹¨á‰°áŒ á‰ á‰€ áŠá‹á¢")}
          </p>

          <p className="text-sm font-medium text-green">
            {t("Made for Ethiopia ðŸ‡ªðŸ‡¹", "áˆˆáŠ¢á‰µá‹®áŒµá‹« á‹¨á‰°áˆ°áˆ« ðŸ‡ªðŸ‡¹")}
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
