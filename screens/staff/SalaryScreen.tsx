import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { User, Employee, Attendance, PayrollRecord } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";
import { formatDuration, formatUsDate } from "../../utils/dateUtils";
import { EmptyState } from "../../components/common/EmptyState";

interface SalaryScreenProps { user: User; employee?: Employee; attendance: Attendance[]; payroll: PayrollRecord[]; }

export function SalaryScreen({ user, employee, attendance, payroll }: SalaryScreenProps) {
  const employeeId = user.employeeId ?? "";
  const records = payroll.filter(record => record.employeeId === employeeId).slice().sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
  const getHoursWorked = (record: PayrollRecord) => attendance
    .filter(item => item.employeeId === employeeId && item.workDate >= record.periodStart && item.workDate <= record.periodEnd && item.timeIn && item.timeOut)
    .reduce((total, item) => total + item.regularHours + item.overtimeHours, 0);
  return <ScreenContainer title="My Salary" subtitle="Your payslips and take-home pay.">
    {records.map(record => <AppCard key={record.id} style={styles.slip}>
      <View style={styles.slipHeading}><View style={{ flex: 1 }}><Text style={styles.slipEyebrow}>PAYSLIP · {employee?.fullName ?? user.name}</Text><Text style={styles.period}>{formatUsDate(record.periodStart)}{record.periodEnd !== record.periodStart ? ` – ${formatUsDate(record.periodEnd)}` : ""}</Text></View><StatusBadge status={record.status === "Paid" ? "Released" : "Pending"} /></View>
      <Line label="Hours worked" value={formatDuration(getHoursWorked(record))} />
      <Text style={styles.sectionTitle}>Pay</Text>
      <Line label="Regular pay" value={peso(record.basicPay)} />
      {record.overtimePay > 0 ? <Line label="Overtime pay" value={peso(record.overtimePay)} /> : null}
      <View style={styles.subtotal}><Line label="Pay earned" value={peso(record.grossPay)} bold /></View>
      {record.deductions > 0 ? record.deductionItems?.length
        ? record.deductionItems.map(item => <Line key={item.name} label={item.name} value={`− ${peso(item.amount)}`} />)
        : <Line label="Deductions" value={`− ${peso(record.deductions)}`} /> : null}
      <View style={styles.netPay}><View><Text style={styles.netLabel}>TAKE-HOME PAY</Text></View><Text style={styles.netAmount}>{peso(record.netPay)}</Text></View>
      <View style={styles.dateRow}><Text style={styles.dateLabel}>Payment date</Text><Text style={styles.dateValue}>{record.paidAt ? formatUsDate(record.paidAt) : "Not paid yet"}</Text></View>
    </AppCard>)}
    {!records.length && <EmptyState title="Your payslips will live here" message="When your café prepares payroll, your hours and take-home pay will show here." />}
  </ScreenContainer>;
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <View style={styles.line}><Text style={[styles.lineLabel, bold && styles.bold]}>{label}</Text><Text style={[styles.lineValue, bold && styles.bold]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  slip: { gap: 10 },
  slipHeading: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  slipEyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  period: { color: COLORS.darkBrown, fontSize: 17, fontWeight: "700", marginTop: 3 },
  dateRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  dateLabel: { color: COLORS.muted, fontSize: 13 },
  dateValue: { color: COLORS.darkBrown, fontSize: 13, fontWeight: "700", textAlign: "right" },
  sectionTitle: { color: COLORS.brown, fontSize: 14, fontWeight: "800", marginTop: 4 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  lineLabel: { flex: 1, color: COLORS.muted, fontSize: 14 },
  lineValue: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "600", textAlign: "right" },
  subtotal: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 1 },
  bold: { color: COLORS.darkBrown, fontWeight: "900" },
  netPay: { marginTop: 5, padding: 14, borderRadius: 16, backgroundColor: COLORS.darkBrown, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  netLabel: { color: "#E4D7C7", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  netAmount: { color: COLORS.white, fontSize: 22, fontWeight: "900", textAlign: "right" },
});
