import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText as Text } from "../../components/common/AppText";
import { Employee, User } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { SECONDARY_FONT } from "../../constants/typography";
import { peso } from "../../utils/currencyUtils";
import { formatUsDate } from "../../utils/dateUtils";

export function ProfileScreen({ user, employee }: { user: User; employee?: Employee }) {
  const displayName = employee?.fullName.trim() || user.name.trim() || "Employee";
  const employmentStatus = employee?.employmentStatus ?? "Active";
  const salary = employee
    ? `${peso(employee.salaryAmount)} / ${employee.salaryType === "Hourly" ? "hour" : "month"}`
    : "Not available";

  return <ScreenContainer title="My Profile" subtitle="Your work and contact details.">
    <AppCard style={styles.identityCard}>
      <View style={styles.identityTop}>
        <View style={styles.avatar}><MaterialCommunityIcons name="account-outline" size={34} color={COLORS.white} /></View>
        <View style={styles.identityCopy}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.position}>{employee?.position ?? "Position not available"}</Text>
        </View>
      </View>
      <View style={styles.identityFooter}>
        <Text style={styles.employeeNumber}>{employee?.employeeNumber ?? user.employeeId ?? "Employee ID unavailable"}</Text>
        <StatusBadge status={employmentStatus} />
      </View>
    </AppCard>

    <AppCard style={styles.detailCard}>
      <View style={styles.sectionHeading}>
        <MaterialCommunityIcons name="card-account-details-outline" size={20} color={COLORS.brown} />
        <Text style={styles.sectionTitle}>Contact details</Text>
      </View>
      <Info icon="email-outline" label="Email" value={employee?.email || user.email || "Not provided"} />
      <View style={styles.rule} />
      <Info icon="phone-outline" label="Phone" value={employee?.contactNumber || "Not provided"} />
    </AppCard>

    <AppCard style={styles.detailCard}>
      <View style={styles.sectionHeading}>
        <MaterialCommunityIcons name="storefront-outline" size={20} color={COLORS.brown} />
        <Text style={styles.sectionTitle}>Employment</Text>
      </View>
      <Info icon="briefcase-outline" label="Employment type" value={employee?.employmentType ?? "Not available"} />
      <View style={styles.rule} />
      <Info icon="calendar-month-outline" label="Date hired" value={employee?.dateHired ? formatUsDate(employee.dateHired) : "Not available"} />
      <View style={styles.rule} />
      <Info icon="cash-multiple" label={employee?.salaryType === "Monthly" ? "Monthly salary" : "Hourly rate"} value={salary} />
    </AppCard>
    <Text style={styles.note}>For updates to your employee details, contact your administrator.</Text>
  </ScreenContainer>;
}

function Info({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; label: string; value: string }) {
  return <View style={styles.infoRow}>
    <MaterialCommunityIcons name={icon} size={19} color={COLORS.mediumBrown} />
    <View style={styles.infoCopy}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  identityCard: { backgroundColor: COLORS.darkBrown, borderColor: COLORS.darkBrown, padding: 18, gap: 16 },
  identityTop: { flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: COLORS.mediumBrown, alignItems: "center", justifyContent: "center" },
  identityCopy: { flex: 1 },
  name: { color: COLORS.white, fontSize: 21, lineHeight: 27, fontWeight: "800", fontFamily: SECONDARY_FONT },
  position: { color: "#D7C8B7", marginTop: 3, fontSize: 14 },
  identityFooter: { borderTopWidth: 1, borderTopColor: "#705A47", paddingTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  employeeNumber: { color: COLORS.white, fontSize: 13, fontWeight: "700", letterSpacing: 0.4 },
  detailCard: { gap: 13 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 2 },
  sectionTitle: { color: COLORS.darkBrown, fontSize: 18, fontWeight: "700", fontFamily: SECONDARY_FONT },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  infoCopy: { flex: 1, gap: 3 },
  label: { color: COLORS.muted, fontSize: 12 },
  value: { color: COLORS.darkBrown, fontSize: 15, fontWeight: "600" },
  rule: { height: 1, backgroundColor: COLORS.border, marginLeft: 30 },
  note: { color: COLORS.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 3 },
});
