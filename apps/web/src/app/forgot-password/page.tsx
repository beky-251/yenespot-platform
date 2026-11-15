"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [language, setLanguage] = useState<"en" | "am">("en");

  useEffect(() => {
    queueMicrotask(() => setLanguage(
      document.cookie.split("; ").some((cookie) => cookie === "yenespot_app_language=am")
        ? "am"
        : "en"
    ));
  }, []);

  const t = (english: string, amharic: string) =>
    language === "am" ? amharic : english;

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    startTransition(async () => {
      const supabase = createClient();

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

      if (resetError) {
        setError(t("Unable to send a reset email. Please check your email address and try again.", "የይለፍ ቃል መቀየሪያ ኢሜይል መላክ አልተቻለም። እባክዎ የኢሜይል አድራሻዎን ያረጋግጡና እንደገና ይሞክሩ።"));
        return;
      }

      setSuccess(
        t("If an account exists for that email, a password reset link has been sent. Please check your inbox.", "ለዚያ ኢሜይል መለያ ካለ፣ የይለፍ ቃል መቀየሪያ ሊንክ ተልኳል። እባክዎ የኢሜይል መልዕክቶችዎን ይመልከቱ።"),
      );
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center">
          <span className="text-3xl font-extrabold tracking-tight text-green">
            Yene<span className="text-gold">Spot</span>
          </span>
          <span className="mt-1 block text-sm text-muted">
            {t("Discover your local favorites.", "የአካባቢዎን ተወዳጅ ቦታዎች ያግኙ።")}
          </span>
        </Link>

        <section className="rounded-2xl border border-border bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-navy">
              {t("Forgot your password?", "የይለፍ ቃልዎን ረሱ?")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t("Enter your email address and we'll send you a link to reset your password.", "የኢሜይል አድራሻዎን ያስገቡ፤ የይለፍ ቃልዎን ለመቀየር ሊንክ እንልክልዎታለን።")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-navy"
              >
                {t("Email address", "የኢሜይል አድራሻ")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm outline-none transition focus:border-green focus:ring-2 focus:ring-green/10"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-green/20 bg-green/5 px-4 py-3 text-sm text-green"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-green px-5 py-3.5 text-sm font-bold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? t("Sending...", "በመላክ ላይ...") : t("Send reset link", "የመቀየሪያ ሊንክ ላክ")}
            </button>
          </form>

          <div className="my-6 border-t border-border" />

          <p className="text-center text-sm text-muted">
            {t("Remember your password?", "የይለፍ ቃልዎን አስታውሰዋል?")}{" "}
            <Link
              href="/login"
              className="font-bold text-green hover:text-gold"
            >
              {t("Sign in", "ይግቡ")}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}