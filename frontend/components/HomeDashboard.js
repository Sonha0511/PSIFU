import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeLiveChat from './HomeLiveChat';
import { getRoleTheme, sharedTheme } from '../theme/roleTheme';

const theme = getRoleTheme('mentee');

export default function HomeDashboard({fullName,userEmail,userXu=0,hasCheckedInToday,currentTerm,major,university,bookings=[],courses=[],onNavigate,onNotifications,onTopUp}) {
  const booked=bookings.filter(row=>['Chờ mentor xác nhận','Đã xác nhận'].includes(row.status)).sort((a,b)=>String(a.dateTime).localeCompare(String(b.dateTime)))[0];
  return <ScrollView style={s.screen} contentContainerStyle={[s.content,{paddingBottom:32}]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
    <View style={s.ambientOne} pointerEvents="none"/><View style={s.ambientTwo} pointerEvents="none"/>
    <View style={s.top}><View><Text style={s.brand}>PSIFU</Text><Text style={s.brandSub}>AURORA LEARNING</Text></View><TouchableOpacity style={s.iconButton} onPress={onNotifications} accessibilityLabel="Thông báo"><Ionicons name="notifications-outline" size={21} color={theme.text}/></TouchableOpacity></View>
    <View style={s.welcome}><View style={{flex:1}}><Text style={s.greeting}>Xin chào, {fullName||'bạn'} 👋</Text><Text style={s.term}>{currentTerm} · {major||'Chưa chọn ngành'}</Text><Text style={s.school}>{university||'Chưa cập nhật trường'}</Text></View><TouchableOpacity accessibilityLabel="Nạp thêm Xu" onPress={onTopUp} style={s.wallet}><Text style={s.walletNum}>{userXu}</Text><Text style={s.walletUnit}>Xu</Text><Ionicons name="add-circle" size={24} color="#1558D8"/></TouchableOpacity></View>
    <Section title="Lịch hẹn sắp tới" action="Xem tất cả" onPress={()=>onNavigate('schedule')}/>
    <TouchableOpacity style={s.sessionCard} onPress={()=>onNavigate('schedule')}>{booked?<><Text style={s.sessionName}>{booked.course||'Mentoring'}</Text><Text style={s.mentorName}>{booked.mentorName}</Text><Text style={s.sessionSub}>{booked.dateTime}</Text><Text style={s.confirmed}>{booked.status}</Text></>:<Text style={s.sessionSub}>Bạn chưa có lịch hẹn sắp tới.</Text>}</TouchableOpacity>
    <HomeLiveChat name={fullName} email={userEmail} variant="mentee"/>
    <TouchableOpacity style={s.streak} onPress={()=>onNavigate('rewards')}><Text style={s.streakTitle}>Điểm danh hằng ngày</Text><Text style={s.caption}>{hasCheckedInToday?'Đã nhận phần thưởng hôm nay':'Điểm danh để nhận 1 Xu hôm nay'} →</Text></TouchableOpacity>
    <Section title="Môn học của tôi" action="Xem tất cả" onPress={()=>onNavigate('courses')}/>{courses.slice(0,2).map(course=><TouchableOpacity key={course.code} style={s.courseCard} onPress={()=>onNavigate('courses')}><Text style={s.courseCode}>{course.code}</Text><Text style={s.courseName}>{course.name}</Text></TouchableOpacity>)}
    <TouchableOpacity style={s.community} onPress={()=>onNavigate('community')}><Ionicons name="people-outline" size={25} color={theme.accent}/><Text style={s.communityTitle}>Mở cộng đồng học tập →</Text></TouchableOpacity>
    <TouchableOpacity style={s.viewMentor} onPress={()=>onNavigate('mentor')}><Text style={s.viewMentorText}>Tìm Mentor phù hợp →</Text></TouchableOpacity>
  </ScrollView>;
}
function Section({title,action,onPress}) { return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{action?<TouchableOpacity onPress={onPress}><Text style={s.link}>{action}</Text></TouchableOpacity>:null}</View>; }
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background},content:{padding:15,paddingBottom:32,overflow:'hidden'},
  ambientOne:{position:'absolute',width:240,height:240,borderRadius:120,backgroundColor:'rgba(47,107,255,.18)',top:-100,right:-95},ambientTwo:{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:'rgba(139,124,255,.09)',top:300,left:-110},
  top:{minHeight:45,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{color:theme.primary,fontWeight:'900',fontSize:17,letterSpacing:1.6},brandSub:{color:theme.textMuted,fontSize:7,fontWeight:'800',letterSpacing:1.3,marginTop:2},iconButton:{width:38,height:38,borderRadius:13,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border,alignItems:'center',justifyContent:'center'},
  welcome:{backgroundColor:theme.surfaceElevated,borderRadius:sharedTheme.radius.lg,padding:16,marginTop:10,flexDirection:'row',justifyContent:'space-between',borderWidth:1,borderColor:theme.border,shadowColor:theme.glow,shadowOpacity:.18,shadowRadius:24,elevation:5},greeting:{fontSize:18,color:theme.text,fontWeight:'900'},term:{fontSize:11,color:theme.textSecondary,marginTop:5},school:{fontSize:9,color:theme.accent,fontWeight:'800',backgroundColor:'rgba(79,214,229,.1)',alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:4,borderRadius:7,marginTop:8},wallet:{backgroundColor:'rgba(139,124,255,.14)',borderRadius:14,alignSelf:'flex-start',padding:9,alignItems:'center',minWidth:56,flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:3,borderWidth:1,borderColor:'rgba(139,124,255,.24)'},walletNum:{color:theme.text,fontWeight:'900',fontSize:13},walletUnit:{fontSize:8,color:theme.textSecondary},
  section:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:18,marginBottom:9},sectionTitle:{fontSize:15,color:theme.text,fontWeight:'900'},link:{fontSize:10,color:theme.primary,fontWeight:'800'},
  sessionCard:{backgroundColor:theme.surface,borderRadius:16,borderWidth:1,borderColor:theme.border,padding:14,shadowColor:'#000',shadowOpacity:.18,shadowRadius:16,elevation:3},sessionName:{fontSize:15,color:theme.text,fontWeight:'900'},mentorName:{fontSize:11,color:theme.accent,fontWeight:'800',marginTop:5},sessionSub:{fontSize:10,color:theme.textSecondary,marginTop:4},confirmed:{fontSize:9,fontWeight:'900',color:sharedTheme.success,backgroundColor:'rgba(68,217,149,.12)',paddingHorizontal:8,paddingVertical:4,borderRadius:7,marginTop:8,alignSelf:'flex-start'},
  caption:{fontSize:10,color:theme.textSecondary,lineHeight:15},streak:{backgroundColor:theme.surface,borderRadius:16,borderWidth:1,borderColor:theme.border,padding:14,marginTop:16},streakTitle:{fontSize:15,color:theme.text,fontWeight:'900'},
  courseCard:{backgroundColor:theme.surface,borderRadius:15,borderWidth:1,borderColor:theme.border,padding:13,marginBottom:8},courseCode:{fontSize:9,color:theme.accent,fontWeight:'900',backgroundColor:'rgba(79,214,229,.1)',padding:5,borderRadius:6,alignSelf:'flex-start'},courseName:{fontSize:11,color:theme.text,fontWeight:'900',marginTop:8},
  community:{backgroundColor:theme.surface,borderRadius:15,borderWidth:1,borderColor:theme.border,padding:13,flexDirection:'row',gap:9,alignItems:'center'},communityTitle:{fontSize:11,color:theme.text,fontWeight:'900'},
  viewMentor:{height:40,backgroundColor:theme.tint,borderWidth:1,borderColor:theme.border,paddingHorizontal:13,borderRadius:12,alignItems:'center',justifyContent:'center',marginTop:10},viewMentorText:{fontSize:10,color:theme.primary,fontWeight:'900'}
});
