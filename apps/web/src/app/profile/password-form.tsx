"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/auth/actions";

const initialState = {
  success: false,
  message: "",
};

export default function PasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePassword,
    initialState,
  );

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <div>
        <label
          htmlFor="currentPassword"
          className="mb-2 block text-sm font-semibold text-navy"
        >
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-2 block text-sm font-semibold text-navy"
        >
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
        />
        <p className="mt-1 text-xs text-muted">
          Use at least 8 characters.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-semibold text-navy"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
        />
      </div>

      {state.message && (
        <p
          role="status"
          aria-live="polite"
          className={state.success ? "text-sm font-medium text-green" : "text-sm font-medium text-red-600"}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-green px-6 py-3 text-sm font-bold text-white transition hover:bg-green/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
      >
        {isPending ? "Changing password..." : "Change password"}
      </button>
    </form>
  );
}
