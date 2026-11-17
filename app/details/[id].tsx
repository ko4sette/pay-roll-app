import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { COLORS } from "../../constants/colors";
import { findRecordDetail, loadAuthorizedUser, RecordDetail } from "../../services/recordRouteService";
import { loadData } from "../../services/storageService";
import { AppText as Text } from "../../components/common/AppText";

export default function RecordDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const [detail, setDetail] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadRecord = async () => {
      const user = await loadAuthorizedUser();
      if (!user) {
        router.replace("/");
        return;
      }
      const routeId = Array.isArray(id) ? id[0] : id;
      if (!routeId) {
        if (mounted) setDetail(null);
        return;
      }
      const data = await loadData();
      if (mounted) setDetail(findRecordDetail(data, user, routeId));
    };
    loadRecord()
      .catch(reason => {
        if (mounted) setError(reason instanceof Error ? reason.message : "Unable to load this record.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, router]);

  return (
    <ScreenContainer title={detail?.title ?? "Record details"} subtitle={detail?.subtitle}>
      <AppButton
        title="Back"
        secondary
        onPress={() => router.canGoBack() ? router.back() : router.replace("/home")}
      />
      {loading ? <ActivityIndicator color={COLORS.brown} /> : null}
      {error ? <Text style={styles.message}>{error}</Text> : null}
      {!loading && !error && !detail
        ? <Text style={styles.message}>This record was not found or is not available for your account.</Text>
        : null}
      {detail?.summary ? <AppCard style={styles.summary}>
        <Text style={styles.summaryLabel}>{detail.summary.label}</Text>
        <Text style={styles.summaryValue}>{detail.summary.value}</Text>
      </AppCard> : null}
      {detail?.sections.map(section => <AppCard key={section.title} style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View>
          {section.fields.map((field, index) => <View key={`${section.title}-${field.label}`} style={[styles.fieldRow, index < section.fields.length - 1 && styles.fieldDivider]}>
            <Text style={styles.label}>{field.label}</Text>
            <Text style={styles.value}>{field.value}</Text>
          </View>)}
        </View>
      </AppCard>)}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: COLORS.darkBrown, borderColor: COLORS.darkBrown, gap: 4, paddingVertical: 18 },
  summaryLabel: { color: "#E5C7A5", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  summaryValue: { color: COLORS.white, fontSize: 27, fontWeight: "900" },
  sectionCard: { backgroundColor: COLORS.cream, gap: 9 },
  sectionTitle: { color: COLORS.brown, fontSize: 14, fontWeight: "800" },
  fieldRow: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 8 },
  fieldDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { flex: 1, color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  value: { flex: 1, color: COLORS.darkBrown, fontSize: 14, fontWeight: "600", textAlign: "right" },
  message: { color: COLORS.muted, lineHeight: 20 },
});
