import AsyncStorage from "@react-native-async-storage/async-storage";
import { Attendance, Employee, PayrollRecord, User } from "../types";
import { employeeNeedsPasswordChange } from "./authService";
import { loadData } from "./storageService";

export interface RecordListItem {
  id: string;
  title: string;
  subtitle: string;
}

export interface RecordDetail {
  title: string;
  subtitle: string;
  fields: { label: string; value: string }[];
}

interface PayrollData {
  employees: Employee[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
}

function canViewEmployee(user: User, employeeId: string): boolean {
  return user.role === "admin" || user.employeeId === employeeId;
}

export async function loadAuthorizedUser(): Promise<User | null> {
  const rawUser = await AsyncStorage.getItem("cafe_current_user");
  if (!rawUser) return null;

  let parsedUser: User;
  try {
    parsedUser = JSON.parse(rawUser) as User;
  } catch {
    await AsyncStorage.removeItem("cafe_current_user");
    return null;
  }

  if (parsedUser.role === "admin") return parsedUser;
  if (parsedUser.role !== "staff" || !parsedUser.employeeId) {
    await AsyncStorage.removeItem("cafe_current_user");
    return null;
  }

  const data = await loadData();
  const employeeIsActive = data.employees.some(
    employee => employee.id === parsedUser.employeeId && employee.employmentStatus === "Active",
  );
  if (!employeeIsActive || await employeeNeedsPasswordChange(parsedUser.employeeId)) {
    await AsyncStorage.removeItem("cafe_current_user");
    return null;
  }
  return parsedUser;
}

export function listRecordItems(data: PayrollData, user: User): RecordListItem[] {
  const employeeItems = data.employees
    .filter(employee => canViewEmployee(user, employee.id))
    .map(employee => ({
      id: `employee-${employee.id}`,
      title: employee.fullName,
      subtitle: `${employee.employeeNumber} · ${employee.position}`,
    }));
  const attendanceItems = data.attendance
    .filter(record => canViewEmployee(user, record.employeeId))
    .map(record => {
      const employeeName = data.employees.find(employee => employee.id === record.employeeId)?.fullName ?? "Employee";
      return {
        id: `attendance-${record.id}`,
        title: `${employeeName} · ${record.workDate}`,
        subtitle: `Attendance · ${record.status}`,
      };
    });
  const payrollItems = data.payroll
    .filter(record => canViewEmployee(user, record.employeeId))
    .map(record => {
      const employeeName = data.employees.find(employee => employee.id === record.employeeId)?.fullName ?? "Employee";
      return {
        id: `payroll-${record.id}`,
        title: `${employeeName} · ${record.periodStart} – ${record.periodEnd}`,
        subtitle: `Payroll · ${record.status}`,
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
      fields: [
        { label: "Email", value: employee.email },
        { label: "Employment status", value: employee.employmentStatus },
        { label: "Employment type", value: employee.employmentType },
        { label: "Salary type", value: employee.salaryType },
        { label: "Salary amount", value: String(employee.salaryAmount) },
        { label: "Date hired", value: employee.dateHired },
      ],
    };
  }

  if (kind === "attendance") {
    const record = data.attendance.find(item => item.id === recordId && canViewEmployee(user, item.employeeId));
    if (!record) return null;
    const employeeName = data.employees.find(employee => employee.id === record.employeeId)?.fullName ?? "Employee";
    return {
      title: `${employeeName} · ${record.workDate}`,
      subtitle: `Attendance · ${record.status}`,
      fields: [
        { label: "Employee ID", value: record.employeeId },
        { label: "Date", value: record.workDate },
        { label: "Status", value: record.status },
        { label: "Time in", value: record.timeIn ?? "—" },
        { label: "Time out", value: record.timeOut ?? "—" },
        { label: "Regular hours", value: String(record.regularHours) },
        { label: "Overtime hours", value: String(record.overtimeHours) },
      ],
    };
  }

  if (kind === "payroll") {
    const record = data.payroll.find(item => item.id === recordId && canViewEmployee(user, item.employeeId));
    if (!record) return null;
    const employeeName = data.employees.find(employee => employee.id === record.employeeId)?.fullName ?? "Employee";
    return {
      title: `${employeeName} · ${record.periodStart} – ${record.periodEnd}`,
      subtitle: `Payroll · ${record.status}`,
      fields: [
        { label: "Basic pay", value: String(record.basicPay) },
        { label: "Overtime pay", value: String(record.overtimePay) },
        { label: "Allowances", value: String(record.allowances) },
        { label: "Gross pay", value: String(record.grossPay) },
        { label: "Deductions", value: String(record.deductions) },
        { label: "Net pay", value: String(record.netPay) },
        { label: "Status", value: record.status },
      ],
    };
  }

  return null;
}
