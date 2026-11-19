import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/dal";
import ReviewForm from "./review-form";

type ReviewSectionProps = {
  businessId: string;
  businessOwnerId: string;
  slug: string;
};

export default async function ReviewSection({
  businessId,
  businessOwnerId,
  slug,
}: ReviewSectionProps) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  const reviewList = reviews ?? [];
  const reviewIds = reviewList.map((review) => review.id);
  const [{ data: profiles }, { data: responses }] = await Promise.all([
    supabase.rpc("get_public_reviewers", {
      p_business_id: businessId,
    }),

    reviewIds.length > 0
      ? supabase
          .from("review_responses")
          .select("*")
          .eq("business_id", businessId)
          .in("review_id", reviewIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profileList = profiles ?? [];
  
  const responseList = responses ?? [];

  const profileMap = new Map(
    profileList.map((profile) => [profile.id, profile]),
  );

  const responseMap = new Map(
    responseList.map((response) => [response.review_id, response]),
  );

  const averageRating =
    reviewList.length > 0
      ? reviewList.reduce((total, review) => total + review.rating, 0) /
        reviewList.length
      : 0;

  const ownReview =
    currentUser?.role === "customer"
      ? (reviewList.find((review) => review.user_id === currentUser.id) ?? null)
      : null;

  const canReview =
    currentUser?.role === "customer" && currentUser.id !== businessOwnerId;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#172B3A]">Customer Reviews</h2>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-3xl font-extrabold text-[#172B3A]">
            {reviewList.length > 0 ? averageRating.toFixed(1) : "â€”"}
          </span>

          <div>
            <div className="text-lg tracking-wide text-[#D5A642]">
              {"â˜…".repeat(Math.round(averageRating))}
              {"â˜†".repeat(5 - Math.round(averageRating))}
            </div>

            <p className="text-sm text-[#747C80]">
              {reviewList.length}{" "}
              {reviewList.length === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      {canReview && (
        <ReviewForm
          key={
            ownReview
              ? `${ownReview.id}-${ownReview.rating}-${ownReview.comment ?? ""}`
              : "new-review"
          }
          businessId={businessId}
          existingReview={
            ownReview
              ? {
                  id: ownReview.id,
                  rating: ownReview.rating,
                  comment: ownReview.comment,
                }
              : null
          }
        />
      )}

      {!currentUser && (
        <div className="rounded-xl border border-[#E8E6DF] bg-white p-5">
          <p className="text-sm text-[#747C80]">
            Sign in with your customer account to share your experience.
          </p>

          <Link
            href={`/login?next=${encodeURIComponent(`/business/${slug}`)}`}
            className="mt-3 inline-block rounded-xl bg-[#173B35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#24554b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173B35] focus-visible:ring-offset-2"
          >
            Sign in to write a review
          </Link>
        </div>
      )}

      {reviewList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D8D5CC] bg-white p-8 text-center">
          <p className="font-semibold text-[#172B3A]">No reviews yet</p>
          <p className="mt-2 text-sm text-[#747C80]">
            Be the first customer to share your experience.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewList.map((review) => {
            const profile = profileMap.get(review.user_id);
            const response = responseMap.get(review.id);

            return (
              <article
                key={review.id}
                className="rounded-xl border border-[#E8E6DF] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#172B3A]">
                      {profile?.full_name || "YeneSpot customer"}
                    </h3>

                    <p className="mt-1 text-xs text-[#747C80]">
                      {new Date(review.created_at).toLocaleDateString("en-ET", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {review.updated_at !== review.created_at && " Â· Edited"}
                    </p>
                  </div>

                  <span
                    className="text-lg tracking-wide text-[#D5A642]"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {"â˜…".repeat(review.rating)}
                    {"â˜†".repeat(5 - review.rating)}
                  </span>
                </div>

                {review.comment && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#555F65]">
                    {review.comment}
                  </p>
                )}

                {response && (
                  <div className="mt-5 rounded-lg bg-[#F5F6F2] p-4">
                    <p className="text-sm font-semibold text-[#173B35]">
                      Business owner response
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#555F65]">
                      {response.response}
                    </p>

                    <p className="mt-2 text-xs text-[#747C80]">
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
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
