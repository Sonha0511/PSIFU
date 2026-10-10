import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Database } from "../data/database";
const courses = ["PRF192", "PRO192", "DBI202", "CSD201"];
const categories = [
  "Study Notes",
  "Exam Review",
  "Practice Code",
  "Study Guide",
];

export default function MentorDocuments({ mentor }) {
  const [docs, setDocs] = useState([]),
    [screen, setScreen] = useState("list"),
    [editing, setEditing] = useState(null),
    [file, setFile] = useState(null),
    [title, setTitle] = useState(""),
    [course, setCourse] = useState("PRF192"),
    [category, setCategory] = useState("Exam Review"),
    [description, setDescription] = useState(""),
    [fee, setFee] = useState(15),
    [preview, setPreview] = useState(2),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("Tất cả");
  const load = async () => {
    try {
      setDocs(await Database.getMentorDocuments(mentor?.email));
    } catch {
      setDocs([]);
    }
  };
  useEffect(() => {
    load();
  }, [mentor?.email]);
  const reset = () => {
    setEditing(null);
    setFile(null);
    setTitle("");
    setCourse("PRF192");
    setCategory("Exam Review");
    setDescription("");
    setFee(15);
    setPreview(2);
  };
  const openNew = () => {
    reset();
    setScreen("form");
  };
  const openEdit = (doc) => {
    setEditing(doc);
    setFile(null);
    setTitle(doc.title || "");
    setCourse(doc.course || "PRF192");
    setCategory(doc.category || "Exam Review");
    setDescription(doc.description || "");
    setFee(Number(doc.fee || 15));
    setPreview(Number(doc.previewPages || 2));
    setScreen("form");
  };
  const choose = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (!result.canceled) setFile(result.assets[0]);
  };
  const upload = async () => {
    const sign = await Database.getCloudinaryUploadSignature(
      mentor.email,
      file.name,
    );
    const form = new FormData();
    form.append("file", new File(file.uri));
    form.append("api_key", String(sign.apiKey));
    form.append("timestamp", String(sign.timestamp));
    form.append("folder", sign.folder);
    form.append("public_id", sign.publicId);
    form.append("signature", sign.signature);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${sign.cloudName}/raw/upload`,
      { method: "POST", body: form },
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.error?.message || "Cloudinary không thể tải tệp lên.",
      );
    return {
      fileUri: data.secure_url,
      cloudinaryPublicId: data.public_id,
      fileSize: file.size || 0,
      fileName: file.name,
      mimeType: file.mimeType || "application/pdf",
    };
  };
  const save = async (status) => {
    if (!title.trim() || !description.trim() || (!file && !editing))
      return Alert.alert(
        "Thiếu thông tin",
        "Nhập tiêu đề, mô tả và chọn PDF cho tài liệu mới.",
      );
    try {
      setBusy(true);
      const uploadData = file ? await upload() : {};
      const payload = {
        title: title.trim(),
        course,
        category,
        description: description.trim(),
        fee,
        previewPages: preview,
        status,
        ...uploadData,
      };
      if (editing) {
        const result = await Database.updateMentorDocument(
          editing.id || editing._id,
          payload,
        );
        setDocs((rows) =>
          rows.map((item) =>
            (item.id || item._id) === (editing.id || editing._id)
              ? result.document
              : item,
          ),
        );
      } else {
        const saved = await Database.saveMentorDocument({
          ...payload,
          mentorEmail: mentor.email,
          mentorName: mentor.fullName,
          term: "Kỳ hiện tại",
          specialty: mentor.specialty || "Mentor PSIFU",
          pages: 0,
          unlocks: 0,
          revenue: 0,
        });
        setDocs((rows) => [saved, ...rows]);
      }
      reset();
      setScreen("list");
      Alert.alert("Đã lưu", "Tài liệu đã được lưu trên máy chủ.");
    } catch (error) {
      Alert.alert(
        "Không thể lưu",
        error?.data?.msg || error.message || "Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = (doc) =>
    Alert.alert(
      "Xóa tài liệu",
      "Tài liệu và quyền mở khóa liên quan sẽ bị xóa.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await Database.deleteMentorDocument(doc.id || doc._id);
              setDocs((rows) =>
                rows.filter(
                  (item) => (item.id || item._id) !== (doc.id || doc._id),
                ),
              );
            } catch (error) {
              Alert.alert(
                "Không thể xóa",
                error?.data?.msg || "Vui lòng thử lại.",
              );
            }
          },
        },
      ],
    );
  const view = async (doc) => {
    if (!doc.fileUri)
      return Alert.alert("Chưa có tệp", "Tài liệu này chưa có đường dẫn PDF.");
    try {
      await Linking.openURL(doc.fileUri);
    } catch {
      Alert.alert("Không thể mở PDF", "Vui lòng thử lại.");
    }
  };
  const share = (doc) =>
    Share.share({
      message: `${doc.title}\n${doc.fileUri || "Tài liệu PSIFU"}`,
    });
  if (screen === "form")
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <Header
          title={editing ? "Chỉnh sửa tài liệu" : "Tải tài liệu"}
          back={() => {
            reset();
            setScreen("list");
          }}
        />
        <Text style={s.tip}>
          PDF được tải lên Cloudinary bằng chữ ký ngắn hạn.
        </Text>
        <Label t="Tiêu đề *" />
        <TextInput
          style={s.input}
          value={title}
          onChangeText={setTitle}
          placeholder="PRF192 Final Review"
        />
        <Label t="Môn học" />
        <Chips values={courses} selected={course} set={setCourse} />
        <Label t="Phân loại" />
        <Chips values={categories} selected={category} set={setCategory} />
        <Label t="Mô tả *" />
        <TextInput
          style={[s.input, s.bio]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Tóm tắt nội dung..."
        />
        <Label t="Tệp PDF" />
        <TouchableOpacity style={s.file} disabled={busy} onPress={choose}>
          <Ionicons name="document-text" size={25} color="#155EEF" />
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>
              {file?.name || editing?.fileName || "Chọn tệp PDF"}
            </Text>
            <Text style={s.copy}>
              {editing && !file ? "Giữ tệp hiện tại" : "Tối đa 50 MB"}
            </Text>
          </View>
          <Ionicons name="cloud-upload-outline" size={21} color="#155EEF" />
        </TouchableOpacity>
        <Label t="Giá mở khóa" />
        <Chips
          values={[10, 15, 20].map((x) => `${x} Xu`)}
          selected={`${fee} Xu`}
          set={(x) => setFee(Number(x.split(" ")[0]))}
        />
        <Label t="Trang xem trước" />
        <Chips
          values={[1, 2, 3].map((x) => `${x} trang`)}
          selected={`${preview} trang`}
          set={(x) => setPreview(Number(x.split(" ")[0]))}
        />
        <Button
          busy={busy}
          title={editing ? "LƯU THAY ĐỔI" : "XUẤT BẢN"}
          onPress={() => save("PUBLISHED")}
        />
        <TouchableOpacity
          style={s.draft}
          disabled={busy}
          onPress={() => save("DRAFT")}
        >
          <Text style={s.draftText}>Lưu bản nháp</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  const visible = docs.filter(
    (doc) =>
      filter === "Tất cả" ||
      (filter === "Đã xuất bản"
        ? doc.status === "PUBLISHED"
        : doc.status === "DRAFT"),
  );
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Header title="Tài liệu Mentor" />
      <View style={s.rowBetween}>
        <Text style={s.copy}>Quản lý học liệu bạn đã đăng.</Text>
        <TouchableOpacity style={s.add} onPress={openNew}>
          <Text style={s.addText}>+ Upload</Text>
        </TouchableOpacity>
      </View>
      <View style={s.filters}>
        {["Tất cả", "Đã xuất bản", "Bản nháp"].map((x) => (
          <TouchableOpacity
            key={x}
            style={[s.chip, filter === x && s.chipOn]}
            onPress={() => setFilter(x)}
          >
            <Text style={[s.chipText, filter === x && s.chipTextOn]}>{x}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {visible.map((doc) => (
        <View key={doc.id || doc._id} style={s.card}>
          <View style={s.docHead}>
            <View style={s.icon}>
              <Ionicons name="document-text" size={21} color="#155EEF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.course}>
                {doc.course} · {doc.status}
              </Text>
              <Text style={s.cardTitle}>{doc.title}</Text>
              <Text style={s.copy} numberOfLines={2}>
                {doc.description}
              </Text>
            </View>
          </View>
          <View style={s.stats}>
            <Text style={s.stat}>{doc.fee || 0} Xu</Text>
            <Text style={s.stat}>{doc.unlocks || 0} lượt mở</Text>
            <Text style={s.stat}>{doc.revenue || 0} Xu doanh thu</Text>
          </View>
          <View style={s.actions}>
            <Action icon="eye-outline" text="Xem" onPress={() => view(doc)} />
            <Action
              icon="create-outline"
              text="Sửa"
              onPress={() => openEdit(doc)}
            />
            <Action
              icon="share-social-outline"
              text="Chia sẻ"
              onPress={() => share(doc)}
            />
            <TouchableOpacity style={s.delete} onPress={() => remove(doc)}>
              <Ionicons name="trash-outline" size={16} color="#D92D20" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {!visible.length && (
        <View style={s.empty}>
          <Ionicons name="document-outline" size={32} color="#71829D" />
          <Text style={s.copy}>Chưa có tài liệu trong mục này.</Text>
        </View>
      )}
    </ScrollView>
  );
}
function Header({ title, back }) {
  return (
    <View style={s.header}>
      {back ? (
        <TouchableOpacity onPress={back}>
          <Ionicons name="arrow-back" size={22} color="#102A56" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 22 }} />
      )}
      <Text style={s.title}>{title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );
}
function Label({ t }) {
  return <Text style={s.label}>{t}</Text>;
}
function Chips({ values, selected, set }) {
  return (
    <View style={s.chips}>
      {values.map((x) => (
        <TouchableOpacity
          key={x}
          style={[s.chip, selected === x && s.chipOn]}
          onPress={() => set(x)}
        >
          <Text style={[s.chipText, selected === x && s.chipTextOn]}>{x}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
function Button({ busy, title, onPress }) {
  return (
    <TouchableOpacity
      disabled={busy}
      onPress={onPress}
      style={[s.primary, busy && s.disabled]}
    >
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={s.primaryText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
function Action({ icon, text, onPress }) {
  return (
    <TouchableOpacity style={s.action} onPress={onPress}>
      <Ionicons name={icon} size={16} color="#155EEF" />
      <Text style={s.actionText}>{text}</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFF" },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, color: "#102A56", fontWeight: "900" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  copy: { fontSize: 12, color: "#64748B", lineHeight: 18, marginTop: 3 },
  add: {
    backgroundColor: "#155EEF",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addText: { fontSize: 12, color: "#fff", fontWeight: "900" },
  filters: { flexDirection: "row", gap: 7, marginTop: 13 },
  chips: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  chip: {
    backgroundColor: "#EEF2F8",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chipOn: { backgroundColor: "#155EEF" },
  chipText: { fontSize: 11, color: "#40536F", fontWeight: "800" },
  chipTextOn: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E8F5",
    padding: 12,
    marginTop: 10,
  },
  docHead: { flexDirection: "row", gap: 10 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  course: { fontSize: 11, color: "#155EEF", fontWeight: "900" },
  cardTitle: {
    fontSize: 14,
    color: "#102A56",
    fontWeight: "900",
    marginTop: 3,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    padding: 8,
    backgroundColor: "#F5F7FC",
    borderRadius: 8,
  },
  stat: { fontSize: 11, color: "#536E99", fontWeight: "800" },
  actions: { flexDirection: "row", gap: 7, marginTop: 10 },
  action: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  actionText: { fontSize: 11, color: "#155EEF", fontWeight: "900" },
  delete: {
    width: 34,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FEE4E2",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", padding: 44, gap: 8 },
  tip: {
    backgroundColor: "#EAF1FF",
    padding: 11,
    borderRadius: 10,
    fontSize: 12,
    color: "#40536F",
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: "#102A56",
    fontWeight: "900",
    marginTop: 16,
    marginBottom: 7,
  },
  input: {
    height: 48,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E8F5",
    borderRadius: 10,
    paddingHorizontal: 11,
    color: "#102A56",
    fontSize: 14,
  },
  bio: { height: 90, textAlignVertical: "top", paddingTop: 10 },
  file: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E8F5",
    borderRadius: 11,
    padding: 12,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
  },
  primary: {
    minHeight: 50,
    borderRadius: 11,
    backgroundColor: "#155EEF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  draft: {
    minHeight: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#C7D7F5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
  },
  draftText: { color: "#155EEF", fontSize: 12, fontWeight: "900" },
  disabled: { opacity: 0.55 },
});
