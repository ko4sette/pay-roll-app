import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { AppText as Text } from "./AppText";
import { COLORS } from "../../constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
type FieldIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
export function Field({ label, icon, ...props }: TextInputProps & { label: string; icon?: FieldIcon }) {
  return <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    {icon ? <View style={styles.iconField}><MaterialCommunityIcons name={icon} size={19} color={COLORS.mediumBrown} /><TextInput placeholderTextColor={COLORS.muted} style={[styles.input, styles.iconInput]} {...props} /></View>
      : <TextInput placeholderTextColor={COLORS.muted} style={styles.input} {...props} />}</View>;
}
const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: COLORS.darkBrown, fontSize: 12, fontWeight: "700" },
  input: { minHeight: 48, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: COLORS.text, fontFamily: "Inter_400Regular" },
  iconField: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, borderRadius: 12, paddingLeft: 12, paddingRight: 4 },
  iconInput: { flex: 1, minWidth: 0, borderWidth: 0, borderRadius: 0, backgroundColor: "transparent", paddingLeft: 0, paddingRight: 8 },
});
