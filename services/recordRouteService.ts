import { auth } from "./firebase";
import { Attendance, Employee, PayrollRecord, User } from "../types";
import { loadFirebaseAppUser } from "./firebaseAuthService";
import { loadData } from "./storageService";
import { formatDuration, formatTimeUpdated, formatUsDate } from "../utils/dateUtils";
import { peso } from "../utils/currencyUtils";

export interface RecordListItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
}

export interface RecordDetail {
  title: string;
  subtitle: string;
  summary?: { label: string; value: string };
  sections: { title: string; fields: { label: string; value: string }[] }[];
}

interface PayrollData {
  employees: Employee[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
}

function canViewEmployee(user: User, employeeId: string): boolean {
  return user.role === "admin" || user.role === "finance" || user.employeeId === employeeId;
}

export async function loadAuthorizedUser(): Promise<User | null> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  const parsedUser = await loadFirebaseAppUser(firebaseUser.uid);
  if (!parsedUser || parsedUser.mustChangePassword) return null;
  if (parsedUser.role === "admin" || parsedUser.role === "finance") return parsedUser;
  if (parsedUser.role !== "staff" || !parsedUser.employeeId) return null;

  const data = await loadData();
  const employeeIsActive = data.employees.some(
    employee => employee.id === parsedUser.employeeId && employee.employmentStatus === "Active",
  );
  if (!employeeIsActive) return null;
  return parsedUser;
}

export function listRecordItems(data: PayrollData, user: User): RecordListItem[] {
  const employeeItems = data.employees
    .filter(employee => canViewEmployee(user, employee.id))
    .map(employee => ({
      id: `employee-${employee.id}`,
      title: employee.fullName,
      subtitle: `${employee.employeeNumber} · ${employee.position}`,
      date: employee.dateHired,
    }));
  const attendanceItems = data.attendance
    .filter(record => canViewEmployee(user, record.employeeId))
    .map(record => {
      const employeeName = data.employees.find(employee => employee.id === record.employeeId)?.fullName ?? "Employee";
      return {
        id: `attendance-${record.id}`,
        title: `${employeeName} · ${formatUsDate(record.workDate)}`,
        subtitle: `Attendance · ${record.status}`,
        date: record.workDate,
      };
    });
  const payrollItems = data.payroll
    .filter(record => canViewEmployee(user, record.employeeId))
    .map(record => {
      const employeeName = data.employees.find(employee => employee.id === record.employeeId)?.fullName ?? "Employee";
      return {
        id: `payroll-${record.id}`,
        title: `${employeeName} · ${formatUsDate(record.periodStart)}${record.periodEnd !== record.periodStart ? ` – ${formatUsDate(record.periodEnd)}` : ""}`,
        subtitle: `Payroll · ${record.status}`,
        date: record.periodStart,
      };
    });

  return [...employeeItems, ...attendanceItems, ...payrollItems];
}

export function findRecordDetail(data: PayrollData, user: User, routeId: string): RecordDetail | null {
  const separator = routeId.indexOf("-");
  if (separator < 1) return null;
  const kind = routeId.slice(0, separator);
  const recordId = routeId.slice(separator + 1);

  if (kind === "employee") {
    const employee = data.employees.find(
      item => item.id === recordId && canViewEmployee(user, item.id),
    );
    if (!employee) return null;
    return {
      title: employee.fullName,
      subtitle: `${employee.employeeNumber} · ${employee.position}`,
      sections: [
        { title: "Contact", fields: [
          { label: "Email", value: employee.email || "Not provided" },
          { label: "Phone", value: employee.contactNumber || "Not provided" },
        ] },
        { title: "Employment", fields: [
          { label: "Status", value: employee.employmentStatus },
          { label: "Type", value: employee.employmentType },
          { label: "Date hired", value: formatUsDate(employee.dateHired) },
        ] },
        { title: "Pay", fields: [
          { label: "Salary type", value: employee.salaryType },
          { label: "Pay rate", value: `${peso(employee.salaryAmount)} / ${employee.salaryType === "Hourly" ? "hour" : "month"}` },
        ] },
      ],
    };
  }

  if (kind === "attendance") {
    const record = data.attendance.find(item => item.id === recordId && canViewEmployee(user, item.employeeId));
    if (!record) return null;
    const employeeName = data.employees.find(employee => employee.id === record.employeeId)?.fullName ?? "Employee";
    return {
      title: `${employeeName} · ${formatUsDate(record.workDate)}`,
      subtitle: `Attendance · ${record.status}`,
      summary: { label: "Shift length", value: record.timeOut ? formatDuration(record.regularHours + record.overtimeHours) : "In progress" },
      sections: [
        { title: "Shift details", fields: [
          { label: "Employee ID", value: record.employeeId },
          { label: "Date", value: formatUsDate(record.workDate) },
          { label: "Status", value: record.status },
          { label: "Time in", value: record.timeIn ?? "—" },
          { label: "Time out", value: record.timeOut ?? "—" },
        ] },
        ...(record.updatedAt ? [{ title: "Record", fields: [{ label: "Last updated", value: formatTimeUpdated(record.updatedAt) }] }] : []),
      ],
    };
  }

  if (kind === "payroll") {
    const record = data.payroll.find(item => item.id === recordId && canViewEmployee(user, item.employeeId));
    if (!record) return null;
    const employeeName = data.employees.find(employee => employee.id === record.employeeId)?.fullName ?? "Employee";
    const hoursWorked = data.attendance
      .filter(item => item.employeeId === record.employeeId
        && item.workDate >= record.periodStart
        && item.workDate <= record.periodEnd
        && item.timeIn
        && item.timeOut)
      .reduce((total, item) => total + item.regularHours + item.overtimeHours, 0);
    const period = `${formatUsDate(record.periodStart)}${record.periodEnd !== record.periodStart ? ` – ${formatUsDate(record.periodEnd)}` : ""}`;
    return {
      title: `${employeeName} · ${period}`,
      subtitle: `Payroll · ${record.status}`,
      summary: { label: "Take-home pay", value: peso(record.netPay) },
      sections: [
        { title: "Pay period", fields: [
          { label: "Dates", value: period },
          { label: "Hours worked", value: formatDuration(hoursWorked) },
        ] },
        { title: "Earnings", fields: [
          { label: "Regular pay", value: peso(record.basicPay) },
          ...(record.overtimePay > 0 ? [{ label: "Overtime pay", value: peso(record.overtimePay) }] : []),
          { label: "Pay earned", value: peso(record.grossPay) },
        ] },
        ...(record.deductions > 0 ? [{ title: "Deductions", fields: record.deductionItems?.length
          ? record.deductionItems.map(item => ({ label: item.name, value: `− ${peso(item.amount)}` }))
          : [{ label: "Total deductions", value: `− ${peso(record.deductions)}` }] }] : []),
        { title: "Payment", fields: [
          { label: "Status", value: record.status === "Paid" ? "Paid" : "Not paid yet" },
          ...(record.paidAt ? [{ label: "Payment date", value: formatUsDate(record.paidAt) }] : []),
          ...(record.paymentMethod ? [{ label: "Payment method", value: record.paymentMethod }] : []),
          ...(record.paymentReference ? [{ label: "Receipt or transfer code", value: record.paymentReference }] : []),
          ...(record.updatedAt || record.preparedAt ? [{ label: "Updated", value: formatTimeUpdated(record.updatedAt ?? record.preparedAt) }] : []),
        ] },
      ],
    };
  }

  return null;
}
