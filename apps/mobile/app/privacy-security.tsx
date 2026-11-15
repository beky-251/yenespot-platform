import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

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

export default function PrivacySecurityScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function changePassword() {
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user?.email) {
        router.replace("/login");
        return;
      }

      const { error: verificationError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (verificationError) {
        setError("Your current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Password updated",
        "Your password has been changed successfully.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update your password. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹  Back to Profile</Text>
        </Pressable>

        <Text style={styles.heading}>Privacy & Security</Text>
        <Text style={styles.description}>
          Protect your YeneSpot account by keeping your password secure.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Change password</Text>
          <Text style={styles.infoDescription}>
            Verify your current password before choosing a new one.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showPasswords}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showPasswords}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showPasswords}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={styles.visibilityButton}
            onPress={() => setShowPasswords((value) => !value)}
          >
            <Text style={styles.visibilityText}>
              {showPasswords ? "Hide passwords" : "Show passwords"}
            </Text>
          </Pressable>

          <Text style={styles.helperText}>
            Use at least 8 characters for your new password.
          </Text>
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={() => void changePassword()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Update password</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
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
    marginTop: 7,
    marginBottom: 22,
    lineHeight: 21,
  },
  infoCard: {
    backgroundColor: "#EEF3EF",
    borderRadius: 13,
    padding: 16,
    marginBottom: 18,
  },
  infoTitle: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "800",
  },
  infoDescription: {
    color: COLORS.charcoal,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    color: COLORS.charcoal,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    color: COLORS.charcoal,
    fontSize: 15,
    backgroundColor: COLORS.white,
  },
  visibilityButton: {
    alignSelf: "flex-start",
    paddingVertical: 12,
  },
  visibilityText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700",
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: "#B42318",
    backgroundColor: "#FEECEB",
    padding: 12,
    borderRadius: 9,
    marginBottom: 15,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: COLORS.green,
    minHeight: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
