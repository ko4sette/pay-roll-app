import React from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppText as Text } from "./AppText";
import { AppButton } from "./AppButton";
import { AppCard } from "./AppCard";
import { AppNotification } from "../../types";
import { COLORS } from "../../constants/colors";
import { formatTimeUpdated } from "../../utils/dateUtils";

export function NotificationInbox({ visible, notifications, readIds, onRead, onReadAll, onOpen, onClose }: {
  visible: boolean;
  notifications: AppNotification[];
  readIds: string[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onOpen: (notification: AppNotification) => void;
  onClose: () => void;
}) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.backdrop}><View style={styles.modal}>
      <View style={styles.heading}><View><Text style={styles.title}>Updates</Text><Text style={styles.subtitle}>{notifications.filter(item => !readIds.includes(item.id)).length} unread</Text></View><MaterialCommunityIcons name="bell-outline" size={25} color={COLORS.brown} /></View>
      {notifications.some(item => !readIds.includes(item.id)) ? <TouchableOpacity accessibilityRole="button" onPress={onReadAll} style={styles.readAll}><Text style={styles.readAllText}>Mark all as read</Text></TouchableOpacity> : null}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {notifications.map(item => {
          const read = readIds.includes(item.id);
          return <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}. ${read ? "Read" : "Unread"}. Open ${item.route}.`} onPress={() => onOpen(item)} activeOpacity={0.75}>
            <AppCard style={read ? styles.item : styles.unread}>
              <View style={[styles.dot, read && styles.readDot]} />
              <View style={styles.copy}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.message}>{item.message}</Text>{item.createdAt ? <Text style={styles.time}>{formatTimeUpdated(item.createdAt)}</Text> : null}</View>
              {!read ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mark as read" onPress={event => { event.stopPropagation(); onRead(item.id); }}><MaterialCommunityIcons name="check-circle-outline" size={20} color={COLORS.brown} /></TouchableOpacity> : null}
            </AppCard>
          </TouchableOpacity>;
        })}
        {!notifications.length ? <Text style={styles.empty}>You’re all caught up. New updates will appear here when your payroll data changes.</Text> : null}
      </ScrollView>
      <AppButton title="Close" secondary onPress={onClose} />
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(40,30,23,0.55)" },
  modal: { maxHeight: "88%", width: "100%", maxWidth: 620, alignSelf: "center", backgroundColor: COLORS.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, gap: 11 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: COLORS.darkBrown, fontSize: 23, fontWeight: "800" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  readAll: { alignSelf: "flex-start", paddingVertical: 3 },
  readAllText: { color: COLORS.brown, fontWeight: "700", fontSize: 13 },
  list: { flexShrink: 1 },
  listContent: { gap: 9, paddingBottom: 3 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  unread: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderColor: COLORS.brown, backgroundColor: COLORS.cream },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, marginTop: 5 },
  readDot: { backgroundColor: COLORS.border },
  copy: { flex: 1, gap: 3 },
  itemTitle: { color: COLORS.darkBrown, fontSize: 14, fontWeight: "800" },
  message: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
  time: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  empty: { color: COLORS.muted, fontSize: 14, lineHeight: 20, paddingVertical: 20, textAlign: "center" },
});
