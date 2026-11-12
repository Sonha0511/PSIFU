import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
const normalizeSlots = (value = []) =>
  DAYS.map((day) => {
    const saved = value.find((item) => item.day === day);
    return { day, ranges: Array.isArray(saved?.ranges) ? saved.ranges : [] };
  });

export default function MentorHub({ mentor, screen = "home", onNavigate, onAvailabilitySaved }) {
  const [view, setView] = useState(screen === "sessions" ? "sessions" : "home");
  const [bookings, setBookings] = useState([]);
  const [accepting, setAccepting] = useState(
    mentor?.mentorAvailability?.accepting ?? true,
  );
  const [slots, setSlots] = useState(
    normalizeSlots(mentor?.mentorAvailability?.slots),
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
      normalizeSlots(mentor?.mentorAvailability?.slots),
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
  const toggle = (day, enabled) =>
    setSlots((items) =>
      items.map((item) =>
        item.day === day
          ? { ...item, ranges: enabled ? [item.ranges[0] || "18:00 - 21:00"] : [] }
          : item,
      ),
    );
  const changeTime = (day, rangeIndex, edge, text) => {
    const cleaned = text.replace(/[^0-9:]/g, "").slice(0, 5);
    setSlots((items) =>
      items.map((item) => {
        if (item.day !== day) return item;
        const [from = "18:00", to = "21:00"] = String(
          item.ranges[rangeIndex] || "18:00 - 21:00",
        )
          .split("-")
          .map((value) => value.trim());
        const ranges = [...item.ranges];
        ranges[rangeIndex] = edge === "from" ? `${cleaned} - ${to}` : `${from} - ${cleaned}`;
        return {
          ...item,
          ranges,
        };
      }),
    );
  };
  const addRange = (day) =>
    setSlots((items) =>
      items.map((item) =>
        item.day === day
          ? { ...item, ranges: [...item.ranges, item.ranges.length ? "08:00 - 09:00" : "18:00 - 21:00"] }
          : item,
      ),
    );
  const removeRange = (day, rangeIndex) =>
    setSlots((items) =>
      items.map((item) =>
        item.day === day
          ? { ...item, ranges: item.ranges.filter((_, index) => index !== rangeIndex) }
          : item,
      ),
    );
  const save = () => {
    const validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    const minutes = (value) => {
      const [hour, minute] = value.split(":").map(Number);
      return hour * 60 + minute;
    };
    const invalid = slots.find((item) => item.ranges.some((range) => {
      const [from, to] = String(range).split("-").map((value) => value.trim());
      return !validTime(from) || !validTime(to) || minutes(to) - minutes(from) < 60;
    }));
    if (invalid) {
      Alert.alert(
        "Khung giờ chưa hợp lệ",
        `${invalid.day}: nhập giờ theo HH:mm và mở tối thiểu 60 phút.`,
      );
      return;
    }
    const overlapping = slots.find((item) => {
      const ordered = item.ranges.map((range) => range.split("-").map((value) => minutes(value.trim()))).sort((a, b) => a[0] - b[0]);
      return ordered.some((range, index) => index > 0 && range[0] < ordered[index - 1][1]);
    });
    if (overlapping) {
      Alert.alert("Khung giờ bị trùng", `${overlapping.day}: các khung giờ rảnh không được chồng lên nhau.`);
      return;
    }
    onSave();
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <BackHeader title="Lịch rảnh" onBack={onBack} />
      <Text style={s.copy}>
        Thiết lập lịch cố định hàng tuần hoặc thêm nhiều khung giờ rảnh cho từng thứ. Lịch bận đã có sẽ luôn được máy chủ loại trừ.
      </Text>
      <View style={s.card}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>Nhận booking mới</Text>
          <Text style={s.copy}>{accepting ? "Đang mở" : "Đang tạm dừng"}</Text>
        </View>
        <Switch value={accepting} onValueChange={setAccepting} />
      </View>
      {slots.map((item) => {
        const enabled = item.ranges.length > 0;
        return (
        <View key={item.day} style={s.availabilityCard}>
          <View style={s.dayHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.day}</Text>
              <Text style={s.copy}>{enabled ? `${item.ranges.length} khung giờ rảnh` : "Không nhận lịch"}</Text>
            </View>
            <Switch value={enabled} onValueChange={(value) => toggle(item.day, value)} />
          </View>
            {enabled ? (
              item.ranges.map((range, rangeIndex) => {
                const [from = "18:00", to = "21:00"] = String(range).split("-").map((value) => value.trim());
                return <View key={`${item.day}-${rangeIndex}`} style={s.timeRow}>
                  <TextInput value={from} onChangeText={(value) => changeTime(item.day, rangeIndex, "from", value)} placeholder="18:00" keyboardType="numbers-and-punctuation" style={s.timeInput} accessibilityLabel={`Giờ bắt đầu ${item.day} khung ${rangeIndex + 1}`} />
                  <Text style={s.timeSeparator}>đến</Text>
                  <TextInput value={to} onChangeText={(value) => changeTime(item.day, rangeIndex, "to", value)} placeholder="21:00" keyboardType="numbers-and-punctuation" style={s.timeInput} accessibilityLabel={`Giờ kết thúc ${item.day} khung ${rangeIndex + 1}`} />
                  <TouchableOpacity style={s.removeTime} onPress={() => removeRange(item.day, rangeIndex)} accessibilityLabel={`Xóa khung giờ ${rangeIndex + 1} ${item.day}`}>
                    <Ionicons name="trash-outline" size={18} color={sharedTheme.error} />
                  </TouchableOpacity>
                </View>;
              })
            ) : (
              null
            )}
          <TouchableOpacity style={s.addTime} onPress={() => addRange(item.day)}>
            <Ionicons name="add-circle-outline" size={18} color={theme.secondary} />
            <Text style={s.addTimeText}>Thêm lịch rảnh vào {item.day}</Text>
          </TouchableOpacity>
        </View>
      );})}
      <TouchableOpacity disabled={saving} style={s.primary} onPress={save}>
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
  availabilityCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 13,
    marginTop: 10,
  },
  dayHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  timeInput: {
    width: 76,
    minHeight: 40,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.surfaceElevated,
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  timeSeparator: { marginHorizontal: 8, color: theme.textSecondary, fontSize: 12 },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  removeTime: { width: 38, height: 38, marginLeft: 8, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "rgba(255,102,124,.10)" },
  addTime: { minHeight: 40, marginTop: 10, borderWidth: 1, borderStyle: "dashed", borderColor: theme.secondary, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  addTimeText: { color: theme.secondary, fontSize: 11, fontWeight: "900" },
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
