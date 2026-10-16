import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { COLORS } from "../../constants/colors";
export function AppButton({ title, onPress, secondary, style }: { title: string; onPress: () => void; secondary?: boolean; style?: ViewStyle }) {
  return <TouchableOpacity onPress={onPress} style={[styles.button, secondary && styles.secondary, style]}><Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text></TouchableOpacity>;
}
const styles = StyleSheet.create({
  button: { backgroundColor: COLORS.brown, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, alignItems: "center" },
  secondary: { backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.beige },
  text: { color: COLORS.white, fontWeight: "800" },
  secondaryText: { color: COLORS.darkBrown }
});
