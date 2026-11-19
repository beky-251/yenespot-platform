"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { register } from "@/app/auth/actions";

export default function RegisterPage() {
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

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await register(formData);

      if (result.success) {
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
          <span className="text-3xl font-extrabold tracking-tight text-green">
            Yene<span className="text-gold">Spot</span>
          </span>
          <span className="mt-1 block text-sm text-muted">
            {t("Discover your local favorites.", "á‹¨áŠ áŠ«á‰£á‰¢á‹ŽáŠ• á‰°á‹ˆá‹³áŒ… á‰¦á‰³á‹Žá‰½ á‹«áŒáŠ™á¢")}
          </span>
        </Link>

        <section className="rounded-2xl border border-border bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-navy">
              {t("Create your account", "áˆ˜áˆˆá‹«á‹ŽáŠ• á‹­ááŒ áˆ©")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t("Join YeneSpot and discover great places around you.", "á‹¨YeneSpot áŠ á‰£áˆ á‹­áˆáŠ‘áŠ“ á‰ áŠ áŠ«á‰£á‰¢á‹Ž á‹«áˆ‰ áŒ¥áˆ© á‰¦á‰³á‹Žá‰½áŠ• á‹«áŒáŠ™á¢")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold text-navy"
              >
                {t("Full name", "áˆ™áˆ‰ áˆµáˆ")}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                placeholder={t("Your full name", "áˆ™áˆ‰ áˆµáˆá‹Ž")}
                className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm outline-none transition focus:border-green focus:ring-2 focus:ring-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-navy"
              >
                {t("Email address", "á‹¨áŠ¢áˆœá‹­áˆ áŠ á‹µáˆ«áˆ»")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm outline-none transition focus:border-green focus:ring-2 focus:ring-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-navy"
              >
                {t("Password", "á‹¨á‹­áˆˆá á‰ƒáˆ")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  placeholder={t("At least 8 characters", "á‰¢á‹«áŠ•áˆµ 8 á‰áˆáŠá‹Žá‰½")}
                  className="w-full rounded-xl border border-border bg-cream px-4 py-3 pr-20 text-sm outline-none transition focus:border-green focus:ring-2 focus:ring-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                >
                  {showPassword ? t("Hide", "á‹°á‰¥á‰…") : t("Show", "áŠ áˆ³á‹­")}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="rounded-xl border border-green/20 bg-green/5 px-4 py-3 text-sm text-green"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-green px-5 py-3.5 text-sm font-bold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            >
              {isPending ? t("Creating account...", "áˆ˜áˆˆá‹« á‰ áˆ˜ááŒ áˆ­ áˆ‹á‹­...") : t("Create account", "áˆ˜áˆˆá‹« á‹­ááŒ áˆ©")}
            </button>
          </form>

          <div className="my-6 border-t border-border" />

          <p className="text-center text-sm text-muted">
            {t("Already have an account?", "áŠ áˆµá‰€á‹µáˆ˜á‹ áˆ˜áˆˆá‹« áŠ áˆˆá‹Žá‰µ?")}{" "}
            <Link
              href="/login"
              className="font-bold text-green hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            >
              {t("Sign in", "á‹­áŒá‰¡")}
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
            â† {t("Back to YeneSpot homepage", "á‹ˆá‹° YeneSpot áˆ˜áŠáˆ» áŒˆáŒ½ á‰°áˆ˜áˆˆáˆµ")}
          </Link>
        </p>
      </div>
    </main>
  );
}