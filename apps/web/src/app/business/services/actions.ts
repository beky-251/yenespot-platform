"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const serviceSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000),
  price: z.number().finite().min(0).nullable(),
  isAvailable: z.boolean(),
});

async function verifyBusinessOwnership(businessId: string) {
  const user = await requireRole(["business_owner"]);
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !business) {
    return null;
  }

  return { supabase, business };
}

export async function addBusinessService(
  input: z.infer<typeof serviceSchema>,
) {
  const parsed = serviceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the service details and try again.",
    };
  }

  const access = await verifyBusinessOwnership(
    parsed.data.businessId,
  );

  if (!access) {
    return {
      success: false,
      message: "Business not found or access denied.",
    };
  }

  const { data: existing } = await access.supabase
    .from("business_services")
    .select("sort_order")
    .eq("business_id", access.business.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await access.supabase
    .from("business_services")
    .insert({
      business_id: access.business.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price,
      currency: "ETB",
      is_available: parsed.data.isAvailable,
      sort_order: (existing?.sort_order ?? -1) + 1,
    });

  if (error) {
    return {
      success: false,
      message: "Could not add the service. Please try again.",
    };
  }

  revalidatePath("/business/services");
  revalidatePath("/business/dashboard");

  return {
    success: true,
    message: "Service added successfully!",
  };
}

export async function updateBusinessService(
  serviceId: string,
  input: z.infer<typeof serviceSchema>,
) {
  const parsed = serviceSchema.safeParse(input);

  if (!z.string().uuid().safeParse(serviceId).success || !parsed.success) {
    return {
      success: false,
      message: "Invalid service details.",
    };
  }

  const access = await verifyBusinessOwnership(
    parsed.data.businessId,
  );

  if (!access) {
    return {
      success: false,
      message: "Business not found or access denied.",
    };
  }

  const { data, error } = await access.supabase
    .from("business_services")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price,
      currency: "ETB",
      is_available: parsed.data.isAvailable,
    })
    .eq("id", serviceId)
    .eq("business_id", access.business.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message: "Could not update the service.",
    };
  }

  revalidatePath("/business/services");
  revalidatePath("/business/dashboard");

  return {
    success: true,
    message: "Service updated successfully!",
  };
}

export async function deleteBusinessService(
  businessId: string,
  serviceId: string,
) {
  if (
    !z.string().uuid().safeParse(businessId).success ||
    !z.string().uuid().safeParse(serviceId).success
  ) {
    return {
      success: false,
      message: "Invalid service information.",
    };
  }

  const access = await verifyBusinessOwnership(businessId);

  if (!access) {
    return {
      success: false,
      message: "Business not found or access denied.",
    };
  }

  const { error } = await access.supabase
    .from("business_services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", access.business.id);

  if (error) {
    return {
      success: false,
      message: "Could not delete the service.",
    };
  }

  revalidatePath("/business/services");
  revalidatePath("/business/dashboard");

  return {
    success: true,
    message: "Service deleted successfully!",
  };
}