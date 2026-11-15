import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import { logout } from "@/app/auth/actions";
import PasswordForm from "@/app/profile/password-form";

export const metadata = {
  title: "Business Dashboard | YeneSpot",
  description: "Manage your businesses on YeneSpot.",
};

export const instant = false;

const statusStyles: Record<string, string> = {
  pending: "bg-gold/10 text-gold",
  approved: "bg-green/10 text-green",
  rejected: "bg-red-50 text-red-700",
  suspended: "bg-gray-100 text-gray-600",
};

export default async function BusinessDashboardPage() {
  const language = await getAppLanguage();
  const user = await requireRole(["business_owner"]);
  const supabase = await createClient();

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, description, phone, email, website, address, city, neighborhood, status, verified, average_rating, review_count, created_at",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const totalBusinesses = businesses?.length ?? 0;
  const approvedBusinesses =
    businesses?.filter((business) => business.status === "approved").length ??
    0;
  const pendingBusinesses =
    businesses?.filter((business) => business.status === "pending").length ?? 0;
  const totalReviews =
    businesses?.reduce((total, business) => total + business.review_count, 0) ??
    0;

  const overviewItems = [
    [t(language, "Total businesses", "ጠቅላላ ንግዶች"), totalBusinesses],
    [t(language, "Approved listings", "የጸደቁ ዝርዝሮች"), approvedBusinesses],
    [t(language, "Pending listings", "በመጠባበቅ ላይ ያሉ"), pendingBusinesses],
    [t(language, "Customer reviews", "የደንበኞች ግምገማዎች"), totalReviews],
  ];

  const managementItems = [
    {
      title: "Photos",
      titleAm: "ፎቶዎች",
      description: "Show customers what your business looks like.",
      descriptionAm: "ደንበኞች ንግድዎ ምን እንደሚመስል እንዲያዩ ያድርጉ።",
      link: null,
      action: "Coming soon",
      actionAm: "በቅርቡ",
    },
    {
      title: "Reviews",
      titleAm: "ግምገማዎች",
      description: "Read and respond to customer reviews.",
      descriptionAm: "የደንበኞችን ግምገማዎች ያንብቡ እና ምላሽ ይስጡ።",
      link: "/business/reviews",
      action: "Manage reviews",
      actionAm: "ግምገማዎችን ያስተዳድሩ",
    },
    {
      title: "Notifications",
      titleAm: "ማሳወቂያዎች",
      description: "Stay updated about new customer reviews.",
      descriptionAm: "ስለ አዳዲስ የደንበኛ ግምገማዎች መረጃ ያግኙ።",
      link: "/business/notifications",
      action: "View notifications",
      actionAm: "ማሳወቂያዎችን ይመልከቱ",
    },
    {
      title: "Business Hours",
      titleAm: "የሥራ ሰዓቶች",
      description: "Keep your opening hours up to date.",
      descriptionAm: "የመክፈቻ ሰዓቶችዎን ወቅታዊ ያድርጉ።",
      link: "/business/hours",
      action: "Manage hours",
      actionAm: "ሰዓቶችን ያስተዳድሩ",
    },
    {
      title: "Services",
      titleAm: "አገልግሎቶች",
      description: "Manage the services your business offers.",
      descriptionAm: "ንግድዎ የሚያቀርባቸውን አገልግሎቶች ያስተዳድሩ።",
      link: "/business/services",
      action: "Manage services",
      actionAm: "አገልግሎቶችን ያስተዳድሩ",
    },
    {
      title: "Subscription",
      titleAm: "የደንበኝነት ምዝገባ",
      description: "View your subscription and plan information.",
      descriptionAm: "የምዝገባዎን እና የዕቅድዎን መረጃ ይመልከቱ።",
      link: null,
      action: "Coming soon",
      actionAm: "በቅርቡ",
    },
  ];

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green">
            Yene<span className="text-gold">Spot</span>
          </Link>

          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy">
              {t(language, "Sign out", "ውጣ")}
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <section className="rounded-2xl bg-green p-8 text-white sm:p-10">
          <p className="text-sm font-medium text-white/70">
            {t(language, "BUSINESS OWNER DASHBOARD", "የንግድ ባለቤት ዳሽቦርድ")}
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {t(language, "Welcome to your business dashboard!", "ወደ ንግድ ዳሽቦርድዎ እንኳን በደህና መጡ!")}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
            {t(language, "Manage your business presence, connect with customers, and grow your visibility on YeneSpot.", "የንግድዎን መረጃ ያስተዳድሩ፣ ከደንበኞች ጋር ይገናኙ እና በYeneSpot ላይ የንግድዎን ታይነት ያሳድጉ።")}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Business overview", "የንግድ አጠቃላይ እይታ")}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewItems.map(([title, value]) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-white p-6"
              >
                <p className="text-sm text-muted">{title}</p>
                <p className="mt-3 text-3xl font-bold text-navy">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy">
                {t(language, "My businesses", "ንግዶቼ")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t(language, "Manage your registered business listings.", "የተመዘገቡ የንግድ ዝርዝሮችዎን ያስተዳድሩ።")}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
              {t(language, "We could not load your businesses. Please refresh and try again.", "ንግዶችዎን መጫን አልተቻለም። እባክዎ ገጹን አድስተው እንደገና ይሞክሩ።")}
            </div>
          ) : businesses && businesses.length > 0 ? (
            <div className="mt-5 space-y-5">
              {businesses.map((business) => (
                <article
                  key={business.id}
                  className="rounded-2xl border border-border bg-white p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-navy">
                        {business.name}
                      </h3>

                      <p className="mt-2 text-sm text-muted">
                        {business.neighborhood
                          ? `${business.neighborhood}, `
                          : ""}
                        {business.city}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${
                        statusStyles[business.status] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t(
                        language,
                        business.status,
                        business.status === "pending"
                          ? "በመጠባበቅ ላይ"
                          : business.status === "approved"
                            ? "ጸድቋል"
                            : business.status === "rejected"
                              ? "ውድቅ ተደርጓል"
                              : business.status === "suspended"
                                ? "ታግዷል"
                                : business.status,
                      )}
                    </span>
                  </div>

                  {business.description && (
                    <p className="mt-4 text-sm leading-7 text-muted">
                      {business.description}
                    </p>
                  )}

                  <div className="mt-6 grid gap-5 border-t border-border pt-6 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold text-muted">
                        {t(language, "RATING", "ደረጃ")}
                      </p>
                      <p className="mt-2 font-semibold text-navy">
                        {Number(business.average_rating).toFixed(1)} / 5
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-muted">
                        {t(language, "REVIEWS", "ግምገማዎች")}
                      </p>
                      <p className="mt-2 font-semibold text-navy">
                        {business.review_count}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-muted">
                        {t(language, "VERIFICATION", "ማረጋገጫ")}
                      </p>
                      <p className="mt-2 font-semibold text-navy">
                        {business.verified
                          ? t(language, "Verified", "የተረጋገጠ")
                          : t(language, "Not verified", "ያልተረጋገጠ")}
                      </p>
                    </div>

                    {business.phone && (
                      <div>
                        <p className="text-xs font-bold text-muted">
                          {t(language, "PHONE", "ስልክ")}
                        </p>
                        <p className="mt-2 text-sm text-navy">
                          {business.phone}
                        </p>
                      </div>
                    )}

                    {business.email && (
                      <div>
                        <p className="text-xs font-bold text-muted">
                          {t(language, "EMAIL", "ኢሜይል")}
                        </p>
                        <p className="mt-2 break-all text-sm text-navy">
                          {business.email}
                        </p>
                      </div>
                    )}

                    {business.address && (
                      <div>
                        <p className="text-xs font-bold text-muted">
                          {t(language, "ADDRESS", "አድራሻ")}
                        </p>
                        <p className="mt-2 text-sm text-navy">
                          {business.address}
                        </p>
                      </div>
                    )}
                  </div>

                  {business.status === "pending" && (
                    <div className="mt-6 rounded-xl border border-gold/20 bg-gold/5 p-4">
                      <p className="text-sm font-semibold text-navy">
                        {t(language, "Your business listing is awaiting review.", "የንግድ ዝርዝርዎ ግምገማን እየጠበቀ ነው።")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {t(language, "Customers will be able to discover your business after the administration team approves the listing.", "የአስተዳደር ቡድኑ ዝርዝርዎን ካጸደቀ በኋላ ደንበኞች ንግድዎን ማግኘት ይችላሉ።")}
                      </p>
                    </div>
                  )}

                  {business.status === "approved" && (
                    <div className="mt-6 rounded-xl border border-green/20 bg-green/5 p-4">
                      <p className="text-sm font-semibold text-green">
                        {t(language, "Your business listing is public.", "የንግድ ዝርዝርዎ ለሁሉም ይታያል።")}
                      </p>
                    </div>
                  )}

                  <div className="mt-5">
                    <p className="text-xs text-muted">
                      {t(language, "Business ID:", "የንግድ መለያ:")} {business.id}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-border bg-white p-8 text-center">
              <h3 className="text-lg font-bold text-navy">
                {t(language, "No business listings yet", "እስካሁን የንግድ ዝርዝር የለም")}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {t(language, "Your approved business applications will appear here.", "የጸደቁ የንግድ ማመልከቻዎችዎ እዚህ ይታያሉ።")}
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Business management", "የንግድ አስተዳደር")}
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/business/profile"
              className="rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="font-bold text-navy">
                {t(language, "Business Profile", "የንግድ መገለጫ")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "Update your business name, description, contact information, and address.", "የንግድ ስምዎን፣ መግለጫዎን፣ የመገኛ መረጃዎን እና አድራሻዎን ያዘምኑ።")}
              </p>
              <p className="mt-4 text-xs font-semibold text-green">
                {t(language, "Manage profile →", "መገለጫን ያስተዳድሩ →")}
              </p>
            </Link>

            {managementItems.map((item) => (
              item.link ? (
                <Link
                  key={item.title}
                  href={item.link}
                  className="rounded-2xl border border-border bg-white p-6 transition hover:border-gold hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-navy">
                      {t(language, item.title, item.titleAm)}
                    </h3>
                    {item.title === "Notifications" &&
                      (unreadNotifications ?? 0) > 0 && (
                        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-green">
                          {unreadNotifications} {t(language, "unread", "ያልተነበቡ")}
                        </span>
                      )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {t(language, item.description, item.descriptionAm)}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-green">
                    {t(language, item.action, item.actionAm)} →
                  </p>
                </Link>
              ) : (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-white p-6"
                >
                  <h3 className="font-bold text-navy">
                    {t(language, item.title, item.titleAm)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {t(language, item.description, item.descriptionAm)}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-gold">
                    {t(language, item.action, item.actionAm)}
                  </p>
                </div>
              )
            ))}
          </div>
        </section>

        <p className="mt-8 text-sm text-muted">
          {t(language, "Signed in as:", "ገብተዋል በ:")} {user.email}
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Change Password", "የይለፍ ቃል ይቀይሩ")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t(language, "Update your account password. You must enter your current password to continue.", "የመለያዎን የይለፍ ቃል ያዘምኑ። ለመቀጠል የአሁኑን የይለፍ ቃል ማስገባት አለብዎት።")}
          </p>
          <div className="max-w-xl">
            <PasswordForm />
          </div>
        </section>

        <footer className="mt-12 border-t border-border py-6 text-center text-sm text-muted">
          © YeneSpot. {t(language, "Empowering local businesses.", "የአካባቢ ንግዶችን ማበረታታት።")}
        </footer>
      </div>
    </main>
  );
}