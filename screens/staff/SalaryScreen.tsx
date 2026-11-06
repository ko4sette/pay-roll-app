import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { User, PayrollRecord } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";
import { formatUsDate } from "../../utils/dateUtils";

interface SalaryScreenProps {
  user: User;
  payroll: PayrollRecord[];
}

export function SalaryScreen({ user, payroll }: SalaryScreenProps) {
  const employeeId = user.employeeId ?? "";
  const records = payroll.filter(record => record.employeeId === employeeId).slice().reverse();
  return <ScreenContainer title="My Salary" subtitle="View your payroll history.">
    <Text style={styles.sectionTitle}>Payroll history</Text>
    {records.map(record => <AppCard key={record.id}>
      <View style={styles.row}>
        <Text style={styles.title}>{formatUsDate(record.periodStart)}{record.periodEnd !== record.periodStart ? ` – ${formatUsDate(record.periodEnd)}` : ""}</Text>
        <StatusBadge status={record.status} />
      </View>
      <Line label="Basic pay" value={peso(record.basicPay)} />
      <Line label="Overtime pay" value={peso(record.overtimePay)} />
      <Line label="Allowances" value={peso(record.allowances)} />
      <Line label="Gross pay" value={peso(record.grossPay)} />
      <Line label="Deductions" value={`− ${peso(record.deductions)}`} />
      <View style={styles.total}><Line label="Net pay" value={peso(record.netPay)} bold /></View>
    </AppCard>)}
    {!records.length && <Text style={styles.meta}>No salary records available yet.</Text>}
  </ScreenContainer>;
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <View style={styles.line}>
    <Text style={[styles.meta, bold && styles.bold]}>{label}</Text>
    <Text style={[styles.meta, bold && styles.bold]}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 16, marginBottom: 8 },
  title: { color: COLORS.darkBrown, fontWeight: "800", flex: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 8 },
  meta: { color: COLORS.muted, fontSize: 13 },
  bold: { color: COLORS.darkBrown, fontWeight: "900", fontSize: 15 },
  total: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 12, paddingTop: 5, marginBottom: 12 },
  sectionTitle: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 18, marginTop: 8 },
});
