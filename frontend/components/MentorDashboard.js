import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Database } from '../data/database';

const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

export default function MentorDashboard({ mentor, screen = 'calendar' }) {
  const [bookings, setBookings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentTerm, setDocumentTerm] = useState('Kỳ 1');
  const [documentCourse, setDocumentCourse] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [mentorMessages, setMentorMessages] = useState([]);
  const [newMentorMessage, setNewMentorMessage] = useState('');

  const loadBookings = useCallback(async () => {
    const allBookings = await Database.getBookings();
    setBookings(allBookings.filter(item => item.mentorEmail === mentor?.email));
  }, [mentor?.email]);
  const loadDocuments = useCallback(async () => setDocuments(await Database.getMentorDocuments()), []);

  useEffect(() => {
    loadBookings();
    loadDocuments();
    Database.getChatMessages('mentor-community', []).then(setMentorMessages);
  }, [loadBookings, loadDocuments]);

  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!result.canceled) setSelectedFile(result.assets[0]);
  };

  const uploadDocument = async () => {
    if (!selectedFile) return Alert.alert('Chưa chọn tệp', 'Hãy chọn một tệp trước khi tải lên.');
    const saved = await Database.saveMentorDocument({
      title: documentTitle.trim() || selectedFile.name,
      fileName: selectedFile.name,
      fileUri: selectedFile.uri,
      mimeType: selectedFile.mimeType || 'unknown',
      mentorEmail: mentor?.email,
      mentorName: mentor?.fullName,
      term: documentTerm,
      course: documentCourse.trim() || 'Môn chưa phân loại',
      specialty: mentor?.specialty || 'Đa ngành'
    });
    setDocuments(prev => [saved, ...prev]);
    setDocumentTitle('');
    setSelectedFile(null);
    Alert.alert('Tải lên thành công', 'Tài liệu đã được lưu để demo và hiển thị cho mentee.');
  };

  const sendMentorMessage = async () => {
    if (!newMentorMessage.trim()) return;
    const message = await Database.saveChatMessage('mentor-community', { user: mentor?.fullName || 'Mentor', authorEmail: mentor?.email || '', text: newMentorMessage.trim() });
    setMentorMessages(prev => [...prev, message]);
    setNewMentorMessage('');
  };

  const confirmBooking = async (bookingId) => {
    if (await Database.updateBookingStatus(bookingId, 'Đã xác nhận')) {
      await loadBookings();
      Alert.alert('Đã xác nhận', 'Mentee có thể xem lịch tư vấn đã được duyệt.');
    }
  };

  if (screen === 'docs') return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.title}>Tài liệu Mentor</Text>
    <Text style={styles.sub}>Chọn tệp và lưu metadata vào bộ nhớ ứng dụng. Trong demo, tài liệu sẽ hiển thị lại sau khi đổi màn hình/tài khoản.</Text>
    <View style={styles.card}>
      <Text style={styles.name}>Tải tài liệu lên</Text>
      <TextInput value={documentTitle} onChangeText={setDocumentTitle} style={styles.input} placeholder="Tiêu đề tài liệu (không bắt buộc)" />
      <TextInput value={documentTerm} onChangeText={setDocumentTerm} style={styles.input} placeholder="Kỳ học, ví dụ: Kỳ 3" />
      <TextInput value={documentCourse} onChangeText={setDocumentCourse} style={styles.input} placeholder="Môn học, ví dụ: Cấu trúc dữ liệu" />
      <TouchableOpacity style={styles.secondaryButton} onPress={chooseFile}><Text style={styles.buttonText}>CHỌN TỆP</Text></TouchableOpacity>
      {selectedFile && <Text style={styles.fileName}>Đã chọn: {selectedFile.name}</Text>}
      <TouchableOpacity style={styles.button} onPress={uploadDocument}><Text style={styles.buttonText}>TẢI LÊN</Text></TouchableOpacity>
    </View>
    <Text style={styles.heading}>Tài liệu đã đăng</Text>
    {documents.filter(item => item.mentorEmail === mentor?.email).map(item => <View key={item.id} style={styles.card}>
      <Text style={styles.name}>{item.title}</Text><Text>{item.fileName}</Text><Text style={styles.meta}>{item.mimeType}</Text>
    </View>)}
  </ScrollView>;

  if (screen === 'community') return <ScrollView contentContainerStyle={styles.page}><Text style={styles.title}>Community Mentor</Text><Text style={styles.sub}>Dùng tab Community để trao đổi trực tiếp với các đồng nghiệp trong cùng cộng đồng.</Text></ScrollView>;

  const year = cursor.getFullYear(), month = cursor.getMonth(), days = new Date(year, month + 1, 0).getDate();
  const selected = selectedDay ? bookings.filter(item => item.dateTime && item.dateTime.includes(`${selectedDay}/${month + 1}/${year}`)) : [];
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.title}>Lịch tư vấn Mentor</Text><Text style={styles.sub}>Các yêu cầu đặt lịch của mentee được lưu và hiển thị theo đúng mentor được chọn.</Text>
    <View style={styles.month}><TouchableOpacity onPress={() => setCursor(new Date(year, month - 1, 1))}><Text style={styles.nav}>‹</Text></TouchableOpacity><Text style={styles.name}>{monthNames[month]} {year}</Text><TouchableOpacity onPress={() => setCursor(new Date(year, month + 1, 1))}><Text style={styles.nav}>›</Text></TouchableOpacity></View>
    <View style={styles.grid}>{Array.from({length:days},(_,i)=>i+1).map(day => { const has = bookings.some(item => item.dateTime && item.dateTime.includes(`${day}/${month + 1}/${year}`)); return <TouchableOpacity key={day} style={[styles.day, selectedDay === day && styles.selectedDay]} onPress={() => setSelectedDay(day)}><Text>{day}</Text>{has && <Text style={styles.dot}>●</Text>}</TouchableOpacity>; })}</View>
    <Text style={styles.heading}>{selectedDay ? `Lịch ngày ${selectedDay}/${month + 1}/${year}` : 'Chọn một ngày có dấu chấm'}</Text>
    {selected.map(item => <View key={item.id} style={styles.card}><Text style={styles.name}>{item.dateTime}</Text><Text>{item.menteeName}: {item.note}</Text><Text style={styles.meta}>{item.status}</Text>{item.status !== 'Đã xác nhận' && <TouchableOpacity style={styles.button} onPress={() => confirmBooking(item.id)}><Text style={styles.buttonText}>XÁC NHẬN LỊCH TƯ VẤN</Text></TouchableOpacity>}</View>)}
  </ScrollView>;
}

