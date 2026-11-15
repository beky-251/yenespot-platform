"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

const userIdSchema = z.string().uuid();
const roleSchema = z.enum(["customer", "admin"]);

export type AdministratorActionResult = {
  success: boolean;
  message: string;
};

export async function updateAdministratorRole(
  userId: string,
  newRole: string,
): Promise<AdministratorActionResult> {
  await requireRole(["super_admin"]);

  const parsedId = userIdSchema.safeParse(userId);
  const parsedRole = roleSchema.safeParse(newRole);

  if (!parsedId.success || !parsedRole.success) {
    return { success: false, message: "Invalid account or role." };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      success: false,
      message: "Your session has expired. Please sign in again.",
    };
  }

  const { error } = await supabase.rpc("manage_administrator_role", {
    target_user_id: parsedId.data,
    new_role: parsedRole.data,
  });

  if (error) {
    return {
      success: false,
      message: "Could not change this account's role. Please check its current status and try again.",
    };
  }

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/admins");

  return {
    success: true,
    message: parsedRole.data === "admin"
      ? "Administrator access granted successfully."
      : "Administrator access removed successfully.",
  };
}