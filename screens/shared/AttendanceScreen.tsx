import React, { useRef, useState } from "react";
import { Alert, Animated, StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { User, Employee, Attendance } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { formatDuration, formatTimeUpdated, formatUsDate } from "../../utils/dateUtils";
import { EmptyState } from "../../components/common/EmptyState";
import { localDateString } from "../../utils/dateUtils";

const clock = () => new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false });
export function AttendanceScreen({ user, employees, attendance, setAttendance, onSaveAttendance, storeOpen = true }: { user: User; employees: Employee[]; attendance: Attendance[]; setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>; onSaveAttendance: (record: Attendance) => Promise<void>; storeOpen?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const confirmationScale = useRef(new Animated.Value(0.92)).current;
  const showConfirmation = (message: string) => {
    setConfirmation(message);
    confirmationScale.setValue(0.92);
    Animated.spring(confirmationScale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 7 }).start();
  };
  const isAdmin = user.role === "admin";
  const myEmployee = employees.find(e => e.id === user.employeeId);
  const list = isAdmin ? attendance : attendance.filter(a => a.employeeId === user.employeeId);
  const today = localDateString();
  const myToday = attendance.find(a => a.employeeId === user.employeeId && a.workDate === today);
  const canClock = storeOpen;
  const doTimeIn = async () => {
    if (!storeOpen) { Alert.alert("Café is closed", "Employee clock-in is disabled while the café is closed."); return; }
    if (myToday?.timeIn) { Alert.alert("Already recorded", "You already have a time-in record for today."); return; }
    const timeIn = clock();
    const record: Attendance = { id: `a${Date.now()}`, employeeId: user.employeeId || "", workDate: today, timeIn, regularHours: 0, overtimeHours: 0, status: "Incomplete", updatedAt: new Date().toISOString() };
    setSaving(true);
    try {
      await onSaveAttendance(record);
      setAttendance(old => [...old, record]);
      showConfirmation(`You’re clocked in · ${timeIn}`);
    } catch {
      Alert.alert("Could not record time in", "Check your internet connection and try again. Your time was not saved to the shared attendance records.");
    } finally {
      setSaving(false);
    }
  };

  
  const doTimeOut = async () => {
    if (!storeOpen) { Alert.alert("Café is closed", "Employee clock-out is disabled while the café is closed."); return; }
    const current = attendance.find(a => a.employeeId === user.employeeId && a.workDate === today);
    if (!current?.timeIn) { Alert.alert("Time in required", "Record your time in before timing out."); return; }
    if (current.timeOut) { Alert.alert("Already recorded", "Time out has already been recorded."); return; }
    const timeOut = clock();
    const [ih, im] = current.timeIn.split(":").map(Number); const [oh, om] = timeOut.split(":").map(Number);
    const hours = Math.max(0, Math.round(((oh * 60 + om) - (ih * 60 + im)) / 60 * 100) / 100);
    const updatedRecord: Attendance = { ...current, timeOut, regularHours: Math.min(hours, 8), overtimeHours: Math.max(0, hours - 8), status: "Present", updatedAt: new Date().toISOString() };
    setSaving(true);
    try {
      await onSaveAttendance(updatedRecord);
      setAttendance(old => old.map(a => a.id === current.id ? updatedRecord : a));
      showConfirmation(`Shift complete · ${formatDuration(hours)}`);
    } catch {
      Alert.alert("Could not record time out", "Check your internet connection and try again. Your time was not saved to the shared attendance records.");
    } finally {
      setSaving(false);
    }
  };
  return <ScreenContainer title={isAdmin ? "Attendance" : "My Attendance"} subtitle={isAdmin ? "Review cafe team attendance." : "Record and review your work hours."}>
    {!isAdmin && <AppCard style={styles.clockCard}><Text style={styles.heading}>Today's attendance</Text><Text style={styles.meta}>{myEmployee?.position || "Staff"} · {today}</Text>{confirmation ? <Animated.View style={[styles.confirmation, { transform: [{ scale: confirmationScale }] }]}><Text style={styles.confirmText}>{confirmation}</Text></Animated.View> : null}<View style={styles.buttons}><AppButton title={saving ? "Saving..." : myToday?.timeIn ? "Clocked in" : "Clock in"} onPress={doTimeIn} disabled={saving || Boolean(myToday?.timeIn) || !canClock} style={{ flex: 1 }} /><AppButton title={saving ? "Saving..." : myToday?.timeOut ? "Clocked out" : "Clock out"} secondary onPress={doTimeOut} disabled={saving || !myToday?.timeIn || Boolean(myToday?.timeOut) || !canClock} style={{ flex: 1 }} /></View><Text style={styles.note}>{storeOpen ? "You can clock in and out while the café is open." : "The café is closed. Clock in and out are unavailable; your attendance is unchanged."}</Text></AppCard>}
    {list.slice().reverse().map(a => {
      const employee = employees.find(e => e.id === a.employeeId);
      const shiftLength = a.timeOut ? formatDuration(a.regularHours + a.overtimeHours) : "In progress";
      return <AppCard key={a.id} style={styles.recordCard}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.heading}>{isAdmin ? employee?.fullName || "Unknown employee" : formatUsDate(a.workDate)}</Text><Text style={styles.meta}>{isAdmin ? `${formatUsDate(a.workDate)} · ${employee?.position || ""}` : `Time in ${a.timeIn || "--"} · Time out ${a.timeOut || "--"}`}</Text>{isAdmin ? <><Text style={styles.meta}>In: {a.timeIn || "--"} · Out: {a.timeOut || "--"}</Text><Text style={styles.meta}>Shift length: {shiftLength}</Text></> : <Text style={styles.meta}>Shift length: {shiftLength}</Text>}<Text style={styles.updated}>Updated {a.updatedAt ? formatTimeUpdated(a.updatedAt) : formatUsDate(a.workDate)}</Text></View><StatusBadge status={a.status} /></View></AppCard>;
    })}
    {list.length === 0 && <EmptyState title="No shifts to show yet" message={isAdmin ? "Employee attendance will appear here after the team starts recording shifts." : "Your clock-in and clock-out history will appear here."} />}
  </ScreenContainer>;
}
const styles = StyleSheet.create({ heading: { color: COLORS.darkBrown, fontSize: 17, fontWeight: "800" }, meta: { color: COLORS.muted, fontSize: 14, marginTop: 5 }, note: { color: COLORS.muted, fontSize: 12, marginTop: 12 }, buttons: { flexDirection: "row", gap: 8, marginTop: 14 }, row: { flexDirection: "row", gap: 10, alignItems: "flex-start" }, clockCard: { backgroundColor: COLORS.cream, borderColor: COLORS.beige }, confirmation: { marginTop: 12, backgroundColor: "#DCE4D6", borderRadius: 10, padding: 12 }, confirmText: { color: COLORS.success, fontSize: 14, fontWeight: "800" }, recordCard: { backgroundColor: "#EDE1D0" }, updated: { color: COLORS.muted, fontSize: 12, marginTop: 6 } });