const styles=StyleSheet.create({page:{padding:20},title:{fontSize:23,fontWeight:'bold',color:'#0284c7'},sub:{color:'#64748b',marginVertical:8,lineHeight:19},month:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:18},nav:{fontSize:32,color:'#0284c7'},grid:{flexDirection:'row',flexWrap:'wrap',marginTop:12},day:{width:'14.28%',height:48,alignItems:'center',justifyContent:'center',borderRadius:8},selectedDay:{backgroundColor:'#e0f2fe'},dot:{fontSize:12,color:'#16a34a'},heading:{fontSize:16,fontWeight:'bold',marginTop:16},card:{backgroundColor:'#fff',padding:14,borderRadius:12,marginTop:10},name:{fontWeight:'bold',color:'#1e293b'},meta:{fontSize:12,color:'#64748b',marginTop:5},input:{borderWidth:1,borderColor:'#cbd5e1',borderRadius:8,padding:11,marginTop:12},button:{backgroundColor:'#0284c7',padding:12,borderRadius:8,alignItems:'center',marginTop:10},secondaryButton:{backgroundColor:'#64748b',padding:12,borderRadius:8,alignItems:'center',marginTop:10},buttonText:{color:'#fff',fontWeight:'bold'},fileName:{marginTop:10,color:'#166534'}});
