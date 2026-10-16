import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "./constants/colors";
import { User, Employee, Attendance, PayrollRecord } from "./types";
import { DEMO_EMPLOYEES, DEMO_ATTENDANCE, DEMO_PAYROLL } from "./constants/demoData";
import { loadData, saveData } from "./services/storageService";
import { LoginScreen } from "./screens/auth/LoginScreen";
import { AdminDashboard } from "./screens/admin/DashboardScreen";
import { EmployeesScreen } from "./screens/admin/EmployeesScreen";
import { AttendanceScreen } from "./screens/shared/AttendanceScreen";
import { PayrollScreen } from "./screens/admin/PayrollScreen";
import { PayslipsScreen } from "./screens/shared/PayslipsScreen";
import { ReportsScreen } from "./screens/admin/ReportsScreen";
import { StaffDashboard } from "./screens/staff/DashboardScreen";
import { SalaryScreen } from "./screens/staff/SalaryScreen";
import { ProfileScreen } from "./screens/staff/ProfileScreen";

type Tab = "Dashboard" | "Employees" | "Attendance" | "Payroll" | "Payslips" | "Reports" | "Salary" | "Profile";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await loadData();
      setEmployees(data.employees);
      setAttendance(data.attendance);
      setPayroll(data.payroll);
      const savedUser = await AsyncStorage.getItem("cafe_current_user");
      if (savedUser) setUser(JSON.parse(savedUser));
      setReady(true);
    })().catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) saveData({ employees, attendance, payroll }).catch(() => {});
  }, [employees, attendance, payroll, ready]);

  const login = async (nextUser: User) => {
    setUser(nextUser);
    setTab("Dashboard");
    await AsyncStorage.setItem("cafe_current_user", JSON.stringify(nextUser));
  };

  const logout = async () => {
    setUser(null);
    setTab("Dashboard");
    await AsyncStorage.removeItem("cafe_current_user");
  };

  if (!ready) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.brown} /><Text style={styles.loadingText}>Preparing your cafe...</Text></View>;
  if (!user) return <LoginScreen onLogin={login} />;

  const adminTabs: Tab[] = ["Dashboard", "Employees", "Attendance", "Payroll", "Payslips", "Reports"];
  const staffTabs: Tab[] = ["Dashboard", "Attendance", "Salary", "Payslips", "Profile"];
  const tabs = user.role === "admin" ? adminTabs : staffTabs;

  const screen = () => {
    if (tab === "Dashboard") {
      return user.role === "admin"
        ? <AdminDashboard employees={employees} attendance={attendance} payroll={payroll} onNavigate={setTab} />
        : <StaffDashboard user={user} attendance={attendance} payroll={payroll} onNavigate={setTab} />;
    }
    if (tab === "Employees" && user.role === "admin") return <EmployeesScreen employees={employees} setEmployees={setEmployees} />;
    if (tab === "Attendance") return <AttendanceScreen user={user} employees={employees} attendance={attendance} setAttendance={setAttendance} />;
    if (tab === "Payroll" && user.role === "admin") return <PayrollScreen employees={employees} attendance={attendance} payroll={payroll} setPayroll={setPayroll} />;
    if (tab === "Payslips") return <PayslipsScreen user={user} employees={employees} payroll={payroll} />;
    if (tab === "Reports" && user.role === "admin") return <ReportsScreen employees={employees} attendance={attendance} payroll={payroll} />;
    if (tab === "Salary" && user.role === "staff") return <SalaryScreen user={user} payroll={payroll} />;
    if (tab === "Profile" && user.role === "staff") return <ProfileScreen user={user} onLogout={logout} />;
    return <AdminDashboard employees={employees} attendance={attendance} payroll={payroll} onNavigate={setTab} />;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <View style={styles.topbar}>
        <View><Text style={styles.brand}>☕ Cafe Payroll</Text><Text style={styles.role}>{user.role === "admin" ? "ADMIN WORKSPACE" : "STAFF WORKSPACE"}</Text></View>
        <TouchableOpacity onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>
      </View>
      <View style={styles.content}>{screen()}</View>
      <View style={styles.tabbar}>
        {tabs.map((item) => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{tabIcon(item)}{"\n"}{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function tabIcon(tab: string) {
  const icons: Record<string, string> = { Dashboard: "⌂", Employees: "♙", Attendance: "◷", Payroll: "₱", Payslips: "▤", Reports: "▥", Salary: "₱", Profile: "☺" };
  return icons[tab] || "•";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cream },
  loadingText: { marginTop: 12, color: COLORS.brown },
  topbar: { backgroundColor: COLORS.cream, paddingHorizontal: 18, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: COLORS.beige },
  brand: { color: COLORS.darkBrown, fontSize: 19, fontWeight: "800" },
  role: { color: COLORS.muted, fontSize: 10, letterSpacing: 1.2, marginTop: 3 },
  logout: { backgroundColor: COLORS.beige, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  logoutText: { color: COLORS.darkBrown, fontWeight: "700", fontSize: 12 },
  content: { flex: 1 },
  tabbar: { flexDirection: "row", backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.beige, paddingBottom: 4, paddingTop: 5 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 5, borderRadius: 10 },
  activeTab: { backgroundColor: COLORS.cream },
  tabText: { color: COLORS.muted, textAlign: "center", fontSize: 10, lineHeight: 15 },
  activeTabText: { color: COLORS.brown, fontWeight: "800" }
});
