import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import ResponseForm from "./response-form";

export const instant = false;

export default async function BusinessReviewsPage() {
  const language = await getAppLanguage();
  const user = await requireRole(["business_owner"]);
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug, status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const businessList = businesses ?? [];
  const businessIds = businessList.map((business) => business.id);

  if (businessIds.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href="/business/dashboard"
          className="text-sm font-medium text-[#173B35] hover:underline"
        >
          {t(language, "Back to dashboard", "ወደ ዳሽቦርድ ተመለስ")}
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-[#173B35]">
          {t(language, "Customer Reviews", "የደንበኞች ግምገማዎች")}
        </h1>

        <p className="mt-4 text-gray-600">
          {t(language, "You do not have a business listing yet.", "እስካሁን የንግድ ዝርዝር የለዎትም።")}
        </p>
      </main>
    );
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, business_id, user_id, rating, comment, created_at")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  const reviewList = reviews ?? [];
  const reviewIds = reviewList.map((review) => review.id);
  let profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[] = [];

  let responses: {
    id: string;
    review_id: string;
    response: string;
  }[] = [];

  if (businessIds.length > 0) {
    const reviewerResults = await Promise.all(
      businessIds.map((businessId) =>
        supabase.rpc("get_public_reviewers", {
          p_business_id: businessId,
        }),
      ),
    );

    profiles = reviewerResults.flatMap(({ data }) => data ?? []);
  }

  if (reviewIds.length > 0) {
    const { data } = await supabase
      .from("review_responses")
      .select("id, review_id, response")
      .in("review_id", reviewIds);

    responses = data ?? [];
  }

  const businessMap = new Map(
    businessList.map((business) => [business.id, business]),
  );

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const responseMap = new Map(
    responses.map((response) => [response.review_id, response]),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/business/dashboard"
        className="text-sm font-medium text-[#173B35] hover:underline"
      >
        {t(language, "Back to dashboard", "ወደ ዳሽቦርድ ተመለስ")}
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold text-[#173B35]">
          {t(language, "Customer Reviews", "የደንበኞች ግምገማዎች")}
        </h1>

        <p className="mt-2 text-gray-600">
          {t(
            language,
            "Read customer feedback and respond publicly to reviews of your businesses.",
            "የደንበኞችን አስተያየት ያንብቡ እና ስለ ንግድዎ ለተሰጡ ግምገማዎች በይፋ ምላሽ ይስጡ።",
          )}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            {t(language, "Your businesses", "የእርስዎ ንግዶች")}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#173B35]">
            {businessList.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            {t(language, "Total reviews", "ጠቅላላ ግምገማዎች")}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#173B35]">
            {reviewList.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            {t(language, "Responses published", "የታተሙ ምላሾች")}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#173B35]">
            {responses.length}
          </p>
        </div>
      </div>

      <section className="mt-8 space-y-6">
        {reviewList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-[#173B35]">
              {t(language, "No reviews yet", "እስካሁን ግምገማዎች የሉም")}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {t(
                language,
                "Customer reviews will appear here when people share their experiences.",
                "ደንበኞች ተሞክሯቸውን ሲያጋሩ ግምገማዎቻቸው እዚህ ይታያሉ።",
              )}
            </p>
          </div>
        ) : (
          reviewList.map((review) => {
            const business = businessMap.get(review.business_id);
            const profile = profileMap.get(review.user_id);
            const response = responseMap.get(review.id);

            return (
              <article
                key={review.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#173B35]">
                      {business?.name ?? t(language, "Your business", "የእርስዎ ንግድ")}
                    </h2>

                    {business && (
                      <Link
                        href={`/business/${business.slug}`}
                        className="mt-1 inline-block text-sm text-[#B98526] hover:underline"
                      >
                        {t(language, "View public listing", "የህዝብ ዝርዝሩን ይመልከቱ")}
                      </Link>
                    )}
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                    {business?.status ?? "unknown"}
                  </span>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[#292D32]">
                      {profile?.full_name || t(language, "YeneSpot customer", "የYeneSpot ደንበኛ")}
                    </p>

                    <time
                      dateTime={review.created_at}
                      className="text-xs text-gray-500"
                    >
                      {new Date(review.created_at).toLocaleDateString(
                        language === "am" ? "am-ET" : "en-ET",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </time>
                  </div>

                  <p
                    className="mt-2 text-lg tracking-wide text-[#D5A642]"
                    aria-label={`${review.rating} ${t(language, "out of 5 stars", "ከ5 ኮከቦች")}`}
                  >
                    {"\u2605".repeat(review.rating)}
                    {"\u2606".repeat(5 - review.rating)}
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {review.comment ||
                      t(
                        language,
                        "The customer left a rating without a comment.",
                        "ደንበኛው አስተያየት ሳይጽፍ ደረጃ ሰጥቷል።",
                      )}
                  </p>

                  {business && (
                    <ResponseForm
                      businessId={business.id}
                      reviewId={review.id}
                      existingResponse={
                        response
                          ? {
                              id: response.id,
                              response: response.response,
                            }
                          : null
                      }
                    />
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}