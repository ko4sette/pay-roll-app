import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

export function ScreenContainer({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    <View style={styles.body}>{children}</View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 18, paddingBottom: 28 },
  title: { fontSize: 25, fontWeight: "800", color: COLORS.darkBrown },
  subtitle: { marginTop: 5, color: COLORS.muted, fontSize: 13 },
  body: { marginTop: 18, gap: 12 }
});
