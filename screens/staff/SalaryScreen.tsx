import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { User, PayrollRecord } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";

export function SalaryScreen({ user, payroll }: { user: User; payroll: PayrollRecord[] }) {
  const records = payroll.filter(p => p.employeeId === user.employeeId).slice().reverse();
  return <ScreenContainer title="My Salary" subtitle="View your payroll breakdown and history.">
    {records.map(p => <AppCard key={p.id}><View style={styles.row}><Text style={styles.title}>{p.periodStart} – {p.periodEnd}</Text><StatusBadge status={p.status} /></View><Line label="Basic pay" value={peso(p.basicPay)} /><Line label="Overtime pay" value={peso(p.overtimePay)} /><Line label="Allowances" value={peso(p.allowances)} /><Line label="Gross pay" value={peso(p.grossPay)} /><Line label="Deductions" value={`− ${peso(p.deductions)}`} /><View style={styles.total}><Line label="Net pay" value={peso(p.netPay)} bold /></View></AppCard>)}
    {!records.length && <Text style={styles.meta}>No salary records available yet.</Text>}
  </ScreenContainer>;
}
function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) { return <View style={styles.line}><Text style={[styles.meta, bold && styles.bold]}>{label}</Text><Text style={[styles.meta, bold && styles.bold]}>{value}</Text></View>; }
const styles = StyleSheet.create({ row: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 12 }, title: { color: COLORS.darkBrown, fontWeight: "800", flex: 1 }, line: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 }, meta: { color: COLORS.muted, fontSize: 13 }, bold: { color: COLORS.darkBrown, fontWeight: "900", fontSize: 15 }, total: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 12, paddingTop: 5 } });
