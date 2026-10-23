import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { COLORS } from "../../constants/colors";
import { localDateString } from "../../utils/dateUtils";
import { Employee, Attendance, PayrollRecord } from "../../types";
import { peso } from "../../utils/currencyUtils";

export function AdminDashboard({ employees, attendance, payroll, onNavigate, onBrowseRecords }: { employees: Employee[]; attendance: Attendance[]; payroll: PayrollRecord[]; onNavigate: (tab: any) => void; onBrowseRecords: () => void }) {
  const today = localDateString();
  const present = attendance.filter(a => a.workDate === today && a.status === "Present").length;
  const pending = payroll.filter(p => p.status === "Pending").length;
  const expense = payroll.reduce((sum, p) => sum + p.netPay, 0);
  const stats = [{ label: "Employees", value: employees.filter(e => e.employmentStatus === "Active").length }, { label: "Present Today", value: present }, { label: "Pending Payroll", value: pending }, { label: "Payroll Total", value: peso(expense) }];
  return <ScreenContainer title="Good day, Admin" subtitle="Here is your cafe's payroll overview.">
    <View style={styles.grid}>{stats.map(s => <AppCard key={s.label} style={styles.stat}><Text style={styles.label}>{s.label}</Text><Text style={styles.value}>{s.value}</Text></AppCard>)}</View>
    <AppCard><Text style={styles.cardTitle}>Quick actions</Text><View style={styles.actions}><AppButton title="+ Add Employee" onPress={() => onNavigate("Employees")} /><AppButton title="View Attendance" secondary onPress={() => onNavigate("Attendance")} /><AppButton title="Process Payroll" secondary onPress={() => onNavigate("Payroll")} /><AppButton title="Browse Records" secondary onPress={onBrowseRecords} /></View></AppCard>
  </ScreenContainer>;
}
const styles = StyleSheet.create({ grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, stat: { width: "48%", flexGrow: 1, backgroundColor: COLORS.cream }, label: { color: COLORS.muted, fontSize: 12 }, value: { color: COLORS.darkBrown, fontSize: 21, fontWeight: "900", marginTop: 8 }, cardTitle: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "800", marginBottom: 10 }, actions: { gap: 8 }, body: { color: COLORS.muted, lineHeight: 20 } });
