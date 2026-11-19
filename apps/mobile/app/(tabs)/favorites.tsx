import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { supabase } from "../../lib/supabase";
import { useAppLanguage } from "../../context/LanguageContext";

const COLORS = {
  navy: "#172B3A",
  green: "#173B35",
  gold: "#D5A642",
  cream: "#FAF9F6",
  white: "#FFFFFF",
  charcoal: "#292D32",
  muted: "#747C80",
  border: "#E8E6DF",
  red: "#C94B4B",
};

type FavoriteBusiness = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  neighborhood: string | null;
  average_rating: number | null;
  review_count: number | null;
  verified: boolean | null;
  image_url: string | null;
};

type FavoriteRow = {
  business_id: string;
  created_at: string;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  neighborhood: string | null;
  average_rating: number | null;
  review_count: number | null;
  verified: boolean | null;
};

type PhotoRow = {
  business_id: string;
  image_url: string;
  is_cover: boolean;
  sort_order: number;
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { language } = useAppLanguage();
  const isAmharic = language === "am";
  const t = useCallback(
    (english: string, amharic: string) =>
      isAmharic ? amharic : english,
    [isAmharic],
  );

  const [favorites, setFavorites] = useState<FavoriteBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError) throw authError;

      const user = session?.user;

      if (!user) {
        setFavorites([]);
        setError(t("Please sign in to view your favorite places.", "\u12a5\u12e8\u12a9\u12f5 \u12e8\u12c8\u12f7\u1279\u1275 \u1266\u1273\u12ce\u127d\u1295 \u1208\u121b\u12e8\u1275 \u12ed\u130d\u1261"));
        return;
      }

      const { data: favoriteRows, error: favoritesError } =
        await supabase
          .from("favorites")
          .select("business_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

      if (favoritesError) throw favoritesError;

      const typedFavoriteRows = (favoriteRows ?? []) as FavoriteRow[];

      if (typedFavoriteRows.length === 0) {
        setFavorites([]);
        return;
      }

      const businessIds = typedFavoriteRows.map(
        (favorite) => favorite.business_id,
      );

      const { data: businesses, error: businessesError } =
        await supabase
          .from("businesses")
          .select(
            "id, name, slug, description, city, neighborhood, average_rating, review_count, verified",
          )
          .in("id", businessIds)
          .eq("status", "approved");

      if (businessesError) throw businessesError;

      const businessRows = (businesses ?? []) as BusinessRow[];

      if (businessRows.length === 0) {
        setFavorites([]);
        return;
      }

      const { data: photos, error: photosError } = await supabase
        .from("business_photos")
        .select("business_id, image_url, is_cover, sort_order")
        .in("business_id", businessRows.map((business) => business.id))
        .order("sort_order", { ascending: true });

      if (photosError) throw photosError;

      const photoRows = (photos ?? []) as PhotoRow[];

      const photoByBusiness = new Map<string, string>();

      businessRows.forEach((business) => {
        const businessPhotos = photoRows.filter(
          (photo) => photo.business_id === business.id,
        );

        const coverPhoto =
          businessPhotos.find((photo) => photo.is_cover) ??
          businessPhotos[0];

        if (coverPhoto) {
          photoByBusiness.set(
            business.id,
            coverPhoto.image_url,
          );
        }
      });

      const orderedBusinesses = businessIds
        .map((id) => businessRows.find((business) => business.id === id))
        .filter((business) => business !== undefined)
        .map((business) => ({
          ...business,
          image_url: photoByBusiness.get(business.id) ?? null,
        }));

      setFavorites(orderedBusinesses);
    } catch (err) {
      console.error("Favorites loading error:", err);
      setError(t("We couldn't load your favorites. Please try again.", "\u12f5\u130d\u130d\u121e\u127d\u12ce\u1295 \u1218\u132b\u1295 \u12a0\u120d\u127b\u120d\u1295\u121d\u1362 \u12a5\u1295\u12f0\u1308\u1293 \u12ed\u1209\u1362"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadFavorites();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadFavorites]);

  const removeFavorite = async (businessId: string) => {
    try {
      setRemovingId(businessId);

      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError) throw authError;

      const user = session?.user;

      if (!user) {
        Alert.alert(t("Sign in required", "\u1218\u130d\u1263\u1275 \u12eb\u1235\u1348\u120d\u130b\u120d"), t("Please sign in first.", "\u12a5\u1263\u12ad\u12ce \u1218\u1300\u1218\u122a\u12eb \u12ed\u130d\u1261\u1362"));
        return;
      }

      const { error: deleteError } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("business_id", businessId);

      if (deleteError) throw deleteError;

      setFavorites((current) =>
        current.filter((item) => item.id !== businessId),
      );
    } catch (err) {
      console.error("Remove favorite error:", err);
      Alert.alert(
        t("Something went wrong", "\u1235\u1205\u1270\u1275 \u1270\u12a8\u1235\u1277\u120d"),
        t("We couldn't remove this business. Please try again.", "\u12ed\u1205\u1295 \u1262\u12dd\u1290\u1235 \u121b\u1235\u12c8\u1308\u12f5 \u12a0\u120d\u127b\u120d\u1295\u121d\u1362 \u12a5\u1295\u12f0\u1308\u1293 \u12ed\u1209\u1362"),
      );
    } finally {
      setRemovingId(null);
    }
  };

  const openBusiness = (slug: string) => {
    router.push(`/business/${slug}` as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t("YOUR COLLECTION", "\u12e8\u12a5\u122d\u1235\u12ce \u1218\u12f3\u1265\u122d")}</Text>
          <Text style={styles.title}>{t("Favorite places", "\u12e8\u121a\u12c8\u12f7\u1278\u12cd \u1266\u1273\u12ce\u127d")}</Text>
          <Text style={styles.subtitle}>
            {t("Keep the places you love close.", "\u12e8\u121a\u12c8\u12f7\u1278\u12cd\u1295 \u1266\u1273\u12ce\u127d \u1260\u1245\u122d\u1265\u12ce \u12eb\u1246\u12c2\u1362")}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>{t("YOUR SAVED PLACES", "\u12e8\u1270\u1240\u1218\u1321 \u1266\u1273\u12ce\u127d")}</Text>
            <Text style={styles.summaryTitle}>
              {t("Your favorites, all in one place.", "\u12f5\u130d\u130d\u121e\u127d\u12ce \u1260\u12a0\u1295\u12f5 \u1273\u1233\u1262 \u12cd\u1235\u1325\u1362")}
            </Text>
            <Text style={styles.summaryDescription}>
              {t("Find the local businesses you love whenever you need them.", "\u12e8\u121a\u12c8\u12f7\u1278\u12cd\u1295 \u12e8\u12a0\u12ab\u1263\u1262\u12eb\u120d \u1262\u12dd\u1290\u1236\u127d \u1260\u121a\u12ab\u120d\u1260\u1275 \u130a\u12dc \u12eb\u130d\u1299\u1362")}
            </Text>
          </View>

          <View style={styles.heartCircle}>
            <Text style={styles.heartIcon}>♥</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("Saved businesses", "\u12e8\u1270\u1240\u1218\u1321 \u1262\u12dd\u1290\u1236\u127d")}</Text>
          {!loading && (
            <Text style={styles.count}>
              {favorites.length} {favorites.length === 1 ? t("place", "\u1266\u1273") : t("places", "\u1266\u1273\u12ce\u127d")}
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.loadingText}>
              {t("Loading your favorite places...", "\u12e8\u121a\u12c8\u12f7\u1278\u12cd \u1266\u1273\u12ce\u127d \u1260\u1218\u132b\u1295 \u120b\u12ed \u1293\u1278\u12cd...")}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>!</Text>
            <Text style={styles.emptyTitle}>{t("Unable to load favorites", "\u12f5\u130d\u130d\u121e\u127d\u1295 \u1218\u132b\u1295 \u12a0\u120d\u127b\u120d\u121d")}</Text>
            <Text style={styles.emptyDescription}>{error}</Text>

            <Pressable
              style={styles.exploreButton}
              onPress={loadFavorites}
            >
              <Text style={styles.exploreButtonText}>{t("Try again", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u1209")}</Text>
            </Pressable>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>♡</Text>
            </View>

            <Text style={styles.emptyTitle}>{t("No favorites yet", "\u12a5\u1235\u12ab\u1201\u1295 \u12f5\u130d\u130d\u121e\u127d \u12e8\u1209\u121d")}</Text>

            <Text style={styles.emptyDescription}>
              {t("When you discover a business you love, save it to your favorites. You can easily find it here later.", "\u12e8\u121a\u12c8\u12f1\u1275\u1295 \u1262\u12dd\u1290\u1235 \u1232\u12eb\u1308\u1299 \u12c8\u12f0 \u12f5\u130d\u130d\u121e\u127d\u12ce \u12ed\u1328\u121d\u1229\u1275\u1362 \u1260\u12a5\u1290\u12da\u1205 \u1260\u1240\u120b\u1209 \u121b\u130d\u1298\u1275 \u12ed\u127d\u120b\u1209\u1362")}
            </Text>

            <Pressable
              style={styles.exploreButton}
              onPress={() => router.push("/(tabs)/explore" as never)}
            >
              <Text style={styles.exploreButtonText}>
                Explore businesses →
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {favorites.map((business) => (
              <View key={business.id} style={styles.businessCard}>
                <Pressable
                  style={styles.businessMain}
                  onPress={() => openBusiness(business.slug)}
                >
                  {business.image_url ? (
                    <Image
                      source={{ uri: business.image_url }}
                      style={styles.businessImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.placeholderIcon}>🏬</Text>
                    </View>
                  )}

                  <View style={styles.businessInfo}>
                    <View style={styles.nameRow}>
                      <Text
                        style={styles.businessName}
                        numberOfLines={1}
                      >
                        {business.name}
                      </Text>

                      {business.verified && (
                        <Text style={styles.verified}>✓</Text>
                      )}
                    </View>

                    <Text
                      style={styles.businessDescription}
                      numberOfLines={2}
                    >
                      {business.description || t("Discover this local business.", "\u12ed\u1205\u1295 \u12e8\u12ab\u1263\u1262 \u1262\u12dd\u1290\u1235 \u12eb\u130d\u1299\u1362")}
                    </Text>

                    <Text style={styles.location}>
                      📍{" "}
                      {[business.neighborhood, business.city]
                        .filter(Boolean)
                        .join(", ") || t("Location unavailable", "\u12e8\u12a0\u12ab\u1263\u1262 \u1218\u1228\u1303 \u12a0\u12ed\u1329\u121d")}
                    </Text>

                    <Text style={styles.rating}>
                      ★ {Number(business.average_rating ?? 0).toFixed(1)}
                      {"  "}({business.review_count ?? 0} {t("reviews", "\u132d\u130d\u121d\u1308\u121b\u12ce\u127d")})
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.viewButton}
                    onPress={() => openBusiness(business.slug)}
                  >
                    <Text style={styles.viewButtonText}>{t("View place", "\u1266\u1273\u12cd\u1295 \u12ed\u12a8\u1273\u1270\u1209")} {"\u2192"}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.removeButton}
                    disabled={removingId === business.id}
                    onPress={() => removeFavorite(business.id)}
                  >
                    {removingId === business.id ? (
                      <ActivityIndicator size="small" color={COLORS.red} />
                    ) : (
                      <Text style={styles.removeButtonText}>{"\u2665"} {t("Remove", "\u12a0\u1235\u12c8\u130d\u12f5")}</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>

          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{t("A little tip", "\u1325\u1242\u121d \u134d\u124b\u12f5")}</Text>
            <Text style={styles.tipDescription}>
              {t("Discover interesting places in Explore and save them here to find them again easily.", "\u1260Explore \u12a0\u1235\u12c8\u12f3\u12f5 \u12e8\u121a\u1235\u1261 \u1266\u1273\u12ce\u127d\u1295 \u12eb\u130d\u1299\u1362 \u12a5\u1295\u12f0\u1308\u1293 \u1260\u12da\u1205 \u121b\u130d\u1298\u1275 \u12ed\u127d\u120b\u1209\u1362")}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          YeneSpot {"\u00b7"} {t("Discover local. Support local.", "\u12e8\u12ab\u1263\u1262\u12cd\u1295 \u12ed\u12c8\u1241\u1362 \u12e8\u12ab\u1263\u1262\u12cd\u1295 \u12ed\u1320\u1241\u1362")}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 35,
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.navy,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 7,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 20,
    padding: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 27,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  summaryTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
    maxWidth: 220,
  },
  summaryDescription: {
    color: "#D4DDE2",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 225,
  },
  heartCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  heartIcon: {
    color: COLORS.gold,
    fontSize: 27,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "900",
  },
  count: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 14,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 35,
  },
  emptyIconCircle: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: "#F5F0E4",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    color: COLORS.gold,
    fontSize: 42,
    lineHeight: 55,
  },
  emptyTitle: {
    color: COLORS.navy,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 20,
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
  },
  exploreButton: {
    backgroundColor: COLORS.green,
    borderRadius: 11,
    paddingHorizontal: 22,
    paddingVertical: 14,
    marginTop: 23,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  list: {
    gap: 15,
  },
  businessCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  businessMain: {
    flexDirection: "row",
  },
  businessImage: {
    width: 105,
    height: 115,
    borderRadius: 12,
    backgroundColor: "#EEECE5",
  },
  imagePlaceholder: {
    width: 105,
    height: 115,
    borderRadius: 12,
    backgroundColor: "#F2EDDF",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 35,
  },
  businessInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  businessName: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "900",
    flexShrink: 1,
  },
  verified: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 5,
  },
  businessDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  location: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 7,
  },
  rating: {
    color: "#A87916",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 7,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 12,
    paddingTop: 10,
  },
  viewButton: {
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  viewButtonText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
  },
  removeButton: {
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  removeButtonText: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: "800",
  },
  tipCard: {
    backgroundColor: "#F2EDDF",
    borderRadius: 15,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  tipIcon: {
    fontSize: 25,
    marginRight: 13,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "900",
  },
  tipDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
  },
  footer: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 30,
  },
});
