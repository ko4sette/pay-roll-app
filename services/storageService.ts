import AsyncStorage from "@react-native-async-storage/async-storage";
import { Employee, Attendance, PayrollRecord } from "../types";
import { DEMO_EMPLOYEES, DEMO_ATTENDANCE, DEMO_PAYROLL } from "../constants/demoData";

const KEY = "cafe_payroll_data_v1";
export async function loadData(): Promise<{ employees: Employee[]; attendance: Attendance[]; payroll: PayrollRecord[] }> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const initial = { employees: DEMO_EMPLOYEES, attendance: DEMO_ATTENDANCE, payroll: DEMO_PAYROLL };
  await AsyncStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}
export async function saveData(data: { employees: Employee[]; attendance: Attendance[]; payroll: PayrollRecord[] }) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}
