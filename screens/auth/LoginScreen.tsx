import React, { useState } from "react";
import { ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../components/common/AppButton";
import { Field } from "../../components/common/Field";
import { COLORS } from "../../constants/colors";
import { Employee, User } from "../../types";
import { authenticateFirebaseUser, getFriendlyFirebaseLoginError } from "../../services/firebaseAuthService";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { AppText as Text } from "../../components/common/AppText";
import { BRAND_FONT, BRAND_NAME, SECONDARY_FONT } from "../../constants/typography";

interface LoginScreenProps {
  employees: Employee[];
  onLogin: (user: User) => void | Promise<void>;
  onPasswordAssistanceRequest: (employee: Employee) => Promise<{ ok: boolean; message: string }>;
}

export function LoginScreen({ employees, onLogin, onPasswordAssistanceRequest }: LoginScreenProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async () => {
    if (isSubmitting) return;
    setErrorMessage("");

    const identifier = employeeId.trim();
    if (!identifier || !password) {
      setErrorMessage("Enter your email or Employee ID and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await authenticateFirebaseUser(identifier, password, employees);
      if (!user) {
        setErrorMessage("Check your email or Employee ID and password, or contact your admin.");
        return;
      }
      await onLogin(user);
    } catch (error) {
      setErrorMessage(getFriendlyFirebaseLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordScreen
      employees={employees}
      onBack={() => setShowForgotPassword(false)}
      onSubmit={onPasswordAssistanceRequest}
    />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={require("../../assets/paper-grid.jpg")} resizeMode="cover" imageStyle={styles.paperBackground} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={styles.keyboardArea} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>{BRAND_NAME}</Text>
          <Text style={styles.subtitle}>Payroll for your café team</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Sign in</Text>
          <Text style={styles.help}>Sign in with your email or Employee ID.</Text>
          <>
            <>
              <Field
                label="EMAIL OR EMPLOYEE ID"
                icon="account-outline"
                value={employeeId}
                onChangeText={setEmployeeId}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your email or Employee ID"
              />
              <Field
                label="PASSWORD"
                icon="lock-outline"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your password"
              />
              <Text onPress={() => setShowPassword(!showPassword)} style={styles.show}>
                {showPassword ? "Hide password" : "Show password"}
              </Text>
              {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
              <AppButton title="Log In" onPress={submit} disabled={isSubmitting} />
              <Text
                accessibilityRole="link"
                onPress={() => setShowForgotPassword(true)}
                style={styles.forgotPassword}
              >
                Forgot password?
              </Text>
              {isSubmitting ? <ActivityIndicator color={COLORS.brown} /> : null}
            </>
          </>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  keyboardArea: { flex: 1 },
  page: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 28 },
  hero: { width: "100%", maxWidth: 520, alignItems: "center", marginBottom: 30, paddingHorizontal: 6 },
  paperBackground: { opacity: 0.18 },
  title: { color: COLORS.darkBrown, fontSize: 40, lineHeight: 48, fontWeight: "900", marginTop: 5, fontFamily: BRAND_FONT, textAlign: "center" },
  subtitle: { color: COLORS.muted, marginTop: 5, fontSize: 17, textAlign: "center", fontFamily: SECONDARY_FONT },
  form: { width: "100%", maxWidth: 520, backgroundColor: COLORS.background, borderRadius: 22, padding: 20, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 22 },
  help: { color: COLORS.muted, marginTop: -9, marginBottom: 3 },
  show: { color: COLORS.brown, textAlign: "right", marginTop: -8, fontSize: 12, fontWeight: "700" },
  forgotPassword: { color: COLORS.brown, fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: -5 },
  hint: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  error: { color: "#9D2F25", fontSize: 13, fontWeight: "600" },
});
