"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationAsRead(formData: FormData) {
  const user = await requireRole(["business_owner"]);
  const notificationId = formData.get("notificationId");

  if (
    typeof notificationId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      notificationId,
    )
  ) {
    throw new Error("Invalid notification ID.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw new Error("Could not mark notification as read.");
  }

  revalidatePath("/business/notifications");
}
