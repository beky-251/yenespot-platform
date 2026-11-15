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
          className="text-sm font-semibold text-green hover:underline"
        >
          {t(language, "← Back to profile", "← ወደ መገለጫ ተመለስ")}
        </Link>

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-navy">
            {t(language, "My Reviews", "ግምገማዎቼ")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t(language, "Manage your reviews and read responses from businesses.", "ግምገማዎችዎን ያስተዳድሩ እና ከንግዶች የተሰጡ ምላሾችን ያንብቡ።")}
          </p>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
            {t(language, "We could not load your reviews. Please refresh and try again.", "ግምገማዎችዎን መጫን አልተቻለም። እባክዎ ገጹን አድስተው እንደገና ይሞክሩ።")}
          </div>
        ) : reviewList.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-navy">
              {t(language, "You have not written any reviews yet.", "እስካሁን ምንም ግምገማ አልጻፉም።")}
            </h2>

            <p className="mt-2 text-sm text-muted">
              {t(language, "Visit a business and share your experience with the YeneSpot community.", "ንግድን ይጎብኙ እና ልምድዎን ከYeneSpot ማህበረሰብ ጋር ያጋሩ።")}
            </p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-green px-5 py-3 text-sm font-semibold text-white hover:bg-green/90"
            >
              {t(language, "Explore businesses", "ንግዶችን ያስሱ")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <p className="text-sm font-semibold text-muted">
              {reviewList.length}{" "}
              {reviewList.length === 1
                ? t(language, "review submitted", "ግምገማ ቀርቧል")
                : t(language, "reviews submitted", "ግምገማዎች ቀርበዋል")}
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
                        {business?.name ?? t(language, "Business", "ንግድ")}
                      </h2>

                      {business && (
                        <Link
                          href={`/business/${business.slug}`}
                          className="mt-1 inline-block text-sm font-semibold text-green hover:underline"
                        >
                          {t(language, "View business →", "ንግዱን ይመልከቱ →")}
                        </Link>
                      )}

                      <p className="mt-2 text-xs text-muted">
                        {t(language, "Submitted", "የቀረበበት ቀን")}{" "}
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
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
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
                        {t(language, "Business owner response", "የንግድ ባለቤቱ ምላሽ")}
                      </h3>

                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted">
                        {response.response}
                      </p>

                      <p className="mt-3 text-xs text-muted">
                        {t(language, "Updated", "የተዘመነበት ቀን")}{" "}
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