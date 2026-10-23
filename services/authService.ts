import AsyncStorage from "@react-native-async-storage/async-storage";
import { Employee, User } from "../types";

interface EmployeeCredential {
  password: string;
  mustChangePassword: boolean;
}

type CredentialStore = Record<string, EmployeeCredential>;

const CREDENTIALS_KEY = "cafe_employee_credentials_v1";

const LEGACY_DEMO_EMPLOYEE_IDS = new Set(["e1", "e2", "e3", "e4", "e5"]);

export async function authenticateDemoAdmin(email: string, password: string): Promise<User | null> {
  if (email.trim().toLowerCase() !== "admin@cafepay.com" || password !== "admin123") return null;

  return {
    id: "admin-1",
    name: "Cafe Admin",
    email: "admin@cafepay.com",
    role: "admin",
  };
}

async function loadCredentials(): Promise<CredentialStore> {
  const raw = await AsyncStorage.getItem(CREDENTIALS_KEY);
  const credentials = raw ? JSON.parse(raw) as CredentialStore : {};
  const cleanedCredentials = Object.fromEntries(
    Object.entries(credentials).filter(([employeeId]) => !LEGACY_DEMO_EMPLOYEE_IDS.has(employeeId)),
  );
  if (!raw || Object.keys(cleanedCredentials).length !== Object.keys(credentials).length) {
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(cleanedCredentials));
  }
  return cleanedCredentials;
}

export async function authenticateEmployee(
  employeeNumber: string,
  password: string,
  employees: Employee[],
): Promise<{ user: User; mustChangePassword: boolean } | null> {
  const employee = employees.find(
    item => item.employeeNumber.toUpperCase() === employeeNumber && item.employmentStatus === "Active",
  );
  if (!employee) return null;

  const credential = (await loadCredentials())[employee.id];
  if (!credential || credential.password !== password) return null;

  return {
    user: {
      id: employee.id,
      name: employee.fullName,
      email: employee.email,
      role: "staff",
      employeeId: employee.id,
    },
    mustChangePassword: credential.mustChangePassword,
  };
}

export async function employeeNeedsPasswordChange(employeeId: string): Promise<boolean> {
  const credential = (await loadCredentials())[employeeId];
  return credential?.mustChangePassword ?? false;
}

export async function updateEmployeePassword(
  employeeId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const credentials = await loadCredentials();
  const credential = credentials[employeeId];
  if (!credential) throw new Error("Employee account was not found.");
  if (credential.password !== currentPassword) throw new Error("Current password is incorrect.");
  if (!newPassword.trim()) throw new Error("New password cannot be empty.");
  if (newPassword.length < 8) throw new Error("Choose a password with at least 8 characters.");
  if (newPassword === credential.password) throw new Error("Choose a new password different from your current password.");

  credentials[employeeId] = { password: newPassword, mustChangePassword: false };
  await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export async function issueTemporaryPassword(employeeId: string, employeeNumber: string): Promise<string> {
  if (!employeeNumber.trim()) throw new Error("Employee ID is required to create a temporary password.");
  const credentials = await loadCredentials();
  const password = employeeNumber.trim();
  credentials[employeeId] = { password, mustChangePassword: true };
  await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  return password;
}
