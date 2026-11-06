import React, { useState } from "react";
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { AppButton } from "../../components/common/AppButton";
import { Field } from "../../components/common/Field";
import { AppText as Text } from "../../components/common/AppText";
import { COLORS } from "../../constants/colors";
import { Employee } from "../../types";
import { BRAND_FONT } from "../../constants/typography";

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
    <View style={styles.page}>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="coffee-outline" size={43} color={COLORS.brown} />
        <Text style={styles.brand}>PayMee! Cafe</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.headingRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back to employee login"
            onPress={onBack}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.darkBrown} />
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
  safe: { flex: 1, backgroundColor: COLORS.cream },
  page: { flex: 1, justifyContent: "center", padding: 22 },
  hero: { alignItems: "center", marginBottom: 25 },
  brand: { color: COLORS.darkBrown, fontSize: 30, fontWeight: "900", marginTop: 5, fontFamily: BRAND_FONT },
  form: { backgroundColor: COLORS.background, borderRadius: 22, padding: 20, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 22 },
  backButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17 },
  help: { color: COLORS.muted, marginTop: -8, lineHeight: 19 },
  error: { color: COLORS.error, fontSize: 13, fontWeight: "600" },
  confirmation: { color: COLORS.success, fontSize: 13, fontWeight: "700" },
});
