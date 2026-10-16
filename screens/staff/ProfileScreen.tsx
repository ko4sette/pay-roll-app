import React from "react";
import { Text, StyleSheet } from "react-native";
import { User } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { COLORS } from "../../constants/colors";

export function ProfileScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  return <ScreenContainer title="My Profile" subtitle="Your account information.">
    <AppCard><Text style={styles.avatar}>☺</Text><Text style={styles.name}>{user.name}</Text><Text style={styles.role}>CAFE STAFF</Text><Text style={styles.label}>Email</Text><Text style={styles.value}>{user.email}</Text><Text style={styles.label}>Employee ID</Text><Text style={styles.value}>{user.employeeId || "Not assigned"}</Text><Text style={styles.note}>Profile editing and password changes can be connected to a secure account service in the next version.</Text></AppCard>
    <AppButton title="Log out" secondary onPress={onLogout} />
  </ScreenContainer>;
}
const styles = StyleSheet.create({ avatar: { fontSize: 40, color: COLORS.brown, textAlign: "center" }, name: { color: COLORS.darkBrown, fontSize: 21, fontWeight: "900", textAlign: "center", marginTop: 6 }, role: { color: COLORS.muted, fontSize: 10, textAlign: "center", letterSpacing: 1.4, marginTop: 5, marginBottom: 20 }, label: { color: COLORS.muted, fontSize: 12, marginTop: 10 }, value: { color: COLORS.darkBrown, fontWeight: "700", marginTop: 4 }, note: { color: COLORS.muted, lineHeight: 18, fontSize: 12, marginTop: 20 } });
