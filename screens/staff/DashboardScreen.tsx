import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText as Text } from "../../components/common/AppText";
import { User, Attendance, PayrollRecord } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { EmptyState } from "../../components/common/EmptyState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { localDateString, formatUsDate } from "../../utils/dateUtils";
import { peso } from "../../utils/currencyUtils";
import { PaydayCalendar } from "../../components/common/PaydayCalendar";

export function StaffDashboard({ user, attendance, payroll, paydayDate, onNavigate }: { user: User; attendance: Attendance[]; payroll: PayrollRecord[]; paydayDate?: string | null; onNavigate: (tab: any) => void; onBrowseRecords: () => void }) {
  const mine = payroll.filter(record => record.employeeId === user.employeeId).slice().sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
  const latest = mine[0];
  const today = localDateString();
  const todayRecord = attendance.find(record => record.employeeId === user.employeeId && record.workDate === today);
  const shiftDone = Boolean(todayRecord?.timeOut);

  return <ScreenContainer title={`Hello, ${user.name.split(" ")[0]}`} subtitle={`${formatUsDate(today)} · Your shift and pay`}>
    <AppCard style={styles.shiftPanel}>
      <View style={styles.shiftHeading}>
        <View style={styles.shiftIcon}><MaterialCommunityIcons name="clock-outline" size={21} color={COLORS.brown} /></View>
        <View style={styles.shiftCopy}><Text style={styles.panelLabel}>TODAY’S SHIFT</Text><Text style={styles.shiftTitle}>{shiftDone ? "Shift complete" : todayRecord?.timeIn ? "You’re on the clock" : "Not clocked in"}</Text></View>
      </View>
      <View style={styles.times}>
        <View style={styles.timeCell}><Text style={styles.timeLabel}>TIME IN</Text><Text style={styles.timeValue}>{todayRecord?.timeIn ?? "—"}</Text></View>
        <View style={styles.timeDivider} />
        <View style={styles.timeCell}><Text style={styles.timeLabel}>TIME OUT</Text><Text style={styles.timeValue}>{todayRecord?.timeOut ?? "—"}</Text></View>
      </View>
      <AppButton title={shiftDone ? "View attendance" : "Open attendance"} onPress={() => onNavigate("Attendance")} />
    </AppCard>

    <PaydayCalendar configuredPayday={paydayDate} />

    {latest ? <AppCard style={styles.payCard}>
      <View style={styles.payHeader}><View style={styles.payIcon}><MaterialCommunityIcons name="wallet-outline" size={20} color={COLORS.brown} /></View><View style={styles.payCopy}><Text style={styles.rowLabel}>LATEST TAKE-HOME PAY</Text><Text style={styles.amount}>{peso(latest.netPay)}</Text></View><StatusBadge status={latest.status} /></View>
      <Text style={styles.payPeriod}>{formatUsDate(latest.periodStart)}{latest.periodEnd !== latest.periodStart ? ` – ${formatUsDate(latest.periodEnd)}` : ""}</Text>
      <AppButton title="View payslip" secondary onPress={() => onNavigate("Salary")} />
    </AppCard> : <EmptyState title="Your payslip will appear here" message="Once payroll is prepared, you can review your hours and take-home pay." />}
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  shiftPanel: { backgroundColor: COLORS.cream, gap: 12 },
  shiftHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  shiftIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#DCC9AD", alignItems: "center", justifyContent: "center" },
  shiftCopy: { flex: 1, gap: 3 },
  panelLabel: { color: COLORS.brown, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  shiftTitle: { color: COLORS.darkBrown, fontSize: 18, lineHeight: 23, fontWeight: "800" },
  times: { flexDirection: "row", alignItems: "center", backgroundColor: "#E4D8C7", borderRadius: 12, padding: 12 },
  timeCell: { flex: 1, gap: 4 },
  timeLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  timeValue: { color: COLORS.darkBrown, fontSize: 18, fontWeight: "700" },
  timeDivider: { width: 1, height: 34, backgroundColor: COLORS.border, marginHorizontal: 12 },
  rowLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  payCard: { backgroundColor: COLORS.cream, gap: 10 },
  payHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  payIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#DCC9AD", alignItems: "center", justifyContent: "center" },
  payCopy: { flex: 1 },
  amount: { color: COLORS.darkBrown, fontSize: 24, fontWeight: "900", marginTop: 3 },
  payPeriod: { color: COLORS.muted, fontSize: 13, marginTop: 7 },
});
