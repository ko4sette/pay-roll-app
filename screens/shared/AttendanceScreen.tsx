import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { User, Employee, Attendance } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";

const clock = () => new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false });
export function AttendanceScreen({ user, employees, attendance, setAttendance }: { user: User; employees: Employee[]; attendance: Attendance[]; setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>> }) {
  const isAdmin = user.role === "admin";
  const myEmployee = employees.find(e => e.id === user.employeeId);
  const list = isAdmin ? attendance : attendance.filter(a => a.employeeId === user.employeeId);
  const today = new Date().toISOString().slice(0, 10);
  const myToday = attendance.find(a => a.employeeId === user.employeeId && a.workDate === today);
  const doTimeIn = () => {
    if (myToday?.timeIn) { Alert.alert("Already recorded", "You already have a time-in record for today."); return; }
    setAttendance(old => [...old, { id: `a${Date.now()}`, employeeId: user.employeeId || "", workDate: today, timeIn: clock(), regularHours: 0, overtimeHours: 0, status: "Incomplete" }]);
    Alert.alert("Time in recorded", `Time in: ${clock()}`);
  };
  const doTimeOut = () => {
    const current = attendance.find(a => a.employeeId === user.employeeId && a.workDate === today);
    if (!current?.timeIn) { Alert.alert("Time in required", "Record your time in before timing out."); return; }
    if (current.timeOut) { Alert.alert("Already recorded", "Time out has already been recorded."); return; }
    const [ih, im] = current.timeIn.split(":").map(Number); const [oh, om] = clock().split(":").map(Number);
    const hours = Math.max(0, Math.round(((oh * 60 + om) - (ih * 60 + im)) / 60 * 100) / 100);
    setAttendance(old => old.map(a => a.id === current.id ? { ...a, timeOut: clock(), regularHours: Math.min(hours, 8), overtimeHours: Math.max(0, hours - 8), status: "Present" } : a));
    Alert.alert("Time out recorded", `Total hours: ${hours}`);
  };
  return <ScreenContainer title={isAdmin ? "Attendance" : "My Attendance"} subtitle={isAdmin ? "Review cafe team attendance." : "Record and review your work hours."}>
    {!isAdmin && <AppCard><Text style={styles.heading}>Today's attendance</Text><Text style={styles.meta}>{myEmployee?.position || "Staff"} · {today}</Text><View style={styles.buttons}><AppButton title="Time In" onPress={doTimeIn} /><AppButton title="Time Out" secondary onPress={doTimeOut} /></View><Text style={styles.note}>Time records are saved on this device in this prototype.</Text></AppCard>}
    {list.slice().reverse().map(a => {
      const employee = employees.find(e => e.id === a.employeeId);
      return <AppCard key={a.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.heading}>{isAdmin ? employee?.fullName || "Unknown employee" : a.workDate}</Text><Text style={styles.meta}>{isAdmin ? `${a.workDate} · ${employee?.position || ""}` : `Time in ${a.timeIn || "--"} · Time out ${a.timeOut || "--"}`}</Text>{isAdmin && <Text style={styles.meta}>In: {a.timeIn || "--"} · Out: {a.timeOut || "--"} · Hours: {a.regularHours}</Text>}</View><StatusBadge status={a.status} /></View></AppCard>;
    })}
    {list.length === 0 && <Text style={styles.meta}>No attendance records yet.</Text>}
  </ScreenContainer>;
}
const styles = StyleSheet.create({ heading: { color: COLORS.darkBrown, fontSize: 15, fontWeight: "800" }, meta: { color: COLORS.muted, fontSize: 12, marginTop: 5 }, note: { color: COLORS.muted, fontSize: 11, marginTop: 12 }, buttons: { flexDirection: "row", gap: 8, marginTop: 14 }, row: { flexDirection: "row", gap: 10, alignItems: "flex-start" } });
