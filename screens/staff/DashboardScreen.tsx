import React from "react";
import { StyleSheet, Text } from "react-native";
import { User, Attendance, PayrollRecord } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";

export function StaffDashboard({ user, attendance, payroll, onNavigate }: { user: User; attendance: Attendance[]; payroll: PayrollRecord[]; onNavigate: (tab: any) => void }) {
  const mine = payroll.filter(p => p.employeeId === user.employeeId).slice().reverse();
  const latest = mine[0];
  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = attendance.find(a => a.employeeId === user.employeeId && a.workDate === today);
  return <ScreenContainer title={`Hello, ${user.name.split(" ")[0]} ☕`} subtitle="Here's your work and pay summary.">
    <AppCard style={styles.hero}><Text style={styles.small}>LATEST NET PAY</Text><Text style={styles.amount}>{latest ? peso(latest.netPay) : "Not available"}</Text><Text style={styles.small}>{latest ? `${latest.periodStart} – ${latest.periodEnd}` : "Your payslip will appear here."}</Text></AppCard>
    <AppCard><Text style={styles.heading}>Today's attendance</Text><Text style={styles.body}>{todayRecord ? `${todayRecord.status} · Time in ${todayRecord.timeIn || "--"} · Time out ${todayRecord.timeOut || "--"}` : "No attendance recorded today."}<Text>{"\n"}Record your shift time from My Attendance.</Text></Text><AppButton title="Open My Attendance" onPress={() => onNavigate("Attendance")} /></AppCard>
    <AppCard><Text style={styles.heading}>Quick actions</Text><AppButton title="View salary details" onPress={() => onNavigate("Salary")} /><AppButton title="View payslips" secondary onPress={() => onNavigate("Payslips")} /></AppCard>
  </ScreenContainer>;
}
const styles = StyleSheet.create({ hero: { backgroundColor: COLORS.cream }, small: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }, amount: { color: COLORS.darkBrown, fontSize: 28, fontWeight: "900", marginVertical: 8 }, heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 16, marginBottom: 8 }, body: { color: COLORS.muted, lineHeight: 20, marginBottom: 12 } });
