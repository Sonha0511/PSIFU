import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Database } from "../data/database";
import { io } from "socket.io-client";
import { getAccessToken, SOCKET_URL } from "../data/api";
import { getRoleTheme } from "../theme/roleTheme";

const ROOM = "homepage-live";
const asTime = (value) => {
  try {
    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export default function HomeLiveChat({ name, email, role = "MENTEE", variant }) {
  const theme = getRoleTheme(variant || (role === "MENTOR" ? "mentor" : "mentee"));
  const s = createStyles(theme);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const load = async () => {
    try {
      const rows = await Database.getChatMessages(ROOM);
      setMessages(rows);
    } catch {}
  };
  useEffect(() => {
    let socket;
    let alive = true;
    load();
    (async () => {
      try {
        const token = await getAccessToken();
        if (!alive) return;
        socket = io(SOCKET_URL, { transports: ["websocket"], auth: { token }, reconnection: true, reconnectionDelay: 700, reconnectionDelayMax: 5000 });
        socket.on("connect", () => { setConnected(true); socket.emit("chat:join", ROOM); });
        socket.on("disconnect", () => setConnected(false));
        socket.on("connect_error", () => setConnected(false));
        socket.on("chat:message", (message) => {
          if (message.roomId === ROOM)
            setMessages((rows) =>
              rows.some(
                (row) =>
                  (row.id || row._id) === (message.id || message._id) ||
                  (row.authorEmail === message.authorEmail &&
                    row.text === message.text),
              )
                ? rows
                : [...rows, message],
            );
        });
      } catch {}
    })();
    const fallback = setInterval(() => { if (!socket?.connected) load(); }, 12000);
    return () => {
      alive = false;
      clearInterval(fallback);
      socket?.disconnect();
    };
  }, []);
  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic = {
      user: name || "Bạn",
      authorEmail: email,
      role,
      text,
      createdAt: new Date().toISOString(),
    };
    setDraft("");
    setMessages((rows) => [...rows, optimistic]);
    try {
      const saved = await Database.saveChatMessage(ROOM, optimistic);
      setMessages((rows) =>
        rows.map((row) => (row === optimistic ? saved : row)),
      );
    } catch {
      setDraft(text);
      Alert.alert("Chưa gửi được tin nhắn", "Nội dung đã được giữ lại để bạn thử lại.");
      setMessages((rows) => rows.filter((row) => row !== optimistic));
    } finally {
      setSending(false);
    }
  };
  const feed = (
    <>
      {messages.length ? (
        messages.slice(open ? -50 : -4).map((item, index) => (
          <View
            key={item.id || item._id || `${item.createdAt}-${index}`}
            style={s.message}
          >
            <View style={s.messageHead}>
              <Text style={s.user}>{item.user || "Thành viên"}</Text>
              <Text style={[s.badge, item.role === "MENTOR" && s.mentorBadge]}>
                {item.role === "MENTOR" ? "MENTOR" : "MENTEE"}
              </Text>
              <Text style={s.time}>{asTime(item.createdAt)}</Text>
            </View>
            <Text style={s.messageText}>{item.text}</Text>
          </View>
        ))
      ) : (
        <Text style={s.empty}>
          Chưa có tin nhắn. Hãy mở đầu cuộc trò chuyện.
        </Text>
      )}
    </>
  );
  const composer = (
    <View style={s.composer}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={send}
        placeholder="Nhắn tin với mọi người…"
        placeholderTextColor={theme.textMuted}
        style={s.input}
        maxLength={1000}
      />
      <TouchableOpacity
        disabled={!draft.trim() || sending}
        onPress={send}
        style={[s.send, (!draft.trim() || sending) && s.sendDisabled]}
      >
        <Ionicons name="send" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
  return (
    <>
      <View style={s.card}>
        <View style={s.head}>
          <View>
            <View style={s.titleRow}>
              <Text style={s.title}>PSIFU Chat</Text>
              <Text style={[s.live, !connected && s.syncing]}>● {connected ? "LIVE" : "SYNC"}</Text>
            </View>
            <Text style={s.copy}>Phòng chat chung theo thời gian thực.</Text>
          </View>
          <TouchableOpacity onPress={() => setOpen(true)}>
            <Text style={s.open}>Open full chat</Text>
          </TouchableOpacity>
        </View>
        <View style={s.feed}>{feed}</View>
        {composer}
        <TouchableOpacity style={s.expand} onPress={() => setOpen(true)}>
          <Text style={s.expandText}>Open Full Chat Room →</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView style={s.modal} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={s.modalHead}>
            <View>
              <Text style={s.modalTitle}>PSIFU Chat</Text>
              <Text style={s.copy}>
                Sảnh chung · cập nhật theo thời gian thực
              </Text>
            </View>
            <TouchableOpacity style={s.exit} onPress={() => setOpen(false)}>
              <Ionicons name="close" size={20} color={theme.text} />
              <Text style={s.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.fullFeed}>{feed}</ScrollView>
          {composer}
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
const createStyles = theme => StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 15, color: theme.text, fontWeight: "900" },
  live: {
    fontSize: 11,
    color: "#E11D48",
    fontWeight: "900",
    backgroundColor: "#FFE7E7",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  syncing: { color: "#A16207", backgroundColor: "#FEF3C7" },
  copy: { fontSize: 12, color: theme.textSecondary, lineHeight: 18, marginTop: 3 },
  open: { fontSize: 12, color: theme.primary, fontWeight: "900" },
  feed: { gap: 7, marginTop: 10 },
  message: { backgroundColor: theme.surfaceElevated, borderRadius: 10, padding: 9, borderWidth: 1, borderColor: theme.border },
  messageHead: { flexDirection: "row", alignItems: "center", gap: 5 },
  user: { fontSize: 12, color: theme.text, fontWeight: "900" },
  badge: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: "900",
    backgroundColor: theme.surfaceMuted,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mentorBadge: { color: theme.accent, backgroundColor: theme.tint },
  time: { fontSize: 11, color: theme.textMuted, marginLeft: "auto" },
  messageText: { fontSize: 12, color: theme.textSecondary, lineHeight: 18, marginTop: 3 },
  empty: {
    fontSize: 12,
    color: theme.textSecondary,
    paddingVertical: 10,
    textAlign: "center",
  },
  composer: {
    height: 48,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
  },
  input: { flex: 1, color: theme.text, fontSize: 14, paddingVertical: 0 },
  send: {
    width: 38,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { backgroundColor: theme.textMuted },
  expand: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.tint,
    borderRadius: 7,
    marginTop: 8,
  },
  expandText: { color: theme.primary, fontSize: 12, fontWeight: "900" },
  modal: { flex: 1, backgroundColor: theme.background },
  modalHead: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: theme.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, color: theme.text, fontWeight: "900" },
  exit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.tint,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  exitText: { fontSize: 12, color: theme.text, fontWeight: "900" },
  fullFeed: { padding: 14, gap: 8, flexGrow: 1 },
});
