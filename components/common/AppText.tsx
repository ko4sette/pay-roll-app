import React from "react";
import { StyleSheet, Text as NativeText, TextProps } from "react-native";
import { FONT_FAMILY_BY_WEIGHT } from "../../constants/typography";

export function AppText({ style, ...props }: TextProps) {
  const textStyle = StyleSheet.flatten(style);
  const fontFamily = textStyle?.fontFamily
    ?? FONT_FAMILY_BY_WEIGHT[String(textStyle?.fontWeight ?? "400") as keyof typeof FONT_FAMILY_BY_WEIGHT]
    ?? FONT_FAMILY_BY_WEIGHT["400"];

  return <NativeText {...props} style={[style, { fontFamily }]} />;
}
