import type { Position } from "../constants/positions";

export type Role = "admin" | "finance" | "staff";
export interface User { id: string; email: string; name: string; role: Role; employeeId?: string; password?: string; }
export interface Employee {
  id: string; 
  employeeNumber: string; 
  fullName: string; 
  email: string; 
  contactNumber: string;
  position: Position; employmentType: "Full-time" | "Part-time"; salaryType: "Hourly" | "Monthly";
  salaryAmount: number; dateHired: string; employmentStatus: "Active" | "Inactive";
}
export interface Attendance {
  id: string; employeeId: string; workDate: string; timeIn?: string; timeOut?: string;
  regularHours: number; overtimeHours: number; status: "Present" | "Late" | "Absent" | "Incomplete"; updatedAt?: string;
}
export interface PayrollRecord {
  id: string; employeeId: string; periodStart: string; periodEnd: string; basicPay: number;
  overtimePay: number; allowances: number; grossPay: number; deductions: number; netPay: number;
  hourlyRate?: number; workedMinutes?: number;
  deductionItems?: { name: string; amount: number }[];
  status: "Pending" | "Paid"; paidAt?: string; preparedAt?: string; updatedAt?: string; paymentMethod?: "Cash" | "Bank transfer" | "E-wallet"; paymentReference?: string;
}
export interface CashoutRequest {
  id: string;
  employeeId: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  requestedAt: string;
  processedAt?: string;
}
export interface PasswordAssistanceRequest {
  id: string;
  employeeId: string;
  submittedAt: string;
  status: "Pending" | "Resolved";
  resolvedAt?: string;
}
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  route: string;
  createdAt?: string;
}
