"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
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
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8 || password.length > 128) {
      setError(t("Your password must be between 8 and 128 characters.", "የይለፍ ቃልዎ ከ8 እስከ 128 ቁምፊዎች መሆን አለበት።"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("The passwords do not match.", "የይለፍ ቃሎቹ አይዛመዱም።"));
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      const { data: { user }, error: userError } =
        await supabase.auth.getUser();

      if (userError || !user) {
        setError(t("Your reset session has expired. Please request a new reset link.", "የይለፍ ቃል መቀየሪያ ጊዜዎ አልቋል። እባክዎ አዲስ የመቀየሪያ ሊንክ ይጠይቁ።"));
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(t("Unable to update your password. Please request a new reset link and try again.", "የይለፍ ቃልዎን ማዘመን አልተቻለም። እባክዎ አዲስ የመቀየሪያ ሊንክ ይጠይቁና እንደገና ይሞክሩ።"));
        return;
      }

      await supabase.auth.signOut();
      router.replace("/login?password_updated=1");
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
              {t("Create a new password", "አዲስ የይለፍ ቃል ይፍጠሩ")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t("Choose a new password for your YeneSpot account.", "ለYeneSpot መለያዎ አዲስ የይለፍ ቃል ይምረጡ።")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-navy"
              >
                {t("New password", "አዲስ የይለፍ ቃል")}
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
                  placeholder={t("At least 8 characters", "ቢያንስ 8 ቁምፊዎች")}
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-navy"
              >
                {t("Confirm new password", "አዲሱን የይለፍ ቃል ያረጋግጡ")}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                placeholder={t("Enter your password again", "የይለፍ ቃልዎን እንደገና ያስገቡ")}
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-green px-5 py-3.5 text-sm font-bold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? t("Updating password...", "የይለፍ ቃል በማዘመን ላይ...")
                : t("Update password", "የይለፍ ቃል አዘምን")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            <Link
              href="/login"
              className="font-bold text-green hover:text-gold"
            >
              {t("Back to sign in", "ወደ መግቢያ ተመለስ")}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}