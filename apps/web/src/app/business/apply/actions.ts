"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/dal";

const optionalEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().email().max(254).optional(),
);

const optionalWebsite = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().url().max(500).optional(),
);

const applicationSchema = z.object({
  businessName: z.string().trim().min(2).max(150),
  categoryId: z.string().uuid(),
  description: z.string().trim().max(3000).optional(),
  phone: z.string().trim().min(7).max(30),
  email: optionalEmail,
  website: optionalWebsite,
  city: z.string().trim().min(2).max(100),
  neighborhood: z.string().trim().max(150).optional(),
  address: z.string().trim().max(300).optional(),
});

export type ApplicationActionResult = {
  success: boolean;
  message: string;
};

export async function submitBusinessApplication(
  formData: FormData,
): Promise<ApplicationActionResult> {
  const user = await requireRole(["customer"]);

  const parsed = applicationSchema.safeParse({
    businessName: formData.get("businessName"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website"),
    city: formData.get("city"),
    neighborhood: formData.get("neighborhood") || undefined,
    address: formData.get("address") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your information and try again.",
    };
  }

  const supabase = await createClient();

  const { data: category, error: categoryError } = await supabase
    .from("business_categories")
    .select("id")
    .eq("id", parsed.data.categoryId)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError || !category) {
    return {
      success: false,
      message: "Please select a valid business category.",
    };
  }

  const { error } = await supabase
    .from("business_owner_applications")
    .insert({
      user_id: user.id,
      business_name: parsed.data.businessName,
      category_id: parsed.data.categoryId,
      description: parsed.data.description || null,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      city: parsed.data.city,
      neighborhood: parsed.data.neighborhood || null,
      address: parsed.data.address || null,
    });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "You already have a pending business application.",
      };
    }

    return {
      success: false,
      message: "We couldn't submit your application. Please try again.",
    };
  }

  revalidatePath("/business/apply");

  return {
    success: true,
    message: "Your business application has been submitted successfully!",
  };
}