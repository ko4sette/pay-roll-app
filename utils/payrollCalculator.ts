import { Employee, Attendance } from "../types";
import { getAttendanceWorkedMinutes, uniqueAttendanceByEmployeeDay } from "./attendanceUtils";

export function calculatePay(employee: Employee, records: Attendance[]) {
  const approved = uniqueAttendanceByEmployeeDay(records)
    .filter(record => record.employeeId === employee.id)
    .map(record => getAttendanceWorkedMinutes(record))
    .filter((minutes): minutes is number => minutes !== null);
  const workedMinutes = approved.reduce((sum, minutes) => sum + minutes, 0);
  const regularMinutes = approved.reduce((sum, minutes) => sum + Math.min(minutes, 8 * 60), 0);
  const overtimeMinutes = Math.max(0, workedMinutes - regularMinutes);
  const basicPay = employee.salaryType === "Hourly"
    ? regularMinutes / 60 * employee.salaryAmount
    : employee.salaryAmount;
  const overtimePay = employee.salaryType === "Hourly"
    ? overtimeMinutes / 60 * employee.salaryAmount * 1.25
    : 0;
  const roundedBasicPay = Math.round(basicPay * 100) / 100;
  const roundedOvertimePay = Math.round(overtimePay * 100) / 100;
  const grossPay = roundedBasicPay + roundedOvertimePay;
  const deductions = 0;
  return {
    basicPay: roundedBasicPay,
    overtimePay: roundedOvertimePay,
    allowances: 0,
    grossPay,
    deductions,
    deductionItems: [],
    netPay: grossPay - deductions,
    workedMinutes,
    hourlyRate: employee.salaryType === "Hourly" ? employee.salaryAmount : undefined,
  };
}
