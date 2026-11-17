import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppCard } from "./AppCard";
import { AppText as Text } from "./AppText";
import { COLORS } from "../../constants/colors";
import { dateFromLocalString, daysBetweenLocalDates, formatUsDate, localDateString, nextSunday } from "../../utils/dateUtils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const monthLabel = (date: Date) => date.toLocaleDateString("en-PH", { month: "long", year: "numeric" });

export function PaydayCalendar({ configuredPayday }: { configuredPayday?: string | null }) {
  const [today, setToday] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const todayKey = localDateString(today);
  const storedDate = configuredPayday ? dateFromLocalString(configuredPayday) : null;
  const upcomingDate = storedDate && localDateString(storedDate) >= todayKey ? storedDate : nextSunday(today);
  const upcomingKey = localDateString(upcomingDate);
  const daysUntil = daysBetweenLocalDates(today, upcomingDate);
  const countdown = daysUntil === 0 ? "Payday is today" : `Payday in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;

  const calendarDays = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { date, key: localDateString(date), inMonth: date.getMonth() === visibleMonth.getMonth() };
    });
  }, [visibleMonth]);

  return <AppCard style={styles.card}>
    <View style={styles.topline}>
      <View style={styles.nextCopy}>
        <Text style={styles.eyebrow}>NEXT PAYDAY</Text>
        <Text style={styles.nextDate}>{formatUsDate(upcomingKey)}</Text>
        <Text style={styles.countdown}>{countdown}</Text>
      </View>
      <View style={styles.legend}><View style={styles.legendDot} /><Text style={styles.legendText}>Every Sunday</Text></View>
    </View>
    <View style={styles.monthRow}>
      <Text style={styles.month}>{monthLabel(visibleMonth)}</Text>
      <View style={styles.monthControls}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setVisibleMonth(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))} style={styles.monthButton}><MaterialCommunityIcons name="chevron-left" size={20} color={COLORS.darkBrown} /></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setVisibleMonth(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))} style={styles.monthButton}><MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.darkBrown} /></TouchableOpacity>
      </View>
    </View>
    <View style={styles.grid}>
      {WEEKDAYS.map((day, index) => <View key={`${day}-${index}`} style={styles.cell}><Text style={styles.weekday}>{day}</Text></View>)}
      {calendarDays.map(({ date, key, inMonth }) => {
        const isSunday = date.getDay() === 0;
        const isToday = key === todayKey;
        const isUpcoming = key === upcomingKey;
        return <View key={key} style={styles.cell}>
          <View style={[styles.day, isSunday && styles.sunday, isToday && styles.today, isUpcoming && styles.upcoming]}>
            <Text style={[styles.dayText, !inMonth && styles.outsideMonth, isSunday && styles.sundayText, isToday && styles.todayText, isUpcoming && styles.emphasis]}>{date.getDate()}</Text>
          </View>
        </View>;
      })}
    </View>
  </AppCard>;
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  nextCopy: { gap: 2 },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  nextDate: { color: COLORS.darkBrown, fontSize: 20, fontWeight: "800" },
  countdown: { color: COLORS.brown, fontSize: 13, fontWeight: "700" },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.caramel },
  legendText: { color: COLORS.muted, fontSize: 11 },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 5, borderTopWidth: 1, borderTopColor: COLORS.border },
  month: { color: COLORS.darkBrown, fontSize: 15, fontWeight: "700" },
  monthControls: { flexDirection: "row", gap: 5 },
  monthButton: { width: 30, height: 30, borderRadius: 9, backgroundColor: COLORS.cream, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 3 },
  cell: { width: `${100 / 7}%`, height: 29, alignItems: "center", justifyContent: "center" },
  weekday: { color: COLORS.muted, fontSize: 11, fontWeight: "800" },
  day: { width: 26, height: 26, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  sunday: { backgroundColor: "#E4CFAD" },
  today: { backgroundColor: "#D6C1A3", borderWidth: 1, borderColor: COLORS.brown },
  todayText: { color: COLORS.darkBrown, fontWeight: "900" },
  upcoming: { backgroundColor: COLORS.brown },
  dayText: { color: COLORS.darkBrown, fontSize: 11 },
  sundayText: { fontWeight: "800" },
  emphasis: { color: COLORS.white, fontWeight: "800" },
  outsideMonth: { opacity: 0.42 },
});
