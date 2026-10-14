import React, {useMemo,useState} from 'react';
import {ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import CommunityRoom from './CommunityRoom';
import DirectMessage from './DirectMessage';
import {getRoleTheme,sharedTheme} from '../theme/roleTheme';
const theme=getRoleTheme('mentor');
const channels=[['announcements','Thông báo'],['general','Thảo luận chung'],['mentoring-tips','Kinh nghiệm mentoring'],['course-discussion','Trao đổi môn học'],['resources','Chia sẻ học liệu'],['documents','Thảo luận tài liệu']];
export default function MentorCommunity({mentor,bookings=[]}) {
  const [mode,setMode]=useState('community'),[query,setQuery]=useState(''),[channel,setChannel]=useState(null),[booking,setBooking]=useState(null),[todayOnly,setTodayOnly]=useState(false);
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
  const rows=useMemo(()=>bookings.filter(row=>row.mentorEmail===mentor?.email&&row.status!=='Đã hủy'&&(!todayOnly||row.dateTime?.startsWith(today))&&`${row.menteeName} ${row.course}`.toLowerCase().includes(query.toLowerCase())),[bookings,mentor?.email,query,today,todayOnly]);
  if(channel)return <CommunityRoom key={channel[0]} roomId={'mentor-community::'+channel[0]} title={channel[1]} user={mentor} readOnly={channel[0]==='announcements'&&mentor.role!=='admin'} onBack={()=>setChannel(null)}/>;
  if(booking)return <DirectMessage booking={booking} mentorName={mentor.fullName} mentorEmail={mentor.email} menteeName={booking.menteeName} currentUserName={mentor.fullName} currentUserEmail={mentor.email} currentUserRole="MENTOR" onBack={()=>setBooking(null)}/>;
  return <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.title}>Cộng đồng Mentor</Text>
    <View style={s.switch}>{[['community','Kênh Mentor'],['mentees','Chat Mentee']].map(([value,label])=><TouchableOpacity key={value} style={[s.switchItem,mode===value&&s.switchOn]} onPress={()=>setMode(value)}><Text style={[s.switchText,mode===value&&s.switchTextOn]}>{label}</Text></TouchableOpacity>)}</View>
    {mode==='community'?<><Text style={s.heading}>Kênh trao đổi chuyên môn</Text><Text style={s.sub}>Chỉ Mentor và quản trị viên truy cập được các kênh này.</Text>{channels.map(item=><TouchableOpacity key={item[0]} style={s.channel} onPress={()=>setChannel(item)}><Ionicons name="chatbubbles-outline" size={24} color={theme.secondary}/><View style={{flex:1}}><Text style={s.rowTitle}>{item[1]}</Text><Text style={s.sub}>#{item[0]}</Text></View><Ionicons name="chevron-forward" size={20} color={theme.textMuted}/></TouchableOpacity>)}</>:<>
    <View style={s.search}><Ionicons name="search-outline" size={20} color={theme.textMuted}/><TextInput placeholderTextColor={theme.textMuted} style={s.input} value={query} onChangeText={setQuery} placeholder="Tìm tên Mentee hoặc môn học…"/></View>
    <View style={s.filters}>{[[false,'Tất cả'],[true,'Có lịch hôm nay']].map(([value,label])=><TouchableOpacity key={label} onPress={()=>setTodayOnly(value)}><Text style={todayOnly===value?s.filterOn:s.filter}>{label}</Text></TouchableOpacity>)}</View>
    {rows.map(row=><TouchableOpacity key={row.id||row._id} style={s.mentee} onPress={()=>setBooking(row)}><View style={{flex:1}}><Text style={s.rowTitle}>{row.menteeName}</Text><Text style={s.sub}>{row.course} · {row.dateTime}</Text><Text style={s.sub}>{row.status}</Text></View><Ionicons name="chatbubble-outline" size={24} color={theme.secondary}/></TouchableOpacity>)}
    {!rows.length&&<Text style={s.sub}>Chưa có lịch hẹn phù hợp.</Text>}
    </>}
  </ScrollView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, paddingBottom: 40 },
  top: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 22, color: theme.text, fontWeight: "900" },
  topRight: { flexDirection: "row", alignItems: "center", gap: 17 },
  avatar: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  switch: {
    height: 46,
    marginTop: 13,
    padding: 4,
    borderRadius: 12,
    backgroundColor: theme.surfaceMuted,
    flexDirection: "row",
  },
  switchItem: {
    flex: 1,
    borderRadius: 9,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  switchOn: { backgroundColor: theme.primary },
  switchText: { fontSize: 12, color: theme.textSecondary, fontWeight: "800" },
  switchTextOn: { color: "#fff" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#155EEF",
    position: "absolute",
    right: 9,
    top: 10,
  },
  hero: {
    backgroundColor: "#155EEF",
    borderRadius: 15,
    padding: 16,
    marginTop: 17,
  },
  verify: { fontSize: 11, color: "#fff", fontWeight: "900" },
  heroTitle: { fontSize: 21, color: "#fff", fontWeight: "900", marginTop: 12 },
  heroCopy: { fontSize: 12, color: "#E4ECFF", lineHeight: 18, marginTop: 5 },
  heroMeta: { fontSize: 11, color: "#E4ECFF", fontWeight: "800", marginTop: 14 },
  lock: {
    backgroundColor: "#EEF2FF",
    borderRadius: 13,
    padding: 13,
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  rowTitle: { fontSize: 14, color: theme.text, fontWeight: "900" },
  sub: { fontSize: 12, color: theme.textSecondary, lineHeight: 18, marginTop: 3 },
  heading: {
    fontSize: 15,
    color: theme.text,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 9,
  },
  channel: {
    backgroundColor: theme.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 11,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 7,
  },
  channelIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: "#E8EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    fontSize: 11,
    color: "#155EEF",
    fontWeight: "900",
    backgroundColor: "#E5EDFF",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },
  recentHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: { fontSize: 12, color: "#155EEF", fontWeight: "900" },
  post: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E8F5",
    padding: 12,
    marginBottom: 10,
  },
  postHead: { flexDirection: "row", gap: 9, alignItems: "center" },
  person: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCE8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  personText: { fontSize: 10, color: "#155EEF", fontWeight: "900" },
  mentor: { fontSize: 11, color: "#155EEF" },
  channelText: { fontSize: 11, color: "#155EEF", marginTop: 3 },
  postText: { fontSize: 12, color: "#243B5B", lineHeight: 17, marginTop: 12 },
  file: {
    backgroundColor: "#E6EEFF",
    borderRadius: 10,
    padding: 10,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  fileText: { flex: 1, fontSize: 11, color: "#102A56", fontWeight: "800" },
  react: { fontSize: 11, color: "#536E99", marginTop: 11 },
  menteeTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#102A56",
    marginTop: 15,
  },
  count: { fontSize: 11, color: "#155EEF", backgroundColor: "#E5EDFF" },
  search: {
    height: 48,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E8F5",
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    marginTop: 12,
  },
  input: { flex: 1, fontSize: 14, color: theme.text },
  filters: { flexDirection: "row", gap: 7, marginVertical: 11 },
  filterOn: {
    fontSize: 11,
    color: sharedTheme.white,
    backgroundColor: theme.primary,
    padding: 7,
    borderRadius: 7,
    fontWeight: "900",
  },
  filter: {
    fontSize: 11,
    color: theme.textSecondary,
    backgroundColor: theme.surfaceMuted,
    padding: 7,
    borderRadius: 7,
  },
  mentee: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 10,
    flexDirection: "row",
    gap: 9,
    marginBottom: 8,
  },
  sessionLine: {
    fontSize: 11,
    color: "#155EEF",
    fontWeight: "800",
    marginTop: 6,
  },
  confirm: { fontSize: 11, color: sharedTheme.success, fontWeight: "900" },
  pending: { fontSize: 11, color: sharedTheme.warning, fontWeight: "900" },
  policy: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  policyText: { flex: 1, fontSize: 12, color: "#536E99", lineHeight: 18 },
  empty: { alignItems: "center", padding: 35, gap: 8 },
});
