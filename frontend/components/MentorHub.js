import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Database } from "../data/database";
import HomeLiveChat from "./HomeLiveChat";
import { getRoleTheme, sharedTheme } from "../theme/roleTheme";

const theme = getRoleTheme('mentor');

const DAYS = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];
const defaultSlots = DAYS.map((day, index) => ({
  day,
  ranges: [],
}));

export default function MentorHub({ mentor, screen = "home", onNavigate, onAvailabilitySaved }) {
  const [view, setView] = useState(screen === "sessions" ? "sessions" : "home");
  const [bookings, setBookings] = useState([]);
  const [accepting, setAccepting] = useState(
    mentor?.mentorAvailability?.accepting ?? true,
  );
  const [slots, setSlots] = useState(
    mentor?.mentorAvailability?.slots?.length
      ? mentor.mentorAvailability.slots
      : defaultSlots,
  );
  const [saving, setSaving] = useState(false);
  const loadBookings = async () => {
    try {
      const rows = await Database.getBookings();
      setBookings(rows.filter((row) => row.mentorEmail === mentor?.email));
    } catch {
      setBookings([]);
    }
  };
  useEffect(() => {
    loadBookings();
  }, [mentor?.email]);
  useEffect(() => {
    setView(screen === "sessions" ? "sessions" : "home");
  }, [screen]);
  useEffect(() => {
    setAccepting(mentor?.mentorAvailability?.accepting ?? true);
    setSlots(
      mentor?.mentorAvailability?.slots?.length
        ? mentor.mentorAvailability.slots
        : defaultSlots,
    );
  }, [mentor?.mentorAvailability]);
  const active = useMemo(
    () =>
      bookings.filter(
        (row) => ["Chờ mentor xác nhận", "Đã xác nhận"].includes(row.status),
      ),
    [bookings],
  );
  const saveAvailability = async () => {
    setSaving(true);
    try {
      const ok = await Database.updateUserData(mentor.email, {
        mentorAvailability: { accepting, slots },
      });
      if (!ok) throw new Error();
      Alert.alert(
        "Đã lưu lịch rảnh",
        "Thiết lập sẽ áp dụng cho các lượt đặt hẹn mới.",
      );
      onAvailabilitySaved?.({accepting, slots});
      setView("home");
    } catch {
      Alert.alert("Không thể lưu", "Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setSaving(false);
    }
  };
  const confirm = async (id) => {
    const ok = await Database.updateBookingStatus(id, "Đã xác nhận");
    if (!ok) return Alert.alert("Không thể xác nhận lịch", "Vui lòng thử lại.");
    loadBookings();
  };
  if (view === "availability")
    return (
      <Availability
        {...{
          accepting,
          setAccepting,
          slots,
          setSlots,
          onSave: saveAvailability,
          saving,
        }}
        onBack={() => setView("home")}
      />
    );
  if (view === "calendar")
    return <Calendar bookings={active} onBack={() => setView("sessions")} />;
  if (view === "sessions")
    return (
      <Sessions
        bookings={active}
        onBack={() => onNavigate?.("home")}
        onCalendar={() => setView("calendar")}
        onConfirm={confirm}
      />
    );
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Header
        title="Mentor Home"
        onNotification={() =>
          Alert.alert("Thông báo", "Bạn chưa có thông báo mới.")
        }
      />
      <View style={s.ambient} pointerEvents="none" />
      <Text style={s.brand}>PSIFU · MENTOR CONSOLE</Text>
      <Text style={s.greeting}>
        Xin chào, {mentor?.fullName || "Mentor"} 👋
      </Text>
      <View style={s.statRow}>
        <Stat
          value={active.length}
          label="Lịch sắp tới"
          icon="calendar-outline"
        />
        <Stat
          value={String(mentor?.availableXu ?? 0)}
          label="Xu khả dụng"
          icon="wallet-outline"
        />
      </View>
      <Section
        title="Lịch hẹn sắp tới"
        action="Xem tất cả"
        onPress={() => onNavigate?.("mentor")}
      />
      {active.slice(0, 2).map((item) => (
        <Booking
          key={item.id || item._id}
          item={item}
          onConfirm={() => confirm(item.id || item._id)}
        />
      ))}
      {!active.length && <Empty text="Chưa có lịch mentoring nào." />}
      <View style={s.card}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>Lịch rảnh</Text>
          <Text style={s.copy}>
            {accepting ? "Đang nhận booking mới" : "Đang tạm dừng nhận booking"}
          </Text>
        </View>
        <TouchableOpacity
          style={s.outline}
          onPress={() => setView("availability")}
        >
          <Text style={s.outlineText}>Quản lý</Text>
        </TouchableOpacity>
      </View>
      <Section title="PSIFU Chat" />
      <HomeLiveChat
        name={mentor?.fullName}
        email={mentor?.email}
        role="MENTOR"
        variant="mentor"
      />
      <Section
        title="Tài liệu của bạn"
        action="Quản lý tài liệu"
        onPress={() => onNavigate?.("docs")}
      />
      <TouchableOpacity style={s.card} onPress={() => onNavigate?.("docs")}>
        <Ionicons name="document-text-outline" size={24} color={theme.secondary} />
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>Quản lý tài liệu Mentor</Text>
          <Text style={s.copy}>
            Đăng, chỉnh sửa và theo dõi tài liệu của bạn.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function Header({ title, onNotification }) {
  return (
    <View style={s.header}>
      <Text style={s.title}>{title}</Text>
      <TouchableOpacity onPress={onNotification} accessibilityLabel="Thông báo">
        <Ionicons name="notifications-outline" size={21} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}
function Section({ title, action, onPress }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onPress}>
          <Text style={s.link}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
function Stat({ value, label, icon }) {
  return (
    <View style={s.stat}>
      <Ionicons name={icon} size={18} color={theme.secondary} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.copy}>{label}</Text>
    </View>
  );
}
function Empty({ text }) {
  return (
    <View style={s.empty}>
      <Ionicons name="calendar-clear-outline" size={28} color={theme.textMuted} />
      <Text style={s.copy}>{text}</Text>
    </View>
  );
}
function Booking({ item, onConfirm }) {
  const confirmed = item.status === "Đã xác nhận";
  return (
    <View style={s.booking}>
      <Text style={s.cardTitle}>{item.course || "Phiên mentoring"}</Text>
      <Text style={s.copy}>
        {item.menteeName || "Mentee"} · {item.dateTime || "Chưa có thời gian"}
      </Text>
      <View style={s.bookingFoot}>
        <Text style={confirmed ? s.ok : s.pending}>
          {confirmed ? "ĐÃ XÁC NHẬN" : "CHỜ XÁC NHẬN"}
        </Text>
        {!confirmed && (
          <TouchableOpacity style={s.smallButton} onPress={onConfirm}>
            <Text style={s.smallButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
function Sessions({ bookings, onBack, onCalendar, onConfirm }) {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <BackHeader
        title="Sessions"
        onBack={onBack}
        right="calendar-outline"
        onRight={onCalendar}
      />
      <Text style={s.copy}>Danh sách các phiên mentoring của bạn.</Text>
      {bookings.length ? (
        bookings.map((item) => (
          <Booking
            key={item.id || item._id}
            item={item}
            onConfirm={() => onConfirm(item.id || item._id)}
          />
        ))
      ) : (
        <Empty text="Chưa có session nào." />
      )}
    </ScrollView>
  );
}
function Calendar({ bookings, onBack }) {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <BackHeader title="Session Calendar" onBack={onBack} />
      <Text style={s.copy}>Lịch chỉ hiển thị session đã tạo.</Text>
      {bookings.map((item) => (
        <View key={item.id || item._id} style={s.booking}>
          <Text style={s.cardTitle}>{item.dateTime || "Đang cập nhật"}</Text>
          <Text style={s.copy}>
            {item.course || "Mentoring"} · {item.menteeName || "Mentee"}
          </Text>
        </View>
      ))}
      {!bookings.length && <Empty text="Chưa có sự kiện trong lịch." />}
    </ScrollView>
  );
}
function Availability({
  accepting,
  setAccepting,
  slots,
  setSlots,
  onSave,
  saving,
  onBack,
}) {
  const toggle = (day) =>
    setSlots((items) =>
      items.map((item) =>
        item.day === day
          ? { ...item, ranges: item.ranges.length ? [] : ["18:00 - 21:00"] }
          : item,
      ),
    );
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <BackHeader title="Lịch rảnh" onBack={onBack} />
      <Text style={s.copy}>
        Chọn ngày nhận booking. Lịch bận đã có sẽ luôn được máy chủ loại trừ.
      </Text>
      <View style={s.card}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>Nhận booking mới</Text>
          <Text style={s.copy}>{accepting ? "Đang mở" : "Đang tạm dừng"}</Text>
        </View>
        <Switch value={accepting} onValueChange={setAccepting} />
      </View>
      {slots.map((item) => (
        <TouchableOpacity
          key={item.day}
          style={s.card}
          onPress={() => toggle(item.day)}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{item.day}</Text>
            <Text style={s.copy}>
              {item.ranges.length ? item.ranges.join(", ") : "Không nhận lịch"}
            </Text>
          </View>
          <Text style={item.ranges.length ? s.ok : s.pending}>
            {item.ranges.length ? "BẬT" : "TẮT"}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity disabled={saving} style={s.primary} onPress={onSave}>
        <Text style={s.primaryText}>
          {saving ? "ĐANG LƯU..." : "LƯU LỊCH RẢNH"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
function BackHeader({ title, onBack, right, onRight }) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="arrow-back" size={21} color={theme.text} />
      </TouchableOpacity>
      <Text style={s.title}>{title}</Text>
      {right ? (
        <TouchableOpacity onPress={onRight}>
          <Ionicons name={right} size={20} color={theme.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 20 }} />
      )}
    </View>
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
  title: { color: theme.text, fontSize: 20, fontWeight: "900" },
  ambient: { position:'absolute', width:210, height:210, borderRadius:105, right:-115, top:40, backgroundColor:'rgba(33,199,199,.08)' },
  brand: { color: theme.secondary, fontSize: 10, fontWeight: "900", marginTop: 12, letterSpacing: 1.2 },
  greeting: { color: theme.text, fontSize: 23, fontWeight: "900", marginTop: 6 },
  statRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  stat: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: {
    color: theme.secondary,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 7,
  },
  copy: { color: theme.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 3 },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 9,
  },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: "900" },
  link: { color: theme.secondary, fontSize: 12, fontWeight: "900" },
  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 9,
  },
  cardTitle: { color: theme.text, fontSize: 14, fontWeight: "900" },
  outline: {
    borderWidth: 1,
    borderColor: theme.secondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  outlineText: { color: theme.secondary, fontWeight: "900", fontSize: 12 },
  booking: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 13,
    marginTop: 9,
  },
  bookingFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  ok: { color: sharedTheme.success, fontWeight: "900", fontSize: 11 },
  pending: { color: sharedTheme.warning, fontWeight: "900", fontSize: 11 },
  smallButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  smallButtonText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  chat: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 13,
  },
  live: { color: "#C21C3A", fontSize: 11, fontWeight: "900" },
  chatEmpty: { fontSize: 12, color: "#64748B", marginTop: 10 },
  message: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F6FD",
  },
  messageName: { fontSize: 11, color: theme.secondary, fontWeight: "900" },
  messageText: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  composer: {
    minHeight: 48,
    marginTop: 11,
    backgroundColor: theme.surfaceElevated,
    borderRadius: 9,
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  composerInput: { flex: 1, color: theme.text, fontSize: 14 },
  send: {
    width: 36,
    alignSelf: "stretch",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primary,
  },
  sendDisabled: { backgroundColor: theme.textMuted },
  empty: {
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 28,
    gap: 8,
  },
  primary: {
    minHeight: 50,
    backgroundColor: theme.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  primaryText: { color: "#fff", fontSize: 12, fontWeight: "900" },
});
