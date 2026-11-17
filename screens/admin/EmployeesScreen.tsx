import React, { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { AppText as Text } from "../../components/common/AppText";
import { Employee } from "../../types";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { Field } from "../../components/common/Field";
import { AppButton } from "../../components/common/AppButton";
import { StatusBadge } from "../../components/common/StatusBadge";
import { EmptyState } from "../../components/common/EmptyState";
import { COLORS } from "../../constants/colors";
import { peso } from "../../utils/currencyUtils";
import { issueTemporaryPassword } from "../../services/authService";
import { generateEmployeeNumber } from "../../services/storageService";
import { Position, POSITIONS, POSITION_DESCRIPTIONS, POSITION_RATES } from "../../constants/positions";
import { formatUsDate, isValidPhoneNumber, localDateString } from "../../utils/dateUtils";

interface EmployeesScreenProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  requestedEmployeeId?: string;
  passwordRequestId?: string;
  onPasswordAssistanceHandled?: (requestId: string) => Promise<void>;
}

export function EmployeesScreen({
  employees,
  setEmployees,
  requestedEmployeeId,
  passwordRequestId,
  onPasswordAssistanceHandled,
}: EmployeesScreenProps) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [position, setPosition] = useState<Position>("Barista");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneEditEmployeeId, setPhoneEditEmployeeId] = useState<string | null>(null);
  const [positionPickerVisible, setPositionPickerVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const hourlyRate = POSITION_RATES[position];
  const selectedEmployee = employees.find(employee => employee.id === selectedEmployeeId);
  const phoneEditEmployee = employees.find(employee => employee.id === phoneEditEmployeeId);
  const filtered = employees.filter(employee =>
    `${employee.fullName} ${employee.employeeNumber} ${employee.position}`.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (requestedEmployeeId && employees.some(employee => employee.id === requestedEmployeeId)) {
      setSelectedEmployeeId(requestedEmployeeId);
    }
  }, [employees, requestedEmployeeId]);

  const clearForm = () => {
    setName("");
    setEmail("");
    setPhoneNumber("");
    setPosition("Barista");
  };

  const cancelAdd = () => {
    if (creating) return;
    setAdding(false);
    setPositionPickerVisible(false);
    clearForm();
  };

  const add = async () => {
    if (creating) return;
    if (!name.trim() || !email.trim() || !phoneNumber.trim() || !isValidPhoneNumber(phoneNumber) || employees.some(employee => employee.email.toLowerCase() === email.trim().toLowerCase())) {
      Alert.alert("Check details", "Enter a name, a unique email address, and a valid phone number.");
      return;
    }

    setCreating(true);
    try {
      const employeeNumber = await generateEmployeeNumber();
      const employee: Employee = {
        id: employeeNumber,
        employeeNumber,
        fullName: name.trim(),
        email: email.trim(),
        contactNumber: phoneNumber.trim(),
        position,
        employmentType: "Full-time",
        salaryType: "Hourly",
        salaryAmount: hourlyRate,
        dateHired: localDateString(),
        employmentStatus: "Active",
      };
      const temporaryPassword = await issueTemporaryPassword(employee.id, employee.employeeNumber);
      setEmployees(old => [...old, employee]);
      setAdding(false);
      clearForm();
      Alert.alert(
        "Employee added",
        `${employee.fullName} was added successfully.\n\nEmployee ID: ${employee.employeeNumber}\nTemporary password: ${temporaryPassword}\n\nThey must set a new password when they first sign in.`,
      );
    } catch (error) {
      Alert.alert("Unable to add employee", error instanceof Error ? error.message : "The employee could not be saved.");
    } finally {
      setCreating(false);
    }
  };

  const savePhoneNumber = () => {
    if (!phoneEditEmployee || !isValidPhoneNumber(phoneNumber)) {
      Alert.alert("Check phone number", "Enter a valid phone number with 7 to 15 digits.");
      return;
    }
    setEmployees(old => old.map(employee => employee.id === phoneEditEmployee.id
      ? { ...employee, contactNumber: phoneNumber.trim() }
      : employee));
    setPhoneEditEmployeeId(null);
  };

  const resetPassword = async (employee: Employee) => {
    try {
      const temporaryPassword = await issueTemporaryPassword(employee.id, employee.employeeNumber);
      Alert.alert(
        "Temporary password created",
        `Share this sign-in with ${employee.fullName}:\n\nEmployee ID: ${employee.employeeNumber}\nTemporary password: ${temporaryPassword}\n\nThey must set a new password at their next sign-in.`,
      );
      if (
        passwordRequestId
        && requestedEmployeeId === employee.id
        && onPasswordAssistanceHandled
      ) {
        await onPasswordAssistanceHandled(passwordRequestId);
      }
    } catch (error) {
      Alert.alert("Unable to reset password", error instanceof Error ? error.message : "The temporary password could not be saved.");
    }
  };

  const toggleEmploymentStatus = (employee: Employee) => {
    const activating = employee.employmentStatus === "Inactive";
    Alert.alert(
      `Confirm ${activating ? "reactivation" : "deactivation"}`,
      `${activating ? "Reactivate" : "Deactivate"} ${employee.fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: activating ? "Reactivate" : "Deactivate",
          style: activating ? "default" : "destructive",
          onPress: () => setEmployees(old => old.map(item =>
            item.id === employee.id
              ? { ...item, employmentStatus: activating ? "Active" : "Inactive" }
              : item,
          )),
        },
      ],
    );
  };

  return <ScreenContainer title="Employees" subtitle={`${employees.length} employee records`}>
    <Field label="SEARCH EMPLOYEES" value={search} onChangeText={setSearch} placeholder="Search name, ID, position" />
    <AppButton title="+ Add employee" onPress={() => setAdding(true)} />

    {filtered.map(employee => <AppCard key={employee.id} style={styles.employeeRow}>
      <View style={styles.employeeHeading}><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.name}>{employee.fullName}</Text><Text style={styles.meta}>{employee.position} · {employee.employeeNumber}</Text></View><StatusBadge status={employee.employmentStatus} /></View>
      <View style={styles.employeeFooter}><Text style={styles.employeePay}>{peso(employee.salaryAmount)} / {employee.salaryType === "Hourly" ? "hr" : "month"}</Text><AppButton title="View details" secondary onPress={() => setSelectedEmployeeId(employee.id)} style={styles.viewButton} /></View>
    </AppCard>)}
    {filtered.length === 0 && <EmptyState title={search ? "No match found" : "Your team starts here"} message={search ? "Try another name, employee ID, or position." : "Add the café team so you can manage shifts and prepare payroll."} />}

    <Modal visible={adding} transparent animationType="slide" onRequestClose={cancelAdd}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>NEW EMPLOYEE</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <Field label="FULL NAME" value={name} onChangeText={setName} placeholder="Employee name" />
            <Field label="EMAIL" value={email} onChangeText={setEmail} placeholder="employee@cafe.com" autoCapitalize="none" keyboardType="email-address" />
            <Field label="PHONE NUMBER" icon="phone-outline" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="e.g. +63 912 345 6789" keyboardType="phone-pad" />
            <Text style={styles.label}>POSITION</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Position: ${position}`}
              onPress={() => setPositionPickerVisible(true)}
              style={styles.picker}
            >
              <Text style={styles.pickerText}>{position}</Text>
              <Text style={styles.pickerArrow}>Change</Text>
            </TouchableOpacity>
            <View style={styles.rate}>
              <Text style={styles.rateLabel}>HOURLY RATE</Text>
              <Text style={styles.rateValue}>{peso(hourlyRate)} / hour</Text>
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <AppButton title={creating ? "Saving..." : "Save Employee"} onPress={add} disabled={creating} style={styles.modalActionButton} />
            <AppButton title="Cancel" secondary onPress={cancelAdd} disabled={creating} style={styles.modalActionButton} />
          </View>
        </View>
      </View>
    </Modal>

    <Modal
      visible={Boolean(selectedEmployee)}
      transparent
      animationType="slide"
      onRequestClose={() => setSelectedEmployeeId(null)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          {selectedEmployee && <>
            <View style={styles.detailsHeading}>
              <View style={styles.detailsTitle}>
                <Text style={styles.modalTitle}>EMPLOYEE DETAILS</Text>
                <Text style={styles.name}>{selectedEmployee.fullName}</Text>
              </View>
              <StatusBadge status={selectedEmployee.employmentStatus} />
            </View>
            <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.details}>
              <Detail label="Employee ID" value={selectedEmployee.employeeNumber} />
              <Detail label="Position" value={selectedEmployee.position} />
              <Detail label="Email" value={selectedEmployee.email} />
              <Detail label="Contact Number" value={selectedEmployee.contactNumber || "Not provided"} />
              <AppButton title="Update phone number" secondary onPress={() => { setPhoneNumber(selectedEmployee.contactNumber); setPhoneEditEmployeeId(selectedEmployee.id); }} />
              <Detail label="Employment Type" value={selectedEmployee.employmentType} />
              <Detail
                label="Salary"
                value={`${peso(selectedEmployee.salaryAmount)} / ${selectedEmployee.salaryType === "Hourly" ? "hour" : "month"}`}
              />
              <Detail label="Date Hired" value={formatUsDate(selectedEmployee.dateHired)} />
              <Detail label="Employment Status" value={selectedEmployee.employmentStatus} />
            </ScrollView>
            <View style={styles.detailActions}>
              <AppButton
                title="Issue Temporary Password"
                secondary
                onPress={() => resetPassword(selectedEmployee)}
              />
              <AppButton
                title={selectedEmployee.employmentStatus === "Active" ? "Deactivate Employee" : "Reactivate Employee"}
                secondary
                onPress={() => toggleEmploymentStatus(selectedEmployee)}
              />
              <AppButton title="Close" onPress={() => setSelectedEmployeeId(null)} />
            </View>
          </>}
        </View>
      </View>
    </Modal>

    <Modal visible={Boolean(phoneEditEmployee)} transparent animationType="fade" onRequestClose={() => setPhoneEditEmployeeId(null)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.positionModal}>
          <Text style={styles.modalTitle}>Update phone number</Text>
          <Field label="PHONE NUMBER" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="e.g. +63 912 345 6789" keyboardType="phone-pad" />
          <AppButton title="Save phone number" onPress={savePhoneNumber} />
          <AppButton title="Cancel" secondary onPress={() => setPhoneEditEmployeeId(null)} />
        </View>
      </View>
    </Modal>

    <Modal visible={positionPickerVisible} transparent animationType="fade" onRequestClose={() => setPositionPickerVisible(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.positionModal}>
          <Text style={styles.modalTitle}>Select position</Text>
          {POSITIONS.map(option => <TouchableOpacity
            key={option}
            accessibilityRole="button"
            onPress={() => { setPosition(option); setPositionPickerVisible(false); }}
            style={styles.option}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionText}>{option}</Text>
              <Text style={styles.optionDescription}>{POSITION_DESCRIPTIONS[option]}</Text>
            </View>
            <Text style={styles.optionRate}>{peso(POSITION_RATES[option])} / hour</Text>
          </TouchableOpacity>)}
          <AppButton title="Cancel" secondary onPress={() => setPositionPickerVisible(false)} />
        </View>
      </View>
    </Modal>
  </ScreenContainer>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  heading: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 17 },
  form: { gap: 12, paddingVertical: 8 },
  label: { color: COLORS.darkBrown, fontSize: 12, fontWeight: "700", marginBottom: -6 },
  picker: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerText: { color: COLORS.text },
  pickerArrow: { color: COLORS.brown, fontSize: 13, fontWeight: "700" },
  rate: { backgroundColor: COLORS.cream, padding: 12, borderRadius: 12, gap: 4 },
  rateLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  rateValue: { color: COLORS.darkBrown, fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 16 },
  modal: { width: "100%", maxWidth: 560, maxHeight: "90%", backgroundColor: COLORS.background, borderRadius: 18, padding: 18, gap: 12 },
  positionModal: { width: "100%", maxWidth: 460, backgroundColor: COLORS.background, borderRadius: 18, padding: 18, gap: 8 },
  modalTitle: { color: COLORS.darkBrown, fontSize: 18, fontWeight: "800", marginBottom: 4 },
  modalActions: { flexDirection: "row", gap: 8 },
  modalActionButton: { flex: 1, paddingHorizontal: 8 },
  option: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, backgroundColor: COLORS.cream, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  optionInfo: { flex: 1 },
  optionText: { color: COLORS.darkBrown, fontWeight: "700" },
  optionDescription: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  optionRate: { color: COLORS.brown, fontSize: 12, fontWeight: "700" },
  employeeRow: { gap: 12, backgroundColor: "#EDE1D0" },
  employeeHeading: { flexDirection: "row", alignItems: "center", gap: 11 },
  name: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "800" },
  meta: { color: COLORS.muted, fontSize: 13, marginTop: 3 },
  employeeFooter: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  employeePay: { color: COLORS.brown, fontSize: 14, fontWeight: "700" },
  viewButton: { paddingVertical: 9, paddingHorizontal: 14 },
  detailsHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  detailsTitle: { flex: 1 },
  detailsScroll: { flexGrow: 0 },
  details: { gap: 8, paddingVertical: 4 },
  detailRow: { paddingVertical: 9, paddingHorizontal: 11, backgroundColor: COLORS.cream, borderRadius: 12, gap: 3 },
  detailLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  detailValue: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "600" },
  detailActions: { gap: 8 },
});
