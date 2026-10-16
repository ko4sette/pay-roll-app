import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { COLORS } from "../../constants/colors";
import { Employee, Attendance, PayrollRecord } from "../../types";
import { peso } from "../../utils/currencyUtils";

export function AdminDashboard({ employees, attendance, payroll, onNavigate }: { employees: Employee[]; attendance: Attendance[]; payroll: PayrollRecord[]; onNavigate: (tab: any) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const present = attendance.filter(a => a.workDate === today && a.status === "Present").length;
  const pending = payroll.filter(p => p.status === "Pending").length;
  const expense = payroll.reduce((sum, p) => sum + p.netPay, 0);
  const stats = [{ label: "Employees", value: employees.filter(e => e.employmentStatus === "Active").length }, { label: "Present Today", value: present }, { label: "Pending Payroll", value: pending }, { label: "Payroll Total", value: peso(expense) }];
  return <ScreenContainer title="Good day, Admin ☕" subtitle="Here is your cafe's payroll overview.">
    <View style={styles.grid}>{stats.map(s => <AppCard key={s.label} style={styles.stat}><Text style={styles.label}>{s.label}</Text><Text style={styles.value}>{s.value}</Text></AppCard>)}</View>
    <AppCard><Text style={styles.cardTitle}>Quick actions</Text><View style={styles.actions}><AppButton title="+ Add Employee" onPress={() => onNavigate("Employees")} /><AppButton title="View Attendance" secondary onPress={() => onNavigate("Attendance")} /><AppButton title="Process Payroll" secondary onPress={() => onNavigate("Payroll")} /><AppButton title="View Reports" secondary onPress={() => onNavigate("Reports")} /></View></AppCard>
    <AppCard><Text style={styles.cardTitle}>Cafe payroll tip</Text><Text style={styles.body}>Review attendance records before processing payroll. This demo uses sample deduction values, so verify all payroll rules before real-world use.</Text></AppCard>
  </ScreenContainer>;
}
const styles = StyleSheet.create({ grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, stat: { width: "48%", flexGrow: 1, backgroundColor: COLORS.cream }, label: { color: COLORS.muted, fontSize: 12 }, value: { color: COLORS.darkBrown, fontSize: 21, fontWeight: "900", marginTop: 8 }, cardTitle: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "800", marginBottom: 10 }, actions: { gap: 8 }, body: { color: COLORS.muted, lineHeight: 20 } });
