import React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { AppText as Text } from "./AppText";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <View style={styles.wrap}>
    <View style={styles.rule} />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>;
}
const styles = StyleSheet.create({ wrap: { alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 18, backgroundColor: COLORS.cream, borderRadius: 16, gap: 7 }, rule: { width: 34, height: 3, borderRadius: 2, backgroundColor: COLORS.mediumBrown, marginBottom: 5 }, title: { color: COLORS.darkBrown, fontSize: 16, fontWeight: "800" }, message: { color: COLORS.muted, fontSize: 14, lineHeight: 20 } });
