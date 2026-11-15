"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const businessIdSchema = z.string().uuid();

export async function addFavorite(businessId: string) {
  const user = await requireRole(["customer"]);

  const parsed = businessIdSchema.safeParse(businessId);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid business.",
    };
  }

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("id", parsed.data)
    .eq("status", "approved")
    .maybeSingle();

  if (!business) {
    return {
      success: false,
      message: "Business not found.",
    };
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    business_id: business.id,
  });

  if (error) {
    return {
      success: false,
      message:
        error.code === "23505"
          ? "This business is already in your favorites."
          : "Unable to save this business. Please try again.",
    };
  }

  revalidatePath("/favorites");
  revalidatePath("/profile");
  revalidatePath(`/business/${business.slug}`);

  return {
    success: true,
    message: "Business added to your favorites!",
  };
}

export async function removeFavorite(businessId: string) {
  const user = await requireRole(["customer"]);

  const parsed = businessIdSchema.safeParse(businessId);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid business.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("business_id", parsed.data);

  if (error) {
    return {
      success: false,
      message: "Unable to remove this business. Please try again.",
    };
  }

  revalidatePath("/favorites");
  revalidatePath("/profile");

  return {
    success: true,
    message: "Business removed from your favorites.",
  };
}