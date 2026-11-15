import * as Linking from "expo-linking";
import { useState } from "react";
import {
  ActivityIndicator,
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
  muted: "#747C80",
  border: "#E8E6DF",
  red: "#C0392B",
};

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister() {
  setError("");
  setSuccess(false);

  const normalizedName = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
    setError("Please complete all fields.");
    return;
  }

  if (normalizedName.length < 2) {
    setError("Please enter your full name.");
    return;
  }

  if (password.length < 8) {
    setError("Your password must contain at least 8 characters.");
    return;
  }

  if (password !== confirmPassword) {
    setError("Your passwords do not match.");
    return;
  }

  setLoading(true);

  try {
    const redirectTo =
      Platform.OS === "web"
        ? `${window.location.origin}/auth/callback`
        : Linking.createURL("auth/callback", {
            scheme: "yenespot",
          });

    const { error: signupError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: normalizedName,
        },
        emailRedirectTo: redirectTo,
      },
    });

    if (signupError) {
      setError(signupError.message);
      return;
    }

    setSuccess(true);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Registration failed. Please try again.",
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.logoContainer}>
          <Text style={styles.logo}>
            YeneSpot<Text style={styles.logoDot}>.</Text>
          </Text>
          <Text style={styles.tagline}>
            Discover local. Support local.
          </Text>
        </View>

        <View style={styles.card}>
          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✉</Text>

              <Text style={styles.heading}>
                Check your email!
              </Text>

              <Text style={styles.description}>
                Your registration was submitted successfully.
                We sent a verification link to:
              </Text>

              <Text style={styles.emailText}>
                {email.trim().toLowerCase()}
              </Text>

              <Text style={styles.instructions}>
                Open that email and click the verification link.
                After verifying your email, return to YeneSpot
                and sign in.
              </Text>

              <Pressable
                style={styles.primaryButton}
                onPress={() => router.replace("/login" as never)}
              >
                <Text style={styles.primaryButtonText}>
                  Go to sign in
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.heading}>
                Create your account
              </Text>

              <Text style={styles.description}>
                Join YeneSpot and discover amazing local places.
              </Text>

              <Text style={styles.label}>Full name</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!loading}
              />

              <Text style={styles.label}>Email address</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <Text style={styles.label}>Password</Text>

              <TextInput
                style={styles.input}
                placeholder="At least 8 characters"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <Text style={styles.label}>Confirm password</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your password again"
                placeholderTextColor={COLORS.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
                onSubmitEditing={handleRegister}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Create account
                  </Text>
                )}
              </Pressable>

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>
                  Already have an account?
                </Text>

                <Pressable
                  onPress={() => router.replace("/login" as never)}
                  disabled={loading}
                >
                  <Text style={styles.loginLink}> Sign in</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        <Text style={styles.footer}>
          © 2026 YeneSpot. All rights reserved.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 24,
    zIndex: 1,
  },
  backText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "700",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 45,
  },
  logo: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.navy,
  },
  logoDot: {
    color: COLORS.gold,
  },
  tagline: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 23,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heading: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: "900",
  },
  description: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
    marginBottom: 18,
  },
  label: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 14,
    color: COLORS.navy,
    fontSize: 14,
    backgroundColor: COLORS.cream,
  },
  errorBox: {
    backgroundColor: "#FDEDEC",
    borderRadius: 9,
    padding: 12,
    marginTop: 17,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.green,
    borderRadius: 11,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 23,
  },
  loginPrompt: {
    color: COLORS.muted,
    fontSize: 12,
  },
  loginLink: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "900",
  },
  successContainer: {
    alignItems: "center",
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emailText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 15,
  },
  instructions: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 30,
  },
});