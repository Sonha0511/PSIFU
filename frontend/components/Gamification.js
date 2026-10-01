import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal } from 'react-native';

export default function Gamification({ userXu, onUpdateXu, hasCheckedInToday, onCheckInSuccess }) {
  const [showWheelResult, setShowWheelResult] = useState(false);
  const [wheelMessage, setWheelMessage] = useState('');
  const [wheelStatus, setWheelStatus] = useState('plus'); 

  const handleCheckIn = () => {
    if (hasCheckedInToday) {
      Alert.alert('Thông báo 📆', 'Hôm nay bạn đã điểm danh rồi!');
      return;
    }
    onCheckInSuccess();
    Alert.alert('Thành công 🪙', 'Bạn đã nhận được +1 Xu!');
  };

  const handleLuckyWheel = () => {
    if (userXu < 2) {
      Alert.alert('Thất bại 🛑', 'Bạn cần tối thiểu 2 Xu để tham gia Vòng quay may mắn!');
      return;
    }
    const rewards = [-2, -1, 3, 5];
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    onUpdateXu(randomReward);
    
    if (randomReward > 0) {
      setWheelStatus('plus');
      setWheelMessage(`Chúc mừng bạn trúng lớn! Vòng quay đem về cho ví của bạn thêm +${randomReward} Xu 🪙`);
    } else {
      setWheelStatus('minus');
      setWheelMessage(`Đen đủi rồi! Vòng quay lấy đi mất của bạn ${Math.abs(randomReward)} Xu từ tài khoản 🥲`);
    }
    setShowWheelResult(true);
  };

  return (
    <View>
      <Modal visible={showWheelResult} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>{wheelStatus === 'plus' ? '🎉🎁👑' : '💸💔👻'}</Text>
            <Text style={[styles.modalTitle, { color: wheelStatus === 'plus' ? '#10b981' : '#ef4444' }]}>
              {wheelStatus === 'plus' ? 'KẾT QUẢ: THẮNG LỚN!' : 'KẾT QUẢ: MẤT XU'}
            </Text>
            <Text style={styles.modalSub}>{wheelMessage}</Text>
            <TouchableOpacity style={[styles.btnPopupClose, { backgroundColor: wheelStatus === 'plus' ? '#10b981' : '#ef4444' }]} onPress={() => setShowWheelResult(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>XÁC NHẬN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.sectionTitle}>Nhiệm vụ nhận Xu tự động</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btnAction, { backgroundColor: hasCheckedInToday ? '#cbd5e1' : '#10b981' }]} onPress={handleCheckIn}>
          <Text style={styles.btnText}>{hasCheckedInToday ? '✓ Đã Điểm Danh' : '📆 Điểm Danh'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#8b5cf6'}]} onPress={handleLuckyWheel}>
          <Text style={styles.btnText}>🎡 Vòng Quay (-2đ)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155', marginTop: 10, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  btnAction: { flex: 0.48, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalCard: { backgroundColor: '#fff', width: '100%', padding: 24, borderRadius: 16, alignItems: 'center', borderTopWidth: 5, borderTopColor: '#ea580c' },
  modalEmoji: { fontSize: 32, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  modalSub: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  btnPopupClose: { width: '100%', padding: 12, borderRadius: 8, alignItems: 'center' }
});