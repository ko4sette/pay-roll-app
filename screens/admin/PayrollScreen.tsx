import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { Employee, Attendance, PayrollRecord } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";
import { calculatePay } from "../../utils/payrollCalculator";
import { localDateString } from "../../utils/dateUtils";

export function PayrollScreen({ employees, attendance, payroll, setPayroll }: { employees: Employee[]; attendance: Attendance[]; payroll: PayrollRecord[]; setPayroll: React.Dispatch<React.SetStateAction<PayrollRecord[]>> }) {
  const periodEnd = localDateString();
  const periodStart = `${periodEnd.slice(0, 7)}-01`;
  const generate = () => {
    const active = employees.filter(e => e.employmentStatus === "Active");
    const newRecords: PayrollRecord[] = active.filter(e => !payroll.some(p => p.employeeId === e.id && p.periodStart === periodStart && p.periodEnd === periodEnd)).map(e => {
      const calc = calculatePay(e, attendance);
      return { id: `p${Date.now()}-${e.id}`, employeeId: e.id, periodStart, periodEnd, ...calc, status: "Pending" };
    });
    if (!newRecords.length) { Alert.alert("No new payroll", "Payroll already exists for active employees in this demo period."); return; }
    setPayroll(old => [...old, ...newRecords]);
    Alert.alert("Payroll generated", `${newRecords.length} draft payroll records added. Review them before marking as paid.`);
  };
  const markPaid = (record: PayrollRecord) => Alert.alert("Confirm payment", "Mark this payroll record as paid?", [{ text: "Cancel" }, { text: "Mark paid", onPress: () => setPayroll(old => old.map(p => p.id === record.id ? { ...p, status: "Paid", paidAt: localDateString() } : p)) }]);
  return <ScreenContainer title="Payroll" subtitle="Generate and review employee payroll.">
    <AppCard><Text style={styles.heading}>Current demo period</Text><Text style={styles.meta}>{periodStart} to {periodEnd}</Text><Text style={styles.note}>Demo calculation: hourly rate × approved hours. A sample 5% deduction is used for demonstration only.</Text><AppButton title="Generate payroll for active staff" onPress={generate} /></AppCard>
    {payroll.slice().reverse().map(p => {
      const employee = employees.find(e => e.id === p.employeeId);
      return <AppCard key={p.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.heading}>{employee?.fullName || "Unknown employee"}</Text><Text style={styles.meta}>{p.periodStart} – {p.periodEnd}</Text></View><StatusBadge status={p.status} /></View><View style={styles.breakdown}><Line label="Basic pay" value={peso(p.basicPay)} /><Line label="Overtime" value={peso(p.overtimePay)} /><Line label="Allowances" value={peso(p.allowances)} /><Line label="Gross pay" value={peso(p.grossPay)} /><Line label="Deductions" value={`− ${peso(p.deductions)}`} /><Line label="Net pay" value={peso(p.netPay)} bold /></View>{p.status !== "Paid" && <AppButton title="Mark as paid" secondary onPress={() => markPaid(p)} />}</AppCard>;
    })}
    {payroll.length === 0 && <Text style={styles.meta}>No payroll records yet. Generate payroll to begin.</Text>}
  </ScreenContainer>;
}
function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) { return <View style={styles.line}><Text style={[styles.meta, bold && styles.bold]}>{label}</Text><Text style={[styles.meta, bold && styles.bold]}>{value}</Text></View>; }
const styles = StyleSheet.create({ heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 15 }, meta: { color: COLORS.muted, fontSize: 12, marginTop: 5 }, note: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginVertical: 10 }, row: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, breakdown: { marginVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, gap: 3 }, line: { flexDirection: "row", justifyContent: "space-between" }, bold: { color: COLORS.darkBrown, fontWeight: "900" } });
