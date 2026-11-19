import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./services/firebase";
import { loadFirebaseAppUser } from "./services/firebaseAuthService";
import { deleteEmployeeFromFirestore, loadEmployeesForUser, saveEmployeeToFirestore } from "./services/firestoreEmployeeService";
import { loadAttendanceForUser, saveAttendanceToFirestore } from "./services/firestoreAttendanceService";
import { createPayrollRecords, loadPayrollForUser, recordPayrollPayment, subscribeToPayrollForUser } from "./services/firestorePayrollService";
import { createEmployeeAccountOnFreePlan } from "./services/firebaseEmployeeProvisioningService";
import { COLORS } from "./constants/colors";
import { User, Employee, Attendance, PayrollRecord, CashoutRequest, PasswordAssistanceRequest } from "./types";
import { loadData, loadPaydayDate, saveData, loadStoreOpen, saveStoreOpen, loadReadNotificationIds, saveReadNotificationIds } from "./services/storageService";
import { getCashoutRequestError } from "./utils/cashoutUtils";
import { localDateString } from "./utils/dateUtils";
import { LoginScreen } from "./screens/auth/LoginScreen";
import { ForcePasswordChangeScreen } from "./screens/auth/ForcePasswordChangeScreen";
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
import { AppText as Text } from "./components/common/AppText";
import { BRAND_FONT, BRAND_NAME } from "./constants/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { EmployeeGuideTab, OnboardingTutorial } from "./components/common/OnboardingTutorial";
import { NotificationInbox } from "./components/common/NotificationInbox";
import { buildNotifications } from "./utils/notificationUtils";

type Tab = "Dashboard" | "Employees" | "Attendance" | "Payroll" | "Records" | "Payments" | "Notifications" | "Salary" | "Profile";

