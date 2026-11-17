import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";
import { COLORS } from "../../constants/colors";
export function StatusBadge({ status }: { status: string }) {
  const color = ["Paid", "Released", "Verified", "Resolved", "Completed", "Present", "Active"].includes(status)
    ? COLORS.success
    : ["Late", "Pending", "Processing", "For Verification", "Submitted", "Incomplete"].includes(status)
      ? COLORS.warning
      : COLORS.error;
  return <View style={[styles.badge, { backgroundColor: color + "20" }]}><Text style={[styles.text, { color }]}>{status}</Text></View>;
}
const styles = StyleSheet.create({ badge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }, text: { fontSize: 12, fontWeight: "800" } });
