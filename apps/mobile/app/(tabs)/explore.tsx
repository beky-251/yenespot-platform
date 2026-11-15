import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

import { supabase } from "../../lib/supabase";
import { useAppLanguage } from "../../context/LanguageContext";

const COLORS = {
  navy: "#172B3A",
  green: "#173B35",
  gold: "#D5A642",
  cream: "#FAF9F6",
  white: "#FFFFFF",
  text: "#263238",
  muted: "#77838B",
  border: "#E8E6DF",
  background: "#F3F4F1",
  danger: "#B42318",
};

type Category = {
  id: string;
  name: string;
  name_am: string | null;
  slug: string;
  icon: string | null;
};

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  category_id: string | null;
  average_rating: number;
  review_count: number;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
};

type BusinessPhoto = {
  business_id: string;
  image_url: string;
  is_cover: boolean;
  sort_order: number;
};

type BusinessHours = {
  business_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};
const CATEGORY_ICONS: Record<string, string> = {
  "coffee-shops": "\u2615",
  restaurants: "\u{1F37D}\uFE0F",
  hotels: "\u{1F3E8}",
  bakeries: "\u{1F35E}",
  shopping: "\u{1F6CD}\uFE0F",
  "beauty-wellness": "\u{1F484}",
};

const getCategoryIcon = (category: Category) =>
  category.icon || CATEGORY_ICONS[category.slug] || "\u{1F4CD}";

