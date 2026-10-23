import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { AppText as Text } from "./AppText";
import { COLORS } from "../../constants/colors";
export function AppButton({ title, onPress, secondary, disabled, style }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; style?: ViewStyle }) {
  return <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.button, secondary && styles.secondary, disabled && styles.disabled, style]}><Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text></TouchableOpacity>;
}
const styles = StyleSheet.create({
  button: { backgroundColor: COLORS.brown, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, alignItems: "center" },
  secondary: { backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.beige },
  disabled: { opacity: 0.55 },
  text: { color: COLORS.white, fontWeight: "800" },
  secondaryText: { color: COLORS.darkBrown }
});
