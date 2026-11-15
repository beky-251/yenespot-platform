import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getAppLanguage, t } from "@/lib/i18n";
import { markCustomerNotificationAsRead } from "./actions";

export const metadata = {
  title: "My Notifications | YeneSpot",
  description: "Stay updated when businesses reply to your reviews.",
};

export const instant = false;

export default async function CustomerNotificationsPage() {
  const language = await getAppLanguage();
  const user = await requireRole(["customer"]);
  const supabase = await createClient();

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(
      "id, type, title, message, business_id, review_id, is_read, read_at, created_at",
    )
    .eq("user_id", user.id)
    .eq("type", "review_response_received")
    .order("created_at", { ascending: false });

  const notificationList = notifications ?? [];

  const businessIds = [
    ...new Set(
      notificationList.map((notification) => notification.business_id),
    ),
  ];

  const { data: businessResults } =
    businessIds.length > 0
      ? await supabase
          .from("businesses")
          .select("id, name, slug")
          .in("id", businessIds)
      : { data: [] };

  const businessMap = new Map(
    (businessResults ?? []).map((business) => [business.id, business]),
  );

  const unreadCount = notificationList.filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <Link
          href="/profile"
          className="text-sm font-semibold text-green hover:underline"
        >
          {t(language, "← Back to profile", "← ወደ መገለጫ ተመለስ")}
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy">
              {t(language, "My Notifications", "ማሳወቂያዎቼ")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t(language, "See when businesses reply to your reviews.", "ንግዶች ለግምገማዎችዎ ምላሽ ሲሰጡ ይመልከቱ።")}
            </p>
          </div>

          <span className="rounded-full bg-green/10 px-4 py-2 text-sm font-semibold text-green">
            {unreadCount} {t(language, "unread", "ያልተነበቡ")}
          </span>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
            {t(language, "We could not load your notifications. Please refresh and try again.", "ማሳወቂያዎችዎን መጫን አልተቻለም። እባክዎ ገጹን አድስተው እንደገና ይሞክሩ።")}
          </div>
        ) : notificationList.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-navy">
              {t(language, "You are all caught up!", "ሁሉንም ማሳወቂያዎች አንብበዋል!")}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {t(language, "When a business replies to one of your reviews, the notification will appear here.", "አንድ ንግድ ለግምገማዎ ምላሽ ሲሰጥ፣ ማሳወቂያው እዚህ ይታያል።")}
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {notificationList.map((notification) => {
              const business = businessMap.get(notification.business_id);

              return (
                <article
                  key={notification.id}
                  className={`rounded-2xl border bg-white p-6 ${
                    notification.is_read
                      ? "border-border"
                      : "border-gold/40 bg-gold/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-navy">
                        {notification.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {notification.message}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <span className="shrink-0 rounded-full bg-green/10 px-3 py-1 text-xs font-bold text-green">
                        {t(language, "New", "አዲስ")}
                      </span>
                    )}
                  </div>

                  {business && (
                    <p className="mt-3 text-sm font-medium text-green">
                      {business.name}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-xs text-muted">
                      {new Date(notification.created_at).toLocaleString(
                        language === "am" ? "am-ET" : "en-ET",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Africa/Addis_Ababa",
                        },
                      )}
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                      {!notification.is_read && (
                        <form action={markCustomerNotificationAsRead}>
                          <input
                            type="hidden"
                            name="notificationId"
                            value={notification.id}
                          />
                          <button
                            type="submit"
                            className="text-sm font-semibold text-green hover:underline"
                          >
                            {t(language, "Mark as read", "እንደተነበበ ምልክት አድርግ")}
                          </button>
                        </form>
                      )}

                      {business && (
                        <Link
                          href={`/business/${business.slug}`}
                          className="text-sm font-semibold text-green hover:underline"
                        >
                          {t(language, "View business", "ንግዱን ይመልከቱ")}
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}