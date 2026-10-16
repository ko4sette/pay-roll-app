import { Employee, Attendance } from "../types";

export function calculatePay(employee: Employee, records: Attendance[]) {
  const approved = records.filter(r => r.employeeId === employee.id && r.timeIn && r.timeOut && r.regularHours > 0);
  const hours = approved.reduce((sum, r) => sum + r.regularHours, 0);
  const overtimeHours = approved.reduce((sum, r) => sum + r.overtimeHours, 0);
  const basicPay = employee.salaryType === "Hourly" ? hours * employee.salaryAmount : employee.salaryAmount;
  const overtimePay = employee.salaryType === "Hourly" ? overtimeHours * employee.salaryAmount * 1.25 : 0;
  const grossPay = basicPay + overtimePay;
  // Demonstration-only flat sample deduction. Configure/verify real deductions before actual use.
  const deductions = Math.round(grossPay * 0.05 * 100) / 100;
  return { basicPay, overtimePay, allowances: 0, grossPay, deductions, netPay: grossPay - deductions };
}
