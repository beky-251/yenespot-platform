"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const businessIdSchema = z.string().uuid();

const statusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export type BusinessActionResult = {
  success: boolean;
  message: string;
};

export async function updateBusinessStatus(
  businessId: string,
  status: string,
): Promise<BusinessActionResult> {
  await requireRole(["admin", "super_admin"]);

  const parsedId = businessIdSchema.safeParse(businessId);
  const parsedStatus = statusSchema.safeParse(status);

  if (!parsedId.success || !parsedStatus.success) {
    return {
      success: false,
      message: "Invalid business or status.",
    };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      success: false,
      message: "Your session has expired. Please sign in again.",
    };
  }

  const updates: {
    status: "pending" | "approved" | "rejected" | "suspended";
    approved_at?: string | null;
    approved_by?: string | null;
    verified?: boolean;
  } = {
    status: parsedStatus.data,
  };

  if (parsedStatus.data === "approved") {
    updates.approved_at = new Date().toISOString();
    updates.approved_by = authData.user.id;
  }

  if (parsedStatus.data === "rejected" || parsedStatus.data === "pending") {
    updates.approved_at = null;
    updates.approved_by = null;
    updates.verified = false;
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", parsedId.data)
    .select("id, slug")
    .maybeSingle();

  if (error || !business) {
    return {
      success: false,
      message: "Could not update this business. Please try again.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/businesses");
  revalidatePath("/business/dashboard");
  revalidatePath(`/business/${business.slug}`);

  return {
    success: true,
    message: `Business status changed to ${parsedStatus.data}.`,
  };
}

export async function updateBusinessVerification(
  businessId: string,
  verified: boolean,
): Promise<BusinessActionResult> {
  await requireRole(["admin", "super_admin"]);

  const parsedId = businessIdSchema.safeParse(businessId);

  if (!parsedId.success || typeof verified !== "boolean") {
    return {
      success: false,
      message: "Invalid verification request.",
    };
  }

  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .update({ verified })
    .eq("id", parsedId.data)
    .eq("status", "approved")
    .select("id, slug")
    .maybeSingle();

  if (error || !business) {
    return {
      success: false,
      message: "Only approved businesses can be verified.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/businesses");
  revalidatePath(`/business/${business.slug}`);

  return {
    success: true,
    message: verified
      ? "Business verified successfully."
      : "Business verification removed.",
  };
}
