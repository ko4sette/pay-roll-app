import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { AppButton } from "../../components/common/AppButton";
import { Field } from "../../components/common/Field";
import { COLORS } from "../../constants/colors";
import { Employee, Role, User } from "../../types";
import { authenticateDemoAdmin, authenticateEmployee, updateEmployeePassword } from "../../services/authService";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { AppText as Text } from "../../components/common/AppText";
import { BRAND_FONT } from "../../constants/typography";

interface LoginScreenProps {
  employees: Employee[];
  onLogin: (user: User) => void | Promise<void>;
  onPasswordAssistanceRequest: (employee: Employee) => Promise<{ ok: boolean; message: string }>;
}

export function LoginScreen({ employees, onLogin, onPasswordAssistanceRequest }: LoginScreenProps) {
  const [role, setRole] = useState<Role | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backHovered, setBackHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async () => {
    if (isSubmitting) return;
    setErrorMessage("");

    if (passwordChangeUser) {
      if (!passwordChangeUser.employeeId) {
        setErrorMessage("This staff account is missing its employee record.");
        return;
      }
      if (!password) {
        setErrorMessage("Enter your current password.");
        return;
      }
      if (!newPassword.trim()) {
        setErrorMessage("New password cannot be empty.");
        return;
      }
      if (newPassword.length < 8) {
        setErrorMessage("Choose a password with at least 8 characters.");
        return;
      }
      if (newPassword === password) {
        setErrorMessage("Choose a new password different from your temporary password.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("Enter the same new password in both fields.");
        return;
      }

      setIsSubmitting(true);
      try {
        await updateEmployeePassword(passwordChangeUser.employeeId, password, newPassword);
        Alert.alert("Password changed", "Your password was saved. You can now continue to your dashboard.");
        await onLogin(passwordChangeUser);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to update password. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const identifier = employeeId.trim().toUpperCase();
    if (!identifier || !password) {
      setErrorMessage(`Enter your ${role === "admin" ? "Admin ID" : "Employee ID"} and password.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (role === "admin") {
        const user = await authenticateDemoAdmin(identifier, password);
        if (!user) {
          setErrorMessage("Check your Admin ID and password.");
          return;
        }
        await onLogin(user);
        return;
      }

      const result = await authenticateEmployee(identifier, password, employees);
      if (!result) {
        setErrorMessage("Check your Employee ID and password, or contact your admin.");
        return;
      }
      if (result.mustChangePassword) {
        setPasswordChangeUser(result.user);
        setPassword("");
        return;
      }
      await onLogin(result.user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The saved account data could not be read.");
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
      <View style={styles.page}>
        <View style={styles.hero}>
          <MaterialCommunityIcons name="coffee-outline" size={43} color={COLORS.brown} />
          <Text style={styles.title}>PayMee! Cafe</Text>
        </View>

        <View style={styles.form}>
          {passwordChangeUser ? (
            <View style={styles.headingRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
                onPress={() => setPasswordChangeUser(null)}
                onHoverIn={() => setBackHovered(true)}
                onHoverOut={() => setBackHovered(false)}
                style={({ pressed }) => [
                  styles.backButton,
                  (backHovered || pressed) && styles.backButtonActive,
                ]}
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.darkBrown} />
              </Pressable>
              <Text style={styles.heading}>Change password</Text>
            </View>
          ) : <Text style={styles.heading}>Sign in</Text>}
          <Text style={styles.help}>
            {passwordChangeUser
              ? "Change your temporary password to continue to your employee dashboard."
              : role === "admin"
                ? "Sign in with the administrator account."
                : role === "staff"
                  ? "Use the Employee ID and password provided to log in"
                  : "Choose Admin or Employee to continue."}
          </Text>

          {passwordChangeUser ? (
            <>
              <Text style={styles.employeeName}>
                Employee ID: {employees.find(employee => employee.id === passwordChangeUser.employeeId)?.employeeNumber ?? employeeId.trim().toUpperCase()}
              </Text>
              <Field
                label="CURRENT PASSWORD"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your current password"
              />
              <Text
                accessibilityRole="button"
                accessibilityState={{ selected: showCurrentPassword }}
                onPress={() => setShowCurrentPassword(visible => !visible)}
                style={styles.show}
              >
                {showCurrentPassword ? "Hide Password" : "Show Password"}
              </Text>
              <Field
                label="NEW PASSWORD"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                placeholder="At least 8 characters"
              />
              <Text
                accessibilityRole="button"
                accessibilityState={{ selected: showNewPassword }}
                onPress={() => setShowNewPassword(visible => !visible)}
                style={styles.show}
              >
                {showNewPassword ? "Hide Password" : "Show Password"}
              </Text>
              <Field
                label="CONFIRM NEW PASSWORD"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                placeholder="Re-enter new password"
              />
              <Text
                accessibilityRole="button"
                accessibilityState={{ selected: showConfirmPassword }}
                onPress={() => setShowConfirmPassword(visible => !visible)}
                style={styles.show}
              >
                {showConfirmPassword ? "Hide Password" : "Show Password"}
              </Text>
              <AppButton title="Change password" onPress={submit} disabled={isSubmitting} />
              {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
              {isSubmitting ? <ActivityIndicator color={COLORS.brown} /> : null}
            </>
          ) : (
            <>
              <View style={styles.roleOptions}>
                {(["admin", "staff"] as const).map(option => (
                  <TouchableOpacity
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: role === option }}
                    onPress={() => {
                      setRole(option);
                      setEmployeeId("");
                      setPassword("");
                      setErrorMessage("");
                    }}
                    style={[styles.roleOption, role === option && styles.selectedRoleOption]}
                  >
                    <Text style={[styles.roleOptionText, role === option && styles.selectedRoleOptionText]}>
                      {option === "admin" ? "Admin" : "Employee"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {role ? (
                <>
                  <Field
                    label={role === "admin" ? "ADMIN EMAIL" : "EMPLOYEE ID"}
                    value={employeeId}
                    onChangeText={setEmployeeId}
                    autoCapitalize={role === "admin" ? "none" : "characters"}
                    autoCorrect={false}
                    keyboardType={role === "admin" ? "email-address" : "default"}
                    placeholder={role === "admin" ? "admin@cafepay.com" : "e.g. CAF001"}
                  />
                  <Field
                    label="PASSWORD"
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
                  {role === "admin"
                    ? <Text style={styles.hint}></Text>
                    : <Text style={styles.hint}></Text>}
                </>
              ) : null}
              {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
              <AppButton title="Log In" onPress={submit} disabled={!role || isSubmitting} />
              {role === "staff" && <Text
                accessibilityRole="link"
                onPress={() => setShowForgotPassword(true)}
                style={styles.forgotPassword}
              >
                Forgot password?
              </Text>}
              {isSubmitting ? <ActivityIndicator color={COLORS.brown} /> : null}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  page: { flex: 1, justifyContent: "center", padding: 22 },
  hero: { alignItems: "center", marginBottom: 25 },
  cup: { fontSize: 43 },
  title: { color: COLORS.darkBrown, fontSize: 30, fontWeight: "900", marginTop: 5, fontFamily: BRAND_FONT },
  subtitle: { color: COLORS.muted, marginTop: 5, textAlign: "center" },
  form: { backgroundColor: COLORS.background, borderRadius: 22, padding: 20, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 22 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  backButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17 },
  backButtonActive: { backgroundColor: COLORS.cream },
  help: { color: COLORS.muted, marginTop: -9, marginBottom: 3 },
  employeeName: { color: COLORS.darkBrown, fontWeight: "700" },
  show: { color: COLORS.brown, textAlign: "right", marginTop: -8, fontSize: 12, fontWeight: "700" },
  forgotPassword: { color: COLORS.brown, fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: -5 },
  hint: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  roleOptions: { flexDirection: "row", gap: 8, padding: 4, borderRadius: 12, backgroundColor: COLORS.cream },
  roleOption: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 9 },
  selectedRoleOption: { backgroundColor: COLORS.brown },
  roleOptionText: { color: COLORS.darkBrown, fontWeight: "700" },
  selectedRoleOptionText: { color: COLORS.white },
  error: { color: "#9D2F25", fontSize: 13, fontWeight: "600" },
});
