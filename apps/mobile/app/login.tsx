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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      const user = loginData.user;

      if (!user) {
        await supabase.auth.signOut();
        setError("Unable to verify your account. Please try again.");
        return;
      }

      // Retrieve the user's assigned role from Supabase.
      const { data: roleRecord, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError || !roleRecord) {
        await supabase.auth.signOut();
        setError(
          "Your account role could not be verified. Please contact support.",
        );
        return;
      }

      const role = roleRecord.role;

      const validRoles = ["customer", "business_owner", "admin", "super_admin"];

      if (!validRoles.includes(role)) {
        await supabase.auth.signOut();
        setError("Your account has an invalid role. Please contact support.");
        return;
      }

      // Customers can use the mobile customer experience.
      if (role === "customer") {
        router.replace("/(tabs)" as never);
        return;
      }

      // Other roles are recognized, but their mobile dashboards
      // have not been implemented yet.
      setError(
        `You are signed in as ${role.replace("_", " ")}. ` +
          "This account's dashboard is not yet available in the mobile app.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.logoContainer}>
          <Text style={styles.logo}>
            YeneSpot<Text style={styles.logoDot}>.</Text>
          </Text>
          <Text style={styles.tagline}>Discover local. Support local.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back!</Text>

          <Text style={styles.description}>
            Sign in to discover places and manage your favorites.
          </Text>

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
            placeholder="Enter your password"
            placeholderTextColor={COLORS.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
            onSubmitEditing={handleLogin}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Don&apos;t have an account?</Text>

            <Pressable
              onPress={() => router.push("/register" as never)}
              disabled={loading}
            >
              <Text style={styles.registerLink}> Create account</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>© 2026 YeneSpot. All rights reserved.</Text>
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
    marginBottom: 35,
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
    marginBottom: 25,
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
  loginButton: {
    backgroundColor: COLORS.green,
    borderRadius: 11,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 23,
  },
  registerPrompt: {
    color: COLORS.muted,
    fontSize: 12,
  },
  registerLink: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "900",
  },
  footer: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 30,
  },
});
