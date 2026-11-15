"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardPathForRole,
  requireRole,
  type UserRole,
} from "@/lib/auth/dal";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

function isUserRole(role: string): role is UserRole {
  return [
    "customer",
    "business_owner",
    "admin",
    "super_admin",
  ].includes(role);
}

function safeRedirectPath(path: string | null | undefined): string | null {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("\r") ||
    path.includes("\n")
  ) {
    return null;
  }

  return path;
}

export type AuthActionResult = {
  success: boolean;
  message: string;
};

export async function register(
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please provide a valid name, email, and password of at least 8 characters.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${(
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      ).replace(/\/$/, "")}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  if (!data.session) {
    return {
      success: true,
      message: "Account created. Please check your email for a verification link.",
    };
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    await supabase.auth.signOut();

    return {
      success: false,
      message: "Unable to verify your account. Please try again.",
    };
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const role =
    !roleError &&
    roleRecord &&
    isUserRole(roleRecord.role)
      ? roleRecord.role
      : null;

  if (!role) {
    await supabase.auth.signOut();

    return {
      success: false,
      message: "Your account role could not be verified. Please contact support.",
    };
  }

  redirect(getDashboardPathForRole(role));
}

export async function login(
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please enter a valid email and password.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      message: "Unable to sign in with those credentials.",
    };
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "Unable to verify your account. Please try again.",
    };
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const role =
    !roleError &&
    roleRecord &&
    isUserRole(roleRecord.role)
      ? roleRecord.role
      : null;

  if (!role) {
    await supabase.auth.signOut();

    return {
      success: false,
      message: "Your account role could not be verified. Please contact support.",
    };
  }

  const requestedPath = safeRedirectPath(
    formData.get("next")?.toString(),
  );

  const dashboardPath = getDashboardPathForRole(role);

  const destination =
    requestedPath && requestedPath === dashboardPath
      ? requestedPath
      : dashboardPath;

  redirect(destination);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "New passwords do not match.",
  });

export async function changePassword(
  _previousState: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const user = await requireRole([
    "customer",
    "business_owner",
    "admin",
    "super_admin",
  ]);

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please check your password details.",
    };
  }

  if (!user.email) {
    return {
      success: false,
      message: "Unable to verify your account email.",
    };
  }

  const supabase = await createClient();

  const { error: verificationError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    });

  if (verificationError) {
    return {
      success: false,
      message: "Your current password is incorrect.",
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return {
      success: false,
      message: "Unable to change your password. Please try again.",
    };
  }

  return {
    success: true,
    message: "Your password has been changed successfully.",
  };
}
