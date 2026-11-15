"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  businessId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000),
});

const updateSchema = reviewSchema.extend({
  reviewId: z.string().uuid(),
});

const idSchema = z.string().uuid();

export async function submitReview(formData: FormData) {
  const user = await requireRole(["customer"]);

  const parsed = reviewSchema.safeParse({
    businessId: formData.get("businessId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please provide a valid rating and comment.",
    };
  }

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("id", parsed.data.businessId)
    .eq("status", "approved")
    .maybeSingle();

  if (!business) {
    return {
      success: false,
      message: "This business is not available for reviews.",
    };
  }

  if (business.owner_id === user.id) {
    return {
      success: false,
      message: "You cannot review your own business.",
    };
  }

  const { error } = await supabase.from("reviews").insert({
    business_id: business.id,
    user_id: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
  });

  if (error) {
    return {
      success: false,
      message:
        error.code === "23505"
          ? "You have already reviewed this business."
          : "Unable to submit your review. Please try again.",
    };
  }

  revalidatePath(`/business/${business.slug}`);

  return {
    success: true,
    message: "Your review was submitted successfully!",
  };
}

export async function updateReview(formData: FormData) {
  const user = await requireRole(["customer"]);

  const parsed = updateSchema.safeParse({
    businessId: formData.get("businessId"),
    reviewId: formData.get("reviewId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please provide a valid rating and comment.",
    };
  }

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("id", parsed.data.businessId)
    .maybeSingle();

  if (!business) {
    return {
      success: false,
      message: "Business not found.",
    };
  }

  const { data, error } = await supabase
    .from("reviews")
    .update({
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    })
    .eq("id", parsed.data.reviewId)
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message: "Unable to update your review.",
    };
  }

  revalidatePath(`/business/${business.slug}`);

  return {
    success: true,
    message: "Your review was updated successfully!",
  };
}

export async function deleteReview(
  reviewId: string,
  businessId: string,
) {
  const user = await requireRole(["customer"]);

  const validReviewId = idSchema.safeParse(reviewId);
  const validBusinessId = idSchema.safeParse(businessId);

  if (!validReviewId.success || !validBusinessId.success) {
    return {
      success: false,
      message: "Invalid review details.",
    };
  }

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) {
    return {
      success: false,
      message: "Business not found.",
    };
  }

  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message: "Unable to delete your review.",
    };
  }

  revalidatePath(`/business/${business.slug}`);

  return {
    success: true,
    message: "Your review was deleted successfully!",
  };
}