import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

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
  danger: "#B42318",
};

type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string;
  neighborhood: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  category_id: string | null;
  average_rating: number;
  review_count: number;
  verified: boolean;
};

type Category = {
  name: string;
  name_am: string | null;
  icon: string | null;
};

type Photo = {
  id: string;
  image_url: string;
  caption: string | null;
  is_cover: boolean;
  sort_order: number;
};

type BusinessHour = {
  id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

type Service = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  is_available: boolean;
};

type Review = {
  id: string;
  user_id?: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Reviewer = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type ReviewResponse = {
  id: string;
  review_id: string;
  business_id: string;
  user_id: string;
  response: string;
  created_at: string;
  updated_at: string;
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAYS_AM = [
  "\u12A5\u1211\u12F5",
  "\u1230\u129E",
  "\u121B\u1295\u1233\u12AD\u1235",
  "\u1228\u1265\u12D5",
  "\u1210\u1219\u1235",
  "\u12D3\u122D\u1265",
  "\u1245\u12B3\u12DC",
];

export default function BusinessDetailsScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { language } = useAppLanguage();
  const isAmharic = language === "am";
  const t = useCallback(
    (english: string, amharic: string) =>
      isAmharic ? amharic : english,
    [isAmharic],
  );

  const [business, setBusiness] = useState<Business | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [reviewResponses, setReviewResponses] = useState<ReviewResponse[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewEditing, setReviewEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const currentDay = currentTime.getDay();
  const currentMinutes =
    currentTime.getHours() * 60 + currentTime.getMinutes();

  const todayHours = hours.find(
    (hour) => hour.day_of_week === currentDay,
  );

  const previousDay = (currentDay + 6) % 7;
  const previousDayHours = hours.find(
    (hour) => hour.day_of_week === previousDay,
  );

  const minutesFromTime = (time: string | null) => {
    if (!time) return null;

    const [hour, minute] = time.split(":").map(Number);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return null;
    }

    return hour * 60 + minute;
  };

  const isOpenNow = (() => {
    if (todayHours && !todayHours.is_closed) {
      const opens = minutesFromTime(todayHours.opens_at);
      const closes = minutesFromTime(todayHours.closes_at);

      if (opens !== null && closes !== null) {
        if (closes > opens) {
          if (currentMinutes >= opens && currentMinutes < closes) {
            return true;
          }
        } else if (currentMinutes >= opens) {
          return true;
        }
      }
    }

    if (previousDayHours && !previousDayHours.is_closed) {
      const previousOpens = minutesFromTime(previousDayHours.opens_at);
      const previousCloses = minutesFromTime(previousDayHours.closes_at);

      if (
        previousOpens !== null &&
        previousCloses !== null &&
        previousCloses <= previousOpens &&
        currentMinutes < previousCloses
      ) {
        return true;
      }
    }

    return false;
  })();

  // Load the customer's existing favorite status.
  const loadFavoriteStatus = useCallback(async (businessId: string) => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setIsFavorite(false);
        return;
      }

      const { data, error: favoriteError } = await supabase
        .from("favorites")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("business_id", businessId)
        .maybeSingle();

      if (favoriteError) throw favoriteError;

      setIsFavorite(!!data);
    } catch (err) {
      console.error("Favorite status error:", err);
    }
  }, []);

  // Add or remove this business from favorites.
  const toggleFavorite = async () => {
    if (!business || favoriteLoading) return;

    try {
      setFavoriteLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        Alert.alert(
          t("Sign in required", "\u1218\u130D\u1263\u1275 \u12EB\u1235\u1348\u120D\u130B\u120D"),
          t("Please sign in to save your favorite places.", "\u1270\u12C8\u12F3\u1305 \u1266\u1273\u12CE\u127D\u12CE\u1295 \u1208\u121B\u1235\u1240\u1218\u1325 \u12ED\u130D\u1261\u1362"),
        );
        return;
      }

      if (isFavorite) {
        const { error: deleteError } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("business_id", business.id);

        if (deleteError) throw deleteError;

        setIsFavorite(false);
      } else {
        const { error: insertError } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            business_id: business.id,
          });

        if (insertError) throw insertError;

        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Toggle favorite error:", err);

      Alert.alert(
        t("Unable to update favorites", "\u1270\u12C8\u12F3\u1305\u1276\u127D\u1295 \u121B\u12D8\u1218\u1295 \u12A0\u120D\u1270\u127B\u1208\u121D"),
        t("Please try again. If the problem continues, check your connection.", "\u12A5\u1263\u12AD\u12CE \u12A5\u1295\u12F0\u1308\u1293 \u12ED\u121E\u12ED\u1271\u1362 \u127D\u130D\u1229 \u12A8\u1240\u1320\u1208\u1363 \u12E8\u12A2\u1295\u1270\u122D\u1294\u1275 \u130D\u1295\u1299\u1290\u1275\u12CE\u1295 \u12EB\u1228\u130B\u130D\u1321\u1362"),
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Load the signed-in customer's role and existing review.
  const loadCustomerReview = useCallback(async (businessId: string) => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      setCurrentUserId(user?.id ?? null);

      if (!user) {
        setUserRole(null);
        setMyReview(null);
        setReviewRating(5);
        setReviewComment("");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      const role = roleData?.role ?? null;
      setUserRole(role);

      if (role !== "customer") {
        setMyReview(null);
        return;
      }

      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (reviewError) throw reviewError;

      const existingReview = reviewData as Review | null;

      setMyReview(existingReview);
      setReviewRating(existingReview?.rating ?? 5);
      setReviewComment(existingReview?.comment ?? "");
    } catch (err) {
      console.error("Customer review loading error:", err);
    }
  }, []);
  const loadBusiness = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    try {
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select(
          "id, owner_id, name, slug, description, address, latitude, longitude, city, neighborhood, phone, email, website, category_id, average_rating, review_count, verified",
        )
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();

      if (businessError) throw businessError;

      if (!businessData) {
        setBusiness(null);
        return;
      }

      const currentBusiness = businessData as Business;
      setBusiness(currentBusiness);

      // Load favorite status for this business.
      void loadFavoriteStatus(currentBusiness.id);
      void loadCustomerReview(currentBusiness.id);

      const [
        photoResult,
        hoursResult,
        serviceResult,
        reviewResult,
        reviewerResult,
        responseResult,
        categoryResult,
      ] = await Promise.all([
        supabase
          .from("business_photos")
          .select("id, image_url, caption, is_cover, sort_order")
          .eq("business_id", currentBusiness.id)
          .order("is_cover", { ascending: false })
          .order("sort_order", { ascending: true }),

        supabase
          .from("business_hours")
          .select(
            "id, day_of_week, opens_at, closes_at, is_closed",
          )
          .eq("business_id", currentBusiness.id)
          .order("day_of_week", { ascending: true }),

        supabase
          .from("business_services")
          .select(
            "id, name, description, price, currency, is_available",
          )
          .eq("business_id", currentBusiness.id)
          .eq("is_available", true)
          .order("sort_order", { ascending: true }),

        supabase
          .from("reviews")
          .select("id, user_id, rating, comment, created_at")
          .eq("business_id", currentBusiness.id)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase.rpc("get_public_reviewers", {
          p_business_id: currentBusiness.id,
        }),

        supabase
          .from("review_responses")
          .select("id, review_id, business_id, user_id, response, created_at, updated_at")
          .eq("business_id", currentBusiness.id)
          .order("created_at", { ascending: true }),

        currentBusiness.category_id
          ? supabase
              .from("business_categories")
              .select("name, name_am, icon")
              .eq("id", currentBusiness.category_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (photoResult.error) throw photoResult.error;
      if (hoursResult.error) throw hoursResult.error;
      if (serviceResult.error) throw serviceResult.error;
      if (reviewResult.error) throw reviewResult.error;
      if (reviewerResult.error) throw reviewerResult.error;
      if (responseResult.error) throw responseResult.error;
      if (categoryResult.error) throw categoryResult.error;

      setPhotos((photoResult.data ?? []) as Photo[]);
      setHours((hoursResult.data ?? []) as BusinessHour[]);
      setServices((serviceResult.data ?? []) as Service[]);
      setReviews((reviewResult.data ?? []) as Review[]);
      setReviewers((reviewerResult.data ?? []) as Reviewer[]);
      setReviewResponses((responseResult.data ?? []) as ReviewResponse[]);
      setCategory(categoryResult.data as Category | null);
    } catch (err) {
      console.error("Business details error:", err);
      setError(t("Unable to load this business. Please try again.", "\u12ED\u1205\u1295 \u1262\u12DD\u1290\u1235 \u1218\u132B\u1295 \u12A0\u120D\u1270\u127B\u1208\u121D\u1362 \u12A5\u1295\u12F0\u1308\u1293 \u12ED\u121E\u12ED\u1271\u1362"));
    } finally {
      setLoading(false);
    }
  }, [slug, loadFavoriteStatus, loadCustomerReview, t]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadBusiness();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadBusiness]);

  // Refresh public reviews and the business rating.
  const refreshBusinessReviews = useCallback(async (businessId: string) => {
    const [reviewResult, businessResult, reviewerResult, responseResult] = await Promise.all([
      supabase
        .from("reviews")
        .select("id, user_id, rating, comment, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("businesses")
        .select("average_rating, review_count")
        .eq("id", businessId)
        .maybeSingle(),
      supabase.rpc("get_public_reviewers", {
        p_business_id: businessId,
      }),
      supabase
        .from("review_responses")
        .select("id, review_id, business_id, user_id, response, created_at, updated_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true }),
    ]);

    if (reviewResult.error) throw reviewResult.error;
    if (businessResult.error) throw businessResult.error;
    if (reviewerResult.error) throw reviewerResult.error;
    if (responseResult.error) throw responseResult.error;

    setReviews((reviewResult.data ?? []) as Review[]);
    setReviewers((reviewerResult.data ?? []) as Reviewer[]);
    setReviewResponses((responseResult.data ?? []) as ReviewResponse[]);

    if (businessResult.data) {
      setBusiness((previous) =>
        previous
          ? {
              ...previous,
              average_rating: businessResult.data.average_rating,
              review_count: businessResult.data.review_count,
            }
          : previous,
      );
    }
  }, []);

  // Submit a new review or update the customer's existing review.
  const handleSaveReview = async () => {
    if (!business) return;

    if (!currentUserId) {
      Alert.alert(t("Sign in required", "\u1218\u130D\u1263\u1275 \u12EB\u1235\u1348\u120D\u130B\u120D"), t("Please sign in to write a review.", "\u12A0\u1235\u1270\u12EB\u12E8\u1275 \u1208\u121B\u1235\u1348\u122D \u12ED\u130D\u1261"), [
        { text: t("Cancel", "\u1230\u122D\u12DD"), style: "cancel" },
        { text: t("Sign in", "\u130D\u1261"), onPress: () => router.push("/login") },
      ]);
      return;
    }

    if (userRole !== "customer") {
      Alert.alert(t("Not available", "\u12A0\u12ED\u1308\u129D\u121D"), t("Only customer accounts can write reviews.", "\u12A8\u12F0\u1295\u1260\u129B \u1218\u1208\u12EB \u1270\u1320\u1243\u121A\u12CE\u127D \u1265\u127B \u12A0\u1235\u1270\u12EB\u12E8\u1275 \u1218\u122B\u1275 \u12ED\u127D\u120B\u1209\u1362"));
      return;
    }

    if (business.owner_id === currentUserId) {
      Alert.alert(t("Not allowed", "\u12A0\u1295\u12F3\u12F0\u1228\u130D\u121D"), t("You cannot review your own business.", "\u12E8\u122B\u1235\u12CE\u1295 \u1262\u12DD\u1290\u1235 \u1218\u1308\u121D\u1308\u121D \u12A0\u12ED\u127D\u1209\u121D\u1362"));
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      Alert.alert(t("Invalid rating", "\u12E8\u12F0\u1228\u1303 \u12CD\u1324\u1275 \u12A0\u120D\u1270\u1218\u1228\u1320\u121D"), t("Please select a rating from 1 to 5.", "\u12A5\u1263\u12AD\u12CE \u12A8 1 \u12A5\u1235\u12A8 5 \u12EB\u1208\u12CD\u1295 \u12F0\u1228\u1303 \u12ED\u121D\u1228\u1321\u1362"));
      return;
    }

    setReviewLoading(true);

    try {
      const reviewValues = {
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      };

      if (myReview) {
        const { data, error: updateError } = await supabase
          .from("reviews")
          .update(reviewValues)
          .eq("id", myReview.id)
          .eq("business_id", business.id)
          .eq("user_id", currentUserId)
          .select("id, rating, comment, created_at")
          .maybeSingle();

        if (updateError) throw updateError;
        if (!data) throw new Error(t("Your review could not be updated.", "\u12E8\u122D\u1235\u12CE\u1295 \u12A0\u120D\u12F0\u1275\u1295\u1260\u1275\u121D\u1362"));

        setMyReview(data as Review);
        Alert.alert(t("Review updated", "\u12A0\u1235\u1270\u12EB\u12E8\u1275 \u1273\u12F5\u1233\u120D"), t("Your review has been updated.", "\u12E8\u122D\u1235\u12CE \u12A0\u1235\u1270\u12EB\u12E8\u1275 \u1273\u12F5\u1237\u120D\u1362"));
      } else {
        const { data, error: insertError } = await supabase
          .from("reviews")
          .insert({
            business_id: business.id,
            user_id: currentUserId,
            ...reviewValues,
          })
          .select("id, rating, comment, created_at")
          .single();

        if (insertError) throw insertError;

        setMyReview(data as Review);
        Alert.alert(t("Review submitted", "\u12A0\u1235\u1270\u12EB\u12E8\u1275 \u1270\u120D\u12AB\u120D"), t("Thank you for sharing your experience.", "\u1208\u12A0\u1235\u1270\u12EB\u12E8\u1275 \u1260\u1270\u12AB\u1348\u1209\u1275 \u12A5\u1293\u121D\u1230\u130D\u1293\u1208\u1295\u1362"));
      }

      setReviewEditing(false);
      await refreshBusinessReviews(business.id);
    } catch (err) {
      console.error("Save review error:", err);
      Alert.alert(
        t("Unable to save review", "\u12A0\u1235\u1270\u12EB\u12E8\u1275\u1295 \u121B\u1235\u1240\u1218\u1325 \u12A0\u120D\u1270\u127B\u1208\u121D"),
        err instanceof Error ? err.message : t("Please try again.", "\u12A5\u1295\u12F0\u1308\u1293 \u12ED\u121E\u12ED\u1271\u1362"),
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // Delete only the signed-in customer's own review.
  const handleDeleteReview = () => {
    if (!business || !currentUserId || !myReview) return;

    Alert.alert(
      t("Delete review", "\u12A0\u1235\u1270\u12EB\u12E8\u1275\u1295 \u1230\u122D\u12DD"),
      t("Are you sure you want to delete your review?", "\u12A5\u1295\u12F0\u1308\u1293 \u12A0\u1235\u1270\u12EB\u12E8\u1275\u12CE\u1295 \u1218\u1230\u1228\u12DD \u12ED\u1348\u120D\u130B\u1209?"),
      [
        { text: t("Cancel", "\u1230\u122D\u12DD"), style: "cancel" },
        {
          text: t("Delete", "\u1230\u122D\u12DD"),
          style: "destructive",
          onPress: async () => {
            setReviewLoading(true);

            try {
              const { error: deleteError } = await supabase
                .from("reviews")
                .delete()
                .eq("id", myReview.id)
                .eq("business_id", business.id)
                .eq("user_id", currentUserId);

              if (deleteError) throw deleteError;

              setMyReview(null);
              setReviewRating(5);
              setReviewComment("");
              setReviewEditing(false);

              await refreshBusinessReviews(business.id);

              Alert.alert(t("Review deleted", "\u12A0\u1235\u1270\u12EB\u12E8\u1275 \u1270\u1230\u122D\u12DF\u120D"), t("Your review has been deleted.", "\u12E8\u122D\u1235\u12CE \u12A0\u1235\u1270\u12EB\u12E8\u1275 \u1270\u1230\u122D\u12DF\u120D\u1362"));
            } catch (err) {
              console.error("Delete review error:", err);
              Alert.alert(
                t("Unable to delete review", "\u12A0\u1235\u1270\u12EB\u12E8\u1275\u1295 \u1218\u1230\u1228\u12DD \u12A0\u120D\u1270\u127B\u1208\u121D"),
                err instanceof Error ? err.message : t("Please try again.", "\u12A5\u1295\u12F0\u1308\u1293 \u12ED\u121E\u12ED\u1271\u1362"),
              );
            } finally {
              setReviewLoading(false);
            }
          },
        },
      ],
    );
  };
  const formatTime = (time: string | null) => {
    if (!time) return "\u2014";

    const [hourText, minuteText] = time.split(":");
    const hour = Number(hourText);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minuteText} ${suffix}`;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const openPhone = () => {
    if (business?.phone) {
      void Linking.openURL(`tel:${business.phone}`);
    }
  };

  const openWebsite = () => {
    if (!business?.website) return;

    const url = business.website.startsWith("http")
      ? business.website
      : `https://${business.website}`;

    void Linking.openURL(url);
  };

  const openDirections = () => {
    if (!business) return;

    const destination =
      business.latitude !== null && business.longitude !== null
        ? `${business.latitude},${business.longitude}`
        : [
            business.address,
            business.neighborhood,
            business.city,
          ]
            .filter(Boolean)
            .join(", ");

    if (!destination) {
      Alert.alert(
        t("Location unavailable", "\u12E8\u12A0\u12AB\u1263\u1262 \u1218\u1228\u1303 \u12A0\u120D\u1270\u1308\u1298\u121D"),
        t("This business has not added its location yet.", "\u12ED\u1205 \u1262\u12DD\u1290\u1235 \u12E8\u12A0\u12AB\u1263\u1262 \u1218\u1228\u1303\u12CD\u1295 \u1308\u1293 \u12A0\u120D\u1328\u1218\u1228\u121D\u1362")
      );
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

    void Linking.openURL(url).catch(() => {
      Alert.alert(t("Unable to open Maps", "\u1218\u120D\u12AD\u1275 \u12A0\u120D\u1270\u12AB\u1270\u1270\u121D"), t("Please try again later.", "\u12A5\u1263\u12AD\u12CE \u1260\u1295\u12F5 \u1320\u1295\u1246 \u12ED\u121E\u12ED\u1271\u1362"));
    });
  };
  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={styles.loadingText}>{t("Loading business...", "\u1262\u12DD\u1290\u1231 \u1260\u1218\u132B\u1295 \u120B\u12ED \u1290\u12CD...")}</Text>
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.emptyIcon}>{"\uD83D\uDCCD"}</Text>
        <Text style={styles.emptyTitle}>
          {error ? t("Something went wrong", "\u12A0\u1295\u12F5 \u1245\u130D\u122D \u1270\u12A8\u1235\u1277\u120D") : t("Business not found", "\u1262\u12DD\u1290\u1231 \u12A0\u120D\u1270\u1308\u1298\u121D")}
        </Text>
        <Text style={styles.emptyDescription}>
          {error || t("This business may no longer be available.", "\u12ED\u1205 \u1262\u12DD\u1290\u1235 \u12A8\u12A5\u1295\u12F2\u1205 \u1260\u12A0\u1201\u1291 \u120B\u12ED\u1308\u129D \u12ED\u127D\u120B\u120D\u1362")}
        </Text>

        {error && (
          <Pressable style={styles.primaryButton} onPress={loadBusiness}>
            <Text style={styles.primaryButtonText}>{t("Try again", "\u12A5\u1295\u12F0\u1308\u1293 \u12ED\u121E\u12ED\u1271")}</Text>
          </Pressable>
        )}

        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>{t("Go back", "\u12C8\u12F0 \u12A0\u12F4 \u1270\u1218\u1208\u1235")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top navigation */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{"\u2039"}</Text>
          </Pressable>

          <Text style={styles.topLogo}>YeneSpot</Text>

          <Pressable
            onPress={toggleFavorite}
            disabled={favoriteLoading}
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            {favoriteLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text
                style={[
                  styles.favoriteIcon,
                  isFavorite && styles.favoriteIconActive,
                ]}
              >
                {isFavorite ? "\u2665" : "\u2661"}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Photo gallery */}
        {photos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {photos.map((photo, index) => (
              <View key={photo.id} style={[styles.gallerySlide, { width: screenWidth }]}>
                <Image
                  source={{ uri: photo.image_url }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />

                <View style={styles.photoCounter}>
                  <Text style={styles.photoCounterText}>
                    {index + 1} / {photos.length}
                  </Text>
                </View>

                {photo.caption && (
                  <View style={styles.photoCaption}>
                    <Text style={styles.photoCaptionText}>
                      {photo.caption}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderIcon}>
              {category?.icon || "\uD83D\uDCCD"}
            </Text>
            <Text style={styles.heroPlaceholderText}>
              {isAmharic ? category?.name_am || category?.name || "\u12E8\u12A0\u12AB\u1263\u1262 \u12F5\u122D\u1305\u1275" : category?.name || "Local business"}
            </Text>
          </View>
        )}

        {/* Business information */}
        <View style={styles.content}>
          <View style={styles.businessHeading}>
            <View style={styles.nameContainer}>
              <Text style={styles.businessName}>{business.name}</Text>

              {business.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>{"\u2713"} {t("Verified", "\u12E8\u1270\u1228\u130B\u1308\u1320")}</Text>
                </View>
              )}
            </View>

            <Text style={styles.categoryText}>
              {category?.icon || "\uD83D\uDCCD"} {isAmharic ? category?.name_am || category?.name || "\u12E8\u12A0\u12AB\u1263\u1262 \u12F5\u122D\u1305\u1275" : category?.name || "Local business"}
            </Text>

            <View style={styles.ratingRow}>
              <Text style={styles.businessRatingStar}>{"\u2605"}</Text>
              <Text style={styles.ratingNumber}>
                {Number(business.average_rating || 0).toFixed(1)}
              </Text>
              <Text style={styles.ratingCount}>
                ({business.review_count} {t("reviews", "\u130D\u121D\u1308\u121B\u12CE\u127D")})
              </Text>
            </View>
          </View>

          {/* Contact and favorite buttons */}
          <View style={styles.actionRow}>
            {business.phone && (
              <Pressable style={styles.primaryAction} onPress={openPhone}>
                <Text style={styles.primaryActionText}>{"\u260E"} {t("Call", "\u12ED\u12F0\u12CD\u1209")}</Text>
              </Pressable>
            )}

            {business.website && (
              <Pressable style={styles.secondaryAction} onPress={openWebsite}>
                <Text style={styles.secondaryActionText}>{"\u2197"} {t("Website", "\u12F5\u122D\u1305\u1275 \u12C8\u12ED\u121D \u12F5\u1228-\u1308\u133D")}</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={[
              styles.favoriteAction,
              isFavorite && styles.favoriteActionActive,
            ]}
            onPress={toggleFavorite}
            disabled={favoriteLoading}
          >
            {favoriteLoading ? (
              <ActivityIndicator color={COLORS.green} />
            ) : (
              <Text
                style={[
                  styles.favoriteActionText,
                  isFavorite && styles.favoriteActionTextActive,
                ]}
              >
                {isFavorite
                  ? `\u2665  ${t("Saved to your favorites", "\u12C8\u12F0 \u1270\u12C8\u12F3\u1305\u1276\u127D \u1270\u1328\u121D\u122F\u120D")}`
                  : `\u2661  ${t("Add to favorites", "\u12C8\u1270\u12C8\u12F3\u1305\u1276\u127D \u1328\u121D\u122D")}`}
              </Text>
            )}
          </Pressable>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("About this place", "\u1260\u12DA\u1205 \u1266\u1273 \u1235\u1208\u121A\u12AB\u1204")}</Text>
            <Text style={styles.description}>
              {business.description ||
                t("Discover this local business on YeneSpot.", "\u12ED\u1205\u1295\u1295 \u12E8\u12A0\u12AB\u1263\u1262 \u12F5\u122D\u1305\u1275 \u1260YeneSpot \u12ED\u12C8\u1241\u1362")}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("Location", "\u12A0\u12F5\u122B\u123B")}</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>{"\uD83D\uDCCD"}</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>
                  {[business.neighborhood, business.city]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
                {business.address && (
                  <Text style={styles.infoDescription}>
                    {business.address}
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              style={styles.directionsAction}
              onPress={openDirections}
            >
              <Text style={styles.directionsActionText}>
                {t("Get directions in Google Maps", "\u1260Google Maps \u12A0\u1265\u122B\u12CB\u127D")}
              </Text>
            </Pressable>
            {business.email && (
              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>{"\u2709\uFE0F"}</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>{t("Email", "\u12A2\u121C\u12ED\u120D")}</Text>
                  <Text style={styles.infoDescription}>
                    {business.email}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Opening hours */}
          <View style={styles.section}>
            <View style={styles.hoursHeading}>
              <Text style={styles.sectionTitle}>{t("Opening hours", "\u12E8\u1235\u122B \u1230\u12D3\u1275")}</Text>

              {hours.length > 0 && (
                <View
                  style={[
                    styles.statusBadge,
                    isOpenNow
                      ? styles.openStatusBadge
                      : styles.closedStatusBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      isOpenNow
                        ? styles.openStatusDot
                        : styles.closedStatusDot,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isOpenNow
                        ? styles.openStatusText
                        : styles.closedStatusText,
                    ]}
                  >
                    {isOpenNow ? t("Open now", "\u12A0\u1201\u1295 \u12ED\u1218\u1208\u1233\u120D") : t("Closed now", "\u12A0\u1201\u1295 \u12DD\u130D\u1277\u120D")}
                  </Text>
                </View>
              )}
            </View>

            {hours.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoDescription}>
                  {t("Opening hours have not been provided.", "\u12E8\u1235\u122B \u1230\u12D3\u1275 \u1218\u1228\u1303 \u12A0\u120D\u1270\u1228\u1348\u121D\u1362")}
                </Text>
              </View>
            ) : (
              <View style={styles.hoursCard}>
                {hours.map((hour) => (
                  <View
                    key={hour.id}
                    style={[
                      styles.hourRow,
                      hour.day_of_week === currentDay && styles.todayHourRow,
                    ]}
                  >
                    <Text style={styles.dayText}>
                      {(isAmharic ? DAYS_AM : DAYS)[hour.day_of_week] ?? t("Day", "\u1240\u1295")}
                    </Text>

                    <Text
                      style={[
                        styles.hourText,
                        hour.is_closed && styles.closedText,
                      ]}
                    >
                      {hour.is_closed
                        ? t("Closed", "\u12DD\u130D\u1277\u120D")
                        : `${formatTime(hour.opens_at)} \u2013 ${formatTime(hour.closes_at)}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("Services & offerings", "\u12E8\u12E0\u1308\u120D\u130D\u120E\u1275 \u12A5\u1293 \u12E8\u121A\u1270\u12EB\u12E9 \u12A0\u1308\u120D\u130D\u120E\u1276\u127D")}</Text>

            {services.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoDescription}>
                  {t("No services have been listed yet.", "\u12A5\u1235\u12AB\u12F5 \u12E8\u12A0\u1308\u120D\u130D\u120E\u1275 \u12DD\u122D\u12DD\u122D \u12A0\u120D\u1270\u12F0\u1228\u1308\u121D\u1362")}
                </Text>
              </View>
            ) : (
              <View style={styles.serviceList}>
                {services.map((service) => (
                  <View key={service.id} style={styles.serviceCard}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {service.description && (
                        <Text style={styles.serviceDescription}>
                          {service.description}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.servicePrice}>
                      {service.price === null
                        ? t("Ask", "\u12CB\u130B\u12CD\u1295 \u12ED\u1320\u12ED\u1241")
                        : `${service.price.toLocaleString()} ${service.currency}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("Customer reviews", "\u12E8\u12F0\u1295\u1260\u129E\u127D \u1320\u1208\u1275")}</Text>

            {/* Customer review form */}
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormTitle}>
                {myReview && !reviewEditing
                  ? t("Your review", "\u12E8\u12A5\u1235\u12AD\u122D\u1293 \u1320\u1208\u1275")
                  : t("Share your experience", "\u12E8\u12A5\u1235\u12AD\u122D\u1293 \u1270\u121E\u12AD\u122E \u12EB\u130B\u1229")}
              </Text>

              {!currentUserId ? (
                <>
                  <Text style={styles.reviewFormDescription}>
                    {t("Sign in to rate and review this business.", "\u12ED\u1205\u1295 \u1262\u12DD\u1290\u1235 \u12CB\u130B \u1208\u1218\u1275\u12A8\u1275 \u12A5\u1293 \u1320\u1208\u1275 \u1208\u1218\u133B\u134D \u12ED\u130D\u1261")}.
                  </Text>
                  <Pressable
                    style={styles.reviewPrimaryButton}
                    onPress={() => router.push("/login")}
                  >
                    <Text style={styles.reviewPrimaryButtonText}>
                      {t("Sign in to write a review", "\u1320\u1208\u1275 \u1208\u1218\u133B\u134D \u12ED\u130D\u1261")}
                    </Text>
                  </Pressable>
                </>
              ) : userRole !== "customer" ? (
                <Text style={styles.reviewFormDescription}>
                  {t("Customer accounts can write reviews. Business owners and administrators cannot submit customer reviews.", "\u1320\u1208\u1275 \u1218\u133B\u134D \u12E8\u121A\u127D\u1209 \u12E8\u12F0\u1295\u1260\u129E\u127D \u1218\u1208\u12AB\u12CE\u127D \u1265\u127B \u1293\u1278\u12CD\u1362 \u12E8\u1262\u12DD\u1290\u1235 \u1263\u1208\u1274\u1276\u127D \u12A5\u1293 \u12A0\u1235\u1270\u12F3\u12F0\u122A\u12CE\u127D \u12E8\u12F0\u1295\u1260\u129E\u127D \u1320\u1208\u1275 \u121B\u1235\u1308\u1263\u1275 \u12A0\u12ED\u127D\u1209\u121D\u1362")}
                </Text>
              ) : business.owner_id === currentUserId ? (
                <Text style={styles.reviewFormDescription}>
                  {t("You cannot review your own business.", "\u1260\u122B\u1235\u12CE \u1262\u12DD\u1290\u1235 \u120B\u12ED \u1320\u1208\u1275 \u1218\u133B\u134D \u12A0\u12ED\u127D\u1209\u121D\u1362")}
                </Text>
              ) : myReview && !reviewEditing ? (
                <>
                  <Text style={styles.reviewFormDescription}>
                    {t("You have already reviewed this business.", "\u1260\u12DA\u1205 \u1262\u12DD\u1290\u1235 \u120B\u12ED \u1320\u1208\u1275 \u133D\u1348\u12CB\u120D\u1362")}
                  </Text>

                  <View style={styles.reviewFormStars}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.ratingStar,
                          index < myReview.rating && styles.ratingStarActive,
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>

                  <Text style={styles.reviewComment}>
                    {myReview.comment || t("You left a rating without a comment.", "\u12A0\u1235\u1270\u12AB\u12A8\u120D \u1233\u12ED\u1328\u121D\u1229 \u12CD\u1324\u1275 \u1275\u1265\u1270\u12CB\u120D\u1362")}
                  </Text>

                  <View style={styles.reviewActionRow}>
                    <Pressable
                      style={styles.reviewPrimaryButton}
                      onPress={() => setReviewEditing(true)}
                    >
                      <Text style={styles.reviewPrimaryButtonText}>
                        {t("Edit review", "\u1320\u1208\u1275 \u12A0\u1235\u1270\u12AB\u12AD\u120D")}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.reviewDeleteButton}
                      onPress={handleDeleteReview}
                      disabled={reviewLoading}
                    >
                      <Text style={styles.reviewDeleteButtonText}>
                        {t("Delete", "\u1230\u122D\u12DD")}
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.reviewFormDescription}>
                    {t("How would you rate your experience?", "\u12E8\u12A5\u1235\u12AD\u122D\u1293 \u1270\u121E\u12AD\u122E\u1295 \u12A5\u1295\u12F4\u1275 \u12ED\u1308\u121D\u1273\u1209?")}
                  </Text>

                  <View style={styles.reviewFormStars}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Pressable
                        key={index}
                        onPress={() => setReviewRating(index + 1)}
                        disabled={reviewLoading}
                        accessibilityRole="button"
                        accessibilityLabel={t(`${index + 1} star rating`, `${index + 1} \u12AE\u12A8\u1265 \u12F0\u1228\u1303`) }
                      >
                        <Text
                          style={[
                            styles.ratingStar,
                            index < reviewRating && styles.ratingStarActive,
                          ]}
                        >
                          ★
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.ratingLabel}>
                    {t(`${reviewRating} out of 5 stars`, `5 \u12AE\u12A8\u1266\u127D \u12CD\u1235\u1325 ${reviewRating} \u12AE\u12A8\u1265`)}
                  </Text>

                  <TextInput
                    style={styles.reviewInput}
                    placeholder={t("Tell others about your experience...", "\u12E8\u12A5\u1235\u12AD\u122D\u1293 \u1270\u121E\u12AD\u122E\u1295 \u1208\u122C\u127D \u12A0\u130B\u1229...")}
                    placeholderTextColor={COLORS.muted}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    maxLength={1000}
                    textAlignVertical="top"
                    editable={!reviewLoading}
                  />

                  <Text style={styles.reviewCharacterCount}>
                    {reviewComment.length}/1000
                  </Text>

                  <View style={styles.reviewActionRow}>
                    <Pressable
                      style={[
                        styles.reviewPrimaryButton,
                        reviewLoading && styles.reviewButtonDisabled,
                      ]}
                      onPress={handleSaveReview}
                      disabled={reviewLoading}
                    >
                      {reviewLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.reviewPrimaryButtonText}>
                                                     {myReview ? t("Update review", "\u1320\u1208\u1275 \u12A0\u12D8\u121D\u1295") : t("Submit review", "\u1320\u1208\u1275 \u12A0\u1235\u1308\u1263")}
                        </Text>
                      )}
                    </Pressable>

                    {myReview && (
                      <Pressable
                        style={styles.reviewCancelButton}
                        onPress={() => {
                          setReviewEditing(false);
                          setReviewRating(myReview.rating);
                          setReviewComment(myReview.comment ?? "");
                        }}
                        disabled={reviewLoading}
                      >
                        <Text style={styles.reviewCancelButtonText}>
                          {t("Cancel", "\u1230\u122D\u12DD")}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </View>
            <View style={styles.reviewSummary}>
              <Text style={styles.bigRating}>
                {Number(business.average_rating || 0).toFixed(1)}
              </Text>

              <View>
                <Text style={styles.stars}>{"\u2605\u2605\u2605\u2605\u2605"}</Text>
                <Text style={styles.reviewSummaryText}>
                  {t(`${business.review_count} customer reviews`, `${business.review_count} \u12E8\u12F0\u1295\u1260\u129E\u127D \u1320\u1208\u1276\u127D`)}
                </Text>
              </View>
            </View>

            {reviews.length === 0 ? (
              <Text style={styles.description}>
                {t("No written reviews yet. Be the first to share your experience.", "\u12A5\u1235\u12AB\u12F5 \u12E8\u1270\u133B\u1349 \u1320\u1208\u1276\u127D \u12E8\u1209\u121D\u1362 \u1270\u121E\u12AD\u122E\u12CE\u1295 \u1260\u1218\u130B\u122B\u1275 \u12E8\u1218\u1240\u1218\u1325 \u12A5\u1235\u12AB\u127D\u1201 \u12ED\u1201\u1291\u1362")}.
              </Text>
            ) : (
              <View style={styles.reviewList}>
                {reviews.map((review) => {
                  const reviewer = reviewers.find(
                    (item) => item.id === review.user_id,
                  );
                  const ownerResponse = reviewResponses.find(
                    (item) => item.review_id === review.id,
                  );

                  return (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewerRow}>
                        {reviewer?.avatar_url ? (
                          <Image
                            source={{ uri: reviewer.avatar_url }}
                            style={styles.reviewerAvatar}
                          />
                        ) : (
                          <View style={styles.reviewerAvatarFallback}>
                            <Text style={styles.reviewerAvatarInitial}>
                              {reviewer?.full_name?.trim().charAt(0).toUpperCase() || "Y"}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.reviewerName}>
                          {reviewer?.full_name || t("YeneSpot customer", "\u12E8YeneSpot \u12F0\u1295\u1260\u129B")}
                        </Text>
                      </View>

                      <View style={styles.reviewTop}>
                        <Text style={styles.reviewStars}>
                          {"\u2605".repeat(
                            Math.max(0, Math.min(5, review.rating)),
                          )}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {formatDate(review.created_at)}
                        </Text>
                      </View>

                      <Text style={styles.reviewComment}>
                        {review.comment || t("Customer left a rating.", "\u12F0\u1295\u1260\u129B\u12CD \u12A0\u1235\u1270\u12AB\u12A8\u120D \u1275\u1265\u1270\u12CB\u120D\u1362")}
                      </Text>

                      {ownerResponse ? (
                        <View style={styles.ownerResponse}>
                          <Text style={styles.ownerResponseLabel}>
                            {t("Business owner response", "\u12E8\u1262\u12DD\u1290\u1235 \u1263\u1208\u1274\u1273 \u121D\u120B\u123D")}
                          </Text>
                          <Text style={styles.ownerResponseText}>
                            {ownerResponse.response}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerLogo}>YeneSpot</Text>
            <Text style={styles.footerText}>
              {t("Discover local. Support local.", "\u12E8\u12A0\u12AB\u1263\u1262\u12CE\u1295 \u1266\u1273 \u12ED\u12C8\u1241\u1362 \u12E8\u12A0\u12AB\u1263\u1262\u12CE\u1295 \u12AD\u1348\u120D \u12ED\u1320\u1241\u1362")}
            </Text>
          </View>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cream,
    padding: 25,
  },
  loadingText: {
    color: COLORS.muted,
    marginTop: 14,
    fontSize: 13,
  },
  emptyIcon: {
    fontSize: 45,
    marginBottom: 15,
  },
  emptyTitle: {
    color: COLORS.navy,
    fontSize: 20,
    fontWeight: "900",
  },
  emptyDescription: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 9,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 20,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },
  backText: {
    color: COLORS.green,
    fontWeight: "800",
    marginTop: 20,
  },
  topBar: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF18",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 34,
  },
  topLogo: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF18",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  favoriteIcon: {
    color: COLORS.white,
    fontSize: 25,
  },
  favoriteIconActive: {
    color: COLORS.danger,
  },
  gallerySlide: {
    width: 390,
    height: 245,
    backgroundColor: "#E7EAE5",
  },
  photoCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#00000099",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoCounterText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  photoCaption: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#00000099",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoCaptionText: {
    color: COLORS.white,
    fontSize: 11,
  },
  heroPlaceholder: {
    height: 200,
    backgroundColor: "#E8EDE8",
    justifyContent: "center",
    alignItems: "center",
  },
  heroPlaceholderIcon: {
    fontSize: 55,
  },
  heroPlaceholderText: {
    color: COLORS.green,
    fontWeight: "800",
    marginTop: 10,
  },
  content: {
    paddingHorizontal: 20,
  },
  businessHeading: {
    paddingTop: 23,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
  },
  businessName: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: "900",
    flexShrink: 1,
  },
  verifiedBadge: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "800",
  },
  categoryText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 9,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  businessRatingStar: {
    color: COLORS.gold,
    fontSize: 19,
  },
  ratingNumber: {
    color: COLORS.navy,
    fontWeight: "900",
    fontSize: 15,
  },
  ratingCount: {
    color: COLORS.muted,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  primaryAction: {
    flex: 1,
    minHeight: 52,
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryActionText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 14,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 52,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: COLORS.green,
    fontWeight: "900",
    fontSize: 14,
  },
  favoriteAction: {
    backgroundColor: "#FFFDF7",
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    padding: 15,
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
  },
  favoriteActionActive: {
    backgroundColor: "#FCEDEC",
    borderColor: "#E8B9B5",
  },
  favoriteActionText: {
    color: COLORS.navy,
    fontWeight: "900",
    fontSize: 13,
  },
  favoriteActionTextActive: {
    color: COLORS.danger,
  },  section: {
    marginTop: 30,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 13,
  },
  description: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
  },
  directionsAction: {
    backgroundColor: COLORS.navy,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 13,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 9,
  },
  directionsActionText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 9,
    gap: 12,
  },
  infoIcon: {
    fontSize: 21,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: "800",
  },
  infoDescription: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  hoursHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
    gap: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 13,
  },
  openStatusBadge: {
    backgroundColor: "#E5F4EA",
  },
  closedStatusBadge: {
    backgroundColor: "#FCEDEC",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  openStatusDot: {
    backgroundColor: "#238A49",
  },
  closedStatusDot: {
    backgroundColor: "#C64242",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  openStatusText: {
    color: "#238A49",
  },
  closedStatusText: {
    color: "#C64242",
  },
  todayHourRow: {
    backgroundColor: "#FAF9F6",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    paddingLeft: 12,
  },
  hoursCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  dayText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "700",
  },
  hourText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
  },
  closedText: {
    color: COLORS.danger,
  },
  serviceList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
    minWidth: 0,
  },
  serviceName: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "800",
  },
  serviceDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  servicePrice: {
    color: COLORS.green,
    backgroundColor: "#F7F0DE",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 9,
    overflow: "hidden",
    textAlign: "center",
  },  reviewForm: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  reviewFormTitle: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: "900",
  },
  reviewFormDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  reviewFormStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingStar: {
    color: COLORS.border,
    fontSize: 32,
  },
  ratingStarActive: {
    color: COLORS.gold,
  },
  ratingLabel: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewInput: {
    minHeight: 105,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 13,
    backgroundColor: COLORS.cream,
  },
  reviewCharacterCount: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "right",
  },
  reviewActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 4,
  },
  reviewPrimaryButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewPrimaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewDeleteButton: {
    backgroundColor: "#FCEDEC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  reviewDeleteButtonText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewCancelButton: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  reviewCancelButtonText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewButtonDisabled: {
    opacity: 0.6,
  },  reviewSummary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 13,
  },
  bigRating: {
    color: COLORS.navy,
    fontSize: 38,
    fontWeight: "900",
  },
  stars: {
    color: COLORS.gold,
    fontSize: 17,
    letterSpacing: 2,
  },
  reviewSummaryText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  reviewList: {
    gap: 10,
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  reviewerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  reviewerAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerAvatarInitial: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "700",
  },
  reviewerName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
  ownerResponse: {
    marginTop: 13,
    padding: 11,
    borderRadius: 9,
    backgroundColor: COLORS.cream,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  ownerResponseLabel: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 5,
  },
  ownerResponseText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewStars: {
    color: COLORS.gold,
    fontSize: 15,
  },
  reviewDate: {
    color: COLORS.muted,
    fontSize: 10,
  },
  reviewComment: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },
  footer: {
    alignItems: "center",
    paddingTop: 40,
  },
  footerLogo: {
    color: COLORS.green,
    fontSize: 22,
    fontWeight: "900",
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },
});









