import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppButton } from "../../components/common/AppButton";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { COLORS } from "../../constants/colors";
import { listRecordItems, loadAuthorizedUser, RecordListItem } from "../../services/recordRouteService";
import { loadData } from "../../services/storageService";
import { AppText as Text } from "../../components/common/AppText";
import { EmptyState } from "../../components/common/EmptyState";
import { formatUsDate } from "../../utils/dateUtils";

type RecordFilter = "Employees" | "Attendance" | "Payroll";
const RECORD_FILTERS: RecordFilter[] = ["Employees", "Attendance", "Payroll"];
const RECORD_PREFIX: Record<RecordFilter, string> = {
  Employees: "employee-",
  Attendance: "attendance-",
  Payroll: "payroll-",
};

export function RecordsScreen({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<RecordListItem[]>([]);
  const [filter, setFilter] = useState<RecordFilter | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
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

  const visibleItems = filter === null
    ? items
    : items.filter(item => item.id.startsWith(RECORD_PREFIX[filter]));
  const groupedItems = visibleItems.reduce<Record<string, RecordListItem[]>>((groups, item) => {
    (groups[item.date] ??= []).push(item);
    return groups;
  }, {});
  const dates = Object.keys(groupedItems).sort((left, right) => right.localeCompare(left));
  const toggleDate = (date: string) => setExpandedDates(current => {
    const next = new Set(current);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    return next;
  });

  return (
    <ScreenContainer title={embedded ? "Records" : "Home"} subtitle="Browse employee, attendance, and payroll records.">
      {!embedded ? <AppButton
        title="Back to dashboard"
        secondary
        onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
      /> : null}
      <View style={styles.filters}>
        {RECORD_FILTERS.map(option => <TouchableOpacity
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === option }}
          onPress={() => setFilter(current => current === option ? null : option)}
          style={[styles.filter, filter === option && styles.filterSelected]}
        >
          <Text style={[styles.filterText, filter === option && styles.filterTextSelected]}>{option}</Text>
        </TouchableOpacity>)}
      </View>
      {loading ? <ActivityIndicator color={COLORS.brown} /> : null}
      {error ? <Text style={styles.message}>{error}</Text> : null}
      {!loading && !error && visibleItems.length === 0
        ? <EmptyState
          title={filter === null ? "Nothing here just yet" : `No ${filter.toLowerCase()} records`}
          message={filter === null ? "Your employee, attendance, and payroll records will show up here as they’re added." : `There are no ${filter.toLowerCase()} records to show.`}
        />
        : null}
      {dates.map(date => {
        const isExpanded = expandedDates.has(date);
        const dayItems = groupedItems[date];
        return <View key={date} style={styles.folderGroup}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            accessibilityLabel={`${formatUsDate(date)}, ${dayItems.length} records`}
            onPress={() => toggleDate(date)}
            style={styles.folder}
          >
            <MaterialCommunityIcons name={isExpanded ? "folder-open-outline" : "folder-outline"} size={22} color={COLORS.brown} />
            <Text style={styles.folderDate}>{formatUsDate(date)}</Text>
            <Text style={styles.folderCount}>{dayItems.length}</Text>
            <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.muted} />
          </TouchableOpacity>
          {isExpanded ? <View style={styles.folderContents}>
            {dayItems.map(item => <TouchableOpacity
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
              <Text style={styles.openLabel}>Open</Text>
            </TouchableOpacity>)}
          </View> : null}
        </View>;
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  filter: { flex: 1, minWidth: 0, minHeight: 40, justifyContent: "center", alignItems: "center", paddingHorizontal: 5, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cream },
  filterSelected: { backgroundColor: COLORS.darkBrown, borderColor: COLORS.darkBrown },
  filterText: { color: COLORS.darkBrown, fontSize: 12, fontWeight: "700", textAlign: "center" },
  filterTextSelected: { color: COLORS.white },
  folderGroup: { gap: 7 },
  folder: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16 },
  folderDate: { flex: 1, color: COLORS.darkBrown, fontSize: 15, fontWeight: "800" },
  folderCount: { minWidth: 25, textAlign: "center", color: COLORS.brown, fontSize: 12, fontWeight: "800" },
  folderContents: { gap: 7, marginLeft: 12, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: COLORS.border },
  item: { backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  itemText: { flex: 1 },
  title: { color: COLORS.darkBrown, fontWeight: "800" },
  subtitle: { color: COLORS.muted, marginTop: 4, fontSize: 12 },
  openLabel: { color: COLORS.brown, fontSize: 13, fontWeight: "800" },
  message: { color: COLORS.muted, lineHeight: 20 },
});
