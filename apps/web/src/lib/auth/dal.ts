import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole =
  | "customer"
  | "business_owner"
  | "admin"
  | "super_admin";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: UserRole | null;
};

function isUserRole(role: string): role is UserRole {
  return [
    "customer",
    "business_owner",
    "admin",
    "super_admin",
  ].includes(role);
}

export const getCurrentUser = cache(
  async (): Promise<CurrentUser | null> => {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: roleRecord, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const role =
      !roleError &&
      roleRecord &&
      isUserRole(roleRecord.role)
        ? roleRecord.role
        : null;

    return {
      id: user.id,
      email: user.email ?? null,
      role,
    };
  },
);

export function getDashboardPathForRole(
  role: UserRole | null,
): string {
  switch (role) {
    case "customer":
      return "/profile";

    case "business_owner":
      return "/business/dashboard";

    case "admin":
      return "/admin";

    case "super_admin":
      return "/super-admin";

    default:
      return "/login";
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(
  allowedRoles: readonly UserRole[],
): Promise<CurrentUser> {
  const user = await requireUser();

  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}