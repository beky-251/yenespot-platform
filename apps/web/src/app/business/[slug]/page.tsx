import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { getAppLanguage, t } from "@/lib/i18n";
import { addFavorite, removeFavorite } from "../../favorites/actions";
import ReviewSection from "./reviews/review-section";

export const instant = false;

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAYS_AM = [
  "እሁድ",
  "ሰኞ",
  "ማክሰኞ",
  "ረቡዕ",
  "ሐሙስ",
  "ዓርብ",
  "ቅዳሜ",
];

function formatTime(time: string | null) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!business) {
    return {
      title: "Business Not Found",
      robots: { index: false, follow: false },
    };
  }

  const description = (
    business.description ||
    `Discover ${business.name} on YeneSpot, your guide to local businesses in Jimma, Ethiopia.`
  ).replace(/\s+/g, " ").slice(0, 160);

  return {
    title: business.name,
    description,
    openGraph: {
      type: "website",
      title: `${business.name} | YeneSpot`,
      description,
    },
    twitter: {
      card: "summary",
      title: `${business.name} | YeneSpot`,
      description,
    },
  };
}
export default async function PublicBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const language = await getAppLanguage();
  const { slug } = await params;
  const supabase = await createClient();

  const currentUser = await getCurrentUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!business) {
    notFound();
  }

  const [
    { data: photos },
    { data: hours },
    { data: services },
    { data: category },
  ] = await Promise.all([
    supabase
      .from("business_photos")
      .select("*")
      .eq("business_id", business.id)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true }),

    supabase
      .from("business_hours")
      .select("*")
      .eq("business_id", business.id)
      .order("day_of_week", { ascending: true }),

    supabase
      .from("business_services")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),

    business.category_id
      ? supabase
          .from("business_categories")
          .select("name, name_am")
          .eq("id", business.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const { data: existingFavorite } =
    currentUser?.role === "customer"
      ? await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("business_id", business.id)
          .maybeSingle()
      : { data: null };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description || `Discover ${business.name} on YeneSpot in Jimma, Ethiopia.`,
    address: {
      "@type": "PostalAddress",
      ...(business.address ? { streetAddress: business.address } : {}),
      addressLocality: business.city || "Jimma",
      addressCountry: "ET",
    },
    ...(category?.name ? { category: category.name } : {}),
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.email ? { email: business.email } : {}),
    ...(business.website ? { url: business.website } : {}),
    ...(Number(business.review_count) > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(business.average_rating),
        reviewCount: Number(business.review_count),
      },
    } : {}),
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="border-b border-[#E8E6DF] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold text-[#173B35]">
            YeneSpot
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-[#173B35] hover:underline"
          >
            {t(language, "Explore businesses →", "ንግዶችን ያስሱ →")}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <p className="text-sm text-[#747C80]">
            {business.city}
            {business.neighborhood ? ` · ${business.neighborhood}` : ""}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#172B3A] md:text-4xl">
            {business.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {category && (
              <span className="rounded-full bg-[#F3EBD8] px-3 py-1 text-sm font-medium text-[#173B35]">
                {language === "am" && category.name_am
                  ? category.name_am
                  : category.name}
              </span>
            )}

            {business.verified && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                ✓ {t(language, "Verified business", "የተረጋገጠ ንግድ")}
              </span>
            )}

            <span className="text-sm text-[#747C80]">
              ★ {business.average_rating.toFixed(1)} (
              {business.review_count}{" "}
              {t(language, "reviews", "ግምገማዎች")})
            </span>
          </div>

          {/* Customer Favorites */}
          <div className="mt-5">
            {currentUser?.role === "customer" ? (
              existingFavorite ? (
                <form
                  action={async () => {
                    "use server";
                    await removeFavorite(business.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-xl border border-[#173B35] px-5 py-3 text-sm font-bold text-[#173B35] transition hover:bg-[#F3EBD8]"
                  >
                    ♥ {t(language, "Remove from Favorites", "ከተወዳጆች ውስጥ አስወግድ")}
                  </button>
                </form>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await addFavorite(business.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-xl bg-[#173B35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#172B3A]"
                  >
                    ♡ {t(language, "Save to Favorites", "ወደ ተወዳጆች አክል")}
                  </button>
                </form>
              )
            ) : !currentUser ? (
              <Link
                href={`/login?next=${encodeURIComponent(
                  `/business/${business.slug}`,
                )}`}
                className="inline-block rounded-xl border border-[#173B35] px-5 py-3 text-sm font-bold text-[#173B35] transition hover:bg-[#F3EBD8]"
              >
                {t(language, "Sign in to Save Favorites", "ተወዳጆች ውስጥ ለማስቀመጥ ይግቡ")}
              </Link>
            ) : null}
          </div>
        </div>

        {photos && photos.length > 0 ? (
          <section className="grid gap-3 md:grid-cols-2">
            {photos.slice(0, 5).map((photo, index) => (
              <div
                key={photo.id}
                className={`relative overflow-hidden rounded-2xl bg-[#E8E6DF] ${
                  index === 0 ? "h-72 md:row-span-2 md:h-full" : "h-48"
                }`}
              >
                <Image
                  src={photo.image_url}
                  alt={photo.caption || `${business.name} photo`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </section>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-[#E8E6DF] text-[#747C80]">
            {t(language, "Business photos coming soon", "የንግዱ ፎቶዎች በቅርቡ ይጨመራሉ")}
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <section>
              <h2 className="text-xl font-bold text-[#172B3A]">
                {t(language, "About this business", "ስለዚህ ንግድ")}
              </h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-[#747C80]">
                {business.description ||
                  t(language, "Business description coming soon.", "የንግዱ መግለጫ በቅርቡ ይጨመራል።")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#172B3A]">
                {t(language, "Services & Products", "አገልግሎቶች እና ምርቶች")}
              </h2>

              {services && services.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <article
                      key={service.id}
                      className="rounded-xl border border-[#E8E6DF] bg-white p-5"
                    >
                      <h3 className="font-bold text-[#172B3A]">
                        {service.name}
                      </h3>

                      {service.description && (
                        <p className="mt-2 text-sm leading-6 text-[#747C80]">
                          {service.description}
                        </p>
                      )}

                      <p className="mt-3 font-semibold text-[#173B35]">
                        {service.price === null
                          ? t(language, "Price on request", "ዋጋውን ይጠይቁ")
                          : `${service.price.toLocaleString(
                              language === "am" ? "am-ET" : "en-ET",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )} ${service.currency}`}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#747C80]">
                  {t(language, "No services currently listed.", "በአሁኑ ጊዜ ምንም አገልግሎቶች አልተዘረዘሩም።")}
                </p>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#172B3A]">
                {t(language, "Opening Hours", "የስራ ሰዓታት")}
              </h2>

              <div className="mt-4 overflow-hidden rounded-xl border border-[#E8E6DF] bg-white">
                {DAYS.map((day, index) => {
                  const schedule = hours?.find(
                    (item) => item.day_of_week === index,
                  );

                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between border-b border-[#E8E6DF] px-5 py-4 last:border-b-0"
                    >
                      <span className="font-medium text-[#292D32]">
                        {language === "am" ? DAYS_AM[index] : day}
                      </span>

                      <span className="text-sm text-[#747C80]">
                        {!schedule
                          ? t(language, "Hours not provided", "የስራ ሰዓት አልተገለጸም")
                          : schedule.is_closed
                            ? t(language, "Closed", "ዝግ ነው")
                            : `${formatTime(schedule.opens_at)} – ${formatTime(schedule.closes_at)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <ReviewSection
              businessId={business.id}
              businessOwnerId={business.owner_id}
              slug={business.slug}
            />
          </div>

          <aside className="h-fit rounded-2xl border border-[#E8E6DF] bg-white p-6">
            <h2 className="text-xl font-bold text-[#172B3A]">
              {t(language, "Contact & Location", "አድራሻ እና አካባቢ")}
            </h2>

            {business.address && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase text-[#747C80]">
                  {t(language, "Address", "አድራሻ")}
                </p>
                <p className="mt-1 text-sm text-[#292D32]">
                  {business.address}
                </p>
              </div>
            )}

            {business.phone && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase text-[#747C80]">
                  {t(language, "Phone", "ስልክ")}
                </p>
                <a
                  href={`tel:${business.phone}`}
                  className="mt-1 block text-sm font-semibold text-[#173B35]"
                >
                  {business.phone}
                </a>
              </div>
            )}

            {business.email && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase text-[#747C80]">
                  {t(language, "Email", "ኢሜይል")}
                </p>
                <a
                  href={`mailto:${business.email}`}
                  className="mt-1 block break-all text-sm font-semibold text-[#173B35]"
                >
                  {business.email}
                </a>
              </div>
            )}

            {business.website && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase text-[#747C80]">
                  {t(language, "Website", "ድረ-ገጽ")}
                </p>
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-sm font-semibold text-[#173B35]"
                >
                  {t(language, "Visit website →", "ድረ-ገጹን ይጎብኙ →")}
                </a>
              </div>
            )}

            <div className="mt-5 border-t border-[#E8E6DF] pt-5">
              <p className="text-sm text-[#747C80]">
                {business.city}
                {business.neighborhood ? ` · ${business.neighborhood}` : ""}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
