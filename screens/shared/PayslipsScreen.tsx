import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { User, Employee, PayrollRecord } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";

export function PayslipsScreen({ user, employees, payroll }: { user: User; employees: Employee[]; payroll: PayrollRecord[] }) {
  const records = user.role === "admin" ? payroll : payroll.filter(p => p.employeeId === user.employeeId);
  return <ScreenContainer title={user.role === "admin" ? "Payslips" : "My Payslips"} subtitle={user.role === "admin" ? "Review saved payroll statements." : "Your personal payroll history."}>
    {records.slice().reverse().map(p => {
      const e = employees.find(x => x.id === p.employeeId);
      return <AppCard key={p.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{e?.fullName || "Employee"}</Text><Text style={styles.meta}>{p.periodStart} – {p.periodEnd}</Text></View><StatusBadge status={p.status} /></View><View style={styles.breakdown}><Line label="Gross pay" value={peso(p.grossPay)} /><Line label="Deductions" value={peso(p.deductions)} /><Line label="Net pay" value={peso(p.netPay)} bold /></View><Text style={styles.meta}>Payslip preview · PDF export can be added in a later version.</Text></AppCard>;
    })}
    {records.length === 0 && <Text style={styles.meta}>No payslips available yet.</Text>}
  </ScreenContainer>;
}
function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) { return <View style={styles.line}><Text style={[styles.meta, bold && styles.bold]}>{label}</Text><Text style={[styles.meta, bold && styles.bold]}>{value}</Text></View>; }
const styles = StyleSheet.create({ row: { flexDirection: "row", gap: 8, alignItems: "flex-start" }, name: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 16 }, meta: { color: COLORS.muted, fontSize: 12, marginTop: 5 }, breakdown: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, gap: 4 }, line: { flexDirection: "row", justifyContent: "space-between" }, bold: { color: COLORS.darkBrown, fontWeight: "900" } });
