import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { supabase } from "../lib/supabase";
import { useAppLanguage } from "../context/LanguageContext";

const COLORS = {
  navy: "#172B3A",
  green: "#173B35",
  gold: "#D5A642",
  cream: "#FAF9F6",
  white: "#FFFFFF",
  text: "#263238",
  muted: "#77838B",
  border: "#E8E6DF",
  danger: "#B42318",
};

type NotificationRow = {
  id: string;
  type: "review_received" | "review_response_received";
  title: string;
  message: string;
  business_id: string;
  review_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type BusinessInfo = {
  id: string;
  name: string;
  slug: string;
};

type NotificationItem = NotificationRow & {
  business: BusinessInfo | null;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { language } = useAppLanguage();
  const isAmharic = language === "am";
  const t = useCallback(
    (english: string, amharic: string) =>
      isAmharic ? amharic : english,
    [isAmharic],
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setNotifications([]);
        setError(t("Please sign in to view your notifications.", "\u1230\u1208\u134b\u1296\u127d\u12ce\u1295 \u1208\u121b\u12e8\u1275 \u12ed\u130d\u1261\u1362"));
        return;
      }

      const { data, error: notificationError } = await supabase
        .from("notifications")
        .select(
          "id, type, title, message, business_id, review_id, is_read, read_at, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (notificationError) throw notificationError;

      const rows = (data ?? []) as NotificationRow[];

      if (rows.length === 0) {
        setNotifications([]);
        return;
      }

      const businessIds = [
        ...new Set(rows.map((notification) => notification.business_id)),
      ];

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, slug")
        .in("id", businessIds);

      if (businessError) throw businessError;

      const businessMap = new Map<string, BusinessInfo>(
        ((businessData ?? []) as BusinessInfo[]).map((business) => [
          business.id,
          business,
        ]),
      );

      setNotifications(
        rows.map((notification) => ({
          ...notification,
          business: businessMap.get(notification.business_id) ?? null,
        })),
      );
    } catch (err) {
      console.error("Notifications loading error:", err);
      setError(t("Unable to load notifications. Please try again.", "\u1230\u1208\u134b\u1296\u127d\u1295 \u1218\u132b\u1295 \u12a0\u120d\u1270\u127b\u1208\u121d\u1362 \u12a5\u1295\u12f0\u1308\u1293 \u12ed\u1209\u1219\u1362"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const markAsRead = async (notification: NotificationItem) => {
    if (notification.is_read) return true;

    const { data: updatedRows, error: updateError } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notification.id)
      .select("id");

    if (updateError || !updatedRows?.length) {
      Alert.alert(t("Unable to update", "\u121b\u12d8\u1218\u1295 \u12a0\u120d\u1270\u127b\u1208\u121d"), t("Please try again.", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u1209\u1219\u1362"));
      return false;
    }

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true, read_at: new Date().toISOString() }
          : item,
      ),
    );

    return true;
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || updating) return;

    setUpdating(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error(t("Please sign in again.", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u130d\u1261\u1362"));

      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: now })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (updateError) throw updateError;

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at ?? now,
        })),
      );
    } catch (err) {
      console.error("Mark all notifications read error:", err);
      Alert.alert(t("Unable to update", "\u121b\u12d8\u1218\u1295 \u12a0\u120d\u1270\u127b\u1208\u121d"), t("Please try again.", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u1209\u1219\u1362"));
    } finally {
      setUpdating(false);
    }
  };

  const openNotification = async (notification: NotificationItem) => {
    const success = await markAsRead(notification);

    if (!success) return;

    if (notification.business?.slug) {
      router.push(`/business/${notification.business.slug}` as never);
    } else {
      Alert.alert(
        t("Business unavailable", "\u12f5\u122d\u1305\u1271 \u12a0\u12ed\u1308\u129d\u121d"),
        t("This business page is no longer available.", "\u12ed\u1205 \u12e8\u12f5\u122d\u1305\u1275 \u1328\u1345 \u12a8\u12a5\u1295\u130d\u12f2\u1205 \u12a0\u120d\u1308\u129d\u121d\u1362"),
      );
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);

    return date.toLocaleString(isAmharic ? "am-ET" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t("Notifications", "\u1230\u1208\u134b\u1296\u127d")}</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? isAmharic
                ? `${unreadCount} \u12eb\u120d\u1270\u12a0\u12e9 \u1230\u1208\u134b\u1296\u127d`
                : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : t("You're all caught up", "\u1230\u1208\u134b\u1296\u127d\u1295 \u1233\u12ed\u1270\u1308\u1299 \u12a0\u1295\u12f3\u1295\u12f1 \u12a0\u120d\u1260\u1275\u121d")}
          </Text>
        </View>

        <Text style={styles.headerIcon}>🔔</Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>{t("Recent activity", "\u12e8\u1275\u1228\u1275 \u12a5\u1295\u1275\u1235\u1243\u1234")}</Text>

        <Pressable
          onPress={() => void markAllAsRead()}
          disabled={unreadCount === 0 || updating}
        >
          <Text
            style={[
              styles.markAllText,
              unreadCount === 0 && styles.disabledText,
            ]}
          >
            {updating ? t("Updating...", "\u1260\u1218\u12d8\u1218\u1295 \u120b\u12ed...") : t("Mark all as read", "\u1201\u1209\u1295\u121d \u12a5\u1295\u12f0\u1270\u1290\u1260\u1261 \u121d\u120d\u12ad\u1275")}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.stateText}>{t("Loading notifications...", "\u1230\u1208\u134b\u1296\u127d\u1295 \u1260\u1218\u132b\u1295 \u120b\u12ed...")}</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={styles.stateText}>{error}</Text>

          <Pressable
            onPress={() => void loadNotifications()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>{t("Try again", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u121e\u12ed\u12f1")}</Text>
          </Pressable>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>{t("No notifications yet", "\u12a5\u12f0\u1205 \u1230\u1208\u134b\u1296\u127d \u12e8\u1208\u121d")}</Text>
          <Text style={styles.stateText}>
            {t("Updates about your reviews and businesses will appear here.", "\u1235\u1208 \u1308\u121d\u1308\u121b\u12ce\u127d\u12ce \u12a5\u1293 \u12f5\u122d\u1305\u1276\u127d\u12ce \u12e8\u121a\u1218\u1208\u12a8\u1271 \u12a0\u12f3\u1235 \u1218\u120d\u12ad\u1276\u127d \u1260\u12da\u1205 \u12ed\u1273\u12eb\u1209\u1362")}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => void openNotification(notification)}
              style={[
                styles.notificationCard,
                !notification.is_read && styles.unreadCard,
              ]}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.notificationIcon}>
                  {notification.type === "review_received" ? "⭐" : "💬"}
                </Text>
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>

                  {!notification.is_read && (
                    <View style={styles.unreadDot} />
                  )}
                </View>

                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>

                <Text style={styles.notificationDate}>
                  {formatDate(notification.created_at)}
                </Text>

                {notification.business && (
                  <Text style={styles.businessLink}>
                    {t("View", "\u12ed\u12ed\u1271")} {notification.business.name} {"\u203a"}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
    paddingTop: 52,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backText: {
    color: COLORS.navy,
    fontSize: 30,
    lineHeight: 34,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.navy,
    fontSize: 21,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  headerIcon: {
    fontSize: 24,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "900",
  },
  markAllText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
  },
  disabledText: {
    color: COLORS.muted,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 35,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 11,
  },
  unreadCard: {
    borderColor: COLORS.gold,
    backgroundColor: "#FFFDF6",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 19,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "900",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },
  notificationMessage: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  notificationDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 9,
  },
  businessLink: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 9,
  },
  stateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 70,
  },
  stateIcon: {
    fontSize: 36,
    marginBottom: 14,
  },
  emptyTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 11,
    marginTop: 18,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
});
