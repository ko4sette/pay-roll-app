import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "./constants/colors";
import { User, Employee, Attendance, PayrollRecord } from "./types";
import { loadData, saveData } from "./services/storageService";
import { LoginScreen } from "./screens/auth/LoginScreen";
import { AdminDashboard } from "./screens/admin/DashboardScreen";
import { EmployeesScreen } from "./screens/admin/EmployeesScreen";
import { AttendanceScreen } from "./screens/shared/AttendanceScreen";
import { PayrollScreen } from "./screens/admin/PayrollScreen";
import { StaffDashboard } from "./screens/staff/DashboardScreen";
import { SalaryScreen } from "./screens/staff/SalaryScreen";
import { ProfileScreen } from "./screens/staff/ProfileScreen";
import { employeeNeedsPasswordChange } from "./services/authService";
import { AppText as Text } from "./components/common/AppText";
import { BRAND_FONT } from "./constants/typography";

type Tab = "Dashboard" | "Employees" | "Attendance" | "Payroll" | "Salary" | "Profile";

export default function App() {
  const router = useRouter();
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
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser) as User;
        const activeEmployee = data.employees.some(
          employee => employee.id === parsedUser.employeeId && employee.employmentStatus === "Active",
        );
        const needsPasswordChange = parsedUser.role === "staff"
          ? await employeeNeedsPasswordChange(parsedUser.employeeId ?? "")
          : false;
        if (parsedUser.role === "admin" || (parsedUser.role === "staff" && activeEmployee && !needsPasswordChange)) {
          setUser(parsedUser);
        } else {
          await AsyncStorage.removeItem("cafe_current_user");
        }
      }
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
  const openRecords = () => router.push("/home");

  if (!ready) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.brown} /><Text style={styles.loadingText}>Preparing your cafe...</Text></View>;
  if (!user) return <LoginScreen employees={employees} onLogin={login} />;

  const adminTabs: Tab[] = ["Dashboard", "Employees", "Attendance", "Payroll"];
  const staffTabs: Tab[] = ["Dashboard", "Attendance", "Salary", "Profile"];
  const tabs = user.role === "admin" ? adminTabs : staffTabs;

  const screen = () => {
    if (tab === "Dashboard") {
      return user.role === "admin"
        ? <AdminDashboard employees={employees} attendance={attendance} payroll={payroll} onNavigate={setTab} onBrowseRecords={openRecords} />
        : <StaffDashboard user={user} attendance={attendance} payroll={payroll} onNavigate={setTab} onBrowseRecords={openRecords} />;
    }
    if (tab === "Employees" && user.role === "admin") return <EmployeesScreen employees={employees} setEmployees={setEmployees} />;
    if (tab === "Attendance") return <AttendanceScreen user={user} employees={employees} attendance={attendance} setAttendance={setAttendance} />;
    if (tab === "Payroll" && user.role === "admin") return <PayrollScreen employees={employees} attendance={attendance} payroll={payroll} setPayroll={setPayroll} />;
    if (tab === "Salary" && user.role === "staff") return <SalaryScreen user={user} payroll={payroll} />;
    if (tab === "Profile" && user.role === "staff") return <ProfileScreen user={user} onLogout={logout} />;
    return user.role === "admin"
      ? <AdminDashboard employees={employees} attendance={attendance} payroll={payroll} onNavigate={setTab} onBrowseRecords={openRecords} />
      : <StaffDashboard user={user} attendance={attendance} payroll={payroll} onNavigate={setTab} onBrowseRecords={openRecords} />;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      <View style={styles.topbar}>
        <View style={styles.brandBlock}><MaterialCommunityIcons name="coffee-outline" size={20} color={COLORS.darkBrown} /><View><Text style={styles.brand}>PayMee! Cafe</Text><Text style={styles.role}>{user.role === "admin" ? "ADMIN WORKSPACE" : "STAFF WORKSPACE"}</Text></View></View>
        <TouchableOpacity onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>
      </View>
      <View style={styles.content}>{screen()}</View>
      <View style={styles.tabbar}>
        {tabs.map((item) => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
            <MaterialCommunityIcons name={tabIcon(item)} size={19} color={tab === item ? COLORS.brown : COLORS.muted} />
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function tabIcon(tab: Tab): React.ComponentProps<typeof MaterialCommunityIcons>["name"] {
  const icons: Record<Tab, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
    Dashboard: "view-dashboard-outline",
    Employees: "account-group-outline",
    Attendance: "clock-outline",
    Payroll: "cash-multiple",
    Salary: "cash",
    Profile: "account-circle-outline",
  };
  return icons[tab] ?? "circle-outline";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cream },
  loadingText: { marginTop: 12, color: COLORS.brown },
  topbar: { backgroundColor: COLORS.cream, paddingHorizontal: 18, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: COLORS.beige },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 7 },
  brand: { color: COLORS.darkBrown, fontSize: 19, fontWeight: "800", fontFamily: BRAND_FONT },
  role: { color: COLORS.muted, fontSize: 10, letterSpacing: 1.2, marginTop: 3 },
  logout: { backgroundColor: COLORS.beige, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  logoutText: { color: COLORS.darkBrown, fontWeight: "700", fontSize: 12 },
  content: { flex: 1 },
  tabbar: { flexDirection: "row", backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.beige, paddingBottom: 4, paddingTop: 5 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 5, borderRadius: 10, gap: 2 },
  activeTab: { backgroundColor: COLORS.cream },
  tabText: { color: COLORS.muted, textAlign: "center", fontSize: 10, lineHeight: 15 },
  activeTabText: { color: COLORS.brown, fontWeight: "800" }
});
