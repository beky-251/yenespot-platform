import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

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

const SECTIONS = [
  {
    title: "1. About YeneSpot",
    body:
      "YeneSpot is a platform that helps people discover local businesses, explore services, save favorite places, and share experiences through reviews. These terms explain the general rules for using the platform.",
  },
  {
    title: "2. Your account",
    body:
      "You are responsible for providing accurate information when creating your account and keeping your login credentials secure. You are responsible for activity carried out through your account. Please notify YeneSpot if you suspect unauthorized access.",
  },
  {
    title: "3. Acceptable use",
    body:
      "You agree to use YeneSpot lawfully and respectfully. Do not misuse the platform, attempt unauthorized access, interfere with its operation, submit misleading information, or use it to harass or harm others.",
  },
  {
    title: "4. Business listings",
    body:
      "Business listings may contain information supplied by business owners or other sources. Details such as prices, opening hours, services, and availability may change. Contact a business directly to confirm important information before visiting or making a purchase.",
  },
  {
    title: "5. Reviews and ratings",
    body:
      "Reviews should reflect genuine experiences and be respectful, relevant, and honest. Do not submit fake reviews, misleading ratings, abusive content, or information that violates another person's rights. YeneSpot may take action on content that violates its platform rules.",
  },
  {
    title: "6. Favorites and notifications",
    body:
      "You may save businesses to your favorites and receive notifications about relevant activity. You are responsible for managing your account preferences and keeping your contact information up to date.",
  },
  {
    title: "7. Intellectual property",
    body:
      "YeneSpot's name, branding, software, and platform design are protected by applicable intellectual property laws. You may not copy or misuse these materials without permission. You must have the necessary rights to content you submit to the platform.",
  },
  {
    title: "8. Service availability",
    body:
      "We aim to keep YeneSpot available and reliable, but access may occasionally be interrupted for maintenance, updates, technical problems, or circumstances outside our control. Features may change as the platform develops.",
  },
  {
    title: "9. Account restrictions",
    body:
      "YeneSpot may restrict or suspend access when necessary to protect users, businesses, or the platform, including when these terms are seriously violated. Where appropriate, we will provide information about the action taken.",
  },
  {
    title: "10. Changes to these terms",
    body:
      "These terms may be updated as YeneSpot develops. Updated terms will be made available through the platform. Continued use after changes take effect may be subject to the updated terms.",
  },
  {
    title: "11. Contact",
    body:
      "Official YeneSpot support contact details will be added here when they are available.",
  },
];

export default function TermsConditionsScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>�  Back to Profile</Text>
      </Pressable>

      <Text style={styles.heading}>Terms & Conditions</Text>
      <Text style={styles.description}>
        Please read these general terms for using YeneSpot.
      </Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Draft terms</Text>
        <Text style={styles.noticeText}>
          This is a preliminary version for review. It should be reviewed for
          legal and regulatory requirements before YeneSpot&apos;s public launch.
        </Text>
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}

      <Text style={styles.footer}>YeneSpot � Terms & Conditions</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    padding: 22,
    paddingTop: 18,
    paddingBottom: 45,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    marginBottom: 18,
  },
  backText: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "600",
  },
  heading: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: "800",
  },
  description: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 20,
  },
  notice: {
    backgroundColor: "#FFF5DF",
    borderRadius: 13,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EBD9AC",
  },
  noticeTitle: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  noticeText: {
    color: COLORS.charcoal,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  sectionBody: {
    color: COLORS.charcoal,
    fontSize: 14,
    lineHeight: 23,
  },
  footer: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
