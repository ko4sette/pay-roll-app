import React, { useState } from "react";
import { ImageBackground, SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";
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
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.brand}>{BRAND_NAME}</Text>
        <Text style={styles.tagline}>Payroll for your café team</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.headingRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back to employee login"
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Forgot Password?</Text>
        </View>
        <Text style={styles.help}>Enter your Employee ID to send a password assistance request to the administrator.</Text>
        <Field
          label="EMPLOYEE ID"
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
        <AppButton title={submitting ? "Sending request..." : "Notify Admin"} onPress={submit} disabled={submitting} />
      </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  paper: { opacity: 0.18 },
  page: { flex: 1, justifyContent: "center", padding: 22 },
  hero: { alignItems: "center", marginBottom: 25 },
  brand: { color: COLORS.darkBrown, fontSize: 40, lineHeight: 48, fontWeight: "900", marginTop: 5, fontFamily: BRAND_FONT, textAlign: "center" },
  tagline: { color: COLORS.muted, fontSize: 17, marginTop: 5, fontFamily: SECONDARY_FONT, textAlign: "center" },
  form: { backgroundColor: COLORS.background, borderRadius: 22, padding: 20, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 22 },
  backButton: { minHeight: 36, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  backText: { color: COLORS.brown, fontSize: 14, fontWeight: "700" },
  help: { color: COLORS.muted, marginTop: -8, lineHeight: 19 },
  error: { color: COLORS.error, fontSize: 13, fontWeight: "600" },
  confirmation: { color: COLORS.success, fontSize: 13, fontWeight: "700" },
});
