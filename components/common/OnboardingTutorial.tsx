import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";
import { AppButton } from "./AppButton";
import { COLORS } from "../../constants/colors";

const DASHBOARD_GUIDE = [
  { title: "Your shift today", body: "This card shows whether you have clocked in or out, along with your recorded shift times. Tap Open attendance to record your shift." },
  { title: "Payday calendar", body: "Check the calendar to see the upcoming payday. Sundays are marked as scheduled paydays." },
  { title: "Your latest pay", body: "When payroll is ready, your take-home pay appears here. Tap View payslip to see the pay period and hours." },
];

export function OnboardingTutorial({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (visible) setStep(0); }, [visible]);
  const page = DASHBOARD_GUIDE[step];

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
    <View style={styles.backdrop}><View style={styles.modal}>
      <Text style={styles.eyebrow}>EMPLOYEE DASHBOARD · {step + 1} OF {DASHBOARD_GUIDE.length}</Text>
      <Text style={styles.title}>{page.title}</Text>
      <Text style={styles.body}>{page.body}</Text>
      <View style={styles.progressRow}>{DASHBOARD_GUIDE.map((_, index) => <View key={index} style={[styles.progressDot, index === step && styles.progressDotActive]} />)}</View>
      <View style={styles.actions}>
        <AppButton title="Skip" secondary onPress={onDismiss} style={styles.actionButton} />
        <AppButton title={step === DASHBOARD_GUIDE.length - 1 ? "Done" : "Next"} onPress={() => step === DASHBOARD_GUIDE.length - 1 ? onDismiss() : setStep(value => value + 1)} style={styles.actionButton} />
      </View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(40,30,23,0.58)" },
  modal: { width: "100%", maxWidth: 520, alignSelf: "center", backgroundColor: COLORS.background, borderRadius: 18, padding: 20, gap: 13 },
  eyebrow: { color: COLORS.brown, fontWeight: "800", fontSize: 11, letterSpacing: 1 },
  title: { color: COLORS.darkBrown, fontSize: 24, fontWeight: "800" },
  body: { color: COLORS.muted, fontSize: 15, lineHeight: 22 },
  progressRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  progressDot: { flex: 1, height: 4, borderRadius: 3, backgroundColor: COLORS.beige },
  progressDotActive: { backgroundColor: COLORS.brown },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 7, marginTop: 4 },
  actionButton: { minWidth: 92 },
});
