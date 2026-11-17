import React from "react";
import { ImageBackground, ScrollView, StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";
import { COLORS } from "../../constants/colors";
import { SECONDARY_FONT } from "../../constants/typography";

export function ScreenContainer({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <ImageBackground source={require("../../assets/paper-grid.jpg")} resizeMode="cover" imageStyle={styles.paper} style={styles.background}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.pageHeading}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  </ImageBackground>;
}
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: COLORS.background },
  paper: { opacity: 0.15 },
  scroll: { flex: 1, backgroundColor: "transparent" },
  container: { paddingHorizontal: 17, paddingTop: 17, paddingBottom: 26 },
  pageHeading: { paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 27, lineHeight: 34, fontWeight: "700", color: COLORS.darkBrown, fontFamily: SECONDARY_FONT },
  subtitle: { marginTop: 4, color: COLORS.muted, fontSize: 14, lineHeight: 19, fontFamily: SECONDARY_FONT },
  body: { marginTop: 15, gap: 12 }
});
