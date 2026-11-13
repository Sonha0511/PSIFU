import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const safeRoom = id => `psifu-${String(id || 'demo-session').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}`;

// meet.jit.si requires the first participant to authenticate. kMeet runs the
// same Jitsi/WebRTC stack but allows starting and joining a room without an
// account, which keeps the mentoring flow one-tap on web and mobile.
export default function JitsiSession({ booking, onLeave }) {
  const room = safeRoom(booking?.id || booking?._id || `${booking?.mentorEmail || 'mentor'}-${booking?.dateTime || 'session'}`);
  const openMeeting = async () => { try { await Linking.openURL(`https://kmeet.infomaniak.com/${encodeURIComponent(room)}`); } catch { Alert.alert('Không thể mở phòng họp', 'Vui lòng kiểm tra kết nối Internet và thử lại.'); } };
  return <SafeAreaView style={s.screen}><View style={s.header}><TouchableOpacity style={s.close} onPress={onLeave}><Ionicons name="close" size={21} color="#fff" /></TouchableOpacity><Text style={s.title}>Phiên mentoring trực tuyến</Text></View><View style={s.content}><View style={s.icon}><Ionicons name="videocam" size={38} color="#155EEF" /></View><Text style={s.heading}>{booking?.course || 'PSIFU mentoring session'}</Text><Text style={s.copy}>Phòng video WebRTC đã sẵn sàng. Bạn chỉ cần cho phép camera, microphone và nhập tên hiển thị; không cần đăng nhập tài khoản họp.</Text><Text style={s.room}>Mã phòng: {room}</Text><TouchableOpacity style={s.primary} onPress={openMeeting}><Ionicons name="open-outline" size={18} color="#fff"/><Text style={s.primaryText}>VÀO PHÒNG VIDEO</Text></TouchableOpacity><TouchableOpacity onPress={onLeave}><Text style={s.back}>Quay lại chi tiết lịch hẹn</Text></TouchableOpacity></View></SafeAreaView>;
}
const s = StyleSheet.create({screen:{flex:1,backgroundColor:'#F7F9FE'},header:{height:58,backgroundColor:'#102A56',paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:12},close:{width:32,height:32,borderRadius:10,backgroundColor:'rgba(255,255,255,.16)',alignItems:'center',justifyContent:'center'},title:{color:'#fff',fontWeight:'900',fontSize:14},content:{flex:1,alignItems:'center',justifyContent:'center',padding:28},icon:{width:82,height:82,borderRadius:26,backgroundColor:'#E6EEFF',alignItems:'center',justifyContent:'center'},heading:{color:'#102A56',fontSize:19,fontWeight:'900',marginTop:18,textAlign:'center'},copy:{color:'#62718A',fontSize:12,lineHeight:18,textAlign:'center',marginTop:9},room:{color:'#155EEF',fontSize:11,fontWeight:'800',marginTop:16},primary:{height:48,alignSelf:'stretch',backgroundColor:'#155EEF',borderRadius:12,marginTop:22,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},primaryText:{color:'#fff',fontWeight:'900',fontSize:11},back:{color:'#155EEF',fontSize:11,fontWeight:'800',padding:16}});
