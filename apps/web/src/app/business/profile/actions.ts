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

const profileSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(3000),
  phone: z.string().trim().min(7).max(30),
  email: optionalEmail,
  website: optionalWebsite,
  city: z.string().trim().min(2).max(100),
  neighborhood: z.string().trim().max(150),
  address: z.string().trim().max(300),
});

export type ProfileActionResult = {
  success: boolean;
  message: string;
};

export async function updateBusinessProfile(
  formData: FormData,
): Promise<ProfileActionResult> {
  const user = await requireRole(["business_owner"]);

  const parsed = profileSchema.safeParse({
    businessId: formData.get("businessId"),
    name: formData.get("name"),
    description: formData.get("description") || "",
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website"),
    city: formData.get("city"),
    neighborhood: formData.get("neighborhood") || "",
    address: formData.get("address") || "",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your information and try again.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      city: parsed.data.city,
      neighborhood: parsed.data.neighborhood || null,
      address: parsed.data.address || null,
    })
    .eq("id", parsed.data.businessId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message: "We could not update your business profile. Please try again.",
    };
  }

  revalidatePath("/business/profile");
  revalidatePath("/business/dashboard");

  return {
    success: true,
    message: "Your business profile has been updated successfully!",
  };
}