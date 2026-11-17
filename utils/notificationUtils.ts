import { AppNotification, Attendance, PayrollRecord, PasswordAssistanceRequest, Role } from "../types";
import { dateFromLocalString, daysBetweenLocalDates, localDateString, nextSunday } from "./dateUtils";

export function buildNotifications(input: {
  role: Role;
  employeeId?: string;
  attendance: Attendance[];
  payroll: PayrollRecord[];
  passwordRequests: PasswordAssistanceRequest[];
  paydayDate?: string | null;
}): AppNotification[] {
  const notifications: AppNotification[] = [];
  const today = new Date();
  const todayKey = localDateString(today);
  if (input.role === "admin") {
    input.passwordRequests.filter(item => item.status === "Pending").forEach(request => notifications.push({
      id: `password-help-${request.id}-pending`, title: "Password help needs review", message: "An employee asked for help signing in.", route: "Notifications", createdAt: request.submittedAt,
    }));
    const incomplete = input.attendance.filter(item => item.workDate === todayKey && (!item.timeOut || item.status === "Incomplete"));
    if (incomplete.length) notifications.push({ id: `attendance-incomplete-${todayKey}`, title: "Attendance needs review", message: `${incomplete.length} shift${incomplete.length === 1 ? "" : "s"} need attention.`, route: "Attendance", createdAt: today.toISOString() });
  }
  if (input.role === "finance") {
    input.payroll.filter(item => item.status === "Pending").forEach(record => notifications.push({
      id: `payroll-${record.id}-pending`, title: "Payroll ready for payment", message: `Review ${record.netPay.toLocaleString("en-PH", { style: "currency", currency: "PHP" })} for the prepared pay period.`, route: "Payments", createdAt: record.preparedAt,
    }));
  }
  if (input.role === "staff" && input.employeeId) {
    const mine = input.payroll.filter(item => item.employeeId === input.employeeId).sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
    const latest = mine[0];
    if (latest) notifications.push({
      id: `payroll-${latest.id}-${latest.status}`, title: latest.status === "Paid" ? "Payslip is available" : "Payroll is awaiting Finance", message: latest.status === "Paid" ? "Your payment has been released. Open your payslip for details." : "Your prepared payroll has not been released yet.", route: "Salary", createdAt: latest.updatedAt ?? latest.preparedAt,
    });
    const shift = input.attendance.find(item => item.employeeId === input.employeeId && item.workDate === todayKey);
    if (shift) notifications.push({ id: `attendance-${shift.id}`, title: "Attendance recorded", message: shift.timeOut ? "Your shift is complete." : "Your time-in is saved; remember to clock out.", route: "Attendance", createdAt: shift.updatedAt });
  }

  const configured = input.paydayDate ? dateFromLocalString(input.paydayDate) : null;
  const payday = configured && localDateString(configured) >= todayKey ? configured : nextSunday(today);
  const daysToPayday = daysBetweenLocalDates(today, payday);
  if (daysToPayday <= 3) notifications.push({
    id: `payday-${localDateString(payday)}`, title: daysToPayday === 0 ? "Payday is today" : "Payday is approaching", message: daysToPayday === 0 ? "Today is the scheduled payday." : `The next payday is in ${daysToPayday} day${daysToPayday === 1 ? "" : "s"}.`, route: "Dashboard", createdAt: today.toISOString(),
  });
  return notifications.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
