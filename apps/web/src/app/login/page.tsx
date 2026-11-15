"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/app/auth/actions";

function LoginContent() {
  const searchParams = useSearchParams();
  const passwordUpdated = searchParams.get("password_updated") === "1";
  const callbackError = searchParams.get("error");

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

  const callbackErrorMessage =
    callbackError === "verification_failed"
      ? t("Email verification failed. Please try again.", "የኢሜይል ማረጋገጫው አልተሳካም። እንደገና ይሞክሩ።")
      : callbackError === "role_verification_failed"
        ? t("Your account role could not be verified. Please contact support.", "የመለያዎ ሚና ማረጋገጥ አልተቻለም። እባክዎ ድጋፍን ያነጋግሩ።")
        : "";

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await login(formData);

      if (!result.success) {
        setError(result.message);
      }
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
              {t("Welcome back", "እንኳን በደህና ተመለሱ")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t("Sign in to continue exploring YeneSpot.", "YeneSpotን ማሰስዎን ለመቀጠል ይግቡ።")}
            </p>
          </div>

          {callbackErrorMessage && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {callbackErrorMessage}
            </div>
          )}

          {passwordUpdated && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-green/20 bg-green/5 px-4 py-3 text-sm text-green"
            >
              {t("Your password has been updated successfully. Please sign in with your new password.", "የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል። እባክዎ በአዲሱ የይለፍ ቃልዎ ይግቡ።")}
            </div>
          )}

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

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-navy"
              >
                {t("Password", "የይለፍ ቃል")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  placeholder={t("Enter your password", "የይለፍ ቃልዎን ያስገቡ")}
                  className="w-full rounded-xl border border-border bg-cream px-4 py-3 pr-20 text-sm outline-none transition focus:border-green focus:ring-2 focus:ring-green/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-green"
                >
                  {showPassword ? t("Hide", "ደብቅ") : t("Show", "አሳይ")}
                </button>
              </div>
            </div>

            <div className="-mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-green hover:text-gold"
              >
                {t("Forgot password?", "የይለፍ ቃልዎን ረሱ?")}
              </Link>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-green px-5 py-3.5 text-sm font-bold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? t("Signing in...", "በመግባት ላይ...") : t("Sign in", "ግባ")}
            </button>
          </form>

          <div className="my-6 border-t border-border" />

          <p className="text-center text-sm text-muted">
            {t("Don't have an account?", "መለያ የለዎትም?")}{" "}
            <Link
              href="/register"
              className="font-bold text-green hover:text-gold"
            >
              {t("Create an account", "መለያ ይፍጠሩ")}
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="hover:text-green">
            ← {t("Back to YeneSpot homepage", "ወደ YeneSpot መነሻ ገጽ ተመለስ")}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}