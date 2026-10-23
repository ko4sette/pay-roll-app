import type { Position } from "../constants/positions";

export type Role = "admin" | "staff";
export interface User { id: string; email: string; name: string; role: Role; employeeId?: string; password?: string; }
export interface Employee {
  id: string; employeeNumber: string; fullName: string; email: string; contactNumber: string;
  position: Position; employmentType: "Full-time" | "Part-time"; salaryType: "Hourly" | "Monthly";
  salaryAmount: number; dateHired: string; employmentStatus: "Active" | "Inactive";
}
export interface Attendance {
  id: string; employeeId: string; workDate: string; timeIn?: string; timeOut?: string;
  regularHours: number; overtimeHours: number; status: "Present" | "Late" | "Absent" | "Incomplete";
}
export interface PayrollRecord {
  id: string; employeeId: string; periodStart: string; periodEnd: string; basicPay: number;
  overtimePay: number; allowances: number; grossPay: number; deductions: number; netPay: number;
  status: "Pending" | "Paid"; paidAt?: string;
}
