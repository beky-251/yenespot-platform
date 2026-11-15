import { useEffect, useState } from "react";
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

export default function PersonalInformationScreen() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (active) {
          setEmail(user.email ?? "");
          setFullName(data?.full_name ?? "");
          setPhone(data?.phone ?? "");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load your personal information.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          phone: trimmedPhone || null,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      Alert.alert(
        "Profile updated",
        "Your personal information has been saved.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save your personal information.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={styles.loadingText}>Loading your information...</Text>
      </View>
    );
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

        <Text style={styles.heading}>Personal information</Text>
        <Text style={styles.description}>
          Keep your account details up to date.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={email}
            editable={false}
            selectTextOnFocus={false}
          />
          <Text style={styles.helperText}>
            Your email address cannot be changed here.
          </Text>

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
            returnKeyType="done"
          />
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={() => void saveProfile()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save changes</Text>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cream,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
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
    marginBottom: 24,
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
  readOnlyInput: {
    backgroundColor: COLORS.cream,
    color: COLORS.muted,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 7,
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
