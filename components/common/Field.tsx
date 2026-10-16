import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { COLORS } from "../../constants/colors";
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.wrap}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={COLORS.muted} style={styles.input} {...props} /></View>;
}
const styles = StyleSheet.create({ wrap: { gap: 6 }, label: { color: COLORS.darkBrown, fontSize: 12, fontWeight: "700" }, input: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, color: COLORS.text } });
