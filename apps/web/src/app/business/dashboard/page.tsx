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
    [t(language, "Total businesses", "áŒ á‰…áˆ‹áˆ‹ áŠ•áŒá‹¶á‰½"), totalBusinesses],
    [t(language, "Approved listings", "á‹¨áŒ¸á‹°á‰ á‹áˆ­á‹áˆ®á‰½"), approvedBusinesses],
    [t(language, "Pending listings", "á‰ áˆ˜áŒ á‰£á‰ á‰… áˆ‹á‹­ á‹«áˆ‰"), pendingBusinesses],
    [t(language, "Customer reviews", "á‹¨á‹°áŠ•á‰ áŠžá‰½ áŒáˆáŒˆáˆ›á‹Žá‰½"), totalReviews],
  ];

  const managementItems = [
    {
      title: "Photos",
      titleAm: "áŽá‰¶á‹Žá‰½",
      description: "Show customers what your business looks like.",
      descriptionAm: "á‹°áŠ•á‰ áŠžá‰½ áŠ•áŒá‹µá‹Ž áˆáŠ• áŠ¥áŠ•á‹°áˆšáˆ˜áˆµáˆ áŠ¥áŠ•á‹²á‹«á‹© á‹«á‹µáˆ­áŒ‰á¢",
      link: null,
      action: "Coming soon",
      actionAm: "á‰ á‰…áˆ­á‰¡",
    },
    {
      title: "Reviews",
      titleAm: "áŒáˆáŒˆáˆ›á‹Žá‰½",
      description: "Read and respond to customer reviews.",
      descriptionAm: "á‹¨á‹°áŠ•á‰ áŠžá‰½áŠ• áŒáˆáŒˆáˆ›á‹Žá‰½ á‹«áŠ•á‰¥á‰¡ áŠ¥áŠ“ áˆáˆ‹áˆ½ á‹­áˆµáŒ¡á¢",
      link: "/business/reviews",
      action: "Manage reviews",
      actionAm: "áŒáˆáŒˆáˆ›á‹Žá‰½áŠ• á‹«áˆµá‰°á‹³á‹µáˆ©",
    },
    {
      title: "Notifications",
      titleAm: "áˆ›áˆ³á‹ˆá‰‚á‹«á‹Žá‰½",
      description: "Stay updated about new customer reviews.",
      descriptionAm: "áˆµáˆˆ áŠ á‹³á‹²áˆµ á‹¨á‹°áŠ•á‰ áŠ› áŒáˆáŒˆáˆ›á‹Žá‰½ áˆ˜áˆ¨áŒƒ á‹«áŒáŠ™á¢",
      link: "/business/notifications",
      action: "View notifications",
      actionAm: "áˆ›áˆ³á‹ˆá‰‚á‹«á‹Žá‰½áŠ• á‹­áˆ˜áˆáŠ¨á‰±",
    },
    {
      title: "Business Hours",
      titleAm: "á‹¨áˆ¥áˆ« áˆ°á‹“á‰¶á‰½",
      description: "Keep your opening hours up to date.",
      descriptionAm: "á‹¨áˆ˜áŠ­áˆá‰» áˆ°á‹“á‰¶á‰½á‹ŽáŠ• á‹ˆá‰…á‰³á‹Š á‹«á‹µáˆ­áŒ‰á¢",
      link: "/business/hours",
      action: "Manage hours",
      actionAm: "áˆ°á‹“á‰¶á‰½áŠ• á‹«áˆµá‰°á‹³á‹µáˆ©",
    },
    {
      title: "Services",
      titleAm: "áŠ áŒˆáˆáŒáˆŽá‰¶á‰½",
      description: "Manage the services your business offers.",
      descriptionAm: "áŠ•áŒá‹µá‹Ž á‹¨áˆšá‹«á‰€áˆ­á‰£á‰¸á‹áŠ• áŠ áŒˆáˆáŒáˆŽá‰¶á‰½ á‹«áˆµá‰°á‹³á‹µáˆ©á¢",
      link: "/business/services",
      action: "Manage services",
      actionAm: "áŠ áŒˆáˆáŒáˆŽá‰¶á‰½áŠ• á‹«áˆµá‰°á‹³á‹µáˆ©",
    },
    {
      title: "Subscription",
      titleAm: "á‹¨á‹°áŠ•á‰ áŠáŠá‰µ áˆá‹áŒˆá‰£",
      description: "View your subscription and plan information.",
      descriptionAm: "á‹¨áˆá‹áŒˆá‰£á‹ŽáŠ• áŠ¥áŠ“ á‹¨á‹•á‰…á‹µá‹ŽáŠ• áˆ˜áˆ¨áŒƒ á‹­áˆ˜áˆáŠ¨á‰±á¢",
      link: null,
      action: "Coming soon",
      actionAm: "á‰ á‰…áˆ­á‰¡",
    },
  ];

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
            Yene<span className="text-gold">Spot</span>
          </Link>

          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
              {t(language, "Sign out", "á‹áŒ£")}
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <section className="rounded-2xl bg-green p-8 text-white sm:p-10">
          <p className="text-sm font-medium text-white/70">
            {t(language, "BUSINESS OWNER DASHBOARD", "á‹¨áŠ•áŒá‹µ á‰£áˆˆá‰¤á‰µ á‹³áˆ½á‰¦áˆ­á‹µ")}
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {t(language, "Welcome to your business dashboard!", "á‹ˆá‹° áŠ•áŒá‹µ á‹³áˆ½á‰¦áˆ­á‹µá‹Ž áŠ¥áŠ•áŠ³áŠ• á‰ á‹°áˆ…áŠ“ áˆ˜áŒ¡!")}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
            {t(language, "Manage your business presence, connect with customers, and grow your visibility on YeneSpot.", "á‹¨áŠ•áŒá‹µá‹ŽáŠ• áˆ˜áˆ¨áŒƒ á‹«áˆµá‰°á‹³á‹µáˆ©á£ áŠ¨á‹°áŠ•á‰ áŠžá‰½ áŒ‹áˆ­ á‹­áŒˆáŠ“áŠ™ áŠ¥áŠ“ á‰ YeneSpot áˆ‹á‹­ á‹¨áŠ•áŒá‹µá‹ŽáŠ• á‰³á‹­áŠá‰µ á‹«áˆ³á‹µáŒ‰á¢")}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Business overview", "á‹¨áŠ•áŒá‹µ áŠ áŒ á‰ƒáˆ‹á‹­ áŠ¥á‹­á‰³")}
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
                {t(language, "My businesses", "áŠ•áŒá‹¶á‰¼")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t(language, "Manage your registered business listings.", "á‹¨á‰°áˆ˜á‹˜áŒˆá‰¡ á‹¨áŠ•áŒá‹µ á‹áˆ­á‹áˆ®á‰½á‹ŽáŠ• á‹«áˆµá‰°á‹³á‹µáˆ©á¢")}
              </p>
            </div>
          </div>

          {error ? (
            <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
              {t(language, "We could not load your businesses. Please refresh and try again.", "áŠ•áŒá‹¶á‰½á‹ŽáŠ• áˆ˜áŒ«áŠ• áŠ áˆá‰°á‰»áˆˆáˆá¢ áŠ¥á‰£áŠ­á‹Ž áŒˆáŒ¹áŠ• áŠ á‹µáˆµá‰°á‹ áŠ¥áŠ•á‹°áŒˆáŠ“ á‹­áˆžáŠ­áˆ©á¢")}
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
                          ? "á‰ áˆ˜áŒ á‰£á‰ á‰… áˆ‹á‹­"
                          : business.status === "approved"
                            ? "áŒ¸á‹µá‰‹áˆ"
                            : business.status === "rejected"
                              ? "á‹á‹µá‰… á‰°á‹°áˆ­áŒ“áˆ"
                              : business.status === "suspended"
                                ? "á‰³áŒá‹·áˆ"
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
                        {t(language, "RATING", "á‹°áˆ¨áŒƒ")}
                      </p>
                      <p className="mt-2 font-semibold text-navy">
                        {Number(business.average_rating).toFixed(1)} / 5
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-muted">
                        {t(language, "REVIEWS", "áŒáˆáŒˆáˆ›á‹Žá‰½")}
                      </p>
                      <p className="mt-2 font-semibold text-navy">
                        {business.review_count}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-muted">
                        {t(language, "VERIFICATION", "áˆ›áˆ¨áŒ‹áŒˆáŒ«")}
                      </p>
                      <p className="mt-2 font-semibold text-navy">
                        {business.verified
                          ? t(language, "Verified", "á‹¨á‰°áˆ¨áŒ‹áŒˆáŒ ")
                          : t(language, "Not verified", "á‹«áˆá‰°áˆ¨áŒ‹áŒˆáŒ ")}
                      </p>
                    </div>

                    {business.phone && (
                      <div>
                        <p className="text-xs font-bold text-muted">
                          {t(language, "PHONE", "áˆµáˆáŠ­")}
                        </p>
                        <p className="mt-2 text-sm text-navy">
                          {business.phone}
                        </p>
                      </div>
                    )}

                    {business.email && (
                      <div>
                        <p className="text-xs font-bold text-muted">
                          {t(language, "EMAIL", "áŠ¢áˆœá‹­áˆ")}
                        </p>
                        <p className="mt-2 break-all text-sm text-navy">
                          {business.email}
                        </p>
                      </div>
                    )}

                    {business.address && (
                      <div>
                        <p className="text-xs font-bold text-muted">
                          {t(language, "ADDRESS", "áŠ á‹µáˆ«áˆ»")}
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
                        {t(language, "Your business listing is awaiting review.", "á‹¨áŠ•áŒá‹µ á‹áˆ­á‹áˆ­á‹Ž áŒáˆáŒˆáˆ›áŠ• áŠ¥á‹¨áŒ á‰ á‰€ áŠá‹á¢")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {t(language, "Customers will be able to discover your business after the administration team approves the listing.", "á‹¨áŠ áˆµá‰°á‹³á‹°áˆ­ á‰¡á‹µáŠ‘ á‹áˆ­á‹áˆ­á‹ŽáŠ• áŠ«áŒ¸á‹°á‰€ á‰ áŠ‹áˆ‹ á‹°áŠ•á‰ áŠžá‰½ áŠ•áŒá‹µá‹ŽáŠ• áˆ›áŒáŠ˜á‰µ á‹­á‰½áˆ‹áˆ‰á¢")}
                      </p>
                    </div>
                  )}

                  {business.status === "approved" && (
                    <div className="mt-6 rounded-xl border border-green/20 bg-green/5 p-4">
                      <p className="text-sm font-semibold text-green">
                        {t(language, "Your business listing is public.", "á‹¨áŠ•áŒá‹µ á‹áˆ­á‹áˆ­á‹Ž áˆˆáˆáˆ‰áˆ á‹­á‰³á‹«áˆá¢")}
                      </p>
                    </div>
                  )}

                  <div className="mt-5">
                    <p className="text-xs text-muted">
                      {t(language, "Business ID:", "á‹¨áŠ•áŒá‹µ áˆ˜áˆˆá‹«:")} {business.id}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-border bg-white p-8 text-center">
              <h3 className="text-lg font-bold text-navy">
                {t(language, "No business listings yet", "áŠ¥áˆµáŠ«áˆáŠ• á‹¨áŠ•áŒá‹µ á‹áˆ­á‹áˆ­ á‹¨áˆˆáˆ")}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {t(language, "Your approved business applications will appear here.", "á‹¨áŒ¸á‹°á‰ á‹¨áŠ•áŒá‹µ áˆ›áˆ˜áˆáŠ¨á‰»á‹Žá‰½á‹Ž áŠ¥á‹šáˆ… á‹­á‰³á‹«áˆ‰á¢")}
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Business management", "á‹¨áŠ•áŒá‹µ áŠ áˆµá‰°á‹³á‹°áˆ­")}
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/business/profile"
              className="rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            >
              <h3 className="font-bold text-navy">
                {t(language, "Business Profile", "á‹¨áŠ•áŒá‹µ áˆ˜áŒˆáˆˆáŒ«")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(language, "Update your business name, description, contact information, and address.", "á‹¨áŠ•áŒá‹µ áˆµáˆá‹ŽáŠ•á£ áˆ˜áŒáˆˆáŒ«á‹ŽáŠ•á£ á‹¨áˆ˜áŒˆáŠ› áˆ˜áˆ¨áŒƒá‹ŽáŠ• áŠ¥áŠ“ áŠ á‹µáˆ«áˆ»á‹ŽáŠ• á‹«á‹˜áˆáŠ‘á¢")}
              </p>
              <p className="mt-4 text-xs font-semibold text-green">
                {t(language, "Manage profile â†’", "áˆ˜áŒˆáˆˆáŒ«áŠ• á‹«áˆµá‰°á‹³á‹µáˆ© â†’")}
              </p>
            </Link>

            {managementItems.map((item) => (
              item.link ? (
                <Link
                  key={item.title}
                  href={item.link}
                  className="rounded-2xl border border-border bg-white p-6 transition hover:border-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-navy">
                      {t(language, item.title, item.titleAm)}
                    </h3>
                    {item.title === "Notifications" &&
                      (unreadNotifications ?? 0) > 0 && (
                        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-green">
                          {unreadNotifications} {t(language, "unread", "á‹«áˆá‰°áŠá‰ á‰¡")}
                        </span>
                      )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {t(language, item.description, item.descriptionAm)}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-green">
                    {t(language, item.action, item.actionAm)} â†’
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
          {t(language, "Signed in as:", "áŒˆá‰¥á‰°á‹‹áˆ á‰ :")} {user.email}
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Change Password", "á‹¨á‹­áˆˆá á‰ƒáˆ á‹­á‰€á‹­áˆ©")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t(language, "Update your account password. You must enter your current password to continue.", "á‹¨áˆ˜áˆˆá‹«á‹ŽáŠ• á‹¨á‹­áˆˆá á‰ƒáˆ á‹«á‹˜áˆáŠ‘á¢ áˆˆáˆ˜á‰€áŒ áˆ á‹¨áŠ áˆáŠ‘áŠ• á‹¨á‹­áˆˆá á‰ƒáˆ áˆ›áˆµáŒˆá‰£á‰µ áŠ áˆˆá‰¥á‹Žá‰µá¢")}
          </p>
          <div className="max-w-xl">
            <PasswordForm />
          </div>
        </section>

        <footer className="mt-12 border-t border-border py-6 text-center text-sm text-muted">
          Â© YeneSpot. {t(language, "Empowering local businesses.", "á‹¨áŠ áŠ«á‰£á‰¢ áŠ•áŒá‹¶á‰½áŠ• áˆ›á‰ áˆ¨á‰³á‰³á‰µá¢")}
        </footer>
      </div>
    </main>
  );
}
