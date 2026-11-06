import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { Employee, User } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";

export function ProfileScreen({ user, employee }: { user: User; employee?: Employee }) {
  const { width } = useWindowDimensions();
  const displayName = employee?.fullName.trim() || user.name.trim() || "Employee";
  const initials = displayName.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");
  const position = employee?.position ?? "Position not available";
  const email = employee?.email ?? user.email;
  const employeeNumber = employee?.employeeNumber ?? user.employeeId ?? "Not assigned";
  const salary = employee
    ? `${peso(employee.salaryAmount)}/${employee.salaryType === "Hourly" ? "hour" : "month"}`
    : "Not available";

  return <ScreenContainer title="My Profile" subtitle="Your account information.">
    <View style={styles.profileLayout}>
      <AppCard style={styles.identityCard}>
        <View style={[styles.avatar, width < 360 && styles.avatarSmall]}>
          <Text style={styles.initials}>{initials || "E"}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.position}>{position}</Text>
        </View>
      </AppCard>

      <AppCard style={styles.informationCard}>
        <Text style={styles.cardTitle}>EMPLOYEE INFORMATION</Text>
        <Info label="Email Address" value={email} />
        <Info label="Employee ID" value={employeeNumber} />
        <Info label="Hourly Rate" value={salary} />
      </AppCard>
    </View>
  </ScreenContainer>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoItem}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  profileLayout: { flexDirection: "column", gap: 12 },
  identityCard: { width: "100%", flexDirection: "row", alignItems: "center", gap: 18 },
  informationCard: { width: "100%", gap: 12 },
  avatar: { width: 124, height: 124, borderRadius: 62, backgroundColor: COLORS.cream, alignItems: "center", justifyContent: "center" },
  avatarSmall: { width: 100, height: 100, borderRadius: 50 },
  initials: { color: COLORS.brown, fontSize: 40, fontWeight: "700" },
  identity: { flex: 1 },
  name: { color: COLORS.darkBrown, fontSize: 19, fontWeight: "900" },
  position: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  cardTitle: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "800", letterSpacing: 0.4, marginBottom: 2 },
  infoItem: { gap: 4 },
  label: { color: COLORS.muted, fontSize: 12 },
  value: { color: COLORS.darkBrown, fontWeight: "700" },
});
