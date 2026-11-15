import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import { logout } from "@/app/auth/actions";
import PasswordForm from "./password-form";

export const metadata = {
  title: "My Profile | YeneSpot",
};

export const instant = false;

export default async function ProfilePage() {
  const language = await getAppLanguage();
  const user = await requireRole(["customer"]);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, preferred_language, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { count: unreadNotificationCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "review_response_received")
    .eq("is_read", false);

  const displayName = profile?.full_name || "YeneSpot Customer";

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-green"
          >
            Yene<span className="text-gold">Spot</span>
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy transition hover:bg-cream"
            >
              {t(language, "Sign out", "ውጣ")}
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <section className="rounded-2xl bg-green p-8 text-white shadow-sm sm:p-10">
          <p className="text-sm font-medium text-white/70">
            {t(language, "CUSTOMER DASHBOARD", "የደንበኛ ዳሽቦርድ")}
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {t(language, "Welcome", "እንኳን ደህና መጡ")}, {displayName}!
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
            {t(language, "Discover local businesses, save your favorite places, and share your experiences with the YeneSpot community.", "በአካባቢዎ ያሉ ንግዶችን ያግኙ፣ የሚወዷቸውን ቦታዎች ያስቀምጡ፣ እና ተሞክሮዎን ከYeneSpot ማህበረሰብ ጋር ያጋሩ።")}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-navy">{t(language, "Your account", "የእርስዎ መለያ")}</h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">{t(language, "Full name", "ሙሉ ስም")}</p>
              <p className="mt-2 font-semibold text-navy">{displayName}</p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">{t(language, "Email address", "የኢሜይል አድራሻ")}</p>
              <p className="mt-2 break-all font-semibold text-navy">
                {user.email || t(language, "Not available", "አልተገኘም")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">{t(language, "Account role", "የመለያ ሚና")}</p>
              <p className="mt-2 font-semibold capitalize text-green">
                {t(language, "Customer", "ደንበኛ")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">{t(language, "Preferred language", "የተመረጠ ቋንቋ")}</p>
              <p className="mt-2 font-semibold text-navy">
                {profile?.preferred_language === "am" ? "Amharic" : "English"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Your YeneSpot activities", "በYeneSpot ያሉ እንቅስቃሴዎችዎ")}
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-6">
              <span className="text-2xl">♡</span>
              <h3 className="mt-3 font-bold text-navy">{t(language, "My Favorites", "የምወዳቸው")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "Keep track of businesses you love.", "የሚወዷቸውን ንግዶች ይከታተሉ።")}
              </p>
              <Link
                href="/favorites"
                className="mt-4 inline-block text-sm font-bold text-green hover:text-gold"
              >
                {t(language, "View My Favorites", "የምወዳቸውን ይመልከቱ")} →
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <span className="text-2xl">♧</span>
              <h3 className="mt-3 font-bold text-navy">{t(language, "My Notifications", "ማሳወቂያዎቼ")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "See when businesses reply to your reviews.", "ንግዶች ለግምገማዎችዎ ምላሽ ሲሰጡ ይመልከቱ።")}
              </p>

              {unreadNotificationCount ? (
                <p className="mt-3 text-sm font-semibold text-gold">
                  {unreadNotificationCount} {t(language, "unread notification(s)", "ያልተነበቡ ማሳወቂያዎች")}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  {t(language, "You are all caught up.", "ሁሉንም ማሳወቂያዎች አንብበዋል።")}
                </p>
              )}

              <Link
                href="/notifications"
                className="mt-4 inline-block text-sm font-bold text-green hover:text-gold"
              >
                {t(language, "View Notifications", "ማሳወቂያዎችን ይመልከቱ")} →
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <span className="text-2xl">★</span>
              <h3 className="mt-3 font-bold text-navy">{t(language, "My Reviews", "ግምገማዎቼ")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "Manage your reviews and read business-owner replies.", "ግምገማዎችዎን ያስተዳድሩ እና የንግድ ባለቤቶችን ምላሾች ያንብቡ።")}
              </p>
              <Link
                href="/my-reviews"
                className="mt-4 inline-block text-sm font-bold text-green hover:text-gold"
              >
                {t(language, "View My Reviews", "ግምገማዎቼን ይመልከቱ")} →
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <span className="text-2xl">⌕</span>
              <h3 className="mt-3 font-bold text-navy">{t(language, "Explore Businesses", "ንግዶችን ያስሱ")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "Discover interesting places around Jimma.", "በጅማ ዙሪያ ያሉ አስደሳች ቦታዎችን ያግኙ።")}
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-bold text-green hover:text-gold"
              >
                {t(language, "Explore YeneSpot", "YeneSpotን ያስሱ")} →
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">{t(language, "Change Password", "የይለፍ ቃል ቀይር")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t(language, "Update your account password. You must enter your current password to continue.", "የመለያዎን የይለፍ ቃል ያዘምኑ። ለመቀጠል አሁን ያለውን የይለፍ ቃል ማስገባት አለብዎት።")}
          </p>
          <div className="max-w-xl">
            <PasswordForm />
          </div>
        </section>

        <footer className="mt-12 border-t border-border py-6 text-center text-sm text-muted">
          © YeneSpot. {t(language, "Discover local favorites.", "የአካባቢዎን ተወዳጅ ቦታዎች ያግኙ።")}
        </footer>
      </div>
    </main>
  );
}