import { CashoutRequest, PayrollRecord } from "../types";

export function getCashoutSummary(
  employeeId: string,
  payroll: PayrollRecord[],
  cashouts: CashoutRequest[],
) {
  const employeePayroll = payroll.filter(record => record.employeeId === employeeId);
  const employeeCashouts = cashouts.filter(request => request.employeeId === employeeId);
  const totalEarnings = employeePayroll.reduce((total, record) => total + record.netPay, 0);
  const paidPayroll = employeePayroll
    .filter(record => record.status === "Paid")
    .reduce((total, record) => total + record.netPay, 0);
  const approvedCashouts = employeeCashouts
    .filter(request => request.status === "Approved")
    .reduce((total, request) => total + request.amount, 0);
  const pendingCashouts = employeeCashouts
    .filter(request => request.status === "Pending")
    .reduce((total, request) => total + request.amount, 0);
  const paidAmount = paidPayroll + approvedCashouts;
  const availableBalance = Math.max(0, Math.round(
    (totalEarnings - paidAmount - pendingCashouts) * 100,
  ) / 100);

  return { totalEarnings, paidAmount, availableBalance };
}

export function getCashoutRequestError(
  employeeId: string,
  amount: number,
  payroll: PayrollRecord[],
  cashouts: CashoutRequest[],
): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter a cashout amount greater than zero.";
  if (cashouts.some(request => request.employeeId === employeeId && request.status === "Pending")) {
    return "You already have a pending cashout request.";
  }
  if (amount > getCashoutSummary(employeeId, payroll, cashouts).availableBalance) {
    return "The cashout amount cannot exceed your available balance.";
  }
  return null;
}
