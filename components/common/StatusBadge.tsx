import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
export function StatusBadge({ status }: { status: string }) {
  const color = status === "Paid" || status === "Present" || status === "Active" ? COLORS.success : status === "Late" || status === "Pending" || status === "Incomplete" ? COLORS.warning : COLORS.error;
  return <View style={[styles.badge, { backgroundColor: color + "20" }]}><Text style={[styles.text, { color }]}>{status}</Text></View>;
}
const styles = StyleSheet.create({ badge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 }, text: { fontSize: 11, fontWeight: "800" } });
