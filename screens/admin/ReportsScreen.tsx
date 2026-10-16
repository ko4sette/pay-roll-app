import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Employee, Attendance, PayrollRecord } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";

export function ReportsScreen({ employees, attendance, payroll }: { employees: Employee[]; attendance: Attendance[]; payroll: PayrollRecord[] }) {
  const paid = payroll.filter(p => p.status === "Paid").reduce((s, p) => s + p.netPay, 0);
  const pending = payroll.filter(p => p.status === "Pending").reduce((s, p) => s + p.netPay, 0);
  const hours = attendance.reduce((s, a) => s + a.regularHours, 0);
  const items = [
    ["Active employees", String(employees.filter(e => e.employmentStatus === "Active").length)],
    ["Payroll records", String(payroll.length)],
    ["Paid payroll total", peso(paid)],
    ["Pending payroll total", peso(pending)],
    ["Recorded regular hours", `${hours.toFixed(2)} hrs`],
    ["Attendance records", String(attendance.length)]
  ];
  return <ScreenContainer title="Reports" subtitle="A quick summary of cafe payroll data.">
    {items.map(([label, value]) => <AppCard key={label}><View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View></AppCard>)}
    <Text style={styles.note}>These totals use locally saved demo data. Export features can be connected in a future version.</Text>
  </ScreenContainer>;
}
const styles = StyleSheet.create({ row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }, label: { color: COLORS.muted, flex: 1 }, value: { color: COLORS.darkBrown, fontSize: 18, fontWeight: "900" }, note: { color: COLORS.muted, fontSize: 12, lineHeight: 18 } });
