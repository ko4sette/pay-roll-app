import React, { useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { AppText as Text } from "./AppText";
import { COLORS } from "../../constants/colors";
export function AppButton({ title, onPress, secondary, disabled, style }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; style?: ViewStyle }) {
  const scale = useRef(new Animated.Value(1)).current;
  const layout = { flex: style?.flex, width: style?.width, height: style?.height, alignSelf: style?.alignSelf };
  const pressIn = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 32, bounciness: 4 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 6 }).start();
  return <Animated.View style={[layout, { transform: [{ scale }] }]}><TouchableOpacity accessibilityRole="button" onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled} style={[styles.button, secondary && styles.secondary, disabled && styles.disabled, style]}><Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text></TouchableOpacity></Animated.View>;
}
const styles = StyleSheet.create({
  button: { minHeight: 48, justifyContent: "center", backgroundColor: COLORS.caramel, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: "center" },
  secondary: { backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.beige },
  disabled: { opacity: 0.55 },
  text: { color: COLORS.darkBrown, fontWeight: "800", fontSize: 15 },
  secondaryText: { color: COLORS.darkBrown }
});
