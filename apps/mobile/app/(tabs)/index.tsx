import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  StatusBar,
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
};

const categories = [
  { name: "Coffee Shops", nameAm: "የቡና ቤቶች", slug: "coffee-shops", icon: "☕" },
  { name: "Restaurants", nameAm: "ምግብ ቤቶች", slug: "restaurants", icon: "🍽️" },
  { name: "Hotels", nameAm: "ሆቴሎች", slug: "hotels", icon: "🏨" },
  { name: "Bakeries", nameAm: "ዳቦ ቤቶች", slug: "bakeries", icon: "🥐" },
  { name: "Shopping", nameAm: "ግብይት", slug: "shopping", icon: "🛍️" },
  { name: "Beauty & Wellness", nameAm: "ውበት እና ጤና", slug: "beauty-wellness", icon: "\uD83D\uDC86" },
];

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  neighborhood: string | null;
  average_rating: number | null;
  review_count: number | null;
  verified: boolean | null;
  image_url?: string | null;
};

export default function HomeScreen() {
  const router = useRouter();
  const { language } = useAppLanguage();
  const isAmharic = language === "am";

  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: businessError } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, description, city, neighborhood, average_rating, review_count, verified",
        )
        .eq("status", "approved")
        .order("average_rating", { ascending: false })
        .limit(6);

      if (businessError) {
        throw businessError;
      }

      const businessList = (data ?? []) as Business[];

      if (businessList.length === 0) {
        setBusinesses([]);
        return;
      }

      const businessIds = businessList.map((business) => business.id);

      const { data: photos, error: photoError } = await supabase
        .from("business_photos")
        .select("business_id, image_url, is_cover, sort_order")
        .in("business_id", businessIds)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true });

      if (photoError) {
        throw photoError;
      }

      const photoMap = new Map<string, string>();

      for (const photo of photos ?? []) {
        if (
          photo.business_id &&
          photo.image_url &&
          !photoMap.has(photo.business_id)
        ) {
          photoMap.set(photo.business_id, photo.image_url);
        }
      }

      setBusinesses(
        businessList.map((business) => ({
          ...business,
          image_url: photoMap.get(business.id) ?? null,
        })),
      );
    } catch (err) {
      console.error("Failed to load homepage businesses:", err);
      setError("We couldn't load businesses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadBusinesses();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadBusinesses]);

  const openExplore = (params?: { q?: string; category?: string }) => {
    router.push({
      pathname: "/(tabs)/explore",
      params: {
        ...(params?.q ? { q: params.q } : {}),
        ...(params?.category ? { category: params.category } : {}),
      },
    } as any);
  };

  const handleSearch = () => {
    openExplore({ q: search.trim() });
  };

  const openBusiness = (slug: string) => {
    router.push({
      pathname: "/business/[slug]" as any,
      params: { slug },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Yene<Text style={styles.logoAccent}>Spot</Text>
            </Text>
            <Text style={styles.tagline}>
              {isAmharic ? "የአካባቢዎን ተወዳጅ ቦታዎች ያግኙ" : "Discover your local favorites"}
            </Text>
          </View>

          <View style={styles.locationButton}>
            <Text style={styles.locationIcon}>{"\uD83D\uDCCD"}</Text>
            <View>
              <Text style={styles.locationLabel}>{isAmharic ? "አሁን ያሉበት ቦታ" : "YOUR LOCATION"}</Text>
              <Text style={styles.locationName}>Jimma, Ethiopia</Text>
            </View>
          </View>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>{isAmharic ? "ጅማን ያስሱ" : "EXPLORE JIMMA"}</Text>
          </View>

          <Text style={styles.heroTitle}>
            {isAmharic ? "ቀጣዩን ተወዳጅ" : "Find your next"}{"\n"}
            <Text style={styles.heroHighlight}>{isAmharic ? "ቦታዎን ያግኙ።" : "favorite spot."}</Text>
          </Text>

          <Text style={styles.heroDescription}>
            {isAmharic ? "በአቅራቢያዎ ያሉ ምርጥ የቡና ቤቶችን፣ ምግብ ቤቶችን፣ ሆቴሎችን እና ሌሎች አካባቢያዊ ንግዶችን ያግኙ።" : "Discover amazing coffee shops, restaurants, hotels and local businesses around you."}
          </Text>

          {/* SEARCH */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>{"🔍"}</Text>

            <TextInput
              style={styles.searchInput}
              placeholder={isAmharic ? "ምን ይፈልጋሉ?" : "What are you looking for?"}
              placeholderTextColor={COLORS.muted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            <Pressable
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>{"→"}</Text>
            </Pressable>
          </View>

          <Text style={styles.searchHint}>
            {isAmharic ? "የቡና ቤቶችን፣ ምግብ ቤቶችን ወይም ሆቴሎችን ይፈልጉ" : "Try coffee shops, restaurants or hotels"}
          </Text>
        </View>

        {/* CATEGORIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{isAmharic ? "ምድቦችን ያስሱ" : "Explore categories"}</Text>
              <Text style={styles.sectionSubtitle}>
                {isAmharic ? "የሚፈልጉትን ያግኙ" : "Find exactly what you need"}
              </Text>
            </View>

            <Pressable onPress={() => openExplore()}>
              <Text style={styles.sectionArrow}>{"\u2192"}</Text>
            </Pressable>
          </View>

          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <Pressable
                key={category.slug}
                onPress={() =>
                  openExplore({ category: category.slug })
                }
                style={styles.categoryCard}
              >
                <View style={styles.categoryIconBox}>
                  <Text style={styles.categoryIcon}>
                    {category.icon}
                  </Text>
                </View>

                <Text style={styles.categoryName}>
                  {isAmharic ? category.nameAm : category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* FEATURED BUSINESSES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{isAmharic ? "ተመራጭ ቦታዎች" : "Featured places"}</Text>
              <Text style={styles.sectionSubtitle}>
                {isAmharic ? "ሊጎበኙ የሚገቡ ቦታዎችን ያግኙ" : "Discover places worth visiting"}
              </Text>
            </View>

            <Pressable onPress={() => openExplore()}>
              <Text style={styles.viewAll}>{"VIEW ALL \u2192"}</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.green} />
              <Text style={styles.loadingText}>
                {isAmharic ? "የአካባቢ ንግዶችን በመፈለግ ላይ..." : "Discovering local businesses..."}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>{"\u26A0\uFE0F"}</Text>

              <Text style={styles.emptyTitle}>
                {isAmharic ? "ችግር ተፈጥሯል" : "Something went wrong"}
              </Text>

              <Text style={styles.emptyDescription}>{error}</Text>

              <Pressable
                style={styles.retryButton}
                onPress={loadBusinesses}
              >
                <Text style={styles.retryButtonText}>{isAmharic ? "እንደገና ይሞክሩ" : "Try again"}</Text>
              </Pressable>
            </View>
          ) : businesses.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyIcon}>{"\uD83C\uDFE1"}</Text>
              </View>

              <Text style={styles.emptyTitle}>
                {isAmharic ? "ቀጣዩ ተወዳጅ ቦታዎ ይጠብቅዎታል" : "Your next favorite place awaits"}
              </Text>

              <Text style={styles.emptyDescription}>
                Local businesses will appear here as they join YeneSpot
                and receive approval.
              </Text>
            </View>
          ) : (
            <View style={styles.businessList}>
              {businesses.map((business) => (
                <Pressable
                  key={business.id}
                  style={styles.businessListing}
                  onPress={() => openBusiness(business.slug)}
                >
                  {business.image_url ? (
                    <Image
                      source={{ uri: business.image_url }}
                      style={styles.businessImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.businessImagePlaceholder}>
                      <Text style={styles.placeholderLetter}>
                        {business.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.businessInfo}>
                    <View style={styles.businessNameRow}>
                      <Text
                        style={styles.businessName}
                        numberOfLines={1}
                      >
                        {business.name}
                      </Text>

                      {business.verified && (
                        <Text style={styles.verifiedBadge}>✓</Text>
                      )}
                    </View>

                    <Text
                      style={styles.listingDescription}
                      numberOfLines={2}
                    >
                      {business.description ||
                        (isAmharic ? "ይህንን የአካባቢ ንግድ ያግኙ።" : "Discover this local business.")}
                    </Text>

                    <Text style={styles.businessLocation}>
                      {"\uD83D\uDCCD"}{" "}
                      {[business.neighborhood, business.city]
                        .filter(Boolean)
                        .join(", ") || "Jimma"}
                    </Text>

                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingStar}>{"\u2605"}</Text>
                      <Text style={styles.ratingValue}>
                        {Number(
                          business.average_rating ?? 0,
                        ).toFixed(1)}
                      </Text>

                      <Text style={styles.reviewCount}>
                        ({business.review_count ?? 0} {isAmharic ? "ግምገማዎች" : "reviews"})
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.businessArrow}>›</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* BUSINESS OWNER PROMOTION */}
        <View style={styles.businessCard}>
          <View style={styles.businessBadge}>
            <Text style={styles.businessBadgeText}>
              {isAmharic ? "ለአካባቢ ንግዶች" : "FOR LOCAL BUSINESSES"}
            </Text>
          </View>

          <Text style={styles.businessTitle}>
            {isAmharic ? "በጅማ ውስጥ ንግድ አለዎት?" : "Have a business in Jimma?"}
          </Text>

          <Text style={styles.businessDescription}>
            {isAmharic ? "ንግድዎን በYeneSpot ላይ ያስመዝግቡና ብዙ ሰዎች እንዲያገኙዎት ያግዙ።" : "Put your business on the map and help more people discover you."}
          </Text>

          <Pressable
            style={styles.businessButton}
            onPress={() => router.push("/(tabs)/profile" as any)}
          >
            <Text style={styles.businessButtonText}>
              {isAmharic ? "YeneSpot ለንግድዎ" : "Discover YeneSpot for Business"} {"\u2192"}
            </Text>
          </Pressable>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>
            YeneSpot<Text style={styles.footerDot}>.</Text>
          </Text>

          <Text style={styles.footerText}>
            {isAmharic ? "አካባቢያዊን ያግኙ። አካባቢያዊን ይደግፉ።" : "Discover local. Support local."}
          </Text>

          <Text style={styles.copyright}>
            {"\u00A9"} 2026 YeneSpot. {isAmharic ? "ለኢትዮጵያ የተሰራ።" : "Made for Ethiopia."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.navy,
    letterSpacing: -1,
  },

  logoAccent: {
    color: COLORS.green,
  },

  tagline: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },

  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 7,
  },

  locationIcon: {
    fontSize: 18,
  },

  locationLabel: {
    fontSize: 8,
    color: COLORS.muted,
    fontWeight: "700",
  },

  locationName: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.navy,
    marginTop: 2,
  },

  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 22,
    backgroundColor: COLORS.navy,
    borderRadius: 22,
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 7,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
  },

  badgeText: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 41,
    marginTop: 22,
    letterSpacing: -1,
  },

  heroHighlight: {
    color: COLORS.gold,
  },

  heroDescription: {
    color: "#D4DDE2",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },

  searchBox: {
    height: 55,
    backgroundColor: COLORS.white,
    borderRadius: 13,
    marginTop: 23,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  searchIcon: {
    fontSize: 27,
    color: COLORS.muted,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: COLORS.charcoal,
    fontSize: 12,
  },

  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },

  searchButtonText: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "700",
  },

  searchHint: {
    color: "#B8C5CB",
    fontSize: 10,
    marginTop: 11,
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  sectionTitle: {
    color: COLORS.navy,
    fontSize: 19,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },

  sectionArrow: {
    fontSize: 23,
    color: COLORS.green,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  categoryCard: {
    width: "31.5%",
    minHeight: 105,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginBottom: 10,
  },

  categoryIconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryIcon: {
    fontSize: 23,
  },

  categoryName: {
    color: COLORS.charcoal,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 9,
  },

  viewAll: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "900",
  },

  loadingCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 35,
    alignItems: "center",
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 13,
  },

  businessList: {
    gap: 12,
  },

  businessListing: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 10,
  },

  businessImage: {
    width: 95,
    height: 105,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
  },

  businessImagePlaceholder: {
    width: 95,
    height: 105,
    borderRadius: 12,
    backgroundColor: "#E9EFEA",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderLetter: {
    fontSize: 35,
    fontWeight: "900",
    color: COLORS.green,
  },

  businessInfo: {
    flex: 1,
    marginLeft: 12,
  },

  businessNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  businessName: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: "900",
    flexShrink: 1,
  },

  verifiedBadge: {
    color: COLORS.white,
    backgroundColor: "#21865A",
    fontSize: 9,
    fontWeight: "900",
    overflow: "hidden",
    borderRadius: 10,
    width: 17,
    height: 17,
    textAlign: "center",
    textAlignVertical: "center",
  },

  listingDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  businessLocation: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 6,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  ratingStar: {
    color: COLORS.gold,
    fontSize: 13,
  },

  ratingValue: {
    color: COLORS.navy,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 4,
  },

  reviewCount: {
    color: COLORS.muted,
    fontSize: 9,
    marginLeft: 5,
  },

  businessArrow: {
    color: COLORS.green,
    fontSize: 25,
    marginLeft: 5,
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 23,
    alignItems: "center",
  },

  emptyIconBox: {
    width: 65,
    height: 65,
    backgroundColor: "#F5F0E4",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    fontSize: 32,
  },

  emptyTitle: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },

  emptyDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 16,
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  businessCard: {
    marginHorizontal: 16,
    marginTop: 30,
    padding: 22,
    borderRadius: 20,
    backgroundColor: COLORS.green,
  },

  businessBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.13)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  businessBadgeText: {
    color: COLORS.gold,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },

  businessTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 17,
  },

  businessDescription: {
    color: "#D8E5DD",
    fontSize: 12,
    lineHeight: 20,
    marginTop: 9,
  },

  businessButton: {
    backgroundColor: COLORS.gold,
    padding: 14,
    borderRadius: 11,
    alignItems: "center",
    marginTop: 19,
  },

  businessButtonText: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: "800",
  },

  footer: {
    alignItems: "center",
    marginTop: 35,
    paddingHorizontal: 20,
  },

  footerLogo: {
    fontSize: 22,
    color: COLORS.navy,
    fontWeight: "900",
  },

  footerDot: {
    color: COLORS.gold,
  },

  footerText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 5,
  },

  copyright: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 16,
  },
});
