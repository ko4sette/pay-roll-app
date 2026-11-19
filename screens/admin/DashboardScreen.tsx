import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText as Text } from "../../components/common/AppText";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { COLORS } from "../../constants/colors";
import { localDateString, formatUsDate } from "../../utils/dateUtils";
import { Attendance, Employee, PayrollRecord } from "../../types";
import { peso } from "../../utils/currencyUtils";
import { PaydayCalendar } from "../../components/common/PaydayCalendar";

interface AdminDashboardProps {
  attendance: Attendance[];
  employees: Employee[];
  payroll: PayrollRecord[];
  onNavigate: (tab: any) => void;
  paydayDate?: string | null;
  storeOpen?: boolean;
  onToggleStore?: () => void;
}

export function AdminDashboard({ attendance, employees, payroll, onNavigate, paydayDate, storeOpen = true, onToggleStore }: AdminDashboardProps) {
  const today = localDateString();
  const needsReview = attendance.filter(item => item.workDate === today && (!item.timeOut || item.status === "Incomplete")).length;
  const pending = payroll.filter(item => item.status === "Pending");
  const pendingTotal = pending.reduce((sum, item) => sum + item.netPay, 0);
  const readyToPrepare = new Set(attendance
    .filter(item => item.timeIn && item.timeOut && employees.find(employee => employee.id === item.employeeId)?.salaryType === "Hourly")
    .filter(item => !payroll.some(record => record.employeeId === item.employeeId && record.periodStart <= item.workDate && record.periodEnd >= item.workDate))
    .map(item => `${item.employeeId}:${item.workDate}`)).size;
  const payrollSummary = pending.length
    ? `${pending.length} payment${pending.length === 1 ? "" : "s"} waiting for Finance`
    : readyToPrepare
      ? `${readyToPrepare} completed shift${readyToPrepare === 1 ? "" : "s"} ready to prepare`
      : "No payroll actions waiting";

  return <ScreenContainer title="Good morning" subtitle={`${formatUsDate(today)}  ·  Café overview`}>
    {needsReview > 0 ? <AppCard style={styles.reviewCard}>
      <View style={styles.reviewCopy}>
        <View style={styles.reviewIcon}><MaterialCommunityIcons name="clock-alert-outline" size={20} color={COLORS.warning} /></View>
        <View style={styles.reviewText}><Text style={styles.reviewTitle}>Attendance needs attention</Text><Text style={styles.reviewDescription}>{needsReview} incomplete shift{needsReview === 1 ? "" : "s"} today</Text></View>
      </View>
      <AppButton title="Review attendance" secondary onPress={() => onNavigate("Attendance")} />
    </AppCard> : null}

    <AppCard style={styles.payrollPanel}>
      <View style={styles.payrollSummary}>
        <View style={styles.payrollIcon}><MaterialCommunityIcons name="cash-multiple" size={21} color={COLORS.brown} /></View>
        <View style={styles.payrollCopy}>
          <Text style={styles.panelEyebrow}>PAYROLL STATUS</Text>
          <Text style={styles.panelDescription}>{payrollSummary}</Text>
          {pending.length > 0 && readyToPrepare > 0 ? <Text style={styles.panelSecondary}>{readyToPrepare} completed shift{readyToPrepare === 1 ? "" : "s"} also ready to prepare</Text> : null}
        </View>
        {pending.length > 0 ? <Text style={styles.panelTotal}>{peso(pendingTotal)}</Text> : null}
      </View>
      <AppButton title={pending.length ? "Review payroll" : readyToPrepare ? "Prepare payroll" : "Open payroll"} onPress={() => onNavigate("Payroll")} />
    </AppCard>

    <PaydayCalendar configuredPayday={paydayDate} />

    <AppCard style={styles.storeCard}>
      <View style={styles.storeMain}>
        <View style={styles.storeHeader}>
          <View style={[styles.storeIcon, storeOpen ? styles.openIcon : styles.closedIcon]}>
            <MaterialCommunityIcons name="storefront-outline" size={19} color={storeOpen ? COLORS.success : COLORS.error} />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeLabel}>Café status</Text>
            <View style={[styles.storeStatus, storeOpen ? styles.openStatus : styles.closedStatus]}>
              <View style={[styles.statusDot, { backgroundColor: storeOpen ? COLORS.success : COLORS.error }]} />
              <Text style={[styles.storeValue, { color: storeOpen ? COLORS.success : COLORS.error }]}>{storeOpen ? "Open" : "Closed"}</Text>
            </View>
          </View>
        </View>
        <AppButton title={storeOpen ? "Close store" : "Open store"} secondary onPress={onToggleStore ?? (() => undefined)} style={styles.storeButton} />
      </View>
      <Text style={styles.storeHint}>Employees can’t clock in or out while the café is closed.</Text>
    </AppCard>

  </ScreenContainer>;
}

const styles = StyleSheet.create({
  payrollPanel: { backgroundColor: COLORS.cream, gap: 12 },
  payrollSummary: { flexDirection: "row", alignItems: "center", gap: 10 },
  payrollIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#DCC9AD", alignItems: "center", justifyContent: "center" },
  payrollCopy: { flex: 1, gap: 3 },
  panelEyebrow: { color: COLORS.brown, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  panelTotal: { color: COLORS.darkBrown, fontSize: 19, fontWeight: "900", textAlign: "right" },
  panelDescription: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
  panelSecondary: { color: COLORS.brown, fontSize: 12, lineHeight: 16, marginTop: 2 },
  reviewCard: { backgroundColor: "#F0DFC5", borderColor: "#D6BD97", gap: 12 },
  reviewCopy: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#E8D1AD", alignItems: "center", justifyContent: "center" },
  reviewText: { flex: 1, gap: 3 },
  reviewTitle: { color: COLORS.darkBrown, fontSize: 15, fontWeight: "800" },
  reviewDescription: { color: COLORS.muted, fontSize: 13 },
  storeCard: { backgroundColor: "#F0E6D8", gap: 10 },
  storeMain: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  storeHeader: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9 },
  storeIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  openIcon: { backgroundColor: "#DCE4D6" },
  closedIcon: { backgroundColor: "#F0D8D3" },
  storeInfo: { alignItems: "flex-start", gap: 4 },
  storeLabel: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "800" },
  storeStatus: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 16 },
  openStatus: { backgroundColor: "#DCE4D6" },
  closedStatus: { backgroundColor: "#F0D8D3" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  storeValue: { fontSize: 15, fontWeight: "800" },
  storeButton: { alignSelf: "center", minWidth: 112, paddingVertical: 9, paddingHorizontal: 9 },
  storeHint: { color: COLORS.muted, fontSize: 11, lineHeight: 15 },
});
