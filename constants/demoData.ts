import { Employee, Attendance, PayrollRecord } from "../types";

export const DEMO_EMPLOYEES: Employee[] = [
  { id: "e1", employeeNumber: "CAF-001", fullName: "Alex Rivera", email: "staff@cafepayroll.com", contactNumber: "09171234567", position: "Barista", employmentType: "Full-time", salaryType: "Hourly", salaryAmount: 75, dateHired: "2025-06-01", employmentStatus: "Active" },
  { id: "e2", employeeNumber: "CAF-002", fullName: "Jamie Santos", email: "jamie@cafepayroll.com", contactNumber: "09181234567", position: "Cashier", employmentType: "Part-time", salaryType: "Hourly", salaryAmount: 70, dateHired: "2025-07-10", employmentStatus: "Active" },
  { id: "e3", employeeNumber: "CAF-003", fullName: "Morgan Cruz", email: "morgan@cafepayroll.com", contactNumber: "09191234567", position: "Kitchen Staff", employmentType: "Full-time", salaryType: "Monthly", salaryAmount: 16000, dateHired: "2025-03-15", employmentStatus: "Active" },
  { id: "e4", employeeNumber: "CAF-004", fullName: "Taylor Lim", email: "taylor@cafepayroll.com", contactNumber: "09201234567", position: "Shift Supervisor", employmentType: "Full-time", salaryType: "Monthly", salaryAmount: 22000, dateHired: "2024-11-01", employmentStatus: "Active" },
  { id: "e5", employeeNumber: "CAF-005", fullName: "Casey Dela Cruz", email: "casey@cafepayroll.com", contactNumber: "09211234567", position: "Barista", employmentType: "Part-time", salaryType: "Hourly", salaryAmount: 75, dateHired: "2025-09-01", employmentStatus: "Active" }
];

export const DEMO_ATTENDANCE: Attendance[] = [
  { id: "a1", employeeId: "e1", workDate: new Date().toISOString().slice(0, 10), timeIn: "08:00", timeOut: "16:00", regularHours: 8, overtimeHours: 0, status: "Present" },
  { id: "a2", employeeId: "e2", workDate: new Date().toISOString().slice(0, 10), timeIn: "09:10", regularHours: 0, overtimeHours: 0, status: "Incomplete" },
  { id: "a3", employeeId: "e3", workDate: new Date().toISOString().slice(0, 10), timeIn: "07:55", timeOut: "16:00", regularHours: 8, overtimeHours: 0, status: "Present" }
];

export const DEMO_PAYROLL: PayrollRecord[] = [
  { id: "p1", employeeId: "e1", periodStart: "2026-10-01", periodEnd: "2026-10-15", basicPay: 9000, overtimePay: 0, allowances: 300, grossPay: 9300, deductions: 450, netPay: 8850, status: "Paid", paidAt: "2026-10-15" },
  { id: "p2", employeeId: "e2", periodStart: "2026-10-01", periodEnd: "2026-10-15", basicPay: 4200, overtimePay: 0, allowances: 0, grossPay: 4200, deductions: 200, netPay: 4000, status: "Pending" }
];
