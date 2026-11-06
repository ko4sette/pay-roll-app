import AsyncStorage from "@react-native-async-storage/async-storage";
import { Employee, Attendance, PayrollRecord, CashoutRequest, PasswordAssistanceRequest } from "../types";
import { DEMO_EMPLOYEES, DEMO_ATTENDANCE, DEMO_PAYROLL } from "../constants/demoData";

const KEY = "cafe_payroll_data_v1";
const EMPLOYEE_ID_SEQUENCE_KEY = "cafe_employee_id_sequence_v1";
const SEEDED_DEMO_PAYROLL_IDS = new Set(["p1", "p2"]);
const LEGACY_DEMO_EMPLOYEE_IDS = new Set(["e1", "e2", "e3", "e4", "e5"]);
let employeeIdAllocation = Promise.resolve();

export async function loadData(): Promise<{ employees: Employee[]; attendance: Attendance[]; payroll: PayrollRecord[]; cashouts: CashoutRequest[]; passwordAssistanceRequests: PasswordAssistanceRequest[] }> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) {
    const data = JSON.parse(raw) as { employees: Employee[]; attendance: Attendance[]; payroll: PayrollRecord[]; cashouts?: CashoutRequest[]; passwordAssistanceRequests?: PasswordAssistanceRequest[] };
    const employees = data.employees.filter(employee => !LEGACY_DEMO_EMPLOYEE_IDS.has(employee.id));
    const attendance = data.attendance.filter(record => !LEGACY_DEMO_EMPLOYEE_IDS.has(record.employeeId));
    const payroll = data.payroll.filter(
      record => !SEEDED_DEMO_PAYROLL_IDS.has(record.id) && !LEGACY_DEMO_EMPLOYEE_IDS.has(record.employeeId),
    );
    const cashouts = (data.cashouts ?? []).filter(request => !LEGACY_DEMO_EMPLOYEE_IDS.has(request.employeeId));
    const passwordAssistanceRequests = (data.passwordAssistanceRequests ?? [])
      .filter(request => !LEGACY_DEMO_EMPLOYEE_IDS.has(request.employeeId));
    if (
      employees.length !== data.employees.length
      || attendance.length !== data.attendance.length
      || payroll.length !== data.payroll.length
      || !data.cashouts
      || cashouts.length !== data.cashouts.length
      || !data.passwordAssistanceRequests
      || passwordAssistanceRequests.length !== data.passwordAssistanceRequests.length
    ) {
      const updated = { ...data, employees, attendance, payroll, cashouts, passwordAssistanceRequests };
      await AsyncStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    }
    return { ...data, cashouts, passwordAssistanceRequests };
  }
  const initial = {
    employees: DEMO_EMPLOYEES,
    attendance: DEMO_ATTENDANCE,
    payroll: DEMO_PAYROLL,
    cashouts: [] as CashoutRequest[],
    passwordAssistanceRequests: [] as PasswordAssistanceRequest[],
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}
export async function saveData(data: { employees: Employee[]; attendance: Attendance[]; payroll: PayrollRecord[]; cashouts: CashoutRequest[]; passwordAssistanceRequests: PasswordAssistanceRequest[] }) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export function generateEmployeeNumber(): Promise<string> {
  const allocation = employeeIdAllocation.then(async () => {
    const data = await loadData();
    const storedNextId = Number(await AsyncStorage.getItem(EMPLOYEE_ID_SEQUENCE_KEY));
    const highestExistingId = data.employees.reduce((highest, employee) => {
      const match = employee.employeeNumber.match(/^CAF-?(\d+)$/i);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    const nextId = Math.max(
      Number.isSafeInteger(storedNextId) && storedNextId > 0 ? storedNextId : 1,
      highestExistingId + 1,
    );

    await AsyncStorage.setItem(EMPLOYEE_ID_SEQUENCE_KEY, String(nextId + 1));
    return `CAF${String(nextId).padStart(3, "0")}`;
  });
  employeeIdAllocation = allocation.then(() => undefined, () => undefined);
  return allocation;
}
