import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "../components/common/AppButton";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { COLORS } from "../constants/colors";
import { listRecordItems, loadAuthorizedUser, RecordListItem } from "../services/recordRouteService";
import { loadData } from "../services/storageService";
import { AppText as Text } from "../components/common/AppText";

export default function RecordHomeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadRecords = async () => {
      const user = await loadAuthorizedUser();
      if (!user) {
        router.replace("/");
        return;
      }
      const data = await loadData();
      if (mounted) setItems(listRecordItems(data, user));
    };
    loadRecords()
      .catch(reason => {
        if (mounted) setError(reason instanceof Error ? reason.message : "Unable to load records.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <ScreenContainer title="Home" subtitle="Browse employee, attendance, and payroll records.">
      <AppButton
        title="Back to dashboard"
        secondary
        onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
      />
      {loading ? <ActivityIndicator color={COLORS.brown} /> : null}
      {error ? <Text style={styles.message}>{error}</Text> : null}
      {!loading && !error && items.length === 0
        ? <Text style={styles.message}>No records are available for your account yet.</Text>
        : null}
      {items.map(item => (
        <TouchableOpacity
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`View ${item.title}`}
          onPress={() => router.push(`/details/${encodeURIComponent(item.id)}`)}
          style={styles.item}
        >
          <View style={styles.itemText}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  itemText: { flex: 1 },
  title: { color: COLORS.darkBrown, fontWeight: "800" },
  subtitle: { color: COLORS.muted, marginTop: 4, fontSize: 12 },
  arrow: { color: COLORS.brown, fontSize: 24, fontWeight: "700" },
  message: { color: COLORS.muted, lineHeight: 20 },
});