export default function ExploreScreen() {
  const router = useRouter();
  const { language } = useAppLanguage();
  const isAmharic = language === "am";

  const params = useLocalSearchParams<{
    q?: string;
    category?: string;
  }>();

  const [search, setSearch] = useState(
    typeof params.q === "string" ? params.q : "",
  );

  const [selectedCategory, setSelectedCategory] = useState(
    typeof params.category === "string" ? params.category : "all",
  );

  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "newest" | "nearby">("rating");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const mapRef = useRef<MapView | null>(null);
  const [distanceLimit, setDistanceLimit] = useState<"any" | 1 | 5 | 10>("any");

  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);
  const [businessHours, setBusinessHours] = useState<
    Record<string, BusinessHours[]>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [previousParams, setPreviousParams] = useState({
    q: params.q,
    category: params.category,
  });

  // Synchronize state when navigation parameters change.
  if (
    params.q !== previousParams.q ||
    params.category !== previousParams.category
  ) {
    setPreviousParams({ q: params.q, category: params.category });

    if (typeof params.q === "string") {
      setSearch(params.q);
    }

    if (typeof params.category === "string") {
      setSelectedCategory(params.category);
    }
  }

  const loadExploreData = useCallback(async () => {
    try {
      const [categoryResult, businessResult] = await Promise.all([
        supabase
          .from("business_categories")
          .select("id, name, name_am, slug, icon")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),

        supabase
          .from("businesses")
          .select(
            "id, name, slug, description, city, neighborhood, category_id, average_rating, review_count, verified, created_at, latitude, longitude",
          )
          .eq("status", "approved")
          .order("average_rating", { ascending: false }),
      ]);

      if (categoryResult.error) {
        throw categoryResult.error;
      }

      if (businessResult.error) {
        throw businessResult.error;
      }

      const categoryRows = (categoryResult.data ?? []) as Category[];
      const businessRows = (businessResult.data ?? []) as Business[];

      setCategories(categoryRows);
      setBusinesses(businessRows);

      if (businessRows.length === 0) {
        setPhotos({});
        setBusinessHours({});
        return;
      }

      const businessIds = businessRows.map((business) => business.id);

      const { data: photoData, error: photoError } = await supabase
        .from("business_photos")
        .select("business_id, image_url, is_cover, sort_order")
        .in("business_id", businessIds)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true });

      if (photoError) {
        throw photoError;
      }

      const { data: hoursData, error: hoursError } = await supabase
        .from("business_hours")
        .select("business_id, day_of_week, opens_at, closes_at, is_closed")
        .in("business_id", businessIds);

      if (hoursError) {
        throw hoursError;
      }

      const hoursMap: Record<string, BusinessHours[]> = {};

      (hoursData ?? []).forEach((hours: BusinessHours) => {
        if (!hoursMap[hours.business_id]) {
          hoursMap[hours.business_id] = [];
        }

        hoursMap[hours.business_id].push(hours);
      });

      setBusinessHours(hoursMap);
      const photoMap: Record<string, string> = {};

      (photoData ?? []).forEach((photo: BusinessPhoto) => {
        if (!photoMap[photo.business_id]) {
          photoMap[photo.business_id] = photo.image_url;
        }
      });

      setPhotos(photoMap);
    } catch (err) {
      console.error("Explore loading error:", err);
      setError("We couldn't load places right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadExploreData();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadExploreData]);

  const enableNearbySorting = async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLocationError(
          "Location permission was denied. Enable location access in your device settings to find nearby places.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      setSortBy("nearby");
    } catch (err) {
      console.error("Location error:", err);
    } finally {
      setIsLocating(false);
    }
  };

  const isBusinessOpen = useCallback((businessId: string) => {
    const hours = businessHours[businessId];

    if (!hours || hours.length === 0) {
      return false;
    }

    const day = currentTime.getDay();
    const nowMinutes =
      currentTime.getHours() * 60 + currentTime.getMinutes();

    const todayHours = hours.find((item) => item.day_of_week === day);
    const yesterdayDay = (day + 6) % 7;
    const yesterdayHours = hours.find(
      (item) => item.day_of_week === yesterdayDay,
    );

    if (
      yesterdayHours &&
      !yesterdayHours.is_closed &&
      yesterdayHours.opens_at &&
      yesterdayHours.closes_at
    ) {
      const previousOpen =
        Number(yesterdayHours.opens_at.slice(0, 2)) * 60 +
        Number(yesterdayHours.opens_at.slice(3, 5));
      const previousClose =
        Number(yesterdayHours.closes_at.slice(0, 2)) * 60 +
        Number(yesterdayHours.closes_at.slice(3, 5));

      if (previousClose < previousOpen && nowMinutes < previousClose) {
        return true;
      }
    }

    if (
      !todayHours ||
      todayHours.is_closed ||
      !todayHours.opens_at ||
      !todayHours.closes_at
    ) {
      return false;
    }

    const openMinutes =
      Number(todayHours.opens_at.slice(0, 2)) * 60 +
      Number(todayHours.opens_at.slice(3, 5));
    const closeMinutes =
      Number(todayHours.closes_at.slice(0, 2)) * 60 +
      Number(todayHours.closes_at.slice(3, 5));

    if (openMinutes === closeMinutes) {
      return true;
    }

    if (closeMinutes < openMinutes) {
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    }

    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }, [businessHours, currentTime]);
  const filteredBusinesses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = businesses.filter((business) => {
      const matchesCategory =
        selectedCategory === "all" ||
        categories.find(
          (category) =>
            category.id === business.category_id &&
            category.slug === selectedCategory,
        ) !== undefined;

      const businessCategory = categories.find(
        (category) => category.id === business.category_id,
      );

      const searchableText = [
        business.name,
        business.description ?? "",
        business.city,
        business.neighborhood ?? "",
        businessCategory?.name ?? "",
        businessCategory?.name_am ?? "",
        businessCategory?.slug ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      const matchesDistance =
        sortBy !== "nearby" ||
        distanceLimit === "any" ||
        (currentLocation !== null &&
          business.latitude !== null &&
          business.longitude !== null &&
          (() => {
            const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

            const latDiff = toRadians(
              business.latitude - currentLocation.latitude,
            );
            const lonDiff = toRadians(
              business.longitude - currentLocation.longitude,
            );

            const haversine =
              Math.sin(latDiff / 2) ** 2 +
              Math.cos(toRadians(currentLocation.latitude)) *
                Math.cos(toRadians(business.latitude)) *
                Math.sin(lonDiff / 2) ** 2;

            const distanceKm =
              6371 *
              2 *
              Math.atan2(
                Math.sqrt(haversine),
                Math.sqrt(1 - haversine),
              );

            return distanceKm <= distanceLimit;
          })());

      const matchesOpenNow =
        !openNowOnly || isBusinessOpen(business.id);

      return (
        matchesCategory &&
        matchesSearch &&
        matchesDistance &&
        matchesOpenNow
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "nearby" && currentLocation) {
        const distance = (business: Business) => {
          if (business.latitude === null || business.longitude === null) {
            return Number.POSITIVE_INFINITY;
          }

          const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
          const earthRadiusKm = 6371;

          const latitudeDifference = toRadians(
            business.latitude - currentLocation.latitude,
          );
          const longitudeDifference = toRadians(
            business.longitude - currentLocation.longitude,
          );

          const haversine =
            Math.sin(latitudeDifference / 2) ** 2 +
            Math.cos(toRadians(currentLocation.latitude)) *
              Math.cos(toRadians(business.latitude)) *
              Math.sin(longitudeDifference / 2) ** 2;

          return (
            earthRadiusKm *
            2 *
            Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
          );
        };

        return distance(a) - distance(b);
      }

      if (sortBy === "reviews") {
        return b.review_count - a.review_count ||
          b.average_rating - a.average_rating;
      }

      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime();
      }

      return b.average_rating - a.average_rating ||
        b.review_count - a.review_count;
    });
  }, [businesses, categories, search, selectedCategory, sortBy, currentLocation, distanceLimit, openNowOnly, isBusinessOpen]);

  const mapCoordinates = useMemo(
    () =>
      filteredBusinesses
        .filter(
          (business) =>
            business.latitude !== null &&
            business.longitude !== null,
        )
        .map((business) => ({
          latitude: business.latitude!,
          longitude: business.longitude!,
        })),
    [filteredBusinesses],
  );

  useEffect(() => {
    if (viewMode !== "map" || mapCoordinates.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      if (mapCoordinates.length > 1) {
        mapRef.current?.fitToCoordinates(mapCoordinates, {
          edgePadding: {
            top: 60,
            right: 50,
            bottom: 60,
            left: 50,
          },
          animated: true,
        });
      } else {
        mapRef.current?.animateToRegion({
          ...mapCoordinates[0],
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 500);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [viewMode, mapCoordinates]);

  const openBusiness = (slug: string) => {
    router.push(`/business/${slug}` as never);
  };

  const selectCategory = (slug: string) => {
    setSelectedCategory(slug);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content"/>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>YeneSpot</Text>
            <Text style={styles.headerSubtitle}>
              {isAmharic ? "\u1260\u12A0\u1245\u122B\u1262\u12EB\u12CE\u127D \u12EB\u1209 \u1266\u1273\u12CE\u127D\u1295 \u12EB\u130D\u1299" : "Discover places around you"}
            </Text>
          </View>

          <View style={styles.locationBadge}>
            <Text style={styles.locationIcon}>{"\u{1F4CD}"}</Text>
            <View>
              <Text style={styles.locationLabel}>{isAmharic ? "\u12E8\u12A0\u1201\u1291 \u12A0\u12AB\u1263\u1262" : "YOUR LOCATION"}</Text>
              <Text style={styles.locationName}>Jimma, Ethiopia</Text>
            </View>
          </View>
        </View>

        {/* Search introduction */}
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>{isAmharic ? "\u1305\u121B\u1295 \u12EB\u1235\u1231" : "EXPLORE JIMMA"}</Text>

          <Text style={styles.title}>
            {isAmharic ? "\u1240\u1323\u12E9\u1295 \u12ED\u1348\u1209" : "Find your next"}{"\n"}
            <Text style={styles.titleHighlight}>{isAmharic ? "\u12E8\u121A\u12C8\u12F1\u1275\u1295 \u1266\u1273" : "favorite place."}</Text>
          </Text>

          <Text style={styles.introDescription}>
            {isAmharic ? "\u1260\u12A0\u1245\u122B\u1262\u12EB\u12CE\u127D \u12EB\u1209 \u12E8\u1241\u1241\u1215 \u1264\u1276\u127D\u1295\u1363 \u122C\u1235\u1276\u122B\u1295\u1276\u127D\u1295\u1363 \u1206\u1274\u120E\u127D\u1295 \u12A5\u1293 \u120C\u120E\u127D\u1295 \u12ED\u1348\u120D\u1309" : "Search local coffee shops, restaurants, hotels, bakeries and more."}

          </Text>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={isAmharic ? "\u12E8\u1295\u130D\u12F5 \u1266\u1273\u12CE\u127D\u1295 \u12C8\u12ED\u121D \u12A0\u12F5\u122B\u123B\u12CE\u127D\u1295 \u12ED\u1348\u120D\u1309..." : "Search businesses or locations..."}
              placeholderTextColor="#8C969D"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
              autoCapitalize="none"
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Text style={styles.clearSearch}>{"\u00D7"}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>
                {isAmharic ? "\u121D\u12F5\u1266\u127D\u1295 \u12EB\u1235\u1221" : "Explore categories"}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {isAmharic ? "\u12E8\u121A\u1348\u120D\u1309\u1275\u1295 \u1260\u1275\u12AD\u12AD\u120D \u12EB\u130D\u1299" : "Find exactly what you need"}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilters}
          >
            <Pressable
              onPress={() => selectCategory("all")}
              style={[
                styles.filterChip,
                selectedCategory === "all" && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === "all" && styles.filterTextActive,
                ]}
              >
                {isAmharic ? "\u1201\u1209\u121D \u1266\u1273\u12CE\u127D" : "All places"}
              </Text>
            </Pressable>

            {categories.map((category) => {
              const active = selectedCategory === category.slug;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => selectCategory(category.slug)}
                  style={[
                    styles.filterChip,
                    active && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {getCategoryIcon(category)}{" "}
                    {isAmharic && category.name_am
                      ? category.name_am
                      : category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Business listings */}
        <View style={styles.listingsSection}>
          <View style={styles.listingsHeading}>
            <View>
              <Text style={styles.sectionTitle}>
                {selectedCategory === "all"
                  ? (isAmharic ? "\u1266\u1273\u12CE\u127D\u1295 \u12EB\u130D\u1299" : "Discover places")
                  : categories.find(
                      (category) => category.slug === selectedCategory,
                    )?.name ?? (isAmharic ? "\u1266\u1273\u12CE\u127D" : "Discover places")}
              </Text>

              <Text style={styles.sectionSubtitle}>
                {filteredBusinesses.length}{" "}
                {filteredBusinesses.length === 1 ? (isAmharic ? "\u1266\u1273 \u1270\u1308\u129D\u1277\u120D" : "place found") : (isAmharic ? "\u1266\u1273\u12CE\u127D \u1270\u1308\u129D\u1270\u12CB\u120D" : "places found")}
              </Text>
            </View>

            {selectedCategory !== "all" && (
              <Pressable onPress={() => selectCategory("all")}>
                <Text style={styles.resetText}>{isAmharic ? "\u121B\u1323\u1270\u122A\u12EB \u12A0\u133D\u12F3" : "Clear filter"}</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortOptions}
          >
            {([
              ["rating", isAmharic ? "\u12A8\u134D\u1270\u129B \u12F0\u1228\u1303 \u12EB\u120B\u1278\u12CD" : "Highest rated"],
              ["reviews", isAmharic ? "\u1265\u12D9 \u130D\u121D\u1308\u121B\u12CE\u127D" : "Most reviewed"],
              ["newest", isAmharic ? "\u12A0\u12F2\u1235" : "Newest"],
              ["nearby", isAmharic ? "\u1260\u12A0\u1245\u122B\u1262\u12EB" : "Nearby"],
            ] as const).map(([value, label]) => (
              <Pressable
                key={value}
                disabled={value === "nearby" && isLocating}
                onPress={() => {
                  if (value === "nearby") {
                    void enableNearbySorting();
                  } else {
                    setSortBy(value);
                    setLocationError(null);
                  }
                }}
                style={[
                  styles.sortChip,
                  sortBy === value && styles.sortChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.sortText,
                    sortBy === value && styles.sortTextActive,
                  ]}
                >
                  {value === "nearby" && isLocating
                    ? (isAmharic ? "\u12A0\u12AB\u1263\u1262\u12CE\u1295 \u1260\u121B\u130D\u1298\u1275 \u120B\u12ED..." : "Finding location...")
                    : label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ marginBottom: 12 }}>
            <Pressable
              onPress={() => setOpenNowOnly((current) => !current)}
              style={[
                styles.sortChip,
                openNowOnly && styles.sortChipActive,
                { alignSelf: "flex-start" },
              ]}
            >
              <Text
                style={[
                  styles.sortText,
                  openNowOnly && styles.sortTextActive,
                ]}
              >
                {isAmharic ? "\u12A0\u1201\u1295 \u12AD\u134D\u1275" : "Open now"}
              </Text>
            </Pressable>
          </View>

          {sortBy === "nearby" && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>
                {isAmharic ? "\u122D\u1240\u1275" : "Distance"}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortOptions}
              >
                {([
                  ["any", isAmharic ? "\u121B\u1295\u129B\u12CD\u121D \u122D\u1240\u1275" : "Any distance"],
                  [1, isAmharic ? "\u1260 1 \u12AA.\u121C \u12CD\u1235\u1325" : "Within 1 km"],
                  [5, isAmharic ? "\u1260 5 \u12AA.\u121C \u12CD\u1235\u1325" : "Within 5 km"],
                  [10, isAmharic ? "\u1260 10 \u12AA.\u121C \u12CD\u1235\u1325" : "Within 10 km"],
                ] as const).map(([value, label]) => (
                  <Pressable
                    key={String(value)}
                    onPress={() => setDistanceLimit(value)}
                    style={[
                      styles.sortChip,
                      distanceLimit === value && styles.sortChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortText,
                        distanceLimit === value && styles.sortTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {locationError && (
            <Text style={styles.stateText}>{locationError}</Text>
          )}

          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => setViewMode("list")}
              style={[
                styles.viewToggleButton,
                viewMode === "list" && styles.viewToggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  viewMode === "list" && styles.viewToggleTextActive,
                ]}
              >
{isAmharic ? "\u12E8\u12DD\u122D\u12DD\u122D \u12A5\u12ED\u1273" : "List View"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setViewMode("map")}
              style={[
                styles.viewToggleButton,
                viewMode === "map" && styles.viewToggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  viewMode === "map" && styles.viewToggleTextActive,
                ]}
              >
{isAmharic ? "\u12E8\u12AB\u122D\u1273 \u12A5\u12ED\u1273" : "Map View"}
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={COLORS.green} />
<Text style={styles.stateText}>{isAmharic ? "\u1325\u1229 \u1266\u1273\u12CE\u127D\u1295 \u1260\u121B\u130D\u1298\u1275 \u120B\u12ED..." : "Finding great places..."}</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateIcon}>{"\u{26A0}"}</Text>
<Text style={styles.stateTitle}>{isAmharic ? "\u127D\u130D\u122D \u1270\u1348\u1325\u122F\u120D" : "Something went wrong"}</Text>
              <Text style={styles.stateText}>{error}</Text>

              <Pressable
                onPress={() => {
                  setLoading(true);
                  setError(null);
                  void loadExploreData();
                }}
                style={styles.retryButton}
              >
<Text style={styles.retryText}>{isAmharic ? "\u12A5\u1295\u12F0\u1308\u1293 \u12ED\u121E\u1291" : "Try again"}</Text>
              </Pressable>
            </View>
          ) : filteredBusinesses.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateIcon}>{"\u{26A0}"}</Text>
<Text style={styles.stateTitle}>{isAmharic ? "\u121D\u1295\u121D \u1266\u1273 \u12A0\u120D\u1270\u1308\u1298\u121D" : "No places found"}</Text>
              <Text style={styles.stateText}>
{isAmharic ? "\u120C\u120B \u134D\u1208\u130B \u12ED\u121E\u1299 \u12C8\u12ED\u121D \u120C\u120B \u121D\u12F5\u1265 \u12ED\u121D\u1228\u1321\u1362" : "Try another search or choose a different category."}
              </Text>

              <Pressable
                onPress={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                style={styles.retryButton}
              >
<Text style={styles.retryText}>{isAmharic ? "\u1201\u1209\u121D \u1266\u1273\u12CE\u127D" : "All places"}</Text>
              </Pressable>
            </View>
          ) : (
            viewMode === "map" ? (
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: currentLocation?.latitude ?? 7.6667,
                    longitude: currentLocation?.longitude ?? 36.8333,
                    latitudeDelta: 0.08,
                    longitudeDelta: 0.08,
                  }}
                  showsUserLocation={currentLocation !== null}
                >
                  {filteredBusinesses
                    .filter(
                      (business) =>
                        business.latitude !== null &&
                        business.longitude !== null,
                    )
                    .map((business) => (
                      <Marker
                        key={business.id}
                        coordinate={{
                          latitude: business.latitude!,
                          longitude: business.longitude!,
                        }}
                        title={business.name}
                        description={`\u2605 ${Number(business.average_rating || 0).toFixed(1)} \u00B7 ${business.review_count} ${isAmharic ? "\u130D\u121D\u1308\u121B\u12CE\u127D" : "reviews"}`}
                        onCalloutPress={() => openBusiness(business.slug)}
                      />
                    ))}
                </MapView>

                {currentLocation && (
                  <Pressable
                    style={styles.myLocationButton}
                    onPress={() =>
                      mapRef.current?.animateToRegion(
                        {
                          latitude: currentLocation.latitude,
                          longitude: currentLocation.longitude,
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        },
                        500,
                      )
                    }
                  >
                    <Text style={styles.myLocationButtonText}>
{isAmharic ? "\u12A0\u12AB\u1263\u1262\u12EC" : "My Location"}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.businessList}>
              {filteredBusinesses.map((business) => {
                const category = categories.find(
                  (item) => item.id === business.category_id,
                );

                const distanceKm = (() => {
                  if (
                    !currentLocation ||
                    business.latitude === null ||
                    business.longitude === null
                  ) {
                    return null;
                  }

                  const toRadians = (degrees: number) =>
                    (degrees * Math.PI) / 180;

                  const latDiff = toRadians(
                    business.latitude - currentLocation.latitude,
                  );
                  const lonDiff = toRadians(
                    business.longitude - currentLocation.longitude,
                  );

                  const haversine =
                    Math.sin(latDiff / 2) ** 2 +
                    Math.cos(toRadians(currentLocation.latitude)) *
                      Math.cos(toRadians(business.latitude)) *
                      Math.sin(lonDiff / 2) ** 2;

                  return 6371 * 2 * Math.atan2(
                    Math.sqrt(haversine),
                    Math.sqrt(1 - haversine),
                  );
                })();

                return (
                  <Pressable
                    key={business.id}
                    onPress={() => openBusiness(business.slug)}
                    style={styles.businessCard}
                  >
                    <View style={styles.businessImageContainer}>
                      {photos[business.id] ? (
                        <Image
                          source={{ uri: photos[business.id] }}
                          style={styles.businessImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.placeholderIcon}>
                            {category ? getCategoryIcon(category) : "\u{1F4CD}"}
                          </Text>
                        </View>
                      )}

                      {business.verified && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>{"\u2713"} {isAmharic ? "\u12E8\u1270\u1228\u130B\u1308\u1320" : "Verified"}</Text>
                        </View>
                      )}
                      {businessHours[business.id]?.length > 0 && (
                        <View
                          style={[
                            styles.openStatusBadge,
                            isBusinessOpen(business.id)
                              ? styles.openStatusBadgeOpen
                              : styles.openStatusBadgeClosed,
                          ]}
                        >
                          <Text style={styles.openStatusText}>
                            {isBusinessOpen(business.id) ? (isAmharic ? "\u12A0\u1201\u1295 \u12AD\u134D\u1275" : "Open now") : (isAmharic ? "\u12A0\u1201\u1295 \u12DD\u130D\u1277\u120D" : "Closed now")}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.businessDetails}>
                      <View style={styles.businessTitleRow}>
                        <Text style={styles.businessName} numberOfLines={1}>
                          {business.name}
                        </Text>

                        <Text style={styles.rating}>
                          {"?"}{" "}
                          {Number(business.average_rating || 0).toFixed(1)}
                        </Text>
                      </View>

                      <Text style={styles.businessCategory}>
                        {category ? (isAmharic && category.name_am ? category.name_am : category.name) : (isAmharic ? "\u12E8\u12A0\u12AB\u1263\u1262 \u1266\u1273" : "Local business")}
                      </Text>

                      <Text
                        style={styles.businessDescription}
                        numberOfLines={2}
                      >
                        {business.description ||
                          (isAmharic ? "\u12ED\u1205\u1295 \u12E8\u12A0\u12AB\u1263\u1262 \u1266\u1273 \u1260YeneSpot \u120B\u12ED \u12EB\u130D\u1299" : "Discover this local business on YeneSpot.")}
                      </Text>

                      <View style={styles.businessFooter}>
                        <Text style={styles.businessLocation}>
                          {"\u{1F4CD}"}{" "}
                          {[business.neighborhood, business.city]
                            .filter(Boolean)
                            .join(", ")}
                          {sortBy === "nearby" && distanceKm !== null
                            ? ` \u00B7 ${distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} away`
                            : ""}
                        </Text>

                        <Text style={styles.reviewCount}>
                          {"\u2605"} {Number(business.average_rating || 0).toFixed(1)} {"\u00B7"} {business.review_count} {isAmharic ? "\u130D\u121D\u1308\u121B\u12CE\u127D" : "reviews"}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            )
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>YeneSpot</Text>
          <Text style={styles.footerText}>
            {isAmharic ? "\u12E8\u12A0\u12AB\u1263\u1262\u12CD\u1295 \u12ED\u12C8\u1241\u1362 \u12E8\u12A0\u12AB\u1263\u1262\u12CD\u1295 \u12ED\u12F0\u130D\u1349\u1362" : "Discover local. Support local."}
          </Text>
          <Text style={styles.copyright}>
            {"\u00A9"} YeneSpot {"\u00B7"} Jimma, Ethiopia
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContent: {
    paddingBottom: 35,
  },
  header: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    color: "#D1D9DE",
    fontSize: 11,
    marginTop: 3,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF15",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  locationIcon: {
    fontSize: 17,
    marginRight: 7,
  },
  locationLabel: {
    color: "#D5A642",
    fontSize: 8,
    fontWeight: "800",
  },
  locationName: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  intro: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  eyebrow: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
    letterSpacing: -1,
  },
  titleHighlight: {
    color: COLORS.gold,
  },
  introDescription: {
    color: "#D3DCE1",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    maxWidth: 330,
  },
  searchBox: {
    backgroundColor: COLORS.white,
    borderRadius: 13,
    marginTop: 22,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    color: COLORS.green,
    fontSize: 27,
    marginRight: 9,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    height: "100%",
  },
  clearSearch: {
    color: COLORS.muted,
    fontSize: 16,
    padding: 6,
  },
  section: {
    paddingTop: 27,
    paddingHorizontal: 20,
  },
  sectionHeading: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 19,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  categoryFilters: {
    paddingBottom: 17,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  filterText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
  },
  filterTextActive: {
    color: COLORS.white,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "31.5%",
    minHeight: 105,
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryCardActive: {
    borderColor: COLORS.gold,
    backgroundColor: "#FBF5E8",
  },
  categoryIcon: {
    fontSize: 25,
    marginBottom: 7,
  },
  categoryName: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  categoryNameActive: {
    color: COLORS.green,
  },
  categoryAmharic: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },  sortOptions: {
    gap: 8,
    paddingBottom: 14,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  sortText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
  },
  sortTextActive: {
    color: COLORS.white,
  },

  listingsSection: {
    paddingHorizontal: 20,
    paddingTop: 31,
  },
  listingsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  resetText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
  },
  businessList: {
    gap: 14,
  },
  businessCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  businessImageContainer: {
    height: 190,
    backgroundColor: "#E9EDE9",
  },
  businessImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8EDE8",
  },
  placeholderIcon: {
    fontSize: 48,
  },
  verifiedBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  verifiedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },
  openStatusBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  openStatusBadgeOpen: {
    backgroundColor: "#237A45",
  },
  openStatusBadgeClosed: {
    backgroundColor: "#B83232",
  },
  openStatusText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  viewToggleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 9,
  },
  viewToggleButtonActive: {
    backgroundColor: COLORS.green,
  },
  viewToggleText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  viewToggleTextActive: {
    color: COLORS.white,
  },
  mapContainer: {
    height: 500,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 18,
    right: 18,
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  myLocationButtonText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "800",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  businessDetails: {
    padding: 16,
  },
  businessTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  businessName: {
    color: COLORS.navy,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    flex: 1,
  },
  rating: {
    color: "#A87513",
    fontSize: 13,
    fontWeight: "900",
  },
  businessCategory: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
  },
  businessDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },
  businessFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  businessLocation: {
    color: COLORS.muted,
    fontSize: 11,
    flex: 1,
  },
  reviewCount: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },  stateBox: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 27,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stateIcon: {
    fontSize: 34,
    marginBottom: 10,
  },
  stateTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 7,
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 9,
  },
  retryButton: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 17,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  footer: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 15,
  },
  footerLogo: {
    color: COLORS.green,
    fontSize: 22,
    fontWeight: "900",
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },
  copyright: {
    color: "#A0A8A8",
    fontSize: 10,
    marginTop: 12,
  },
});









