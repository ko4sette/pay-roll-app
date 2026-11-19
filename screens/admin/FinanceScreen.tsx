import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText as Text } from "../../components/common/AppText";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { StatusBadge } from "../../components/common/StatusBadge";
import { EmptyState } from "../../components/common/EmptyState";
import { COLORS } from "../../constants/colors";
import { Employee, PayrollRecord } from "../../types";
import { peso } from "../../utils/currencyUtils";
import { formatUsDate, formatTimeUpdated, localDateString } from "../../utils/dateUtils";
import { PaydayCalendar } from "../../components/common/PaydayCalendar";

type PaymentMethod = "Cash" | "Bank transfer" | "E-wallet";
export function FinanceDashboard({ payroll, onNavigate, paydayDate }: { payroll: PayrollRecord[]; onNavigate: (tab: any) => void; paydayDate?: string | null }) {
  const pending = payroll.filter(record => record.status === "Pending");
  const paidCount = payroll.filter(record => record.status === "Paid").length;
  const progress = useRef(new Animated.Value(0)).current;
  const completion = payroll.length ? paidCount / payroll.length : 0;
  useEffect(() => {
    Animated.timing(progress, { toValue: completion, duration: 550, useNativeDriver: false }).start();
  }, [completion, progress]);
  const total = pending.reduce((sum, record) => sum + record.netPay, 0);
  return <ScreenContainer title="Good morning" subtitle={`${formatUsDate(localDateString())} · Finance overview`}>
    <AppCard style={styles.dashboardPanel}>
      <View style={styles.dashboardSummary}>
        <View style={styles.dashboardIcon}><MaterialCommunityIcons name="cash-multiple" size={21} color={COLORS.brown} /></View>
        <View style={styles.dashboardCopy}>
          <Text style={styles.heroEyebrow}>PAYMENTS</Text>
          <Text style={styles.heroMeta}>{pending.length ? `${pending.length} employee payment${pending.length === 1 ? "" : "s"} waiting` : payroll.length ? "All prepared payments are recorded" : "Payroll will appear after Admin prepares it"}</Text>
        </View>
        {pending.length > 0 ? <Text style={styles.heroTotal}>{peso(total)}</Text> : null}
      </View>
      {payroll.length > 0 ? <>
        <View style={styles.progressTrack}><Animated.View style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} /></View>
        <Text style={styles.progressText}>{paidCount} of {payroll.length} payments recorded</Text>
      </> : null}
      <AppButton title="Review payments" onPress={() => onNavigate("Payments")} />
    </AppCard>
    <PaydayCalendar configuredPayday={paydayDate} />
    {!payroll.length && <EmptyState title="Your payment desk is ready" message="Payroll will appear here after Admin prepares the first payment." />}
  </ScreenContainer>;
}

