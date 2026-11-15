import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import { ServicesManager } from "./services-manager";

export const instant = false;

export default async function BusinessServicesPage() {
  const language = await getAppLanguage();
  const user = await requireRole(["business_owner"]);
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!business) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold text-[#172B3A]">
          {t(language, "Business not found", "ንግድ አልተገኘም")}
        </h1>
        <p className="mt-2 text-[#747C80]">
          {t(
            language,
            "No business listing is associated with your account.",
            "ከመለያዎ ጋር የተያያዘ የንግድ ዝርዝር የለም።",
          )}
        </p>
        <Link
          href="/business/dashboard"
          className="mt-6 inline-block font-semibold text-[#173B35]"
        >
          ← {t(language, "Back to dashboard", "ወደ ዳሽቦርድ ተመለስ")}
        </Link>
      </main>
    );
  }

  const { data: services, error } = await supabase
    .from("business_services")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/business/dashboard"
          className="text-sm font-semibold text-[#173B35] hover:underline"
        >
          ← {t(language, "Back to dashboard", "ወደ ዳሽቦርድ ተመለስ")}
        </Link>

        <header className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#B98526]">
            {t(language, "Business management", "የንግድ አስተዳደር")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#172B3A]">
            {t(language, "Services & Products", "አገልግሎቶች እና ምርቶች")}
          </h1>
          <p className="mt-2 text-[#747C80]">
            {t(
              language,
              `Manage the services and products offered by ${business.name}.`,
              `${business.name} የሚያቀርባቸውን አገልግሎቶችና ምርቶች ያስተዳድሩ።`,
            )}
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {t(
              language,
              "Could not load your services. Please refresh the page.",
              "አገልግሎቶችዎን መጫን አልተቻለም። እባክዎ ገጹን እንደገና ያድሱ።",
            )}
          </div>
        ) : (
          <ServicesManager
            businessId={business.id}
            initialServices={services ?? []}
          />
        )}
      </div>
    </main>
  );
}