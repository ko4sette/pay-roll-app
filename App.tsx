import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "./constants/colors";
import { User, Employee, Attendance, PayrollRecord, CashoutRequest, PasswordAssistanceRequest } from "./types";
import { loadData, loadPaydayDate, saveData, loadStoreOpen, saveStoreOpen, loadReadNotificationIds, saveReadNotificationIds } from "./services/storageService";
import { getCashoutRequestError } from "./utils/cashoutUtils";
import { localDateString } from "./utils/dateUtils";
import { LoginScreen } from "./screens/auth/LoginScreen";
import { AdminDashboard } from "./screens/admin/DashboardScreen";
import { EmployeesScreen } from "./screens/admin/EmployeesScreen";
import { NotificationsScreen } from "./screens/admin/NotificationsScreen";
import { AttendanceScreen } from "./screens/shared/AttendanceScreen";
import { PayrollScreen } from "./screens/admin/PayrollScreen";
import { FinanceDashboard, FinanceScreen } from "./screens/admin/FinanceScreen";
import { RecordsScreen } from "./screens/shared/RecordsScreen";
import { StaffDashboard } from "./screens/staff/DashboardScreen";
import { SalaryScreen } from "./screens/staff/SalaryScreen";
import { ProfileScreen } from "./screens/staff/ProfileScreen";
import { employeeNeedsPasswordChange } from "./services/authService";
import { AppText as Text } from "./components/common/AppText";
import { BRAND_FONT, BRAND_NAME } from "./constants/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { OnboardingTutorial } from "./components/common/OnboardingTutorial";
import { NotificationInbox } from "./components/common/NotificationInbox";
import { buildNotifications } from "./utils/notificationUtils";

type Tab = "Dashboard" | "Employees" | "Attendance" | "Payroll" | "Records" | "Payments" | "Notifications" | "Salary" | "Profile";

