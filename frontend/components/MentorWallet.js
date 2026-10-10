import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Database } from "../data/database";

const BANKS = [
  ["MB Bank", "970422"],
  ["Vietcombank", "970436"],
  ["Techcombank", "970407"],
  ["BIDV", "970418"],
  ["VietinBank", "970415"],
  ["ACB", "970416"],
  ["TPBank", "970423"],
  ["VPBank", "970432"],
];
const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} Xu`;
const mask = (value) =>
  value ? `•••• ${String(value).slice(-4)}` : "Chưa chọn";
const statusLabel = (value) =>
  ({
    SUCCESS: "ĐÃ DUYỆT",
    FAILED: "ĐÃ TỪ CHỐI",
    CANCELLED: "ĐÃ HỦY",
    PROCESSING: "CHỜ XÉT DUYỆT",
  })[String(value || "").toUpperCase()] || "CHỜ XÉT DUYỆT";

export default function MentorWallet({ user, onBack, onUserUpdate }) {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [amount, setAmount] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bank, setBank] = useState(BANKS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const available = Number(user?.availableXu ?? 0);
  const value = Number(amount || 0);
  const selectedAccount = useMemo(
    () =>
      accounts.find((item) => item.id === selected) ||
      accounts.find((item) => item.accountNumber === selected) ||
      null,
    [accounts, selected],
  );
  const load = async () => {
    setLoading(true);
    try {
      const [banks, rows] = await Promise.all([
        Database.getMentorBankAccounts(user.email),
        Database.getPayouts(user.email),
      ]);
      setAccounts(banks.accounts || []);
      setSelected(
        banks.selectedAccountNumber || banks.accounts?.[0]?.id || null,
      );
      setPayouts(rows || []);
    } catch (error) {
      Alert.alert("Không tải được ví", error?.data?.msg || "Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [user?.email]);
  const addAccount = async () => {
    if (!/^\d{6,19}$/.test(accountNumber) || !accountHolder.trim())
      return Alert.alert(
        "Thông tin chưa hợp lệ",
        "Nhập số tài khoản gồm 6–19 chữ số và tên chủ tài khoản.",
      );
    setSubmitting(true);
    try {
      const result = await Database.addMentorBankAccount(user.email, {
        bankName: bank[0],
        bin: bank[1],
        accountNumber,
        accountHolder,
      });
      setAccounts(result.accounts || []);
      setSelected(result.selectedAccountNumber);
      setShowForm(false);
      setAccountNumber("");
      setAccountHolder("");
      Alert.alert(
        "Đã thêm tài khoản",
        "Tài khoản đã được lưu. Bạn có thể chọn làm tài khoản nhận tiền.",
      );
    } catch (error) {
      Alert.alert(
        "Không thể thêm tài khoản",
        error?.data?.msg || "Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const choose = async (item) => {
    try {
      await Database.selectMentorBankAccount(user.email, item.id);
      setSelected(item.id);
      onUserUpdate?.({ ...user, bankAccount: item });
    } catch (error) {
      Alert.alert(
        "Không thể chọn tài khoản",
        error?.data?.msg || "Vui lòng thử lại.",
      );
    }
  };
  const requestPayout = async () => {
    if (!selectedAccount)
      return Alert.alert(
        "Chưa chọn tài khoản",
        "Hãy thêm hoặc chọn tài khoản nhận tiền trước.",
      );
    if (!Number.isInteger(value) || value < 50)
      return Alert.alert("Số Xu chưa hợp lệ", "Số Xu rút tối thiểu là 50 Xu.");
    if (value > available)
      return Alert.alert(
        "Số dư không đủ",
        "Số Xu rút không được vượt số dư khả dụng.",
      );
    setSubmitting(true);
    try {
      const result = await Database.createPayout(user.email, value);
      setPayouts((rows) => [result.payout, ...rows]);
      setAmount("");
      onUserUpdate?.({ ...user, availableXu: result.availableXu });
      Alert.alert(
        "Đã gửi yêu cầu rút",
        "Yêu cầu đang chờ PSIFU xét duyệt và đối soát. Không có chuyển tiền tức thì trong ứng dụng.",
      );
    } catch (error) {
      Alert.alert(
        "Không tạo được yêu cầu",
        error?.data?.msg || "Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (loading)
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#155EEF" />
        <Text style={s.copy}>Đang tải ví Mentor…</Text>
      </View>
    );
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Header onBack={onBack} />
      <View style={s.hero}>
        <Text style={s.heroLabel}>SỐ DƯ KHẢ DỤNG</Text>
        <Text style={s.heroValue}>{money(user?.availableXu)}</Text>
        <Text style={s.heroCopy}>
          Xu chỉ được trừ sau khi bạn gửi yêu cầu rút. Mọi yêu cầu đều chờ PSIFU
          xét duyệt.
        </Text>
      </View>
      <Title
        text="Tài khoản nhận tiền"
        action="+ Thêm tài khoản"
        onPress={() => setShowForm((value) => !value)}
      />
      {showForm && (
        <View style={s.form}>
          <Text style={s.formTitle}>Thêm tài khoản ngân hàng</Text>
          <Text style={s.label}>Chọn ngân hàng</Text>
          <View style={s.bankGrid}>
            {BANKS.map((item) => (
              <TouchableOpacity
                key={item[1]}
                style={[s.bankChip, bank[1] === item[1] && s.bankChipOn]}
                onPress={() => setBank(item)}
              >
                <Text
                  style={[
                    s.bankChipText,
                    bank[1] === item[1] && s.bankChipTextOn,
                  ]}
                >
                  {item[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.bin}>
            Mã BIN: {bank[1]} · được điền theo ngân hàng đã chọn
          </Text>
          <Text style={s.label}>Số tài khoản</Text>
          <TextInput
            style={s.input}
            value={accountNumber}
            onChangeText={(value) => setAccountNumber(value.replace(/\D/g, ""))}
            keyboardType="number-pad"
            maxLength={19}
            placeholder="Nhập số tài khoản"
            placeholderTextColor="#8A9BB5"
          />
          <Text style={s.label}>Tên chủ tài khoản</Text>
          <TextInput
            style={s.input}
            value={accountHolder}
            onChangeText={setAccountHolder}
            autoCapitalize="characters"
            placeholder="NGUYEN VAN A"
            placeholderTextColor="#8A9BB5"
          />
          <Text style={s.note}>
            Hãy kiểm tra thông tin trước khi lưu. PSIFU không tự xác minh chủ
            tài khoản với ngân hàng.
          </Text>
          <TouchableOpacity
            style={[s.primary, submitting && s.disabled]}
            disabled={submitting}
            onPress={addAccount}
          >
            <Text style={s.primaryText}>
              {submitting ? "ĐANG LƯU..." : "LƯU TÀI KHOẢN"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {accounts.length ? (
        accounts.map((item) => (
          <TouchableOpacity
            key={item.id || item.accountNumber}
            style={[
              s.account,
              selectedAccount?.accountNumber === item.accountNumber &&
                s.accountOn,
            ]}
            onPress={() => choose(item)}
          >
            <View style={s.bankIcon}>
              <Ionicons name="card-outline" size={20} color="#155EEF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.accountTitle}>{item.bankName}</Text>
              <Text style={s.copy}>
                {item.accountHolder} · {mask(item.accountNumber)}
              </Text>
              <Text style={s.bin}>BIN: {item.bin || "Chưa có"}</Text>
            </View>
            <Ionicons
              name={
                selectedAccount?.accountNumber === item.accountNumber
                  ? "radio-button-on"
                  : "radio-button-off"
              }
              size={21}
              color="#155EEF"
            />
          </TouchableOpacity>
        ))
      ) : (
        <View style={s.empty}>
          <Ionicons name="card-outline" size={29} color="#71829D" />
          <Text style={s.copy}>
            Chưa có tài khoản nhận tiền. Thêm ít nhất một tài khoản để gửi yêu
            cầu rút Xu.
          </Text>
        </View>
      )}
      <Title text="Yêu cầu rút Xu" />
      <View style={s.withdraw}>
        <Text style={s.copy}>
          Tài khoản nhận:{" "}
          {selectedAccount
            ? `${selectedAccount.bankName} · ${mask(selectedAccount.accountNumber)}`
            : "Chưa chọn"}
        </Text>
        <View style={s.amount}>
          <TextInput
            value={amount}
            onChangeText={(value) => setAmount(value.replace(/\D/g, ""))}
            keyboardType="number-pad"
            placeholder="Số Xu muốn rút"
            placeholderTextColor="#8A9BB5"
            style={s.amountInput}
          />
          <Text style={s.xu}>Xu</Text>
          <TouchableOpacity onPress={() => setAmount(String(available))}>
            <Text style={s.max}>TỐI ĐA</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.copy}>
          Tối thiểu 50 Xu · tương đương khoảng{" "}
          {value ? `${(value * 1000).toLocaleString("vi-VN")} VND` : "0 VND"}.
        </Text>
        <TouchableOpacity
          style={[s.primary, (!selectedAccount || submitting) && s.disabled]}
          disabled={!selectedAccount || submitting}
          onPress={requestPayout}
        >
          <Text style={s.primaryText}>
            {submitting ? "ĐANG GỬI..." : "GỬI YÊU CẦU RÚT — CHỜ XÉT DUYỆT"}
          </Text>
        </TouchableOpacity>
      </View>
      <Title text="Lịch sử yêu cầu rút" />
      {payouts.length ? (
        payouts.map((item) => (
          <View key={item.id || item.payoutCode} style={s.payout}>
            <View style={{ flex: 1 }}>
              <Text style={s.accountTitle}>{money(item.amountXu)}</Text>
              <Text style={s.copy}>
                {item.payoutCode} ·{" "}
                {item.bankAccount?.bankName || "Tài khoản đã chọn"}
              </Text>
              <Text style={s.copy}>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString("vi-VN")
                  : "Đang cập nhật"}
              </Text>
            </View>
            <Text
              style={[
                s.status,
                String(item.status).toUpperCase() === "COMPLETED" &&
                  s.completed,
              ]}
            >
              {statusLabel(item.status)}
            </Text>
          </View>
        ))
      ) : (
        <View style={s.empty}>
          <Ionicons name="time-outline" size={28} color="#71829D" />
          <Text style={s.copy}>Chưa có yêu cầu rút Xu nào.</Text>
        </View>
      )}
    </ScrollView>
  );
}
function Header({ onBack }) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color="#102A56" />
      </TouchableOpacity>
      <Text style={s.title}>Ví Mentor</Text>
      <View style={{ width: 22 }} />
    </View>
  );
}
function Title({ text, action, onPress }) {
  return (
    <View style={s.titleRow}>
      <Text style={s.sectionTitle}>{text}</Text>
      {action && (
        <TouchableOpacity onPress={onPress}>
          <Text style={s.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFF" },
  content: { padding: 16, paddingBottom: 40 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F8FAFF",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, color: "#102A56", fontWeight: "900" },
  hero: {
    backgroundColor: "#155EEF",
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
  },
  heroLabel: { fontSize: 11, color: "#DCE8FF", fontWeight: "900" },
  heroValue: { fontSize: 30, color: "#fff", fontWeight: "900", marginTop: 5 },
  heroCopy: { fontSize: 13, color: "#E5EDFF", lineHeight: 19, marginTop: 8 },
  titleRow: {
    marginTop: 22,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, color: "#102A56", fontWeight: "900" },
  action: { fontSize: 12, color: "#155EEF", fontWeight: "900" },
  form: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E3F5",
    padding: 14,
    marginBottom: 8,
  },
  formTitle: { fontSize: 14, color: "#102A56", fontWeight: "900" },
  label: {
    fontSize: 12,
    color: "#102A56",
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 6,
  },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  bankChip: {
    backgroundColor: "#EEF2F8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  bankChipOn: { backgroundColor: "#155EEF" },
  bankChipText: { fontSize: 11, color: "#40536F", fontWeight: "800" },
  bankChipTextOn: { color: "#fff" },
  bin: { fontSize: 11, color: "#155EEF", fontWeight: "800", marginTop: 7 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D7E3F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#102A56",
    fontSize: 14,
  },
  note: { fontSize: 12, color: "#64748B", lineHeight: 18, marginTop: 11 },
  account: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D7E3F5",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 9,
  },
  accountOn: { borderColor: "#155EEF", backgroundColor: "#F1F5FF" },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  accountTitle: { fontSize: 14, color: "#102A56", fontWeight: "900" },
  copy: { fontSize: 12, color: "#64748B", lineHeight: 18, marginTop: 3 },
  empty: {
    alignItems: "center",
    padding: 26,
    gap: 9,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E8F5",
    borderRadius: 14,
  },
  withdraw: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D7E3F5",
    borderRadius: 14,
    padding: 14,
  },
  amount: {
    height: 52,
    borderRadius: 11,
    backgroundColor: "#F1F5FF",
    borderWidth: 1,
    borderColor: "#C6D8FF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 11,
  },
  amountInput: { flex: 1, color: "#155EEF", fontWeight: "900", fontSize: 20 },
  xu: { color: "#155EEF", fontWeight: "900", fontSize: 13 },
  max: {
    color: "#155EEF",
    fontSize: 11,
    fontWeight: "900",
    backgroundColor: "#DCE8FF",
    padding: 7,
    borderRadius: 7,
    marginLeft: 8,
  },
  primary: {
    minHeight: 50,
    borderRadius: 11,
    backgroundColor: "#155EEF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 10,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },
  disabled: { opacity: 0.5 },
  payout: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E8F5",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },
  status: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "900",
    maxWidth: 105,
    textAlign: "right",
  },
  completed: { color: "#15803D" },
});
