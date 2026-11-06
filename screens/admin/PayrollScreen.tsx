import React, { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { Employee, Attendance, PayrollRecord, CashoutRequest } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";
import { calculatePay } from "../../utils/payrollCalculator";
import { formatUsDate, localDateString } from "../../utils/dateUtils";
import { getCashoutSummary } from "../../utils/cashoutUtils";

interface PayrollScreenProps {
  employees: Employee[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
  setPayroll: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
  cashouts: CashoutRequest[];
  setCashouts: React.Dispatch<React.SetStateAction<CashoutRequest[]>>;
}

const COLUMN_WIDTHS = { name: 150, attendance: 125, hours: 105, amount: 140, status: 100, action: 125 };

export function PayrollScreen({
  employees,
  attendance,
  payroll,
  setPayroll,
  cashouts,
  setCashouts,
}: PayrollScreenProps) {
  const [modalDate, setModalDate] = useState<string | null>(null);
  const payrollDates = Array.from(new Set([
    ...attendance.map(record => record.workDate),
    ...payroll.map(record => record.periodEnd),
  ]))
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort((left, right) => right.localeCompare(left));

  const getEmployeeRows = (date: string) => {
    const dateAttendance = attendance.filter(record => record.workDate === date);
    return employees.flatMap(employee => {
      const records = dateAttendance.filter(record => record.employeeId === employee.id);
      return records.length ? [{ employee, records }] : [];
    });
  };

  const getPayrollRecord = (employeeId: string, date: string) => payroll.find(record =>
    record.employeeId === employeeId
    && record.periodStart <= date
    && record.periodEnd >= date,
  );

  const generate = (selectedDate: string) => {
    const employeeAttendance = getEmployeeRows(selectedDate);
    const hourlyRows = employeeAttendance.filter(({ employee }) => employee.salaryType === "Hourly");
    const monthlyCount = employeeAttendance.length - hourlyRows.length;
    const newRecords: PayrollRecord[] = hourlyRows
      .filter(({ employee }) => !getPayrollRecord(employee.id, selectedDate))
      .map(({ employee, records }) => {
        const calculation = calculatePay(employee, records);
        return {
          id: `p${selectedDate}-${employee.id}`,
          employeeId: employee.id,
          periodStart: selectedDate,
          periodEnd: selectedDate,
          ...calculation,
          status: "Pending",
        };
      });

    if (!newRecords.length) {
      const reason = monthlyCount && !hourlyRows.length
        ? "Monthly-salaried employees were not generated because no daily pay policy is configured."
        : "There are no eligible hourly attendance records for this date, or payroll already exists.";
      Alert.alert("No new payroll", reason);
      return;
    }

    setPayroll(old => [
      ...old,
      ...newRecords.filter(candidate => !old.some(record =>
        record.employeeId === candidate.employeeId
        && record.periodStart <= selectedDate
        && record.periodEnd >= selectedDate,
      )),
    ]);
    const monthlyNote = monthlyCount
      ? ` ${monthlyCount} monthly-salaried employee(s) were skipped because no daily pay policy is configured.`
      : "";
    Alert.alert("Payroll generated", `${newRecords.length} payroll record(s) generated for ${formatUsDate(selectedDate)}.${monthlyNote}`);
  };

  const markPaid = (record: PayrollRecord) => {
    if (record.status === "Paid") return;
    Alert.alert("Confirm payment", "Mark this employee's payroll record as paid?", [
      { text: "Cancel" },
      {
        text: "Mark paid",
        onPress: () => setPayroll(old => old.map(item =>
          item.id === record.id && item.status === "Pending"
            ? { ...item, status: "Paid", paidAt: localDateString() }
            : item,
        )),
      },
    ]);
  };

  const processCashout = (request: CashoutRequest, status: "Approved" | "Rejected") => {
    if (request.status !== "Pending") return;
    if (status === "Approved") {
      const availableWithoutRequest = getCashoutSummary(
        request.employeeId,
        payroll,
        cashouts.filter(item => item.id !== request.id),
      ).availableBalance;
      if (request.amount > availableWithoutRequest) {
        Alert.alert(
          "Cannot approve cashout",
          "The employee's available balance changed and is no longer sufficient for this request.",
        );
        return;
      }
    }
    setCashouts(old => old.map(item =>
      item.id === request.id && item.status === "Pending"
        ? { ...item, status, processedAt: localDateString() }
        : item,
    ));
  };

  const selectedAttendance = modalDate ? getEmployeeRows(modalDate) : [];

  return <>
    <ScreenContainer title="Payroll" subtitle="Review employee payroll">

      {payrollDates.map(date => <AppCard key={date} style={styles.dateCard}>
        <Text style={styles.dateText}>{formatUsDate(date)}</Text>
        <View style={styles.dateActions}>
          <AppButton title="Generate Payroll" onPress={() => generate(date)} style={styles.dateButton} />
          <AppButton title="View Employees" secondary onPress={() => setModalDate(date)} style={styles.dateButton} />
        </View>
      </AppCard>)}
      {payrollDates.length === 0 && <Text style={styles.meta}>No payroll dates yet. Dates appear when attendance is recorded.</Text>}

    </ScreenContainer>

    <Modal visible={modalDate !== null} transparent animationType="slide" onRequestClose={() => setModalDate(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeading}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Employees · {modalDate ? formatUsDate(modalDate) : ""}</Text>
              <Text style={styles.meta}>Attendance and payroll status</Text>
            </View>
            <AppButton title="Close" secondary onPress={() => setModalDate(null)} style={styles.closeButton} />
          </View>
          {selectedAttendance.length === 0
            ? <Text style={styles.meta}>No employee attendance records for this date.</Text>
            : <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <TableCell label="Employee Name" width={COLUMN_WIDTHS.name} header />
                  <TableCell label="Attendance Status" width={COLUMN_WIDTHS.attendance} header />
                  <TableCell label="Total Hours Worked" width={COLUMN_WIDTHS.hours} header />
                  <TableCell label="Payroll Amount" width={COLUMN_WIDTHS.amount} header />
                  <TableCell label="Payment Status" width={COLUMN_WIDTHS.status} header />
                  <TableCell label="" width={COLUMN_WIDTHS.action} header />
                </View>
                <ScrollView style={styles.tableBody} nestedScrollEnabled>
                  {selectedAttendance.map(({ employee, records }) => {
                    const record = modalDate ? getPayrollRecord(employee.id, modalDate) : undefined;
                    const attendanceStatus = Array.from(new Set(records.map(item => item.status))).join(", ");
                    const hours = records.reduce((sum, item) => sum + item.regularHours + item.overtimeHours, 0);
                    const paymentStatus = record ? record.status === "Paid" ? "Paid" : "Unpaid" : "Pending";
                    const amount = record
                      ? peso(record.netPay)
                      : employee.salaryType === "Monthly"
                        ? "Not available"
                        : "Not calculated";

                    return <View key={employee.id} style={styles.tableRow}>
                      <TableCell label={employee.fullName} width={COLUMN_WIDTHS.name} />
                      <TableCell label={attendanceStatus} width={COLUMN_WIDTHS.attendance} />
                      <TableCell label={`${hours.toFixed(2)} hrs`} width={COLUMN_WIDTHS.hours} />
                      <TableCell label={amount} width={COLUMN_WIDTHS.amount} />
                      <TableCell label={paymentStatus} width={COLUMN_WIDTHS.status} />
                      <View style={[styles.tableCell, { width: COLUMN_WIDTHS.action }]}>
                        {paymentStatus === "Unpaid" && record
                          ? <AppButton title="Mark as Paid" secondary onPress={() => markPaid(record)} style={styles.markPaidButton} />
                          : <Text style={styles.meta}>{paymentStatus === "Paid" ? "Paid" : "—"}</Text>}
                      </View>
                    </View>;
                  })}
                </ScrollView>
              </View>
            </ScrollView>}
          <Text style={styles.modalNote}>Payroll amount is not available until payroll has been generated for the date.</Text>
        </View>
      </View>
    </Modal>
  </>;
}

function TableCell({ label, width, header }: { label: string; width: number; header?: boolean }) {
  return <View style={[styles.tableCell, { width }]}>
    <Text style={[styles.tableText, header && styles.tableHeaderText]}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 15 },
  meta: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  note: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginVertical: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  sectionTitle: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 18, marginTop: 8 },
  actions: { gap: 8, marginTop: 12 },
  dateCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  dateText: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "800", width: 88 },
  dateActions: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 6 },
  dateButton: { flex: 1, paddingHorizontal: 7, paddingVertical: 11 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 12 },
  modalContent: { width: "100%", maxWidth: 900, maxHeight: "90%", backgroundColor: COLORS.background, borderRadius: 16, padding: 16, gap: 12 },
  modalHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  closeButton: { paddingVertical: 9, paddingHorizontal: 12 },
  tableHeader: { backgroundColor: COLORS.cream, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: "center" },
  tableCell: { paddingHorizontal: 8, paddingVertical: 10, justifyContent: "center" },
  tableText: { color: COLORS.text, fontSize: 12 },
  tableHeaderText: { color: COLORS.darkBrown, fontWeight: "800" },
  tableBody: { maxHeight: 390 },
  markPaidButton: { paddingVertical: 8, paddingHorizontal: 6 },
  modalNote: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
});