export default function App() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [cashouts, setCashouts] = useState<CashoutRequest[]>([]);
  const [passwordAssistanceRequests, setPasswordAssistanceRequests] = useState<PasswordAssistanceRequest[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [paydayDate, setPaydayDate] = useState<string | null>(null);
  const [requestToHandle, setRequestToHandle] = useState<PasswordAssistanceRequest | null>(null);
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const pendingCashoutEmployees = useRef(new Set<string>());

  useEffect(() => {
    (async () => {
      const data = await loadData();
      setPaydayDate(await loadPaydayDate());
      setStoreOpen(await loadStoreOpen());
      setReadNotificationIds(await loadReadNotificationIds());
      setEmployees(data.employees);
      setAttendance(data.attendance);
      setPayroll(data.payroll);
      setCashouts(data.cashouts);
      setPasswordAssistanceRequests(data.passwordAssistanceRequests);
      const savedUser = await AsyncStorage.getItem("cafe_current_user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser) as User;
        const activeEmployee = data.employees.some(
          employee => employee.id === parsedUser.employeeId && employee.employmentStatus === "Active",
        );
        const needsPasswordChange = parsedUser.role === "staff"
          ? await employeeNeedsPasswordChange(parsedUser.employeeId ?? "")
          : false;
        if (parsedUser.role === "admin" || parsedUser.role === "finance" || (parsedUser.role === "staff" && activeEmployee && !needsPasswordChange)) {
          setUser(parsedUser);
        } else {
          await AsyncStorage.removeItem("cafe_current_user");
        }
      }
      setReady(true);
    })().catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) {
      saveData({ employees, attendance, payroll, cashouts, passwordAssistanceRequests }).catch(() => {
        Alert.alert("Save failed", "Your changes could not be saved to this device.");
      });
    }
  }, [employees, attendance, payroll, cashouts, passwordAssistanceRequests, ready]);

  useEffect(() => {
    if (ready) saveReadNotificationIds(readNotificationIds).catch(() => Alert.alert("Save failed", "Notification read status could not be saved."));
  }, [readNotificationIds, ready]);

  useEffect(() => {
    pendingCashoutEmployees.current = new Set(
      cashouts.filter(request => request.status === "Pending").map(request => request.employeeId),
    );
  }, [cashouts]);

  const login = async (nextUser: User) => {
    setUser(nextUser);
    setTab("Dashboard");
    await AsyncStorage.setItem("cafe_current_user", JSON.stringify(nextUser));
    if (nextUser.role === "staff") {
      const tutorialKey = `cafe_employee_dashboard_tutorial_seen_${nextUser.employeeId ?? nextUser.id}`;
      if (await AsyncStorage.getItem(tutorialKey) !== "true") setTutorialVisible(true);
    }
  };

  const logout = async () => {
    setUser(null);
    setTab("Dashboard");
    await AsyncStorage.removeItem("cafe_current_user");
  };
  const dismissTutorial = async () => {
    setTutorialVisible(false);
    if (user?.role === "staff") {
      await AsyncStorage.setItem(`cafe_employee_dashboard_tutorial_seen_${user.employeeId ?? user.id}`, "true");
    }
  };
  const updateStoreOpen = async (open: boolean) => {
    setStoreOpen(open);
    await saveStoreOpen(open);
  };
  const openRecords = () => router.push("/home");
  const submitPasswordAssistanceRequest = async (employee: Employee) => {
    if (passwordAssistanceRequests.some(request =>
      request.employeeId === employee.id && request.status === "Pending",
    )) {
      return { ok: false, message: "There is already a pending request for this Employee ID." };
    }

    const submittedAt = new Date().toISOString();
    const request: PasswordAssistanceRequest = {
      id: `password-help-${employee.id}-${Date.now()}`,
      employeeId: employee.id,
      submittedAt,
      status: "Pending",
    };
    const updatedRequests = [...passwordAssistanceRequests, request];
    await saveData({
      employees,
      attendance,
      payroll,
      cashouts,
      passwordAssistanceRequests: updatedRequests,
    });
    setPasswordAssistanceRequests(updatedRequests);
    return { ok: true, message: "Your password assistance request was sent to the administrator." };
  };
  const fixPasswordRequest = (request: PasswordAssistanceRequest) => {
    if (user?.role !== "admin" || request.status !== "Pending") return;
    setRequestToHandle(request);
    setTab("Employees");
  };
  const resolvePasswordRequest = async (requestId: string) => {
    const updatedRequests = passwordAssistanceRequests.map(request =>
      request.id === requestId && request.status === "Pending"
        ? { ...request, status: "Resolved" as const, resolvedAt: new Date().toISOString() }
        : request,
    );
    await saveData({
      employees,
      attendance,
      payroll,
      cashouts,
      passwordAssistanceRequests: updatedRequests,
    });
    setPasswordAssistanceRequests(updatedRequests);
    setRequestToHandle(null);
  };
  const requestCashout = (requestedAmount: number): boolean => {
    if (user?.role !== "staff" || !user.employeeId) {
      Alert.alert("Cashout unavailable", "A signed-in staff account is required.");
      return false;
    }
    const employeeId = user.employeeId;
    if (pendingCashoutEmployees.current.has(employeeId)) {
      Alert.alert("Cannot request cashout", "You already have a pending cashout request.");
      return false;
    }
    const amount = Math.round(requestedAmount * 100) / 100;
    const error = getCashoutRequestError(employeeId, amount, payroll, cashouts);
    if (error) {
      Alert.alert("Cannot request cashout", error);
      return false;
    }
    pendingCashoutEmployees.current.add(employeeId);
    let sequence = 1;
    const timestamp = Date.now();
    let id = `c${timestamp}-${sequence}`;
    while (cashouts.some(request => request.id === id)) {
      sequence += 1;
      id = `c${timestamp}-${sequence}`;
    }
    setCashouts(old => [...old, {
      id,
      employeeId,
      amount,
      status: "Pending",
      requestedAt: localDateString(),
    }]);
    return true;
  };

  if (!ready) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.brown} /><Text style={styles.loadingText}>Preparing your cafe...</Text></View>;
  if (!user) return <LoginScreen employees={employees} onLogin={login} onPasswordAssistanceRequest={submitPasswordAssistanceRequest} />;

  const adminTabs: Tab[] = ["Dashboard", "Employees", "Attendance", "Payroll", "Records", "Notifications"];
  const financeTabs: Tab[] = ["Dashboard", "Payments"];
  const staffTabs: Tab[] = ["Dashboard", "Attendance", "Salary", "Profile"];
  const tabs = user.role === "admin" ? adminTabs : user.role === "finance" ? financeTabs : staffTabs;
  const notifications = buildNotifications({ role: user.role, employeeId: user.employeeId, attendance, payroll, passwordRequests: passwordAssistanceRequests, paydayDate });
  const unreadCount = notifications.filter(item => !readNotificationIds.includes(item.id)).length;
  const pendingRequestCount = passwordAssistanceRequests.filter(request => request.status === "Pending").length;
  const screen = () => {
    if (tab === "Dashboard") {
      return user.role === "admin"
        ? <AdminDashboard
          attendance={attendance}
          payroll={payroll}
          onNavigate={setTab}
          paydayDate={paydayDate}
          storeOpen={storeOpen}
          onToggleStore={() => updateStoreOpen(!storeOpen)}
        />
        : user.role === "finance"
          ? <FinanceDashboard payroll={payroll} onNavigate={setTab} paydayDate={paydayDate} />
          : <StaffDashboard user={user} attendance={attendance} payroll={payroll} paydayDate={paydayDate} onNavigate={setTab} onBrowseRecords={openRecords} />;
    }
    if (tab === "Employees" && user.role === "admin") return <EmployeesScreen
      employees={employees}
      setEmployees={setEmployees}
      requestedEmployeeId={requestToHandle?.employeeId}
      passwordRequestId={requestToHandle?.id}
      onPasswordAssistanceHandled={resolvePasswordRequest}
    />;
    if (tab === "Notifications" && user.role === "admin") return <NotificationsScreen
      requests={passwordAssistanceRequests}
      employees={employees}
      onFixRequest={fixPasswordRequest}
    />;
    if (tab === "Records" && user.role === "admin") return <RecordsScreen embedded />;
    if (tab === "Attendance") return <AttendanceScreen user={user} employees={employees} attendance={attendance} setAttendance={setAttendance} storeOpen={storeOpen} />;
    if (tab === "Payroll" && user.role === "admin") return <PayrollScreen employees={employees} attendance={attendance} payroll={payroll} setPayroll={setPayroll} cashouts={cashouts} setCashouts={setCashouts} />;
    if (tab === "Payments" && user.role === "finance") return <FinanceScreen employees={employees} payroll={payroll} setPayroll={setPayroll} />;
    if (tab === "Salary" && user.role === "staff") return <SalaryScreen user={user} employee={employees.find(employee => employee.id === user.employeeId)} attendance={attendance} payroll={payroll} />;
    if (tab === "Profile" && user.role === "staff") return <ProfileScreen user={user} employee={employees.find(employee => employee.id === user.employeeId)} />;
    return user.role === "admin"
      ? <AdminDashboard
        attendance={attendance}
        payroll={payroll}
        onNavigate={setTab}
        paydayDate={paydayDate}
        storeOpen={storeOpen}
        onToggleStore={() => updateStoreOpen(!storeOpen)}
      />
      : user.role === "finance"
        ? <FinanceDashboard payroll={payroll} onNavigate={setTab} paydayDate={paydayDate} />
        : <StaffDashboard user={user} attendance={attendance} payroll={payroll} paydayDate={paydayDate} onNavigate={setTab} onBrowseRecords={openRecords} />;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.topbar}>
        <View style={styles.brandBlock}><Text style={styles.brand}>{BRAND_NAME}</Text><Text style={styles.role}>{user.role === "admin" ? "ADMIN" : user.role === "finance" ? "FINANCE" : "EMPLOYEE"}</Text></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open updates, ${unreadCount} unread`} onPress={() => setNotificationsVisible(true)} style={styles.notificationButton}><MaterialCommunityIcons name="bell-outline" size={21} color={COLORS.white} />{unreadCount > 0 ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text></View> : null}</TouchableOpacity>
        {user.role === "staff" ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Replay employee dashboard guide" onPress={() => setTutorialVisible(true)} style={styles.helpButton}><MaterialCommunityIcons name="help-circle-outline" size={19} color={COLORS.white} /><Text style={styles.helpText}>Help</Text></TouchableOpacity> : null}
        <TouchableOpacity onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>
      </View>
      <View key={`${user.id}-${tab}`} style={styles.content}>{screen()}</View>
      <View style={styles.tabbar}>
        {tabs.map((item) => (
          <TouchableOpacity key={item} accessibilityRole="button" accessibilityLabel={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
            <MaterialCommunityIcons name={tabIcon(item)} size={17} color={tab === item ? COLORS.darkBrown : COLORS.muted} />
          {item === "Notifications" && pendingRequestCount > 0 ? <View style={styles.requestCount}><Text style={styles.requestCountText}>{pendingRequestCount > 9 ? "9+" : pendingRequestCount}</Text></View> : null}
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[styles.tabText, tab === item && styles.activeTabText]}>{tabLabel(item)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <OnboardingTutorial visible={tutorialVisible} onDismiss={dismissTutorial} />
      <NotificationInbox
        visible={notificationsVisible}
        notifications={notifications}
        readIds={readNotificationIds}
        onRead={id => setReadNotificationIds(old => old.includes(id) ? old : [...old, id])}
        onReadAll={() => setReadNotificationIds(old => [...new Set([...old, ...notifications.map(item => item.id)])])}
        onOpen={notification => { setReadNotificationIds(old => old.includes(notification.id) ? old : [...old, notification.id]); setNotificationsVisible(false); setTab(notification.route as Tab); }}
        onClose={() => setNotificationsVisible(false)}
      />
    </SafeAreaView>
  );
}

function tabLabel(tab: Tab): string {
  const labels: Partial<Record<Tab, string>> = { Dashboard: "Home", Notifications: "Requests", Salary: "Pay" };
  return labels[tab] ?? tab;
}

function tabIcon(tab: Tab): React.ComponentProps<typeof MaterialCommunityIcons>["name"] {
  const icons: Record<Tab, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
    Dashboard: "view-dashboard-outline", Employees: "account-group-outline", Attendance: "clock-outline",
    Payroll: "file-document-outline", Records: "folder-multiple-outline", Payments: "cash-multiple", Notifications: "bell-outline",
    Salary: "wallet-outline", Profile: "account-outline",
  };
  return icons[tab];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cream },
  loadingText: { marginTop: 12, color: COLORS.brown },
  topbar: { backgroundColor: COLORS.darkBrown, paddingHorizontal: 18, paddingVertical: 20, minHeight: 104, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: COLORS.brown },
  brandBlock: { gap: 3, flexShrink: 1 },
  brand: { color: COLORS.white, fontSize: 28, lineHeight: 34, fontWeight: "800", fontFamily: BRAND_FONT },
  role: { color: "#D7C8B7", fontSize: 12, lineHeight: 16, letterSpacing: 1.5, fontWeight: "700" },
  logout: { backgroundColor: COLORS.mediumBrown, paddingHorizontal: 15, minHeight: 44, justifyContent: "center", borderRadius: 10, marginLeft: 12 },
  logoutText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  notificationButton: { position: "relative", minWidth: 38, height: 42, alignItems: "center", justifyContent: "center", marginLeft: "auto" },
  unreadBadge: { position: "absolute", top: 1, right: 1, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: COLORS.error, alignItems: "center", justifyContent: "center" },
  unreadBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  helpButton: { minHeight: 42, paddingHorizontal: 7, alignItems: "center", justifyContent: "center", marginLeft: "auto" },
  helpText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },
  content: { flex: 1 },
  tabbar: { flexDirection: "row", backgroundColor: "#D8C9B6", borderTopWidth: 1, borderTopColor: COLORS.beige, paddingHorizontal: 7, paddingVertical: 6 },
  tab: { flex: 1, minWidth: 0, minHeight: 50, alignItems: "center", justifyContent: "center", paddingHorizontal: 1, borderRadius: 9, gap: 1 },
  requestCount: { position: "absolute", top: 2, right: "22%", minWidth: 15, height: 15, borderRadius: 8, paddingHorizontal: 3, backgroundColor: COLORS.error, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D8C9B6" },
  requestCountText: { color: COLORS.white, fontSize: 9, lineHeight: 12, fontWeight: "900" },
  activeTab: { backgroundColor: "#BFA98E" },
  tabText: { color: COLORS.muted, textAlign: "center", fontSize: 9, lineHeight: 12, flexShrink: 1 },
  activeTabText: { color: COLORS.darkBrown, fontWeight: "800" }
});
