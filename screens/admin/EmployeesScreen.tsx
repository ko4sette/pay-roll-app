import React, { useState } from "react";
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { Employee } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { Field } from "../../components/common/Field";
import { AppButton } from "../../components/common/AppButton";
import { StatusBadge } from "../../components/common/StatusBadge";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";
import { issueTemporaryPassword } from "../../services/authService";
import { generateEmployeeNumber } from "../../services/storageService";
import { Position, POSITIONS, POSITION_DESCRIPTIONS, POSITION_RATES } from "../../constants/positions";
import { localDateString } from "../../utils/dateUtils";

export function EmployeesScreen({ employees, setEmployees }: { employees: Employee[]; setEmployees: React.Dispatch<React.SetStateAction<Employee[]>> }) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState(""); const [position, setPosition] = useState<Position>("Barista");
  const [email, setEmail] = useState(""); const [positionPickerVisible, setPositionPickerVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const hourlyRate = POSITION_RATES[position];
  const filtered = employees.filter(e => `${e.fullName} ${e.employeeNumber} ${e.position}`.toLowerCase().includes(search.toLowerCase()));
  const add = async () => {
    if (creating) return;
    if (!name.trim() || !email.trim() || employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      Alert.alert("Check details", "Enter a name and a unique email address."); return;
    }
    setCreating(true);
    try {
      const employeeNumber = await generateEmployeeNumber();
      const employee: Employee = { id: employeeNumber, employeeNumber, fullName: name.trim(), email: email.trim(), contactNumber: "", position, employmentType: "Full-time", salaryType: "Hourly", salaryAmount: hourlyRate, dateHired: localDateString(), employmentStatus: "Active" };
      const temporaryPassword = await issueTemporaryPassword(employee.id, employee.employeeNumber);
      setEmployees(old => [...old, employee]); setName(""); setEmail(""); setPosition("Barista"); setAdding(false);
      Alert.alert("Employee added", `Share this temporary sign-in with ${employee.fullName}:\n\nEmployee ID: ${employee.employeeNumber}\nTemporary password: ${temporaryPassword}\n\nThey must set a new password when they first sign in.`);
    } catch (error) {
      Alert.alert("Unable to add employee", error instanceof Error ? error.message : "The temporary password could not be saved.");
    } finally {
      setCreating(false);
    }
  };
  const resetPassword = async (employee: Employee) => {
    try {
      const temporaryPassword = await issueTemporaryPassword(employee.id, employee.employeeNumber);
      Alert.alert("Temporary password created", `Share this sign-in with ${employee.fullName}:\n\nEmployee ID: ${employee.employeeNumber}\nTemporary password: ${temporaryPassword}\n\nThey must set a new password at their next sign-in.`);
    } catch (error) {
      Alert.alert("Unable to reset password", error instanceof Error ? error.message : "The temporary password could not be saved.");
    }
  };
  return <ScreenContainer title="Employees" subtitle={`${employees.length} employee records`}>
    <Field label="SEARCH EMPLOYEES" value={search} onChangeText={setSearch} placeholder="Search name, ID, position" />
    <AppButton title={adding ? "Cancel adding" : "+ Add employee"} onPress={() => setAdding(!adding)} disabled={creating} />
    {adding && <AppCard><Text style={styles.heading}>New employee</Text><View style={styles.form}><Field label="FULL NAME" value={name} onChangeText={setName} placeholder="Employee name" /><Field label="EMAIL" value={email} onChangeText={setEmail} placeholder="employee@cafe.com" autoCapitalize="none" /><Text style={styles.label}>POSITION</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Position: ${position}`} onPress={() => setPositionPickerVisible(true)} style={styles.picker}><Text style={styles.pickerText}>{position}</Text><Text style={styles.pickerArrow}>⌄</Text></TouchableOpacity><View style={styles.rate}><Text style={styles.rateLabel}>HOURLY RATE</Text><Text style={styles.rateValue}>{peso(hourlyRate)} / hour</Text></View><AppButton title={creating ? "Creating employee..." : "Save employee"} onPress={add} disabled={creating} /></View></AppCard>}
    <Modal visible={positionPickerVisible} transparent animationType="fade" onRequestClose={() => setPositionPickerVisible(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Select position</Text>
          {POSITIONS.map(option => <TouchableOpacity key={option} accessibilityRole="button" onPress={() => { setPosition(option); setPositionPickerVisible(false); }} style={styles.option}><View style={styles.optionInfo}><Text style={styles.optionText}>{option}</Text><Text style={styles.optionDescription}>{POSITION_DESCRIPTIONS[option]}</Text></View><Text style={styles.optionRate}>{peso(POSITION_RATES[option])} / hour</Text></TouchableOpacity>)}
          <AppButton title="Cancel" secondary onPress={() => setPositionPickerVisible(false)} />
        </View>
      </View>
    </Modal>
    {filtered.map(e => <AppCard key={e.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{e.fullName}</Text><Text style={styles.meta}>{e.employeeNumber} · {e.position}</Text><Text style={styles.pay}>{e.salaryType === "Hourly" ? `${peso(e.salaryAmount)}/hour` : `${peso(e.salaryAmount)}/month`}</Text></View><StatusBadge status={e.employmentStatus} /></View><Text style={styles.meta}>{e.email}</Text><AppButton title={e.employmentStatus === "Active" ? "Deactivate" : "Reactivate"} secondary onPress={() => Alert.alert("Confirm", `${e.employmentStatus === "Active" ? "Deactivate" : "Reactivate"} ${e.fullName}?`, [{ text: "Cancel" }, { text: "Confirm", onPress: () => setEmployees(old => old.map(x => x.id === e.id ? { ...x, employmentStatus: x.employmentStatus === "Active" ? "Inactive" : "Active" } : x)) }])} /><AppButton title="Issue temporary password" secondary onPress={() => resetPassword(e)} /></AppCard>)}
    {filtered.length === 0 && <Text style={styles.meta}>No employees found.</Text>}
  </ScreenContainer>;
}
const styles = StyleSheet.create({ heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 17 }, form: { gap: 12, marginTop: 12 }, label: { color: COLORS.darkBrown, fontSize: 12, fontWeight: "700", marginBottom: -6 }, picker: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, pickerText: { color: COLORS.text }, pickerArrow: { color: COLORS.muted, fontSize: 18 }, rate: { backgroundColor: COLORS.cream, padding: 12, borderRadius: 11, gap: 4 }, rateLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" }, rateValue: { color: COLORS.darkBrown, fontWeight: "800" }, modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }, modal: { backgroundColor: COLORS.background, borderRadius: 18, padding: 18, gap: 8 }, modalTitle: { color: COLORS.darkBrown, fontSize: 18, fontWeight: "800", marginBottom: 4 }, option: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, backgroundColor: COLORS.cream, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, optionInfo: { flex: 1 }, optionText: { color: COLORS.darkBrown, fontWeight: "700" }, optionDescription: { color: COLORS.muted, fontSize: 11, marginTop: 3 }, optionRate: { color: COLORS.brown, fontSize: 12, fontWeight: "700" }, row: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, name: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "800" }, meta: { color: COLORS.muted, fontSize: 12, marginTop: 5 }, pay: { color: COLORS.brown, fontWeight: "800", marginTop: 7 } });
