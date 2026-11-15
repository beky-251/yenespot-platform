import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

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

type Review = {
  id: string;
  business_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type BusinessInfo = {
  name: string;
  slug: string;
};

type OwnerResponse = {
  review_id: string;
  response: string;
  updated_at: string;
};

type ReviewItem = Review & {
  business: BusinessInfo | null;
  ownerResponse: OwnerResponse | null;
};

export default function MyReviewsScreen() {
  const router = useRouter();
  const { language } = useAppLanguage();
  const isAmharic = language === "am";
  const t = useCallback(
    (english: string, amharic: string) =>
      isAmharic ? amharic : english,
    [isAmharic],
  );

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setReviews([]);
        setError(t("Please sign in to view your reviews.", "\u12a5\u1275\u1218\u12cd\u1233\u1208\u12cd\u1295 \u1308\u121d\u1308\u121b\u12ce\u127d\u1295 \u1208\u121b\u12e8\u1275 \u12ed\u130d\u1261\u1362"));
        return;
      }

      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("id, business_id, rating, comment, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (reviewError) throw reviewError;

      const reviewRows = (reviewData ?? []) as Review[];

      if (reviewRows.length === 0) {
        setReviews([]);
        return;
      }

      const businessIds = [
        ...new Set(reviewRows.map((review) => review.business_id)),
      ];

      const reviewIds = reviewRows.map((review) => review.id);

      const [businessResult, responseResult] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, slug")
          .in("id", businessIds),

        supabase
          .from("review_responses")
          .select("review_id, response, updated_at")
          .in("review_id", reviewIds),
      ]);

      if (businessResult.error) throw businessResult.error;
      if (responseResult.error) throw responseResult.error;

      const businessRows = (businessResult.data ?? []) as {
        id: string;
        name: string;
        slug: string;
      }[];

      const businessMap = new Map<string, BusinessInfo>(
        businessRows.map((business) => [
          business.id,
          { name: business.name, slug: business.slug },
        ]),
      );

      const responseMap = new Map(
        ((responseResult.data ?? []) as OwnerResponse[]).map((response) => [
          response.review_id,
          response,
        ]),
      );

      setReviews(
        reviewRows.map((review) => ({
          ...review,
          business: businessMap.get(review.business_id) ?? null,
          ownerResponse: responseMap.get(review.id) ?? null,
        })),
      );
    } catch (err) {
      console.error("My reviews loading error:", err);
      setError(t("Unable to load your reviews. Please try again.", "\u1308\u121d\u1308\u121b\u12ce\u127d\u1295 \u1218\u132b\u1295 \u12a0\u120d\u1270\u127b\u1208\u121d\u1362 \u12a5\u1295\u12f0\u1308\u1293 \u12ed\u1209\u1219\u1362"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadReviews();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadReviews]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(isAmharic ? "am-ET" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const startEditing = (review: ReviewItem) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment ?? "");
  };

  const saveReview = async (review: ReviewItem) => {
    if (saving) return;

    if (editComment.trim().length > 2000) {
      Alert.alert(t("Review too long", "\u130d\u121d\u1308\u121b\u12cd \u12a8\u121a\u1206\u1290\u12cd \u1260\u120b\u12ed"), t("Your review must be 2,000 characters or fewer.", "\u1308\u121d\u1308\u121b\u12cd 2,000 \u12a0\u1241\u121d\u12eb\u1275 \u12c8\u12ed\u121d \u12a8\u12da\u12eb \u1260\u1273\u127d \u1218\u1206\u1295 \u12a0\u1208\u1260\u1275\u1362"));
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error(t("Please sign in again.", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u130d\u1261\u1362"));

      const { data, error: updateError } = await supabase
        .from("reviews")
        .update({
          rating: editRating,
          comment: editComment.trim() || null,
        })
        .eq("id", review.id)
        .eq("business_id", review.business_id)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) throw new Error(t("The review could not be updated.", "\u1308\u121d\u1308\u121b\u12cd \u121b\u12d8\u1218\u1295 \u12a0\u120d\u1270\u127b\u1208\u121d\u1362"));

      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? {
                ...item,
                rating: editRating,
                comment: editComment.trim() || null,
              }
            : item,
        ),
      );

      setEditingId(null);
      Alert.alert(t("Review updated", "\u1308\u121d\u1308\u121b\u12cd \u1273\u12f5\u1237\u120d"), t("Your changes have been saved.", "\u1218\u1208\u12c8\u1326\u127d\u1295 \u1270\u1240\u1265\u1208\u12cb\u120d\u1362"));
    } catch (err) {
      console.error("Review update error:", err);
      Alert.alert(
        t("Unable to update review", "\u1308\u121d\u1308\u121b\u12cd\u1295 \u121b\u12d8\u1218\u1295 \u12a0\u120d\u1270\u127b\u1208\u121d"),
        err instanceof Error ? err.message : t("Please try again.", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u1209\u1219\u1362"),
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = (review: ReviewItem) => {
    Alert.alert(
      t("Delete review", "\u1308\u121d\u1308\u121b\u12cd\u1295 \u1230\u122d\u12dd"),
      t("Are you sure you want to permanently delete this review?", "\u12ed\u1205\u1295 \u1308\u121d\u1308\u121b \u1260\u124b\u121a\u1290\u1275 \u1218\u1230\u1228\u12dd \u12ed\u1348\u120d\u130b\u1209?"),
      [
        { text: t("Cancel", "\u1230\u122d\u12dd"), style: "cancel" },
        {
          text: t("Delete", "\u1230\u122d\u12dd"),
          style: "destructive",
          onPress: async () => {
            try {
              const {
                data: { user },
                error: authError,
              } = await supabase.auth.getUser();

              if (authError) throw authError;
              if (!user) throw new Error(t("Please sign in again.", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u130d\u1261\u1362"));

              const { data, error: deleteError } = await supabase
                .from("reviews")
                .delete()
                .eq("id", review.id)
                .eq("business_id", review.business_id)
                .eq("user_id", user.id)
                .select("id")
                .maybeSingle();

              if (deleteError) throw deleteError;
              if (!data) throw new Error(t("The review could not be deleted.", "\u1308\u121d\u1308\u121b\u12cd\u1295 \u1218\u1230\u1228\u12dd \u12a0\u120d\u1270\u127b\u1208\u121d\u1362"));

              setReviews((current) =>
                current.filter((item) => item.id !== review.id),
              );

              if (editingId === review.id) {
                setEditingId(null);
              }

              Alert.alert(t("Review deleted", "\u1308\u121d\u1308\u121b\u12cd \u1270\u1230\u122d\u12f7\u120d"), t("Your review has been removed.", "\u1308\u121d\u1308\u121b\u12cd \u1270\u1230\u122d\u12f7\u120d\u1362"));
            } catch (err) {
              console.error("Review deletion error:", err);
              Alert.alert(
                t("Unable to delete review", "\u1308\u121d\u1308\u121b\u12cd\u1295 \u1218\u1230\u1228\u12dd \u12a0\u120d\u1270\u127b\u1208\u121d"),
                err instanceof Error ? err.message : t("Please try again.", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u1209\u1219\u1362"),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.eyebrow}>{t("YOUR CONTRIBUTIONS", "\u12e8\u1293\u1275 \u12a0\u12cb\u1345\u12ce\u127d")}</Text>
          <Text style={styles.title}>{t("My reviews", "\u12e8\u1294 \u1308\u121d\u1308\u121b\u12ce\u127d")}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.subtitle}>
          {t("Manage your ratings and see responses from local businesses.", "\u12e8\u12f0\u1228\u1303 \u12cd\u1324\u1276\u127d\u1295 \u12eb\u1235\u1270\u12f3\u12f5\u1229\u1363 \u12a8\u12a0\u12ab\u1262 \u12f5\u122d\u1305\u1276\u127d \u12e8\u121a\u1308\u1299\u1275\u1295 \u1218\u120d\u1236\u127d \u12ed\u12a8\u1273\u1270\u1209\u1362")}
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.muted}>{t("Loading your reviews...", "\u1308\u121d\u1308\u121b\u12ce\u127d\u1295 \u1260\u1218\u132b\u1295 \u120b\u12ed...")}</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t("Unable to show reviews", "\u1308\u121d\u1308\u121b\u12ce\u127d\u1295 \u121b\u1233\u12e8\u1275 \u12a0\u120d\u1270\u127b\u1208\u121d")}</Text>
            <Text style={styles.muted}>{error}</Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/login" as never)}
            >
              <Text style={styles.primaryButtonText}>{t("Sign in", "\u12ed\u130d\u1261")}</Text>
            </Pressable>

            <Pressable onPress={() => void loadReviews()}>
              <Text style={styles.retryText}>{t("Try again", "\u12a5\u1295\u12f0\u1308\u1293 \u12ed\u121e\u12ed\u12f1")}</Text>
            </Pressable>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>☆</Text>
            <Text style={styles.emptyTitle}>{t("No reviews yet", "\u12a5\u12f0\u1205 \u1308\u121d\u1308\u121b \u12e8\u1208\u121d")}</Text>
            <Text style={styles.muted}>
              {t("Share your experience to help other people discover great local businesses.", "\u120c\u120e\u127d \u1325\u1229 \u12e8\u12f0\u1228\u1303 \u12f5\u122d\u1305\u1276\u127d\u1295 \u12a5\u1295\u12f2\u12eb\u12cd\u1241 \u12e8\u12a5\u1235\u12ab\u12eb\u12ce\u1295 \u1270\u121e\u12ad\u122e \u12eb\u130b\u1229\u1362")}
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/(tabs)/explore" as never)}
            >
              <Text style={styles.primaryButtonText}>{t("Explore businesses", "\u12f5\u122d\u1305\u1276\u127d\u1295 \u12eb\u1235\u1231")}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {reviews.length} {reviews.length === 1 ? t("review", "\u1308\u121d\u1308\u121b") : t("reviews", "\u1308\u121d\u1308\u121b\u12ce\u127d")}
              </Text>
            </View>

            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.businessRow}>
                  <View style={styles.businessInfo}>
                    <Text style={styles.businessName}>
                      {review.business?.name ?? t("Local business", "\u12e8\u12a0\u12ab\u1262 \u12f5\u122d\u1305\u1275")}
                    </Text>
                    <Text style={styles.date}>
                      {t("Submitted", "\u12e8\u1270\u120b\u12a8\u1260\u1275")} {formatDate(review.created_at)}
                    </Text>
                  </View>

                  <Text style={styles.rating}>
                    {"★".repeat(review.rating)}
                    <Text style={styles.ratingMuted}>
                      {"★".repeat(5 - review.rating)}
                    </Text>
                  </Text>
                </View>

                {review.business?.slug ? (
                  <Pressable
                    onPress={() =>
                      router.push(`/business/${review.business!.slug}` as never)
                    }
                  >
                    <Text style={styles.businessLink}>{t("View business \u2192", "\u12f5\u122d\u1305\u1271\u1295 \u12ed\u12ed\u1271 \u2192")}</Text>
                  </Pressable>
                ) : null}

                {editingId === review.id ? (
                  <View style={styles.editor}>
                    <Text style={styles.editorLabel}>{t("Your rating", "\u12e8\u12a5\u122d\u1235\u12ce \u12f0\u1228\u1303")}</Text>

                    <View style={styles.ratingPicker}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Pressable
                          key={rating}
                          onPress={() => setEditRating(rating)}
                          style={styles.ratingButton}
                        >
                          <Text
                            style={[
                              styles.ratingButtonText,
                              rating <= editRating && styles.selectedStar,
                            ]}
                          >
                            ★
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Text style={styles.editorLabel}>{t("Your comment", "\u12e8\u12a5\u122d\u1235\u12ce \u12a0\u1235\u1270\u12eb\u12e8\u1275")}</Text>
                    <TextInput
                      value={editComment}
                      onChangeText={setEditComment}
                      placeholder={t("Share your experience...", "\u12e8\u12a5\u1235\u12ab\u12eb\u12ce\u1295 \u12eb\u130b\u1229...")}
                      placeholderTextColor={COLORS.muted}
                      multiline
                      maxLength={2000}
                      textAlignVertical="top"
                      style={styles.commentInput}
                    />

                    <Text style={styles.characterCount}>
                      {editComment.length}/2000
                    </Text>

                    <View style={styles.editActions}>
                      <Pressable
                        style={styles.saveButton}
                        onPress={() => void saveReview(review)}
                        disabled={saving}
                      >
                        {saving ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <Text style={styles.saveButtonText}>{t("Save changes", "\u1208\u12cd\u1326\u127d\u1295 \u12a0\u1235\u1240\u121d\u1325")}</Text>
                        )}
                      </Pressable>

                      <Pressable
                        style={styles.cancelButton}
                        onPress={() => setEditingId(null)}
                        disabled={saving}
                      >
                        <Text style={styles.cancelButtonText}>{t("Cancel", "\u1230\u122d\u12dd")}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.comment}>
                      {review.comment || t("You left a rating without a comment.", "\u12a0\u1235\u1270\u12eb\u12e8\u1275 \u1203\u1233\u1265 \u1218\u1270\u12cd\u12a8\u12cd\u1295 \u12f0\u1228\u1303 \u1265\u127b \u1208\u12cd\u1230\u12f3\u1209\u1362")}
                    </Text>

                    <View style={styles.reviewActions}>
                      <Pressable
                        style={styles.editButton}
                        onPress={() => startEditing(review)}
                      >
                        <Text style={styles.editButtonText}>{t("Edit review", "\u1308\u121d\u1308\u121b\u12cd\u1295 \u12a0\u122d\u1275\u12d5")}</Text>
                      </Pressable>

                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => deleteReview(review)}
                      >
                        <Text style={styles.deleteButtonText}>{t("Delete", "\u1230\u122d\u12dd")}</Text>
                      </Pressable>
                    </View>
                  </>
                )}

                {review.ownerResponse ? (
                  <View style={styles.responseCard}>
                    <Text style={styles.responseTitle}>
                      {t("Business owner response", "\u12e8\u12f5\u122d\u1305\u1275 \u1263\u1208\u1274\u1273 \u1218\u120d\u1235")}
                    </Text>
                    <Text style={styles.responseText}>
                      {review.ownerResponse.response}
                    </Text>
                    <Text style={styles.responseDate}>
                      {t("Updated", "\u12e8\u1270\u12d8\u1218\u1290\u1260\u1275")} {formatDate(review.ownerResponse.updated_at)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noResponse}>
                    {t("No business response yet.", "\u12e8\u12f5\u122d\u1305\u1271 \u1263\u1208\u1274\u1273 \u1308\u1293 \u1218\u120d\u1235 \u12a0\u120d\u1230\u1320\u121d\u1362")}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#FFFFFF18",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 29,
    lineHeight: 33,
  },
  headerInfo: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 3,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 18,
  },
  center: {
    alignItems: "center",
    padding: 35,
  },
  muted: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 25,
    alignItems: "center",
  },
  emptyIcon: {
    color: COLORS.gold,
    fontSize: 45,
  },
  emptyTitle: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.green,
    borderRadius: 11,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 17,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  retryText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 16,
  },
  countRow: {
    marginBottom: 12,
  },
  countText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: "900",
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 15,
    marginBottom: 13,
  },
  businessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "900",
  },
  date: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },
  rating: {
    color: COLORS.gold,
    fontSize: 15,
  },
  ratingMuted: {
    color: "#D9D9D2",
  },
  businessLink: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 10,
  },
  comment: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 13,
  },
  reviewActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  editButton: {
    backgroundColor: "#EDF3EF",
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  editButtonText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
  },
  deleteButton: {
    backgroundColor: "#FCEDEC",
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "800",
  },
  responseCard: {
    backgroundColor: "#F0F5F1",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
    borderRadius: 9,
    padding: 12,
    marginTop: 16,
  },
  responseTitle: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
  },
  responseText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  responseDate: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 7,
  },
  noResponse: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 15,
  },
  editor: {
    marginTop: 15,
  },
  editorLabel: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
  },
  ratingPicker: {
    flexDirection: "row",
    marginBottom: 16,
  },
  ratingButton: {
    paddingRight: 12,
  },
  ratingButtonText: {
    color: "#D9D9D2",
    fontSize: 29,
  },
  selectedStar: {
    color: COLORS.gold,
  },
  commentInput: {
    minHeight: 105,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 12,
  },
  characterCount: {
    color: COLORS.muted,
    fontSize: 9,
    textAlign: "right",
    marginTop: 5,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: 9,
    padding: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },
  cancelButton: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: "800",
  },
});

