"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const responseSchema = z.object({
  businessId: z.string().uuid(),
  reviewId: z.string().uuid(),
  response: z.string().trim().min(1).max(2000),
});

const idSchema = z.string().uuid();

async function verifyReviewOwnership(
  businessId: string,
  reviewId: string,
) {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) {
    return { supabase, business: null };
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("id")
    .eq("id", reviewId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!review) {
    return { supabase, business: null };
  }

  return { supabase, business };
}

export async function submitBusinessResponse(formData: FormData) {
  const user = await requireRole(["business_owner"]);

  const parsed = responseSchema.safeParse({
    businessId: formData.get("businessId"),
    reviewId: formData.get("reviewId"),
    response: formData.get("response"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please enter a valid response (maximum 2,000 characters).",
    };
  }

  const { supabase, business } = await verifyReviewOwnership(
    parsed.data.businessId,
    parsed.data.reviewId,
  );

  if (!business) {
    return {
      success: false,
      message: "The review or business could not be found.",
    };
  }

  const { data: ownedBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", business.id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!ownedBusiness) {
    return {
      success: false,
      message: "You are not authorized to respond to this review.",
    };
  }

  const { error } = await supabase.from("review_responses").insert({
    business_id: business.id,
    review_id: parsed.data.reviewId,
    user_id: user.id,
    response: parsed.data.response,
  });

  if (error) {
    return {
      success: false,
      message:
        error.code === "23505"
          ? "A response already exists for this review. Please edit it instead."
          : "Unable to submit your response. Please try again.",
    };
  }

  revalidatePath("/business/reviews");
  revalidatePath(`/business/${business.slug}`);

  return {
    success: true,
    message: "Your response was published successfully!",
  };
}

export async function updateBusinessResponse(formData: FormData) {
  const user = await requireRole(["business_owner"]);

  const parsed = responseSchema.safeParse({
    businessId: formData.get("businessId"),
    reviewId: formData.get("reviewId"),
    response: formData.get("response"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please enter a valid response.",
    };
  }

  const { supabase, business } = await verifyReviewOwnership(
    parsed.data.businessId,
    parsed.data.reviewId,
  );

  if (!business) {
    return {
      success: false,
      message: "The review or business could not be found.",
    };
  }

  const { data: ownedBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", business.id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!ownedBusiness) {
    return {
      success: false,
      message: "You are not authorized to edit this response.",
    };
  }

  const { data, error } = await supabase
    .from("review_responses")
    .update({ response: parsed.data.response })
    .eq("review_id", parsed.data.reviewId)
    .eq("business_id", business.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message: "Unable to update your response.",
    };
  }

  revalidatePath("/business/reviews");
  revalidatePath(`/business/${business.slug}`);

  return {
    success: true,
    message: "Your response was updated successfully!",
  };
}

export async function deleteBusinessResponse(
  responseId: string,
  businessId: string,
) {
  const user = await requireRole(["business_owner"]);

  const validResponseId = idSchema.safeParse(responseId);
  const validBusinessId = idSchema.safeParse(businessId);

  if (!validResponseId.success || !validBusinessId.success) {
    return {
      success: false,
      message: "Invalid response details.",
    };
  }

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return {
      success: false,
      message: "Business not found or access denied.",
    };
  }

  const { error } = await supabase
    .from("review_responses")
    .delete()
    .eq("id", responseId)
    .eq("business_id", business.id);

  if (error) {
    return {
      success: false,
      message: "Unable to delete your response.",
    };
  }

  revalidatePath("/business/reviews");
  revalidatePath(`/business/${business.slug}`);

  return {
    success: true,
    message: "Your response was deleted successfully!",
  };
}