"use client";

import { useState, useTransition } from "react";
import {
  submitReview,
  updateReview,
  deleteReview,
} from "./actions";

type ExistingReview = {
  id: string;
  rating: number;
  comment: string | null;
};

type ReviewFormProps = {
  businessId: string;
  existingReview?: ExistingReview | null;
};

export default function ReviewForm({
  businessId,
  existingReview = null,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("rating", String(rating));
    formData.set("comment", comment);

    if (existingReview) {
      formData.set("reviewId", existingReview.id);
    }

    startTransition(async () => {
      const result = existingReview
        ? await updateReview(formData)
        : await submitReview(formData);

      setMessage(result.message);
      setIsSuccess(result.success);

      if (result.success && !existingReview) {
        setComment("");
        setRating(5);
      }
    });
  }

  function handleDelete() {
    if (!existingReview) return;

    if (!window.confirm("Are you sure you want to delete your review?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteReview(existingReview.id, businessId);
      setMessage(result.message);
      setIsSuccess(result.success);

      if (result.success) {
        window.location.reload();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[#e8e5df] bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#172B3A]">
        {existingReview ? "Edit your review" : "Write a review"}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Share your experience with other YeneSpot customers.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Your rating
          </label>

          <div className="flex gap-2" role="group" aria-label="Select a rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                disabled={isPending}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                aria-pressed={rating === star}
                className={`text-3xl transition ${
                  star <= rating ? "text-[#D5A642]" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <p className="mt-1 text-xs text-gray-500">
            {rating} out of 5 stars
          </p>
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Your experience (optional)
          </label>

          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="What did you like about this business?"
            disabled={isPending}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#D5A642] focus:ring-2 focus:ring-[#D5A642]/20"
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {comment.length}/2000
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-[#173B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24554b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Saving..."
              : existingReview
                ? "Update review"
                : "Submit review"}
          </button>

          {existingReview && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              Delete review
            </button>
          )}
        </div>

        {message && (
          <p
            role="status"
            className={`text-sm ${
              isSuccess ? "text-green-700" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </section>
  );
}