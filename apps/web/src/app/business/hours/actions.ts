"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const scheduleSchema = z.object({
  businessId: z.string().uuid(),
  hours: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      isClosed: z.boolean(),
      opensAt: z.string(),
      closesAt: z.string(),
    }),
  ).length(7),
});

export async function saveBusinessHours(
  businessId: string,
  hours: {
    dayOfWeek: number;
    isClosed: boolean;
    opensAt: string;
    closesAt: string;
  }[],
) {
  const user = await requireRole(["business_owner"]);

  const parsed = scheduleSchema.safeParse({
    businessId,
    hours,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid weekly schedule. Please check all seven days.",
    };
  }

  const days = parsed.data.hours.map((day) => day.dayOfWeek);

  if (new Set(days).size !== 7) {
    return {
      success: false,
      message: "Each day of the week must appear exactly once.",
    };
  }

  for (const day of parsed.data.hours) {
    if (day.isClosed) continue;

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (
      !timePattern.test(day.opensAt) ||
      !timePattern.test(day.closesAt)
    ) {
      return {
        success: false,
        message: "Please enter valid opening and closing times.",
      };
    }
  }

  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (businessError || !business) {
    return {
      success: false,
      message: "Business not found or access denied.",
    };
  }

  const records = parsed.data.hours.map((day) => ({
    business_id: business.id,
    day_of_week: day.dayOfWeek,
    is_closed: day.isClosed,
    opens_at: day.isClosed ? null : `${day.opensAt}:00`,
    closes_at: day.isClosed ? null : `${day.closesAt}:00`,
  }));

  const { error } = await supabase
    .from("business_hours")
    .upsert(records, {
      onConflict: "business_id,day_of_week",
    });

  if (error) {
    return {
      success: false,
      message: "Could not save your business hours. Please try again.",
    };
  }

  revalidatePath("/business/hours");
  revalidatePath("/business/dashboard");

  return {
    success: true,
    message: "Business hours saved successfully!",
  };
}