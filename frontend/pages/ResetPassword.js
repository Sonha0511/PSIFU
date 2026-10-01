import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../data/database';

export default function ResetPassword({ email, otpCode, onBack, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password.length < 6) return setError('Mật khẩu mới cần có ít nhất 6 ký tự.');
    if (password !== confirmPassword) return setError('Xác nhận mật khẩu chưa khớp.');
    setLoading(true); setError('');
    const result = await Database.completePasswordReset(email, otpCode, password);
    setLoading(false);
    if (!result.success) return setError(result.msg || 'Không thể đặt lại mật khẩu.');
    Alert.alert('Đặt lại mật khẩu thành công', 'Mật khẩu mới đã được lưu. Hãy đăng nhập để tiếp tục.', [{ text: 'Đăng nhập', onPress: () => onComplete(email) }]);
  };

  const passwordField = (label, value, setValue, visible, setVisible, placeholder) => <>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrap, error && styles.inputError]}>
      <Ionicons name="lock-closed-outline" size={20} color="#7185A2" />
      <TextInput style={styles.input} value={value} onChangeText={(next) => { setValue(next); setError(''); }} placeholder={placeholder} placeholderTextColor="#8194AE" secureTextEntry={!visible} editable={!loading} />
      <TouchableOpacity onPress={() => setVisible(!visible)}><Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={21} color="#7185A2" /></TouchableOpacity>
    </View>
  </>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.content}>
      <View style={styles.top}><TouchableOpacity style={styles.back} onPress={onBack}><Ionicons name="arrow-back" size={22} color="#355476" /></TouchableOpacity><Text style={styles.brand}>PSIFU</Text></View>
      <View style={styles.icon}><Ionicons name="shield-checkmark-outline" size={54} color="#2563EB" /></View>
      <Text style={styles.title}>Tạo mật khẩu mới</Text>
      <Text style={styles.subtitle}>Tạo mật khẩu mới cho tài khoản <Text style={styles.email}>{email}</Text>.</Text>
      {passwordField('Mật khẩu mới', password, setPassword, showPassword, setShowPassword, 'Nhập mật khẩu mới')}
      {passwordField('Xác nhận mật khẩu', confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, 'Nhập lại mật khẩu mới')}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.note}><Ionicons name="information-circle-outline" size={17} color="#2563EB" /><Text style={styles.noteText}>Mật khẩu cần có tối thiểu 6 ký tự để bảo vệ tài khoản.</Text></View>
      <TouchableOpacity style={[styles.button, loading && { opacity: 0.65 }]} onPress={submit} disabled={loading}><Text style={styles.buttonText}>{loading ? 'ĐANG LƯU...' : 'LƯU MẬT KHẨU MỚI'}</Text></TouchableOpacity>
    </View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9FF' }, content: { flex: 1, padding: 29, paddingTop: 28 }, top: { flexDirection: 'row', alignItems: 'center' }, back: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#C9D6E8', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }, brand: { color: '#102A56', fontWeight: '900', fontSize: 20, marginLeft: 96 }, icon: { height: 150, justifyContent: 'center', alignItems: 'center' }, title: { color: '#102A56', fontSize: 29, fontWeight: '800' }, subtitle: { color: '#667992', fontSize: 15, lineHeight: 22, marginTop: 9, marginBottom: 31 }, email: { color: '#155EEF', fontWeight: '700' }, label: { color: '#233B62', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 13 }, inputWrap: { height: 58, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C9D6E8', borderRadius: 13, paddingHorizontal: 14, alignItems: 'center', flexDirection: 'row', gap: 11 }, inputError: { borderColor: '#E07171' }, input: { flex: 1, color: '#102A56', fontSize: 15 }, error: { color: '#B42318', fontSize: 12, marginTop: 9 }, note: { flexDirection: 'row', gap: 9, borderWidth: 1, borderColor: '#B8CDF0', backgroundColor: '#EEF5FF', padding: 14, borderRadius: 11, marginTop: 25 }, noteText: { color: '#355476', flex: 1, fontSize: 12, lineHeight: 18 }, button: { height: 58, backgroundColor: '#2563EB', borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginTop: 17 }, buttonText: { color: '#fff', fontWeight: '900', fontSize: 14 }
});
