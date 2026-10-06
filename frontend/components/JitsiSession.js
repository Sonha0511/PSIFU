import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JitsiMeeting } from '@jitsi/react-native-sdk';

const safeRoom = (bookingId) => `psifu-${String(bookingId || 'demo-session').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}`;

export default function JitsiSession({ booking, displayName, onLeave }) {
  const room = safeRoom(booking?.id || booking?._id || `${booking?.mentorEmail || 'mentor'}-${booking?.dateTime || 'session'}`);
  return <SafeAreaView style={styles.screen}><View style={styles.header}><TouchableOpacity style={styles.close} onPress={onLeave}><Ionicons name="close" size={21} color="#FFFFFF" /></TouchableOpacity><View><Text style={styles.title}>{booking?.course || 'PSIFU mentoring session'}</Text><Text style={styles.room}>Phòng riêng: {room}</Text></View><View style={styles.live}><View style={styles.dot}/><Text style={styles.liveText}>LIVE</Text></View></View><JitsiMeeting style={styles.meeting} room={room} serverURL="https://meet.jit.si/" userInfo={{ displayName: displayName || 'PSIFU Student', email: '' }} config={{ startWithAudioMuted: false, startWithVideoMuted: false, prejoinConfig: { enabled: true } }} flags={{ 'welcomepage.enabled': false, 'invite.enabled': false, 'add-people.enabled': false }} eventListeners={{ onReadyToClose: onLeave }} /></SafeAreaView>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:'#0D1730'},header:{height:58,backgroundColor:'#102A56',paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:10},close:{width:32,height:32,borderRadius:10,backgroundColor:'rgba(255,255,255,.16)',alignItems:'center',justifyContent:'center'},title:{color:'#FFFFFF',fontSize:11,fontWeight:'900'},room:{color:'#B8CBEA',fontSize:7,marginTop:2},live:{marginLeft:'auto',backgroundColor:'rgba(255,255,255,.14)',borderRadius:9,paddingHorizontal:7,paddingVertical:5,flexDirection:'row',gap:4,alignItems:'center'},dot:{width:5,height:5,borderRadius:3,backgroundColor:'#56E39F'},liveText:{color:'#FFFFFF',fontSize:8,fontWeight:'900'},meeting:{flex:1}});
