import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/colors";
export function AppCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: COLORS.border } });
