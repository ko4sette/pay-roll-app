import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/colors";
export function AppCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: COLORS.cream, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.darkBrown, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.045, shadowRadius: 5, elevation: 1 } });
