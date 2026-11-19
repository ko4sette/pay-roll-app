import React, { useState } from "react";
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppButton } from "../../components/common/AppButton";
import { Field } from "../../components/common/Field";
import { AppText as Text } from "../../components/common/AppText";
import { COLORS } from "../../constants/colors";
import { Employee } from "../../types";
import { BRAND_FONT, BRAND_NAME, SECONDARY_FONT } from "../../constants/typography";

interface ForgotPasswordScreenProps {
  employees: Employee[];
  onBack: () => void;
  onSubmit: (employee: Employee) => Promise<{ ok: boolean; message: string }>;
}

export function ForgotPasswordScreen({ employees, onBack, onSubmit }: ForgotPasswordScreenProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setError("");
    setConfirmation("");
    const identifier = employeeId.trim().toUpperCase();
    if (!identifier) {
      setError("Enter your Employee ID.");
      return;
    }

    const employee = employees.find(item => item.employeeNumber.toUpperCase() === identifier);
    if (!employee) {
      setError("We couldn't find that Employee ID. Check it and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit(employee);
      if (result.ok) setConfirmation(result.message);
      else setError(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The request could not be sent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <SafeAreaView style={styles.safe}>
    <ImageBackground source={require("../../assets/paper-grid.jpg")} resizeMode="cover" imageStyle={styles.paper} style={StyleSheet.absoluteFill} />
    <KeyboardAvoidingView style={styles.keyboardArea} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.brand}>{BRAND_NAME}</Text>
        <Text style={styles.tagline}>Payroll for your café team</Text>
      </View>
      <View style={styles.form}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
          onPress={onBack}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.brown} />
          <Text style={styles.backText}>Back to sign in</Text>
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <View style={styles.titleIcon}><MaterialCommunityIcons name="lock-question" size={22} color={COLORS.brown} /></View>
          <View style={styles.titleCopy}>
            <Text style={styles.heading}>Forgot password?</Text>
            <Text style={styles.help}>Enter your Employee ID to request help accessing your account.</Text>
          </View>
        </View>
        <Field
          label="EMPLOYEE ID"
          icon="badge-account-outline"
          value={employeeId}
          onChangeText={value => {
            setEmployeeId(value);
            setError("");
            setConfirmation("");
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="e.g. CAF001"
        />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {confirmation ? <Text accessibilityLiveRegion="polite" style={styles.confirmation}>{confirmation}</Text> : null}
        <AppButton title={submitting ? "Sending request..." : "Send request"} onPress={submit} disabled={submitting} />
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  paper: { opacity: 0.18 },
  keyboardArea: { flex: 1 },
  page: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22, paddingVertical: 18 },
  hero: { width: "100%", maxWidth: 480, alignItems: "center", marginBottom: 20 },
  brand: { color: COLORS.darkBrown, fontSize: 40, lineHeight: 48, fontWeight: "900", marginTop: 5, fontFamily: BRAND_FONT, textAlign: "center" },
  tagline: { color: COLORS.muted, fontSize: 17, marginTop: 5, fontFamily: SECONDARY_FONT, textAlign: "center" },
  form: { width: "100%", maxWidth: 480, backgroundColor: COLORS.background, borderRadius: 22, padding: 20, gap: 16, borderWidth: 1, borderColor: COLORS.border },
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 22 },
  backButton: { minHeight: 36, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingRight: 10, borderRadius: 8 },
  backText: { color: COLORS.brown, fontSize: 14, fontWeight: "700" },
  titleBlock: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 2 },
  titleIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cream },
  titleCopy: { flex: 1, gap: 5 },
  help: { color: COLORS.muted, lineHeight: 19 },
  error: { color: COLORS.error, fontSize: 13, fontWeight: "600" },
  confirmation: { color: COLORS.success, fontSize: 13, fontWeight: "700" },
});
