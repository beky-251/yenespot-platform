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
            className="text-2xl font-extrabold tracking-tight text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          >
            Yene<span className="text-gold">Spot</span>
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            >
              {t(language, "Sign out", "á‹áŒ£")}
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <section className="rounded-2xl bg-green p-8 text-white shadow-sm sm:p-10">
          <p className="text-sm font-medium text-white/70">
            {t(language, "CUSTOMER DASHBOARD", "á‹¨á‹°áŠ•á‰ áŠ› á‹³áˆ½á‰¦áˆ­á‹µ")}
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {t(language, "Welcome", "áŠ¥áŠ•áŠ³áŠ• á‹°áˆ…áŠ“ áˆ˜áŒ¡")}, {displayName}!
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
            {t(language, "Discover local businesses, save your favorite places, and share your experiences with the YeneSpot community.", "á‰ áŠ áŠ«á‰£á‰¢á‹Ž á‹«áˆ‰ áŠ•áŒá‹¶á‰½áŠ• á‹«áŒáŠ™á£ á‹¨áˆšá‹ˆá‹·á‰¸á‹áŠ• á‰¦á‰³á‹Žá‰½ á‹«áˆµá‰€áˆáŒ¡á£ áŠ¥áŠ“ á‰°áˆžáŠ­áˆ®á‹ŽáŠ• áŠ¨YeneSpot áˆ›áˆ…á‰ áˆ¨áˆ°á‰¥ áŒ‹áˆ­ á‹«áŒ‹áˆ©á¢")}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-navy">{t(language, "Your account", "á‹¨áŠ¥áˆ­áˆµá‹Ž áˆ˜áˆˆá‹«")}</h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">{t(language, "Full name", "áˆ™áˆ‰ áˆµáˆ")}</p>
              <p className="mt-2 font-semibold text-navy">{displayName}</p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">{t(language, "Email address", "á‹¨áŠ¢áˆœá‹­áˆ áŠ á‹µáˆ«áˆ»")}</p>
              <p className="mt-2 break-all font-semibold text-navy">
                {user.email || t(language, "Not available", "áŠ áˆá‰°áŒˆáŠ˜áˆ")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">{t(language, "Account role", "á‹¨áˆ˜áˆˆá‹« áˆšáŠ“")}</p>
              <p className="mt-2 font-semibold capitalize text-green">
                {t(language, "Customer", "á‹°áŠ•á‰ áŠ›")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">{t(language, "Preferred language", "á‹¨á‰°áˆ˜áˆ¨áŒ  á‰‹áŠ•á‰‹")}</p>
              <p className="mt-2 font-semibold text-navy">
                {profile?.preferred_language === "am" ? "Amharic" : "English"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Your YeneSpot activities", "á‰ YeneSpot á‹«áˆ‰ áŠ¥áŠ•á‰…áˆµá‰ƒáˆ´á‹Žá‰½á‹Ž")}
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-6">
              <span className="text-2xl">â™¡</span>
              <h3 className="mt-3 font-bold text-navy">{t(language, "My Favorites", "á‹¨áˆá‹ˆá‹³á‰¸á‹")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "Keep track of businesses you love.", "á‹¨áˆšá‹ˆá‹·á‰¸á‹áŠ• áŠ•áŒá‹¶á‰½ á‹­áŠ¨á‰³á‰°áˆ‰á¢")}
              </p>
              <Link
                href="/favorites"
                className="mt-4 inline-block text-sm font-bold text-green hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              >
                {t(language, "View My Favorites", "á‹¨áˆá‹ˆá‹³á‰¸á‹áŠ• á‹­áˆ˜áˆáŠ¨á‰±")} â†’
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <span className="text-2xl">â™§</span>
              <h3 className="mt-3 font-bold text-navy">{t(language, "My Notifications", "áˆ›áˆ³á‹ˆá‰‚á‹«á‹Žá‰¼")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "See when businesses reply to your reviews.", "áŠ•áŒá‹¶á‰½ áˆˆáŒáˆáŒˆáˆ›á‹Žá‰½á‹Ž áˆáˆ‹áˆ½ áˆ²áˆ°áŒ¡ á‹­áˆ˜áˆáŠ¨á‰±á¢")}
              </p>

              {unreadNotificationCount ? (
                <p className="mt-3 text-sm font-semibold text-gold">
                  {unreadNotificationCount} {t(language, "unread notification(s)", "á‹«áˆá‰°áŠá‰ á‰¡ áˆ›áˆ³á‹ˆá‰‚á‹«á‹Žá‰½")}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  {t(language, "You are all caught up.", "áˆáˆ‰áŠ•áˆ áˆ›áˆ³á‹ˆá‰‚á‹«á‹Žá‰½ áŠ áŠ•á‰¥á‰ á‹‹áˆá¢")}
                </p>
              )}

              <Link
                href="/notifications"
                className="mt-4 inline-block text-sm font-bold text-green hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              >
                {t(language, "View Notifications", "áˆ›áˆ³á‹ˆá‰‚á‹«á‹Žá‰½áŠ• á‹­áˆ˜áˆáŠ¨á‰±")} â†’
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <span className="text-2xl">â˜…</span>
              <h3 className="mt-3 font-bold text-navy">{t(language, "My Reviews", "áŒáˆáŒˆáˆ›á‹Žá‰¼")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "Manage your reviews and read business-owner replies.", "áŒáˆáŒˆáˆ›á‹Žá‰½á‹ŽáŠ• á‹«áˆµá‰°á‹³á‹µáˆ© áŠ¥áŠ“ á‹¨áŠ•áŒá‹µ á‰£áˆˆá‰¤á‰¶á‰½áŠ• áˆáˆ‹áˆ¾á‰½ á‹«áŠ•á‰¥á‰¡á¢")}
              </p>
              <Link
                href="/my-reviews"
                className="mt-4 inline-block text-sm font-bold text-green hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              >
                {t(language, "View My Reviews", "áŒáˆáŒˆáˆ›á‹Žá‰¼áŠ• á‹­áˆ˜áˆáŠ¨á‰±")} â†’
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6">
              <span className="text-2xl">âŒ•</span>
              <h3 className="mt-3 font-bold text-navy">{t(language, "Explore Businesses", "áŠ•áŒá‹¶á‰½áŠ• á‹«áˆµáˆ±")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "Discover interesting places around Jimma.", "á‰ áŒ…áˆ› á‹™áˆªá‹« á‹«áˆ‰ áŠ áˆµá‹°áˆ³á‰½ á‰¦á‰³á‹Žá‰½áŠ• á‹«áŒáŠ™á¢")}
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-bold text-green hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
              >
                {t(language, "Explore YeneSpot", "YeneSpotáŠ• á‹«áˆµáˆ±")} â†’
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">{t(language, "Change Password", "á‹¨á‹­áˆˆá á‰ƒáˆ á‰€á‹­áˆ­")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t(language, "Update your account password. You must enter your current password to continue.", "á‹¨áˆ˜áˆˆá‹«á‹ŽáŠ• á‹¨á‹­áˆˆá á‰ƒáˆ á‹«á‹˜áˆáŠ‘á¢ áˆˆáˆ˜á‰€áŒ áˆ áŠ áˆáŠ• á‹«áˆˆá‹áŠ• á‹¨á‹­áˆˆá á‰ƒáˆ áˆ›áˆµáŒˆá‰£á‰µ áŠ áˆˆá‰¥á‹Žá‰µá¢")}
          </p>
          <div className="max-w-xl">
            <PasswordForm />
          </div>
        </section>

        <footer className="mt-12 border-t border-border py-6 text-center text-sm text-muted">
          Â© YeneSpot. {t(language, "Discover local favorites.", "á‹¨áŠ áŠ«á‰£á‰¢á‹ŽáŠ• á‰°á‹ˆá‹³áŒ… á‰¦á‰³á‹Žá‰½ á‹«áŒáŠ™á¢")}
        </footer>
      </div>
    </main>
  );
}