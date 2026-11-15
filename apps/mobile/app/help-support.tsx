import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

const FAQS = [
  {
    category: "Account",
    questions: [
      {
        question: "How do I create a YeneSpot account?",
        answer:
          "Open the app, select Create account, enter your details, and follow the email verification instructions.",
      },
      {
        question: "How can I update my personal information?",
        answer:
          "Open Profile, select Personal information, update your name or phone number, and save your changes.",
      },
      {
        question: "What should I do if I forget my password?",
        answer:
          "Use the password recovery option on the login screen to request instructions for resetting your password.",
      },
    ],
  },
  {
    category: "Reviews and businesses",
    questions: [
      {
        question: "How do I write a business review?",
        answer:
          "Open a business page, find the reviews section, choose a star rating, write your review, and submit it.",
      },
      {
        question: "Can I edit or delete my review?",
        answer:
          "Yes. Open Profile, select My Reviews, and use the available edit or delete options on your review.",
      },
      {
        question: "How do I find businesses?",
        answer:
          "Open Explore to search for businesses, browse categories, and use the available filters and sorting options.",
      },
    ],
  },
  {
    category: "Favorites and notifications",
    questions: [
      {
        question: "How do I save a favorite business?",
        answer:
          "Open a business page and tap the favorite button. You can find saved businesses under Favorites.",
      },
      {
        question: "Where can I see my notifications?",
        answer:
          "Open Profile and select Notifications. You can read notifications and mark individual notifications or all notifications as read.",
      },
      {
        question: "Why did my notification badge disappear?",
        answer:
          "The badge shows unread notifications. It disappears when all your notifications have been marked as read.",
      },
    ],
  },
  {
    category: "Privacy and security",
    questions: [
      {
        question: "How do I change my password?",
        answer:
          "Open Profile, select Privacy and security, enter your current password, choose a new password of at least 8 characters, and update it.",
      },
      {
        question: "Is my account information private?",
        answer:
          "YeneSpot uses account authentication and access controls to protect account information. Keep your password private and never share it with anyone.",
      },
    ],
  },
];

export default function HelpSupportScreen() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(
    null,
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹  Back to Profile</Text>
      </Pressable>

      <Text style={styles.heading}>Help & Support</Text>
      <Text style={styles.description}>
        Find answers to common questions about using YeneSpot.
      </Text>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeIcon}>?</Text>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeTitle}>How can we help?</Text>
          <Text style={styles.welcomeDescription}>
            Browse the questions below to find helpful information.
          </Text>
        </View>
      </View>

      {FAQS.map((section) => (
        <View key={section.category} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.category}</Text>

          <View style={styles.faqCard}>
            {section.questions.map((item, index) => {
              const isExpanded = expandedQuestion === item.question;

              return (
                <View
                  key={item.question}
                  style={[
                    styles.faqItem,
                    index < section.questions.length - 1 &&
                      styles.faqBorder,
                  ]}
                >
                  <Pressable
                    style={styles.questionButton}
                    onPress={() =>
                      setExpandedQuestion(
                        isExpanded ? null : item.question,
                      )
                    }
                  >
                    <Text style={styles.questionText}>
                      {item.question}
                    </Text>
                    <Text style={styles.expandIcon}>
                      {isExpanded ? "-" : "+"}
                    </Text>
                  </Pressable>

                  {isExpanded ? (
                    <Text style={styles.answerText}>{item.answer}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Need more help?</Text>
        <Text style={styles.contactDescription}>
          YeneSpot support contact details will be available here soon.
        </Text>
      </View>
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
    marginBottom: 22,
  },
  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF3EF",
    borderRadius: 14,
    padding: 17,
    marginBottom: 25,
  },
  welcomeIcon: {
    color: COLORS.green,
    fontSize: 30,
    fontWeight: "700",
    marginRight: 13,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "800",
  },
  welcomeDescription: {
    color: COLORS.charcoal,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  section: {
    marginBottom: 23,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },
  faqCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
  },
  faqItem: {
    paddingVertical: 15,
  },
  faqBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  questionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questionText: {
    color: COLORS.charcoal,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    paddingRight: 12,
  },
  expandIcon: {
    color: COLORS.green,
    fontSize: 23,
    fontWeight: "600",
  },
  answerText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    paddingRight: 15,
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginTop: 2,
  },
  contactTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: "800",
  },
  contactDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
});
