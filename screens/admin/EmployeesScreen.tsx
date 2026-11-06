import React, { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
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
  const [positionPickerVisible, setPositionPickerVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const hourlyRate = POSITION_RATES[position];
  const selectedEmployee = employees.find(employee => employee.id === selectedEmployeeId);
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
    if (!name.trim() || !email.trim() || employees.some(employee => employee.email.toLowerCase() === email.trim().toLowerCase())) {
      Alert.alert("Check details", "Enter a name and a unique email address.");
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
        contactNumber: "",
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

    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text style={[styles.headerText, styles.nameColumn]}>Employee Name</Text>
      <Text style={[styles.headerText, styles.idColumn]}>Employee ID</Text>
      <Text style={[styles.headerText, styles.positionColumn]}>Position</Text>
      <Text style={[styles.headerText, styles.actionColumn]}>Action</Text>
    </View>
    {filtered.map(employee => <AppCard key={employee.id} style={styles.employeeRow}>
      <Text numberOfLines={2} style={[styles.name, styles.nameColumn]}>{employee.fullName}</Text>
      <Text numberOfLines={1} style={[styles.meta, styles.idColumn]}>{employee.employeeNumber}</Text>
      <Text numberOfLines={2} style={[styles.meta, styles.positionColumn]}>{employee.position}</Text>
      <View style={styles.actionColumn}>
        <AppButton
          title="View Details"
          secondary
          onPress={() => setSelectedEmployeeId(employee.id)}
          style={styles.viewButton}
        />
      </View>
    </AppCard>)}
    {filtered.length === 0 && <Text style={styles.meta}>No employees found.</Text>}

    <Modal visible={adding} transparent animationType="slide" onRequestClose={cancelAdd}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>NEW EMPLOYEE</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <Field label="FULL NAME" value={name} onChangeText={setName} placeholder="Employee name" />
            <Field label="EMAIL" value={email} onChangeText={setEmail} placeholder="employee@cafe.com" autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>POSITION</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Position: ${position}`}
              onPress={() => setPositionPickerVisible(true)}
              style={styles.picker}
            >
              <Text style={styles.pickerText}>{position}</Text>
              <Text style={styles.pickerArrow}>⌄</Text>
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
              <Detail label="Employment Type" value={selectedEmployee.employmentType} />
              <Detail
                label="Salary"
                value={`${peso(selectedEmployee.salaryAmount)} / ${selectedEmployee.salaryType === "Hourly" ? "hour" : "month"}`}
              />
              <Detail label="Date Hired" value={selectedEmployee.dateHired} />
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
  picker: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerText: { color: COLORS.text },
  pickerArrow: { color: COLORS.muted, fontSize: 18 },
  rate: { backgroundColor: COLORS.cream, padding: 12, borderRadius: 11, gap: 4 },
  rateLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  rateValue: { color: COLORS.darkBrown, fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 16 },
  modal: { width: "100%", maxWidth: 560, maxHeight: "90%", backgroundColor: COLORS.background, borderRadius: 18, padding: 18, gap: 12 },
  positionModal: { width: "100%", maxWidth: 460, backgroundColor: COLORS.background, borderRadius: 18, padding: 18, gap: 8 },
  modalTitle: { color: COLORS.darkBrown, fontSize: 18, fontWeight: "800", marginBottom: 4 },
  modalActions: { flexDirection: "row", gap: 8 },
  modalActionButton: { flex: 1, paddingHorizontal: 8 },
  option: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, backgroundColor: COLORS.cream, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  optionInfo: { flex: 1 },
  optionText: { color: COLORS.darkBrown, fontWeight: "700" },
  optionDescription: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  optionRate: { color: COLORS.brown, fontSize: 12, fontWeight: "700" },
  tableHeader: { paddingHorizontal: 10, paddingVertical: 10, backgroundColor: COLORS.cream, borderRadius: 10 },
  tableRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  employeeRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10 },
  headerText: { color: COLORS.darkBrown, fontSize: 11, fontWeight: "800" },
  name: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "800" },
  meta: { color: COLORS.muted, fontSize: 12 },
  nameColumn: { flex: 1.2 },
  idColumn: { flex: 0.9 },
  positionColumn: { flex: 1 },
  actionColumn: { width: 100, alignItems: "flex-end" },
  viewButton: { paddingVertical: 9, paddingHorizontal: 8 },
  detailsHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  detailsTitle: { flex: 1 },
  detailsScroll: { flexGrow: 0 },
  details: { gap: 8, paddingVertical: 4 },
  detailRow: { paddingVertical: 9, paddingHorizontal: 11, backgroundColor: COLORS.cream, borderRadius: 10, gap: 3 },
  detailLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  detailValue: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "600" },
  detailActions: { gap: 8 },
});
