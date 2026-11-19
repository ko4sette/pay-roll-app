import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText as Text } from "./AppText";
import { AppButton } from "./AppButton";
import { COLORS } from "../../constants/colors";

const DASHBOARD_GUIDE = [
  { tab: "Dashboard", label: "Home", title: "Your home tab", body: "See today’s shift, the next payday, and your latest pay summary." },
  { tab: "Attendance", label: "Attendance", title: "Record your shift", body: "Clock in and out here, then review your recorded hours." },
  { tab: "Salary", label: "Pay", title: "Check your pay", body: "View your payslips, hours worked, and take-home pay." },
  { tab: "Profile", label: "Profile", title: "Your profile", body: "Check your contact details and employment information." },
] as const;

export type EmployeeGuideTab = typeof DASHBOARD_GUIDE[number]["tab"];

export function OnboardingTutorial({
  visible,
  currentTab,
  onNavigate,
  onDismiss,
}: {
  visible: boolean;
  currentTab: EmployeeGuideTab;
  onNavigate: (tab: EmployeeGuideTab) => void;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const navigationClearance = 49 + insets.bottom;
  const step = Math.max(0, DASHBOARD_GUIDE.findIndex(item => item.tab === currentTab));
  const page = DASHBOARD_GUIDE[step];

  useEffect(() => {
    if (visible) onNavigate("Dashboard");
  }, [visible]);

  if (!visible) return null;

  const move = (nextStep: number) => onNavigate(DASHBOARD_GUIDE[nextStep].tab);

  return <View pointerEvents="box-none" style={styles.overlay}>
    <View pointerEvents="auto" style={[styles.scrim, { bottom: navigationClearance }]} />
    <View pointerEvents="box-none" style={[styles.calloutPosition, { bottom: navigationClearance }]}>
      <View style={styles.card}>
        <View style={styles.headingRow}>
          <Text style={styles.eyebrow}>QUICK TOUR · {step + 1} OF {DASHBOARD_GUIDE.length}</Text>
          <Text style={styles.tabLabel}>{page.label}</Text>
        </View>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.body}>{page.body}</Text>
        <View style={styles.progressRow}>{DASHBOARD_GUIDE.map((item, index) =>
          <View key={item.tab} style={[styles.progressDot, index === step && styles.progressDotActive]} />,
        )}</View>
        <View style={styles.actions}>
          {step > 0 ? <AppButton title="Back" secondary onPress={() => move(step - 1)} style={styles.actionButton} /> : null}
          <AppButton title="Skip" secondary onPress={onDismiss} style={styles.actionButton} />
          <AppButton title={step === DASHBOARD_GUIDE.length - 1 ? "Done" : "Next"} onPress={() => step === DASHBOARD_GUIDE.length - 1 ? onDismiss() : move(step + 1)} style={styles.actionButton} />
        </View>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 50 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(40,30,23,0.30)" },
  calloutPosition: { position: "absolute", left: 14, right: 14, alignItems: "center" },
  card: { width: "100%", maxWidth: 460, backgroundColor: COLORS.background, borderRadius: 18, padding: 16, gap: 8, borderWidth: 1, borderColor: COLORS.border, elevation: 8, shadowColor: COLORS.darkBrown, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  eyebrow: { color: COLORS.brown, fontWeight: "800", fontSize: 10, letterSpacing: 0.8 },
  tabLabel: { color: COLORS.darkBrown, fontSize: 11, fontWeight: "800", backgroundColor: "#E8D7BE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9 },
  title: { color: COLORS.darkBrown, fontSize: 21, fontWeight: "800" },
  body: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
  progressRow: { flexDirection: "row", gap: 5, alignItems: "center", marginTop: 2 },
  progressDot: { flex: 1, height: 4, borderRadius: 3, backgroundColor: COLORS.beige },
  progressDotActive: { backgroundColor: COLORS.brown },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 6, marginTop: 3 },
  actionButton: { flex: 1, minWidth: 0, paddingHorizontal: 7 },
});
