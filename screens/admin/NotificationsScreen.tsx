import React, { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { AppText as Text } from "../../components/common/AppText";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { PasswordAssistanceRequest, Employee } from "../../types";
import { COLORS } from "../../constants/colors";

interface NotificationsScreenProps {
  requests: PasswordAssistanceRequest[];
  employees: Employee[];
  onFixRequest: (request: PasswordAssistanceRequest) => void;
}

export function NotificationsScreen({ requests, employees, onFixRequest }: NotificationsScreenProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const sortedRequests = requests.slice().sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
  const pendingRequests = sortedRequests.filter(request => request.status === "Pending");
  const resolvedRequests = sortedRequests.filter(request => request.status === "Resolved");
  const selectedRequest = sortedRequests.find(request => request.id === selectedRequestId);
  const selectedEmployee = selectedRequest
    ? employees.find(employee => employee.id === selectedRequest.employeeId)
    : undefined;
  const requestDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  return <>
    <ScreenContainer title="Notifications" subtitle="Employee requests and updates.">
      {sortedRequests.length === 0 && <AppCard><Text style={styles.body}>No notifications.</Text></AppCard>}
      {pendingRequests.length > 0 && <>
        <Text style={styles.sectionTitle}>Pending</Text>
        {pendingRequests.map(request => <NotificationItem
          key={request.id}
          request={request}
          onPress={() => setSelectedRequestId(request.id)}
        />)}
      </>}
      {resolvedRequests.length > 0 && <>
        <Text style={styles.sectionTitle}>Resolved</Text>
        {resolvedRequests.map(request => <NotificationItem
          key={request.id}
          request={request}
          onPress={() => setSelectedRequestId(request.id)}
        />)}
      </>}
    </ScreenContainer>

    <Modal
      visible={Boolean(selectedRequest)}
      transparent
      animationType="slide"
      onRequestClose={() => setSelectedRequestId(null)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>PASSWORD RESET REQUEST</Text>
          {selectedRequest && <>
            <Text style={styles.body}>Employee: {selectedEmployee?.fullName ?? "Employee record unavailable"}</Text>
            <Text style={styles.body}>Employee ID: {selectedEmployee?.employeeNumber ?? selectedRequest.employeeId}</Text>
            <Text style={styles.body}>Position: {selectedEmployee?.position ?? "Not available"}</Text>
            <Text style={styles.body}>Request: Forgot Password</Text>
            <Text style={styles.body}>Submitted: {requestDate(selectedRequest.submittedAt)}</Text>
            <Text style={styles.body}>Status: {selectedRequest.status}</Text>
            {selectedRequest.status === "Pending" && selectedEmployee && <AppButton
              title="Fix"
              onPress={() => {
                onFixRequest(selectedRequest);
                setSelectedRequestId(null);
              }}
            />}
            <AppButton title="Close" secondary onPress={() => setSelectedRequestId(null)} />
          </>}
        </View>
      </View>
    </Modal>
  </>;
}

function NotificationItem({ request, onPress }: { request: PasswordAssistanceRequest; onPress: () => void }) {
  return <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel="Forgot Password Request"
    accessibilityHint={request.status === "Pending" ? "Pending request" : "Resolved request"}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <AppCard style={styles.notificationCard}>
      <Text style={styles.requestName}>Forgot Password Request</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
    </AppCard>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  body: { color: COLORS.muted, lineHeight: 20 },
  sectionTitle: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "800", marginTop: 4 },
  notificationCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  requestName: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 18 },
  modal: { width: "100%", maxWidth: 460, backgroundColor: COLORS.background, borderRadius: 18, padding: 18, gap: 8 },
  modalTitle: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "800", marginBottom: 4 },
});
