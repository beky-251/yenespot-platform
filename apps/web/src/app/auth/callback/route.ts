import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardPathForRole,
  type UserRole,
} from "@/lib/auth/dal";

function isUserRole(role: string): role is UserRole {
  return [
    "customer",
    "business_owner",
    "admin",
    "super_admin",
  ].includes(role);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", origin),
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", origin),
    );
  }

  if (searchParams.get("next") === "/reset-password") {
    return NextResponse.redirect(
      new URL("/reset-password", origin),
    );
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

  if (!role) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL("/login?error=role_verification_failed", origin),
    );
  }

  const destination = getDashboardPathForRole(role);

  return NextResponse.redirect(
    new URL(destination, origin),
  );
}