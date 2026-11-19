import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { logout } from "@/app/auth/actions";
import PasswordForm from "@/app/profile/password-form";
import { getAppLanguage, t } from "@/lib/i18n";

export const metadata = {
  title: "Admin Dashboard | YeneSpot",
};

export const instant = false;

export default async function AdminDashboardPage() {
  const language = await getAppLanguage();
  const user = await requireRole(["admin", "super_admin"]);

  const sections = [
    {
      title: t(language, "Business Approvals", "á‹¨áŠ•áŒá‹µ áˆ›áŒ½á‹°á‰‚á‹«á‹Žá‰½"),
      description: t(
        language,
        "Review and approve business registration requests.",
        "á‹¨áŠ•áŒá‹µ áˆá‹áŒˆá‰£ áŒ¥á‹«á‰„á‹Žá‰½áŠ• á‹­áˆ˜áˆ­áˆáˆ© áŠ¥áŠ“ á‹«áŒ½á‹µá‰á¢",
      ),
      href: "/admin/business-applications",
    },
    {
      title: t(language, "Business Management", "á‹¨áŠ•áŒá‹µ áŠ áˆµá‰°á‹³á‹°áˆ­"),
      description: t(
        language,
        "Manage listings, approvals, suspensions and verification.",
        "á‹¨áŠ•áŒá‹µ á‹áˆ­á‹áˆ®á‰½áŠ•á£ áˆ›áŒ½á‹°á‰‚á‹«á‹Žá‰½áŠ•á£ áŠ¥áŒˆá‹³á‹Žá‰½áŠ• áŠ¥áŠ“ áˆ›áˆ¨áŒ‹áŒˆáŒ«á‹Žá‰½áŠ• á‹«áˆµá‰°á‹³á‹µáˆ©á¢",
      ),
      href: "/admin/businesses",
    },
    {
      title: t(language, "Customer Management", "á‹¨á‹°áŠ•á‰ áŠžá‰½ áŠ áˆµá‰°á‹³á‹°áˆ­"),
      description: t(
        language,
        "View and manage customer accounts.",
        "á‹¨á‹°áŠ•á‰ áŠžá‰½áŠ• áˆ˜áˆˆá‹«á‹Žá‰½ á‹­áˆ˜áˆáŠ¨á‰± áŠ¥áŠ“ á‹«áˆµá‰°á‹³á‹µáˆ©á¢",
      ),
    },
    {
      title: t(language, "Reviews Management", "á‹¨áŒáˆáŒˆáˆ›á‹Žá‰½ áŠ áˆµá‰°á‹³á‹°áˆ­"),
      description: t(
        language,
        "Monitor customer reviews and reports.",
        "á‹¨á‹°áŠ•á‰ áŠžá‰½áŠ• áŒáˆáŒˆáˆ›á‹Žá‰½ áŠ¥áŠ“ áˆªá–áˆ­á‰¶á‰½ á‹­áŠ¨á‰³á‰°áˆ‰á¢",
      ),
    },
    {
      title: t(language, "Categories", "áˆá‹µá‰¦á‰½"),
      description: t(
        language,
        "Manage business categories.",
        "á‹¨áŠ•áŒá‹µ áˆá‹µá‰¦á‰½áŠ• á‹«áˆµá‰°á‹³á‹µáˆ©á¢",
      ),
    },
    {
      title: t(language, "Platform Settings", "á‹¨áˆ˜á‹µáˆ¨áŠ­ á‰…áŠ•á‰¥áˆ®á‰½"),
      description: t(
        language,
        "Manage platform configuration.",
        "á‹¨áˆ˜á‹µáˆ¨áŠ©áŠ• á‰…áŠ•á‰¥áˆ®á‰½ á‹«áˆµá‰°á‹³á‹µáˆ©á¢",
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
            Yene<span className="text-gold">Spot</span>
            <span className="ml-2 text-xs font-semibold text-muted">ADMIN</span>
          </Link>

          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
              {t(language, "Sign out", "á‹áŒ£")}
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <section className="rounded-2xl bg-navy p-8 text-white sm:p-10">
          <p className="text-sm font-medium text-white/70">
            {t(language, "ADMINISTRATION", "áŠ áˆµá‰°á‹³á‹°áˆ­")}
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {t(language, "YeneSpot Admin Dashboard", "á‹¨YeneSpot áŠ áˆµá‰°á‹³á‹³áˆª á‹³áˆ½á‰¦áˆ­á‹µ")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            {t(
              language,
              "Manage business listings, review registrations, support customers, and maintain the quality of the YeneSpot platform.",
              "á‹¨áŠ•áŒá‹µ á‹áˆ­á‹áˆ®á‰½áŠ• á‹«áˆµá‰°á‹³á‹µáˆ©á£ áˆá‹áŒˆá‰£á‹Žá‰½áŠ• á‹­áˆ˜áˆ­áˆáˆ©á£ á‹°áŠ•á‰ áŠžá‰½áŠ• á‹­áˆ­á‹± áŠ¥áŠ“ á‹¨YeneSpot áˆ˜á‹µáˆ¨áŠ­áŠ• áŒ¥áˆ«á‰µ á‹­áŒ á‰¥á‰á¢",
            )}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Platform management", "á‹¨áˆ˜á‹µáˆ¨áŠ­ áŠ áˆµá‰°á‹³á‹°áˆ­")}
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => {
              const content = (
                <>
                  <h3 className="font-bold text-navy">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {section.description}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-gold">
                    {section.href
                      ? t(language, "Open management â†’", "áŠ áˆµá‰°á‹³á‹°áˆ©áŠ• áŠ­áˆá‰µ â†’")
                      : t(language, "Coming soon", "á‰ á‰…áˆ­á‰¡ á‹­áˆ˜áŒ£áˆ")}
                  </p>
                </>
              );

              return section.href ? (
                <Link
                  key={section.title}
                  href={section.href}
                  className="rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={section.title}
                  className="rounded-2xl border border-border bg-white p-6"
                >
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        <p className="mt-8 text-sm text-muted">
          {t(language, "Signed in as:", "áŒˆá‰¥á‰°á‹‹áˆ á‰ á‹šáˆ… áˆ˜áˆˆá‹«:")} {user.email}
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Change Password", "á‹¨á‹­áˆˆá á‰ƒáˆ á‰€á‹­áˆ­")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t(
              language,
              "Update your account password. You must enter your current password to continue.",
              "á‹¨áˆ˜áˆˆá‹«á‹ŽáŠ• á‹¨á‹­áˆˆá á‰ƒáˆ á‹«á‹˜áˆáŠ‘á¢ áˆˆáˆ˜á‰€áŒ áˆ á‹¨áŠ áˆáŠ‘áŠ• á‹¨á‹­áˆˆá á‰ƒáˆ áˆ›áˆµáŒˆá‰£á‰µ áŠ áˆˆá‰¥á‹Žá‰µá¢",
            )}
          </p>
          <div className="max-w-xl">
            <PasswordForm />
          </div>
        </section>

        <footer className="mt-12 border-t border-border py-6 text-center text-sm text-muted">
          Â© YeneSpot {t(language, "Administration", "áŠ áˆµá‰°á‹³á‹°áˆ­")}.
        </footer>
      </div>
    </main>
  );
}