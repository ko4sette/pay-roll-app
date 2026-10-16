import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Employee } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { Field } from "../../components/common/Field";
import { AppButton } from "../../components/common/AppButton";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";

export function EmployeesScreen({ employees, setEmployees }: { employees: Employee[]; setEmployees: React.Dispatch<React.SetStateAction<Employee[]>> }) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState(""); const [position, setPosition] = useState("Barista");
  const [email, setEmail] = useState(""); const [rate, setRate] = useState("75");
  const filtered = employees.filter(e => `${e.fullName} ${e.employeeNumber} ${e.position}`.toLowerCase().includes(search.toLowerCase()));
  const add = () => {
    if (!name.trim() || !email.trim() || !Number(rate) || employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      Alert.alert("Check details", "Enter a name, a unique email, and a valid salary or hourly rate."); return;
    }
    const employee: Employee = { id: `e${Date.now()}`, employeeNumber: `CAF-${String(employees.length + 1).padStart(3, "0")}`, fullName: name.trim(), email: email.trim(), contactNumber: "", position, employmentType: "Full-time", salaryType: "Hourly", salaryAmount: Number(rate), dateHired: new Date().toISOString().slice(0, 10), employmentStatus: "Active" };
    setEmployees(old => [...old, employee]); setName(""); setEmail(""); setRate("75"); setAdding(false);
  };
  return <ScreenContainer title="Employees" subtitle={`${employees.length} employee records`}>
    <Field label="SEARCH EMPLOYEES" value={search} onChangeText={setSearch} placeholder="Search name, ID, position" />
    <AppButton title={adding ? "Cancel adding" : "+ Add employee"} onPress={() => setAdding(!adding)} />
    {adding && <AppCard><Text style={styles.heading}>New employee</Text><View style={styles.form}><Field label="FULL NAME" value={name} onChangeText={setName} placeholder="Employee name" /><Field label="EMAIL" value={email} onChangeText={setEmail} placeholder="employee@cafe.com" autoCapitalize="none" /><Field label="POSITION" value={position} onChangeText={setPosition} placeholder="Barista / Cashier / Kitchen Staff" /><Field label="HOURLY RATE (₱)" value={rate} onChangeText={setRate} keyboardType="decimal-pad" /><AppButton title="Save employee" onPress={add} /></View></AppCard>}
    {filtered.map(e => <AppCard key={e.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{e.fullName}</Text><Text style={styles.meta}>{e.employeeNumber} · {e.position}</Text><Text style={styles.pay}>{e.salaryType === "Hourly" ? `${peso(e.salaryAmount)}/hour` : `${peso(e.salaryAmount)}/month`}</Text></View><StatusBadge status={e.employmentStatus} /></View><Text style={styles.meta}>{e.email}</Text><AppButton title={e.employmentStatus === "Active" ? "Deactivate" : "Reactivate"} secondary onPress={() => Alert.alert("Confirm", `${e.employmentStatus === "Active" ? "Deactivate" : "Reactivate"} ${e.fullName}?`, [{ text: "Cancel" }, { text: "Confirm", onPress: () => setEmployees(old => old.map(x => x.id === e.id ? { ...x, employmentStatus: x.employmentStatus === "Active" ? "Inactive" : "Active" } : x)) }])} /></AppCard>)}
    {filtered.length === 0 && <Text style={styles.meta}>No employees found.</Text>}
  </ScreenContainer>;
}
const styles = StyleSheet.create({ heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 17 }, form: { gap: 12, marginTop: 12 }, row: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, name: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "800" }, meta: { color: COLORS.muted, fontSize: 12, marginTop: 5 }, pay: { color: COLORS.brown, fontWeight: "800", marginTop: 7 } });
