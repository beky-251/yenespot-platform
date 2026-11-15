import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import { HoursForm } from "./hours-form";

export const instant = false;

export default async function BusinessHoursPage() {
  const language = await getAppLanguage();
  const user = await requireRole(["business_owner"]);
  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (businessError || !business) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link
          href="/business/dashboard"
          className="text-sm font-medium text-[#173B35]"
        >
          {t(language, "← Back to dashboard", "← ወደ ዳሽቦርድ ተመለስ")}
        </Link>

        <div className="mt-8 rounded-xl border border-[#E8E6DF] bg-white p-8">
          <h1 className="text-xl font-bold text-[#172B3A]">
            {t(language, "Business not found", "ንግዱ አልተገኘም")}
          </h1>
          <p className="mt-2 text-sm text-[#747C80]">
            {t(
              language,
              "We could not find a business associated with your account.",
              "ከመለያዎ ጋር የተያያዘ ንግድ ማግኘት አልቻልንም።",
            )}
          </p>
        </div>
      </main>
    );
  }

  const { data: hours, error: hoursError } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", business.id)
    .order("day_of_week");

  if (hoursError) {
    throw new Error("Unable to load business hours.");
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/business/dashboard"
          className="text-sm font-medium text-[#173B35] hover:underline"
        >
          {t(language, "← Back to dashboard", "← ወደ ዳሽቦርድ ተመለስ")}
        </Link>

        <header className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#B98526]">
            {t(language, "Business Management", "የንግድ አስተዳደር")}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#172B3A]">
            {t(language, "Business Hours", "የንግድ ሥራ ሰዓቶች")}
          </h1>

          <p className="mt-2 text-[#747C80]">
            {t(
              language,
              `Manage when ${business.name} is open to customers.`,
              `${business.name} ለደንበኞች የሚከፈትበትን ሰዓት ያስተዳድሩ።`,
            )}
          </p>
        </header>

        <HoursForm
          businessId={business.id}
          initialHours={hours ?? []}
        />
      </div>
    </main>
  );
}