export default function App() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compactHeader = windowWidth < 430;
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
  const [tutorialTab, setTutorialTab] = useState<EmployeeGuideTab>("Dashboard");
  const [ready, setReady] = useState(false);
  const pendingCashoutEmployees = useRef(new Set<string>());
  const employeesRef = useRef<Employee[]>([]);
  const attendanceRef = useRef<Attendance[]>([]);
  const payrollRef = useRef<PayrollRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};
    (async () => {
      const data = await loadData();
      setPaydayDate(await loadPaydayDate());
      setStoreOpen(await loadStoreOpen());
      setReadNotificationIds(await loadReadNotificationIds());
      employeesRef.current = data.employees;
      attendanceRef.current = data.attendance;
      payrollRef.current = data.payroll;
      setEmployees(data.employees);
      setAttendance(data.attendance);
      setPayroll(data.payroll);
      setCashouts(data.cashouts);
      setPasswordAssistanceRequests(data.passwordAssistanceRequests);
      // Remove any old local-only session; Firebase Auth now owns sign-in persistence.
      await AsyncStorage.removeItem("cafe_current_user");
      unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
        try {
          const appUser = firebaseUser ? await loadFirebaseAppUser(firebaseUser.uid) : null;
          if (firebaseUser && !appUser) await signOut(auth);
          if (appUser && !appUser.mustChangePassword) {
            const cloudEmployees = await loadEmployeesForUser(appUser, employeesRef.current);
            const cloudAttendance = await loadAttendanceForUser(appUser, attendanceRef.current);
            const cloudPayroll = await loadPayrollForUser(appUser, payrollRef.current);
            if (mounted) {
              employeesRef.current = cloudEmployees;
              attendanceRef.current = cloudAttendance;
              setEmployees(cloudEmployees);
              setAttendance(cloudAttendance);
              setPayroll(cloudPayroll);
            }
          }
          if (mounted) setUser(appUser);
        } catch {
          if (firebaseUser) await signOut(auth).catch(() => undefined);
          if (mounted) setUser(null);
        } finally {
          if (mounted) setReady(true);
        }
      });
    })().catch(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    employeesRef.current = employees;
  }, [employees]);

  useEffect(() => {
    attendanceRef.current = attendance;
  }, [attendance]);

  useEffect(() => {
    payrollRef.current = payroll;
  }, [payroll]);

  useEffect(() => {
    if (!user || user.mustChangePassword) return;
    return subscribeToPayrollForUser(user, records => setPayroll(records), error => {
      console.warn("Payroll updates could not be received from Firestore.", error);
    });
  }, [user?.id, user?.role, user?.employeeId, user?.mustChangePassword]);

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
    // This cached copy is used only by the separate Records route; app startup
    // always validates the live Firebase Auth session and Firestore profile.
    await AsyncStorage.setItem("cafe_current_user", JSON.stringify(nextUser));
    if (nextUser.role === "staff" && !nextUser.mustChangePassword) {
      const tutorialKey = `cafe_employee_dashboard_tutorial_seen_${nextUser.employeeId ?? nextUser.id}`;
      if (await AsyncStorage.getItem(tutorialKey) !== "true") {
        setTutorialTab("Dashboard");
        setTutorialVisible(true);
      }
    }
  };

  const saveEmployee = async (employee: Employee): Promise<Employee> => {
    const savedEmployee = await saveEmployeeToFirestore(employee);
    return savedEmployee;
  };

  const deleteEmployee = async (employee: Employee): Promise<void> => {
    await deleteEmployeeFromFirestore(employee);
    setEmployees(old => old.filter(item => item.id !== employee.id));
    setAttendance(old => old.filter(item => item.employeeId !== employee.id));
    setPayroll(old => old.filter(item => item.employeeId !== employee.id));
    setCashouts(old => old.filter(item => item.employeeId !== employee.id));
    setPasswordAssistanceRequests(old => old.filter(item => item.employeeId !== employee.id));
  };

  const createEmployeeAccount = async (employee: Employee): Promise<{ employeeId: string; temporaryPassword: string; authEmail: string }> => {
    const account = await createEmployeeAccountOnFreePlan(employee);
    return { employeeId: account.employeeId, temporaryPassword: account.temporaryPassword, authEmail: account.authEmail };
  };

  const saveAttendance = async (record: Attendance): Promise<void> => {
    await saveAttendanceToFirestore(record);
  };

  const createPayroll = async (records: PayrollRecord[]): Promise<void> => {
    await createPayrollRecords(records);
    setPayroll(old => [
      ...old,
      ...records.filter(record => !old.some(item => item.id === record.id)),
    ]);
  };

  const savePayrollPayment = async (record: PayrollRecord): Promise<void> => {
    const paidRecord = await recordPayrollPayment(record);
    setPayroll(old => old.map(item => item.id === paidRecord.id ? paidRecord : item));
  };

  const finishEmployeePasswordChange = async () => {
    if (!user || user.role !== "staff") return;
    const cloudEmployees = await loadEmployeesForUser({ ...user, mustChangePassword: false }, employeesRef.current);
    const cloudAttendance = await loadAttendanceForUser({ ...user, mustChangePassword: false }, attendanceRef.current);
    const cloudPayroll = await loadPayrollForUser({ ...user, mustChangePassword: false }, payroll);
    employeesRef.current = cloudEmployees;
    attendanceRef.current = cloudAttendance;
    setEmployees(cloudEmployees);
    setAttendance(cloudAttendance);
    setPayroll(cloudPayroll);
    setUser(current => current ? { ...current, mustChangePassword: false } : current);
    const tutorialKey = `cafe_employee_dashboard_tutorial_seen_${user.employeeId ?? user.id}`;
    if (await AsyncStorage.getItem(tutorialKey) !== "true") {
      setTutorialTab("Dashboard");
      setTutorialVisible(true);
    }
  };

  const logout = async () => {
    setUser(null);
    setTab("Dashboard");
    await signOut(auth);
  };
  const dismissTutorial = async () => {
    setTutorialVisible(false);
    setTutorialTab("Dashboard");
    setTab("Dashboard");
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
  if (user.role === "staff" && user.mustChangePassword) return <ForcePasswordChangeScreen onComplete={finishEmployeePasswordChange} />;

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
          employees={employees}
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
      onSaveEmployee={saveEmployee}
      onDeleteEmployee={deleteEmployee}
      onCreateEmployeeAccount={createEmployeeAccount}
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
    if (tab === "Attendance") return <AttendanceScreen user={user} employees={employees} attendance={attendance} setAttendance={setAttendance} onSaveAttendance={saveAttendance} storeOpen={storeOpen} />;
    if (tab === "Payroll" && user.role === "admin") return <PayrollScreen employees={employees} attendance={attendance} payroll={payroll} onCreatePayroll={createPayroll} cashouts={cashouts} setCashouts={setCashouts} />;
    if (tab === "Payments" && user.role === "finance") return <FinanceScreen employees={employees} payroll={payroll} onRecordPayment={savePayrollPayment} />;
    if (tab === "Salary" && user.role === "staff") return <SalaryScreen user={user} employee={employees.find(employee => employee.id === user.employeeId)} attendance={attendance} payroll={payroll} />;
    if (tab === "Profile" && user.role === "staff") return <ProfileScreen user={user} employee={employees.find(employee => employee.id === user.employeeId)} />;
    return user.role === "admin"
      ? <AdminDashboard
        attendance={attendance}
        employees={employees}
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
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <StatusBar style="light" />
      <View style={[styles.topbar, compactHeader && styles.topbarCompact]}>
        <View style={styles.brandBlock}><Text style={[styles.brand, compactHeader && styles.brandCompact]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{BRAND_NAME}</Text><Text style={styles.role}>{user.role === "admin" ? "ADMIN" : user.role === "finance" ? "FINANCE" : "EMPLOYEE"}</Text></View>
        <View style={styles.headerActions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open updates, ${unreadCount} unread`} onPress={() => setNotificationsVisible(true)} style={[styles.notificationButton, compactHeader && styles.notificationButtonCompact]}><MaterialCommunityIcons name="bell-outline" size={21} color={COLORS.white} />{unreadCount > 0 ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text></View> : null}</TouchableOpacity>
          {user.role === "staff" ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Replay employee dashboard guide" onPress={() => { setTutorialTab("Dashboard"); setTutorialVisible(true); }} style={styles.helpButton}><MaterialCommunityIcons name="help-circle-outline" size={19} color={COLORS.white} /><Text style={styles.helpText}>Help</Text></TouchableOpacity> : null}
        </View>
        <TouchableOpacity onPress={logout} style={[styles.logout, compactHeader && styles.logoutCompact]}><Text style={[styles.logoutText, compactHeader && styles.logoutTextCompact]}>Log out</Text></TouchableOpacity>
      </View>
      <View key={`${user.id}-${tab}`} style={styles.content}>{screen()}</View>
      <View style={[styles.tabbar, { paddingBottom: Math.max(2, insets.bottom) }]}>
        <View pointerEvents="none" style={styles.coffeeTrim}>
          {Array.from({ length: Math.max(7, Math.ceil(windowWidth / 38)) }, (_, index) => (
            <View key={index} style={styles.trimCupSlot}>
              <Image source={require("./assets/coffee-cup-border.png")} resizeMode="contain" style={styles.trimCup} />
            </View>
          ))}
        </View>
        <View style={styles.tabsRow}>
        {tabs.map((item) => (
          <TouchableOpacity key={item} accessibilityRole="button" accessibilityLabel={item} onPress={() => {
            setTab(item);
            if (tutorialVisible && user.role === "staff" && (item === "Dashboard" || item === "Attendance" || item === "Salary" || item === "Profile")) setTutorialTab(item);
          }} style={[styles.tab, windowWidth < 430 && styles.compactTab, insets.bottom > 0 && styles.tabLowerOnSafeArea, tab === item && styles.activeTab, tutorialVisible && tutorialTab === item && styles.tourTab]}>
            <MaterialCommunityIcons name={tabIcon(item)} size={17} color={tab === item ? COLORS.darkBrown : COLORS.muted} />
          {item === "Notifications" && pendingRequestCount > 0 ? <View style={styles.requestCount}><Text style={styles.requestCountText}>{pendingRequestCount > 9 ? "9+" : pendingRequestCount}</Text></View> : null}
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[styles.tabText, tab === item && styles.activeTabText]}>{tabLabel(item)}</Text>
          </TouchableOpacity>
        ))}
        </View>
      </View>
      <OnboardingTutorial
        visible={tutorialVisible}
        currentTab={tutorialTab}
        onNavigate={nextTab => { setTutorialTab(nextTab); setTab(nextTab); }}
        onDismiss={dismissTutorial}
      />
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
  safe: { flex: 1, backgroundColor: COLORS.darkBrown },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cream },
  loadingText: { marginTop: 12, color: COLORS.brown },
  topbar: { backgroundColor: COLORS.darkBrown, paddingHorizontal: 18, paddingVertical: 20, minHeight: 104, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: COLORS.brown },
  topbarCompact: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 72 },
  brandBlock: { gap: 3, flexShrink: 1 },
  brand: { color: COLORS.white, fontSize: 28, lineHeight: 34, fontWeight: "800", fontFamily: BRAND_FONT },
  brandCompact: { fontSize: 24, lineHeight: 30 },
  role: { color: "#D7C8B7", fontSize: 12, lineHeight: 16, letterSpacing: 1.5, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 5, marginLeft: "auto" },
  logout: { backgroundColor: COLORS.mediumBrown, paddingHorizontal: 15, minHeight: 44, justifyContent: "center", borderRadius: 10, marginLeft: 12 },
  logoutCompact: { paddingHorizontal: 10, minHeight: 40, marginLeft: 7 },
  logoutText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  logoutTextCompact: { fontSize: 13 },
  notificationButton: { position: "relative", minWidth: 38, height: 42, alignItems: "center", justifyContent: "center" },
  notificationButtonCompact: { minWidth: 32 },
  unreadBadge: { position: "absolute", top: 1, right: 1, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: COLORS.error, alignItems: "center", justifyContent: "center" },
  unreadBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  helpButton: { minHeight: 42, paddingHorizontal: 7, alignItems: "center", justifyContent: "center" },
  helpText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },
  content: { flex: 1 },
  tabbar: { width: "100%", maxWidth: 960, alignSelf: "center", flexDirection: "column", backgroundColor: "#D8C9B6", borderTopWidth: 1, borderTopColor: COLORS.beige, paddingTop: 0 },
  tabsRow: { width: "100%", flexDirection: "row", paddingHorizontal: 7, paddingTop: 2 },
  coffeeTrim: { width: "100%", height: 24, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-around", paddingHorizontal: 3 },
  trimCupSlot: { flex: 1, height: 24, alignItems: "center" },
  trimCup: { width: 20, height: 24, transform: [{ translateY: -4 }] },
  tab: { flex: 1, minWidth: 0, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 1, borderRadius: 9, gap: 1 },
  compactTab: { minHeight: 42 },
  tabLowerOnSafeArea: { transform: [{ translateY: 6 }] },
  requestCount: { position: "absolute", top: 2, right: "22%", minWidth: 15, height: 15, borderRadius: 8, paddingHorizontal: 3, backgroundColor: COLORS.error, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D8C9B6" },
  requestCountText: { color: COLORS.white, fontSize: 9, lineHeight: 12, fontWeight: "900" },
  activeTab: { backgroundColor: "#BFA98E" },
  tourTab: { backgroundColor: "#F3D7A9", borderWidth: 2, borderColor: COLORS.darkBrown, transform: [{ scale: 1.04 }] },
  tabText: { color: COLORS.muted, textAlign: "center", fontSize: 9, lineHeight: 12, flexShrink: 1 },
  activeTabText: { color: COLORS.darkBrown, fontWeight: "800" }
});
