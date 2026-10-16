import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { Field } from "../../components/common/Field";
import { AppButton } from "../../components/common/AppButton";
import { User } from "../../types";
import { DEMO_EMPLOYEES } from "../../constants/demoData";

export function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("admin@cafepayroll.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);

  const submit = () => {
    if (email.trim().toLowerCase() === "admin@cafepayroll.com" && password === "admin123") {
      onLogin({ id: "admin-1", name: "Cafe Admin", email, role: "admin" }); return;
    }
    if (email.trim().toLowerCase() === "staff@cafepayroll.com" && password === "staff123") {
      const employee = DEMO_EMPLOYEES[0];
      onLogin({ id: "staff-1", name: employee.fullName, email, role: "staff", employeeId: employee.id }); return;
    }
    Alert.alert("Login unsuccessful", "Please check your email and password.");
  };

  return <View style={styles.page}>
    <View style={styles.hero}><Text style={styles.cup}>☕</Text><Text style={styles.title}>Cafe Payroll</Text><Text style={styles.subtitle}>Your cafe team, organized.</Text></View>
    <View style={styles.form}>
      <Text style={styles.heading}>Welcome back</Text><Text style={styles.help}>Sign in to continue</Text>
      <Field label="EMPLOYEE ID" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@cafe.com" />
      <Field label="PASSWORD" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="Enter password" />
      <Text onPress={() => setShowPassword(!showPassword)} style={styles.show}>{showPassword ? "Hide password" : "Show password"}</Text>
      <AppButton title="Log In" onPress={submit} />
      
    </View>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.cream, justifyContent: "center", padding: 22 },
  hero: { alignItems: "center", marginBottom: 25 }, cup: { fontSize: 43 }, title: { color: COLORS.darkBrown, fontSize: 30, fontWeight: "900", marginTop: 5 }, subtitle: { color: COLORS.muted, marginTop: 5 },
  form: { backgroundColor: COLORS.background, borderRadius: 22, padding: 20, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 22 }, help: { color: COLORS.muted, marginTop: -9, marginBottom: 3 }, show: { color: COLORS.brown, textAlign: "right", marginTop: -8, fontSize: 12, fontWeight: "700" },
  demo: { marginTop: 4, padding: 12, backgroundColor: COLORS.cream, borderRadius: 12, gap: 4 }, demoTitle: { fontWeight: "800", color: COLORS.darkBrown }, demoText: { color: COLORS.muted, fontSize: 11 }
});
