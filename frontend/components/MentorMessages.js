import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DirectMessage from "./DirectMessage";
import { getRoleTheme } from "../theme/roleTheme";
const theme = getRoleTheme('mentor');

export default function MentorMessages({ mentor, bookings, onBack }) {
  const [selected, setSelected] = useState(null);
  const rows = useMemo(
    () =>
      bookings.filter(
        (item) =>
          item.mentorEmail === mentor?.email &&
          !String(item.status).toLowerCase().includes("hủy"),
      ),
    [bookings, mentor?.email],
  );
  if (selected)
    return (
      <DirectMessage
        mentorName={mentor?.fullName || "Mentor"}
        mentorEmail={mentor?.email}
        menteeName={selected.menteeName || "Mentee"}
        booking={selected}
        currentUserName={mentor?.fullName || "Mentor"}
        currentUserEmail={mentor?.email}
        currentUserRole="MENTOR"
        onBack={() => setSelected(null)}
      />
    );
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={s.title}>Mentee Chat</Text>
        <View style={{ width: 22 }} />
      </View>
      <Text style={s.copy}>Chỉ hiển thị Mentee có lịch mentoring với bạn.</Text>
      {rows.length ? (
        rows.map((item) => (
          <TouchableOpacity
            key={item.id || item._id}
            style={s.row}
            onPress={() => setSelected(item)}
          >
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {String(item.menteeName || "M").slice(0, 1)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.menteeName || "Mentee"}</Text>
              <Text style={s.copy}>
                {item.course || "Mentoring"} ·{" "}
                {item.dateTime || "Đang cập nhật"}
              </Text>
              <Text style={s.link}>Nhấn để trò chuyện riêng</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ))
      ) : (
        <View style={s.empty}>
          <Ionicons name="chatbubbles-outline" size={34} color={theme.textMuted} />
          <Text style={s.name}>Chưa có Mentee để chat</Text>
          <Text style={s.copy}>Khi có booking, Mentee sẽ xuất hiện ở đây.</Text>
        </View>
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "900", color: theme.text },
  copy: { fontSize: 12, color: theme.textSecondary, lineHeight: 18, marginTop: 4 },
  row: {
    backgroundColor: theme.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900" },
  name: { fontSize: 14, color: theme.text, fontWeight: "900" },
  link: { fontSize: 12, color: theme.secondary, fontWeight: "900", marginTop: 5 },
  empty: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 35,
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
});
