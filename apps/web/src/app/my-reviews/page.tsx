import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import ReviewForm from "@/app/business/[slug]/reviews/review-form";

export const metadata = {
  title: "My Reviews | YeneSpot",
  description: "Manage your reviews and see business-owner replies.",
};

export const instant = false;

export default async function MyReviewsPage() {
  const language = await getAppLanguage();
  const user = await requireRole(["customer"]);
  const supabase = await createClient();

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const reviewList = reviews ?? [];

  const businessIds = [
    ...new Set(reviewList.map((review) => review.business_id)),
  ];

  const reviewIds = reviewList.map((review) => review.id);

  const [{ data: businesses }, { data: responses }] = await Promise.all([
    businessIds.length > 0
      ? supabase
          .from("businesses")
          .select("id, name, slug")
          .in("id", businessIds)
      : Promise.resolve({ data: [] }),

    reviewIds.length > 0
      ? supabase
          .from("review_responses")
          .select("id, review_id, response, updated_at")
          .in("review_id", reviewIds)
      : Promise.resolve({ data: [] }),
  ]);

  const businessMap = new Map(
    (businesses ?? []).map((business) => [business.id, business]),
  );

  const responseMap = new Map(
    (responses ?? []).map((response) => [response.review_id, response]),
  );

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <Link
          href="/profile"
          className="text-sm font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
        >
          {t(language, "â† Back to profile", "â† á‹ˆá‹° áˆ˜áŒˆáˆˆáŒ« á‰°áˆ˜áˆˆáˆµ")}
        </Link>

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-navy">
            {t(language, "My Reviews", "áŒáˆáŒˆáˆ›á‹Žá‰¼")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t(language, "Manage your reviews and read responses from businesses.", "áŒáˆáŒˆáˆ›á‹Žá‰½á‹ŽáŠ• á‹«áˆµá‰°á‹³á‹µáˆ© áŠ¥áŠ“ áŠ¨áŠ•áŒá‹¶á‰½ á‹¨á‰°áˆ°áŒ¡ áˆáˆ‹áˆ¾á‰½áŠ• á‹«áŠ•á‰¥á‰¡á¢")}
          </p>
        </div>

        {error ? (
          <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
            {t(language, "We could not load your reviews. Please refresh and try again.", "áŒáˆáŒˆáˆ›á‹Žá‰½á‹ŽáŠ• áˆ˜áŒ«áŠ• áŠ áˆá‰°á‰»áˆˆáˆá¢ áŠ¥á‰£áŠ­á‹Ž áŒˆáŒ¹áŠ• áŠ á‹µáˆµá‰°á‹ áŠ¥áŠ•á‹°áŒˆáŠ“ á‹­áˆžáŠ­áˆ©á¢")}
          </div>
        ) : reviewList.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-navy">
              {t(language, "You have not written any reviews yet.", "áŠ¥áˆµáŠ«áˆáŠ• áˆáŠ•áˆ áŒáˆáŒˆáˆ› áŠ áˆáŒ»á‰áˆá¢")}
            </h2>

            <p className="mt-2 text-sm text-muted">
              {t(language, "Visit a business and share your experience with the YeneSpot community.", "áŠ•áŒá‹µáŠ• á‹­áŒŽá‰¥áŠ™ áŠ¥áŠ“ áˆáˆá‹µá‹ŽáŠ• áŠ¨YeneSpot áˆ›áˆ…á‰ áˆ¨áˆ°á‰¥ áŒ‹áˆ­ á‹«áŒ‹áˆ©á¢")}
            </p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-green px-5 py-3 text-sm font-semibold text-white hover:bg-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            >
              {t(language, "Explore businesses", "áŠ•áŒá‹¶á‰½áŠ• á‹«áˆµáˆ±")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <p className="text-sm font-semibold text-muted">
              {reviewList.length}{" "}
              {reviewList.length === 1
                ? t(language, "review submitted", "áŒáˆáŒˆáˆ› á‰€áˆ­á‰§áˆ")
                : t(language, "reviews submitted", "áŒáˆáŒˆáˆ›á‹Žá‰½ á‰€áˆ­á‰ á‹‹áˆ")}
            </p>

            {reviewList.map((review) => {
              const business = businessMap.get(review.business_id);
              const response = responseMap.get(review.id);

              return (
                <article
                  key={review.id}
                  className="rounded-2xl border border-border bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-navy">
                        {business?.name ?? t(language, "Business", "áŠ•áŒá‹µ")}
                      </h2>

                      {business && (
                        <Link
                          href={`/business/${business.slug}`}
                          className="mt-1 inline-block text-sm font-semibold text-green hover:underline"
                        >
                          {t(language, "View business â†’", "áŠ•áŒá‹±áŠ• á‹­áˆ˜áˆáŠ¨á‰± â†’")}
                        </Link>
                      )}

                      <p className="mt-2 text-xs text-muted">
                        {t(language, "Submitted", "á‹¨á‰€áˆ¨á‰ á‰ á‰µ á‰€áŠ•")}{" "}
                        {new Date(review.created_at).toLocaleDateString(
                          "en-ET",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    <span
                      className="text-xl tracking-wide text-gold"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {"â˜…".repeat(review.rating)}
                      {"â˜†".repeat(5 - review.rating)}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
                      {review.comment}
                    </p>
                  )}

                  {response && (
                    <div className="mt-5 rounded-xl bg-cream p-5">
                      <h3 className="font-bold text-green">
                        {t(language, "Business owner response", "á‹¨áŠ•áŒá‹µ á‰£áˆˆá‰¤á‰± áˆáˆ‹áˆ½")}
                      </h3>

                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted">
                        {response.response}
                      </p>

                      <p className="mt-3 text-xs text-muted">
                        {t(language, "Updated", "á‹¨á‰°á‹˜áˆ˜áŠá‰ á‰µ á‰€áŠ•")}{" "}
                        {new Date(response.updated_at).toLocaleDateString(
                          "en-ET",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 border-t border-border pt-5">
                    <ReviewForm
                      key={`${review.id}-${review.rating}-${review.comment ?? ""}`}
                      businessId={review.business_id}
                      existingReview={{
                        id: review.id,
                        rating: review.rating,
                        comment: review.comment,
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}