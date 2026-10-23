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
      {detail?.fields.map(field => (
        <AppCard key={field.label}>
          <View style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>
            <Text style={styles.value}>{field.value}</Text>
          </View>
        </AppCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  value: { color: COLORS.darkBrown, fontSize: 15 },
  message: { color: COLORS.muted, lineHeight: 20 },
});
