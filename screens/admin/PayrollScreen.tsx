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
import { formatDuration, formatUsDate, localDateString } from "../../utils/dateUtils";
import { getCashoutSummary } from "../../utils/cashoutUtils";
import { EmptyState } from "../../components/common/EmptyState";
import { formatTimeUpdated } from "../../utils/dateUtils";

interface PayrollScreenProps {
  employees: Employee[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
  setPayroll: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
  cashouts: CashoutRequest[];
  setCashouts: React.Dispatch<React.SetStateAction<CashoutRequest[]>>;
}

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
          preparedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
    <ScreenContainer title="Prepare payroll" subtitle="Review attendance and prepare pay for Finance.">
      {payrollDates.map(date => {
        const dateRows = getEmployeeRows(date);
        const hourlyRows = dateRows.filter(({ employee }) => employee.salaryType === "Hourly");
        const preparedRecords = hourlyRows
          .map(({ employee }) => getPayrollRecord(employee.id, date))
          .filter((record): record is PayrollRecord => Boolean(record));
        const missingCount = hourlyRows.length - preparedRecords.length;
        const paidRecords = preparedRecords.filter(record => record.status === "Paid");
        const waitingCount = preparedRecords.length - paidRecords.length;
        const allPrepared = hourlyRows.length > 0 && missingCount === 0;
        const allPaid = allPrepared && paidRecords.length === hourlyRows.length;
        const financeStatus = allPaid
          ? "Recorded by Finance"
          : allPrepared
            ? paidRecords.length > 0
              ? `${waitingCount} waiting for Finance · ${paidRecords.length} recorded`
              : `${waitingCount} payment${waitingCount === 1 ? "" : "s"} waiting for Finance`
            : preparedRecords.length > 0
              ? `${preparedRecords.length} prepared · ${missingCount} still to prepare`
              : "";
        return <AppCard key={date} style={styles.dateCard}>
          <View style={styles.dateHeader}>
            <View><Text style={styles.dateText}>{formatUsDate(date)}</Text><Text style={styles.dateSubtext}>{dateRows.length} employee{dateRows.length === 1 ? "" : "s"} with attendance</Text></View>
          </View>
          {financeStatus ? <View style={styles.financeStatus}>
            <View style={[styles.financeStatusDot, { backgroundColor: allPaid ? COLORS.success : COLORS.warning }]} />
            <Text style={[styles.financeStatusText, { color: allPaid ? COLORS.success : COLORS.warning }]}>{financeStatus}</Text>
          </View> : null}
          <View style={styles.dateActions}>
            {(!allPrepared || hourlyRows.length === 0) ? <AppButton title="Prepare payroll" onPress={() => generate(date)} style={styles.prepareButton} /> : null}
            <AppButton title="View team" secondary onPress={() => setModalDate(date)} style={styles.teamButton} />
          </View>
        </AppCard>;
      })}
      {payrollDates.length === 0 && <EmptyState title="Payroll starts with attendance" message="Once shifts are recorded, you can review a date and prepare wages for Finance." />}

    </ScreenContainer>

    <Modal visible={modalDate !== null} transparent animationType="slide" onRequestClose={() => setModalDate(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeading}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Employees</Text>
              <Text style={styles.meta}>Attendance and payroll status</Text>
            </View>
            <AppButton title="Close" secondary onPress={() => setModalDate(null)} style={styles.closeButton} />
          </View>
          {selectedAttendance.length === 0
            ? <EmptyState title="No shifts for this date" message="Attendance records will appear here when employees clock in." />
            : <ScrollView style={styles.employeeList} nestedScrollEnabled contentContainerStyle={styles.employeeListContent}>
              {selectedAttendance.map(({ employee, records }) => {
                const record = modalDate ? getPayrollRecord(employee.id, modalDate) : undefined;
                const attendanceStatus = Array.from(new Set(records.map(item => item.status))).join(", ");
                const hours = records.reduce((sum, item) => sum + item.regularHours + item.overtimeHours, 0);
                const amount = record ? peso(record.netPay) : employee.salaryType === "Monthly" ? "Not available" : "Not calculated";
                const statusLabel = record ? record.status === "Paid" ? "Paid" : "Ready for Finance" : "Not prepared";
                return <AppCard key={employee.id} style={styles.employeePayrollCard}>
                  <View style={styles.employeePayrollHeader}><View style={{ flex: 1 }}><Text style={styles.employeePayrollName}>{employee.fullName}</Text><Text style={styles.meta}>{employee.position}</Text></View><View style={[styles.statePill, record?.status === "Paid" ? styles.statePaid : record ? styles.stateReady : styles.stateIdle]}><Text style={styles.stateText}>{statusLabel}</Text></View></View>
                  <View style={styles.summaryLine}><Text style={styles.meta}>Attendance</Text><Text style={styles.summaryValue}>{attendanceStatus}</Text></View>
                  <View style={styles.summaryLine}><Text style={styles.meta}>Hours worked</Text><Text style={styles.summaryValue}>{formatDuration(hours)}</Text></View>
                  <View style={styles.amountLine}><Text style={styles.employeePayrollName}>Take-home pay</Text><Text style={styles.employeeAmount}>{amount}</Text></View>
                  {record?.updatedAt || record?.preparedAt ? <Text style={styles.updatedCell}>Updated {formatTimeUpdated(record.updatedAt ?? record.preparedAt)}</Text> : null}
                </AppCard>;
              })}
            </ScrollView>}
          <Text style={styles.modalNote}>Monthly salary is not calculated by this demo payroll flow.</Text>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 15 },
  meta: { color: COLORS.muted, fontSize: 14, marginTop: 5 },
  note: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginVertical: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  actions: { gap: 8, marginTop: 12 },
  dateCard: { gap: 10, backgroundColor: "#EDE1D0" },
  dateHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateText: { color: COLORS.darkBrown, fontSize: 17, fontWeight: "800" },
  dateSubtext: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  financeStatus: { flexDirection: "row", alignItems: "center", gap: 7 },
  financeStatusDot: { width: 8, height: 8, borderRadius: 4 },
  financeStatusText: { fontSize: 13, fontWeight: "700" },
  dateActions: { flexDirection: "row", gap: 8 },
  prepareButton: { flex: 1.35, paddingHorizontal: 7, paddingVertical: 11 },
  teamButton: { flex: 1, paddingHorizontal: 7, paddingVertical: 11 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 12 },
  modalContent: { width: "100%", maxWidth: 900, maxHeight: "90%", backgroundColor: COLORS.background, borderRadius: 18, padding: 18, gap: 12 },
  modalHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  closeButton: { paddingVertical: 9, paddingHorizontal: 12 },
  employeeList: { flexGrow: 0, maxHeight: 490 },
  employeeListContent: { gap: 10, paddingBottom: 4 },
  employeePayrollCard: { gap: 8, backgroundColor: "#EDE1D0" },
  employeePayrollHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  employeePayrollName: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "800" },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  summaryValue: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  amountLine: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 9, marginTop: 2, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  employeeAmount: { color: COLORS.darkBrown, fontSize: 18, fontWeight: "900" },
  statePill: { borderRadius: 13, paddingHorizontal: 9, paddingVertical: 6 },
  statePaid: { backgroundColor: "#E5F0E0" }, stateReady: { backgroundColor: "#F9EBD2" }, stateIdle: { backgroundColor: COLORS.cream },
  stateText: { color: COLORS.darkBrown, fontSize: 11, fontWeight: "800" },
  modalNote: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  updatedCell: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
});