export function FinanceScreen({ employees, payroll, onRecordPayment }: {
  employees: Employee[]; payroll: PayrollRecord[]; onRecordPayment: (record: PayrollRecord) => Promise<void>;
}) {
  const [selected, setSelected] = useState<PayrollRecord | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("Bank transfer");
  const [successMessage, setSuccessMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const successScale = useRef(new Animated.Value(0.9)).current;
  const pending = useMemo(() => payroll.filter(record => record.status === "Pending").slice().reverse(), [payroll]);
  const total = pending.reduce((sum, record) => sum + record.netPay, 0);
  const selectedEmployee = selected ? employees.find(item => item.id === selected.employeeId) : undefined;
  const close = () => { setSelected(null); };
  const recordPayment = async () => {
    if (!selected || savingPayment) return;
    setPaymentError("");
    setSavingPayment(true);
    const paidRecord: PayrollRecord = {
      ...selected,
      status: "Paid",
      paidAt: localDateString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: method,
    };
    try {
      await onRecordPayment(paidRecord);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Payment could not be saved. Check your connection and try again.");
      setSavingPayment(false);
      return;
    }
    const employeeName = employees.find(item => item.id === selected.employeeId)?.fullName ?? "Employee";
    setSuccessMessage(`${employeeName} · ${peso(selected.netPay)} paid`);
    successScale.setValue(0.85);
    Animated.spring(successScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
    close();
    setSavingPayment(false);
  };
  return <>
    <ScreenContainer title="Payments" subtitle="Pay records prepared by the administrator.">
      {successMessage ? <Animated.View style={[styles.success, { transform: [{ scale: successScale }] }]}><View style={{ flex: 1 }}><Text style={styles.successTitle}>Payment recorded</Text><Text style={styles.meta}>{successMessage}</Text></View></Animated.View> : null}
      <AppCard style={styles.summary}>
        <Text style={styles.eyebrow}>READY TO PAY</Text>
        <Text style={styles.total}>{peso(total)}</Text>
        <Text style={styles.meta}>{pending.length} employee payment{pending.length === 1 ? "" : "s"} remaining</Text>
      </AppCard>
      <Text style={styles.section}>To pay</Text>
      {pending.map(record => {
        const employee = employees.find(item => item.id === record.employeeId);
        return <AppCard key={record.id} style={styles.record}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{employee?.fullName ?? "Employee"}</Text>
              <Text style={styles.meta}>{formatUsDate(record.periodStart)}{record.periodEnd !== record.periodStart ? ` – ${formatUsDate(record.periodEnd)}` : ""}</Text>
              <Text style={styles.timestamp}>Prepared by Admin · {record.preparedAt ? formatTimeUpdated(record.preparedAt) : "Ready for Finance"}</Text>
            </View>
            <Text style={styles.amount}>{peso(record.netPay)}</Text>
          </View>
          <AppButton title="Record payment" onPress={() => { setSelected(record); setMethod("Bank transfer"); setPaymentError(""); }} />
        </AppCard>;
      })}
      {!pending.length && <EmptyState title="You’re all caught up" message="New payments will appear here after payroll is prepared." />}
      <Text style={styles.section}>Recent payments</Text>
      {payroll.filter(record => record.status === "Paid").slice().reverse().slice(0, 8).map(record => <AppCard key={record.id} style={styles.record}>
        <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{employees.find(item => item.id === record.employeeId)?.fullName ?? "Employee"}</Text><Text style={styles.meta}>{record.paymentMethod ?? "Paid"}</Text><Text style={styles.timestamp}>Updated {record.updatedAt ? formatTimeUpdated(record.updatedAt) : record.paidAt ? formatUsDate(record.paidAt) : "Previously"}</Text></View><View style={{ alignItems: "flex-end" }}><Text style={styles.amount}>{peso(record.netPay)}</Text><StatusBadge status="Paid" /></View></View>
      </AppCard>)}
    </ScreenContainer>
    <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}><View style={styles.modal}>
        <View style={styles.modalHeader}>
          <View style={styles.modalIcon}><MaterialCommunityIcons name="cash-check" size={21} color={COLORS.brown} /></View>
          <View style={styles.modalHeaderCopy}><Text style={styles.modalTitle}>Confirm payment</Text><Text style={styles.modalSubtitle}>Review these details before marking it paid.</Text></View>
        </View>
        <View style={styles.paymentSummary}>
          <Text style={styles.summaryLabel}>EMPLOYEE</Text>
          <Text style={styles.summaryName}>{selectedEmployee?.fullName ?? "Employee"}</Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryAmountRow}><Text style={styles.summaryLabel}>TAKE-HOME PAY</Text><Text style={styles.summaryAmount}>{selected ? peso(selected.netPay) : ""}</Text></View>
        </View>
        <Text style={styles.label}>PAYMENT METHOD</Text>
        <View style={styles.methods}>{(["Bank transfer", "E-wallet", "Cash"] as PaymentMethod[]).map(option => {
          const isSelected = method === option;
          const icon = option === "Bank transfer" ? "bank-transfer" : option === "E-wallet" ? "wallet-outline" : "cash-multiple";
          return <TouchableOpacity
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => setMethod(option)}
            style={[styles.methodOption, isSelected && styles.methodOptionSelected]}
          >
            <MaterialCommunityIcons name={icon} size={18} color={isSelected ? COLORS.brown : COLORS.muted} />
            <Text style={[styles.methodText, isSelected && styles.methodTextSelected]}>{option}</Text>
            {isSelected ? <MaterialCommunityIcons name="check-circle" size={17} color={COLORS.brown} /> : null}
          </TouchableOpacity>;
        })}</View>
        {paymentError ? <Text accessibilityRole="alert" style={{ color: COLORS.error, fontSize: 13, lineHeight: 18 }}>{paymentError}</Text> : null}
        <View style={styles.modalActions}>
          <AppButton title="Cancel" secondary onPress={close} style={styles.actionButton} />
          <AppButton title={savingPayment ? "Saving..." : "Confirm payment"} disabled={savingPayment} onPress={recordPayment} style={styles.actionButton} />
        </View>
      </View></View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  summary: { backgroundColor: COLORS.cream, paddingVertical: 20 },
  eyebrow: { color: COLORS.muted, fontSize: 12, fontWeight: "700", letterSpacing: 0.7 },
  total: { color: COLORS.darkBrown, fontSize: 32, fontWeight: "900", marginVertical: 6 },
  meta: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  section: { color: COLORS.darkBrown, fontSize: 18, fontWeight: "800", marginTop: 8 },
  record: { gap: 12, backgroundColor: "#EDE1D0" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "700" },
  amount: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 17 },
  timestamp: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  backdrop: { flex: 1, backgroundColor: "rgba(40,30,23,0.55)", justifyContent: "center", alignItems: "center", padding: 18 },
  modal: { width: "100%", maxWidth: 440, backgroundColor: COLORS.background, padding: 20, borderRadius: 18, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  modalIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#DCC9AD", alignItems: "center", justifyContent: "center" },
  modalHeaderCopy: { flex: 1, gap: 3 },
  modalTitle: { color: COLORS.darkBrown, fontSize: 20, fontWeight: "800" },
  modalSubtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  paymentSummary: { backgroundColor: COLORS.cream, borderRadius: 14, padding: 14, gap: 4, borderWidth: 1, borderColor: COLORS.border },
  summaryLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  summaryName: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "800" },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 5 },
  summaryAmountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  summaryAmount: { color: COLORS.darkBrown, fontSize: 20, fontWeight: "900" },
  label: { color: COLORS.darkBrown, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, marginBottom: -6 },
  methods: { gap: 8 },
  methodOption: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.cream },
  methodOptionSelected: { borderColor: COLORS.brown, backgroundColor: "#E8D7BE" },
  methodText: { flex: 1, color: COLORS.darkBrown, fontSize: 14, fontWeight: "600" },
  methodTextSelected: { fontWeight: "800" },
  modalActions: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1, paddingHorizontal: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: COLORS.text, fontSize: 16 },
  progressTrack: { height: 8, borderRadius: 6, backgroundColor: "#D6C9B7", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#9ABD78", borderRadius: 6 },
  success: { backgroundColor: "#DCE4D6", borderColor: "#B8C6AF", borderWidth: 1, padding: 13, borderRadius: 16 },
  successTitle: { color: COLORS.darkBrown, fontSize: 15, fontWeight: "800" },
  dashboardPanel: { backgroundColor: COLORS.cream, gap: 12 },
  dashboardSummary: { flexDirection: "row", alignItems: "center", gap: 10 },
  dashboardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#DCC9AD", alignItems: "center", justifyContent: "center" },
  dashboardCopy: { flex: 1, gap: 3 },
  heroEyebrow: { color: COLORS.brown, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  heroTotal: { color: COLORS.darkBrown, fontSize: 19, fontWeight: "900", textAlign: "right" },
  heroMeta: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
  progressText: { color: COLORS.muted, fontSize: 12 },
});
