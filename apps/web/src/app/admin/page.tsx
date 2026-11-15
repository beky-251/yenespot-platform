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
      title: t(language, "Business Approvals", "የንግድ ማጽደቂያዎች"),
      description: t(
        language,
        "Review and approve business registration requests.",
        "የንግድ ምዝገባ ጥያቄዎችን ይመርምሩ እና ያጽድቁ።",
      ),
      href: "/admin/business-applications",
    },
    {
      title: t(language, "Business Management", "የንግድ አስተዳደር"),
      description: t(
        language,
        "Manage listings, approvals, suspensions and verification.",
        "የንግድ ዝርዝሮችን፣ ማጽደቂያዎችን፣ እገዳዎችን እና ማረጋገጫዎችን ያስተዳድሩ።",
      ),
      href: "/admin/businesses",
    },
    {
      title: t(language, "Customer Management", "የደንበኞች አስተዳደር"),
      description: t(
        language,
        "View and manage customer accounts.",
        "የደንበኞችን መለያዎች ይመልከቱ እና ያስተዳድሩ።",
      ),
    },
    {
      title: t(language, "Reviews Management", "የግምገማዎች አስተዳደር"),
      description: t(
        language,
        "Monitor customer reviews and reports.",
        "የደንበኞችን ግምገማዎች እና ሪፖርቶች ይከታተሉ።",
      ),
    },
    {
      title: t(language, "Categories", "ምድቦች"),
      description: t(
        language,
        "Manage business categories.",
        "የንግድ ምድቦችን ያስተዳድሩ።",
      ),
    },
    {
      title: t(language, "Platform Settings", "የመድረክ ቅንብሮች"),
      description: t(
        language,
        "Manage platform configuration.",
        "የመድረኩን ቅንብሮች ያስተዳድሩ።",
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-extrabold text-green">
            Yene<span className="text-gold">Spot</span>
            <span className="ml-2 text-xs font-semibold text-muted">ADMIN</span>
          </Link>

          <form action={logout}>
            <button className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy">
              {t(language, "Sign out", "ውጣ")}
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <section className="rounded-2xl bg-navy p-8 text-white sm:p-10">
          <p className="text-sm font-medium text-white/70">
            {t(language, "ADMINISTRATION", "አስተዳደር")}
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {t(language, "YeneSpot Admin Dashboard", "የYeneSpot አስተዳዳሪ ዳሽቦርድ")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            {t(
              language,
              "Manage business listings, review registrations, support customers, and maintain the quality of the YeneSpot platform.",
              "የንግድ ዝርዝሮችን ያስተዳድሩ፣ ምዝገባዎችን ይመርምሩ፣ ደንበኞችን ይርዱ እና የYeneSpot መድረክን ጥራት ይጠብቁ።",
            )}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Platform management", "የመድረክ አስተዳደር")}
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
                      ? t(language, "Open management →", "አስተዳደሩን ክፈት →")
                      : t(language, "Coming soon", "በቅርቡ ይመጣል")}
                  </p>
                </>
              );

              return section.href ? (
                <Link
                  key={section.title}
                  href={section.href}
                  className="rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-gold hover:shadow-md"
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
          {t(language, "Signed in as:", "ገብተዋል በዚህ መለያ:")} {user.email}
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">
            {t(language, "Change Password", "የይለፍ ቃል ቀይር")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t(
              language,
              "Update your account password. You must enter your current password to continue.",
              "የመለያዎን የይለፍ ቃል ያዘምኑ። ለመቀጠል የአሁኑን የይለፍ ቃል ማስገባት አለብዎት።",
            )}
          </p>
          <div className="max-w-xl">
            <PasswordForm />
          </div>
        </section>

        <footer className="mt-12 border-t border-border py-6 text-center text-sm text-muted">
          © YeneSpot {t(language, "Administration", "አስተዳደር")}.
        </footer>
      </div>
    </main>
  );
}