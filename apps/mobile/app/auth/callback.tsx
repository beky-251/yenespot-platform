import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";

const COLORS = {
  navy: "#172B3A",
  green: "#173B35",
  gold: "#D5A642",
  cream: "#FAF9F6",
  white: "#FFFFFF",
  muted: "#747C80",
  red: "#C0392B",
};

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();

  const started = useRef(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    "Verifying your email address...",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;

    started.current = true;

    async function verifyEmail() {
      try {
        if (params.error) {
          throw new Error(
            params.error_description || params.error,
          );
        }

        const code = params.code;

        if (!code || typeof code !== "string") {
          throw new Error(
            "The verification link is missing its authentication code. Please request a new email.",
          );
        }

        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          throw exchangeError;
        }

        setMessage(
          "Your email has been verified successfully. You can now sign in.",
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Email verification failed. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    void verifyEmail();
  }, [params.code, params.error, params.error_description]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>
          YeneSpot<Text style={styles.logoDot}>.</Text>
        </Text>

        {loading ? (
          <>
            <ActivityIndicator
              size="large"
              color={COLORS.green}
              style={styles.indicator}
            />

            <Text style={styles.heading}>
              Verifying your email
            </Text>

            <Text style={styles.description}>
              Please wait while we securely verify your account.
            </Text>
          </>
        ) : error ? (
          <>
            <Text style={styles.errorIcon}>!</Text>

            <Text style={styles.heading}>
              Verification unsuccessful
            </Text>

            <Text style={styles.errorMessage}>
              {error}
            </Text>

            <Pressable
              style={styles.button}
              onPress={() => router.replace("/register" as never)}
            >
              <Text style={styles.buttonText}>
                Register again
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.successIcon}>✓</Text>

            <Text style={styles.heading}>
              Email verified!
            </Text>

            <Text style={styles.description}>
              {message}
            </Text>

            <Pressable
              style={styles.button}
              onPress={() => router.replace("/login" as never)}
            >
              <Text style={styles.buttonText}>
                Continue to sign in
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E6DF",
  },
  logo: {
    color: COLORS.navy,
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 30,
  },
  logoDot: {
    color: COLORS.gold,
  },
  indicator: {
    marginBottom: 20,
  },
  heading: {
    color: COLORS.navy,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 12,
  },
  successIcon: {
    color: COLORS.green,
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 15,
  },
  errorIcon: {
    color: COLORS.red,
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 15,
  },
  errorMessage: {
    color: COLORS.red,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 12,
  },
  button: {
    backgroundColor: COLORS.green,
    borderRadius: 11,
    paddingVertical: 15,
    paddingHorizontal: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 25,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
});