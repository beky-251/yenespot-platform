"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const applicationIdSchema = z.string().uuid();

const rejectionSchema = z.object({
  applicationId: z.string().uuid(),
  reason: z.string().trim().min(1).max(1000),
});

export type AdminActionResult = {
  success: boolean;
  message: string;
};

export async function approveBusinessApplication(
  applicationId: string,
): Promise<AdminActionResult> {
  await requireRole(["admin", "super_admin"]);

  const parsed = applicationIdSchema.safeParse(applicationId);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid application.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "approve_business_owner_application",
    {
      p_application_id: parsed.data,
    },
  );

  if (error) {
    return {
      success: false,
      message: "Approval failed. Please check the application and try again.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/business-applications");
  revalidatePath("/business/dashboard");

  return {
    success: true,
    message: "Application approved successfully.",
  };
}

export async function rejectBusinessApplication(
  applicationId: string,
  reason: string,
): Promise<AdminActionResult> {
  await requireRole(["admin", "super_admin"]);

  const parsed = rejectionSchema.safeParse({
    applicationId,
    reason,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please provide a valid rejection reason.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "reject_business_owner_application",
    {
      p_application_id: parsed.data.applicationId,
      p_reason: parsed.data.reason,
    },
  );

  if (error) {
    return {
      success: false,
      message: "Rejection failed. Please try again.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/business-applications");

  return {
    success: true,
    message: "Application rejected successfully.",
  };
}