import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../data/database';
import MentorInbox from './MentorInbox';

const FALLBACK_COURSES = [
  { code: 'prf192', name: 'Programming Fundamentals' },
  { code: 'pro192', name: 'Object-Oriented Programming' },
  { code: 'dbi202', name: 'Introduction to Databases' },
  { code: 'csd201', name: 'Data Structures & Algorithms' },
  { code: 'wdu203c', name: 'User Experience Research & Design' },
];

const roomSeed = (channel, term) => [
  { id: 'welcome', user: 'PSIFU Bot', text: channel.code === 'general' ? `Chào mừng bạn đến #general. Hãy cùng hỗ trợ nhau trong ${term}!` : `Chào mừng bạn đến #${channel.code}. Kênh này chỉ dành để thảo luận về ${channel.name}.`, createdAt: new Date().toISOString() },
  { id: 'sample', user: 'Minh K20', text: channel.code === 'general' ? 'Mọi người có lịch học tuần này chưa nhỉ?' : `Ai đang học ${channel.name} cùng trao đổi nhé.`, createdAt: new Date(Date.now() - 600000).toISOString() },
];

export default function Community({ university, currentTerm, fullName, fptK, currentUser, courses = [], mentors = [], bookings = [] }) {
  const courseChannels = useMemo(() => {
    const termCourses = courses.filter((course) => !course.term || course.term === currentTerm);
    return (termCourses.length ? termCourses : FALLBACK_COURSES).map((course) => ({
      code: String(course.code).toLowerCase(),
      name: course.name,
    }));
  }, [courses, currentTerm]);
  const [selectedCode, setSelectedCode] = useState('general');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [channelQuery, setChannelQuery] = useState('');
  const [section, setSection] = useState('community');
  const [mode, setMode] = useState('community');
  const scrollRef = useRef(null);
  const selectedChannel = selectedCode === 'general'
    ? { code: 'general', name: `Thảo luận chung trong ${currentTerm}` }
    : courseChannels.find((course) => course.code === selectedCode) || courseChannels[0] || { code: 'general', name: 'General' };
  const roomId = `${String(university || 'FPT University').toLowerCase()}::${currentTerm || 'Kỳ 1'}::${selectedChannel.code}`;
  if (section === 'chat') return <View style={{flex:1,backgroundColor:'#FFFFFF'}}><View style={styles.segment}><TouchableOpacity style={styles.segmentItem} onPress={() => setSection('community')}><Text style={styles.segmentText}>Cộng đồng</Text></TouchableOpacity><View style={[styles.segmentItem,styles.segmentActive]}><Text style={[styles.segmentText,styles.segmentTextActive]}>Chat mentor</Text></View></View><MentorInbox mentors={mentors} bookings={bookings} menteeName={fullName || currentUser?.fullName}/></View>;

  const loadMessages = async (quiet = false) => {
    try {
      const result = await Database.getChatMessages(roomId, roomSeed(selectedChannel, currentTerm));
      setMessages(result);
    } catch (error) {
      if (!quiet) setMessages(roomSeed(selectedChannel, currentTerm));
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMessages();
    const timer = setInterval(() => loadMessages(true), 3500);
    return () => clearInterval(timer);
  }, [roomId]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages.length, selectedCode]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text) return;
    const message = {
      user: fullName || currentUser?.fullName || 'Sinh viên PSIFU',
      text,
      createdAt: new Date().toISOString(),
    };
    setDraft('');
    try {
      await Database.saveChatMessage(roomId, message);
      await loadMessages(true);
    } catch (error) {
      setMessages((previous) => [...previous, { ...message, id: `local-${Date.now()}` }]);
    }
  };

  const pickChannel = (code) => {
    setSelectedCode(code);
    setChatOpen(true);
  };
  const renderChannel = (channel, subtitle, badge) => {
    const active = selectedChannel.code === channel.code;
    return <TouchableOpacity key={channel.code} style={[styles.channel, active && styles.channelActive]} onPress={() => pickChannel(channel.code)}>
      <View style={[styles.hash, active && styles.hashActive]}><Text style={[styles.hashText, active && styles.hashTextActive]}>#</Text></View>
      <View style={styles.channelCopy}><Text style={[styles.channelName, active && styles.channelNameActive]}>{channel.code}</Text><Text style={styles.channelDescription} numberOfLines={1}>{subtitle}</Text></View>
      {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
      <Ionicons name="chevron-forward" size={15} color={active ? '#60A5FA' : '#53647E'} />
    </TouchableOpacity>;
  };

  if (mode === 'chat') return <View style={{flex:1}}><View style={styles.modeTabs}><TouchableOpacity style={styles.modeTab} onPress={() => setMode('community')}><Text style={styles.modeOff}>Community</Text></TouchableOpacity><View style={[styles.modeTab,styles.modeActive]}><Text style={styles.modeOn}>Chat</Text></View></View><MentorInbox mentors={mentors} menteeName={fullName || currentUser?.fullName}/></View>;
  if (chatOpen) return <KeyboardAvoidingView style={styles.chatPage} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.roomTopbar}>
      <TouchableOpacity onPress={() => setChatOpen(false)} hitSlop={10}><Ionicons name="chevron-back" size={23} color="#C9D7EB" /></TouchableOpacity>
      <View style={styles.roomTitleWrap}><View style={styles.roomNameLine}><Text style={styles.roomHash}>#</Text><Text style={styles.roomName}>{selectedChannel.code}</Text><Text style={styles.roomMembers}>{currentTerm} · 248 Members</Text></View><Text style={styles.roomMeta}>Software Engineering · {fptK || 'K20'} · Fall 2026</Text></View>
      <TouchableOpacity hitSlop={10} onPress={() => setChannelQuery('')}><Ionicons name="search-outline" size={20} color="#AFC1DD" /></TouchableOpacity>
    </View>
    <View style={styles.segment}><View style={[styles.segmentItem,styles.segmentActive]}><Text style={[styles.segmentText,styles.segmentTextActive]}>Cộng đồng</Text></View><TouchableOpacity style={styles.segmentItem} onPress={() => setSection('chat')}><Text style={styles.segmentText}>Chat mentor</Text></TouchableOpacity></View>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.roomContent} keyboardShouldPersistTaps="handled">
      <View style={styles.roomDivider} />
      <View style={styles.welcomeChip}><Ionicons name="checkmark" size={11} color="#60A5FA" /><Text style={styles.welcomeText}>Welcome to the {currentTerm} Community</Text></View>
      {loading ? <Text style={styles.loading}>Đang tải cuộc trò chuyện...</Text> : messages.map((message, index) => {
        const own = message.user === (fullName || currentUser?.fullName);
        const palette = ['#F59E0B', '#477BFF', '#8B5CF6', '#10B981'];
        return <View key={message._id || message.id || index} style={styles.roomMessage}>
          <View style={[styles.roomAvatar, { backgroundColor: own ? '#2563EB' : palette[index % palette.length] }]}><Text style={styles.roomAvatarText}>{String(message.user || 'P').slice(0, 2).toUpperCase()}</Text></View>
          <View style={styles.roomMessageBody}><View style={styles.roomMessageMeta}><Text style={styles.roomUser}>{message.user}</Text><Text style={styles.roomTime}>{new Date(message.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text></View><Text style={styles.roomMessageText}>{message.text}</Text>
            <View style={styles.reactions}><TouchableOpacity style={styles.reaction}><Text>👍</Text><Text style={styles.reactionCount}>{index % 2 ? '8' : '5'}</Text></TouchableOpacity><TouchableOpacity style={styles.reaction}><Text>💙</Text><Text style={styles.reactionCount}>{index % 2 ? '2' : '3'}</Text></TouchableOpacity>{index === 0 ? <TouchableOpacity><Text style={styles.replyText}>3 replies</Text></TouchableOpacity> : null}</View>
          </View>
        </View>;
      })}
      <View style={styles.typing}><View style={[styles.typingDot, { backgroundColor: '#5B8CFF' }]} /><View style={[styles.typingDot, { backgroundColor: '#22C55E', marginLeft: -3 }]} /><Text style={styles.typingText}>Lan and Phúc are typing...</Text></View>
    </ScrollView>
    <View style={styles.roomComposer}><TouchableOpacity style={styles.plusButton}><Ionicons name="add" size={21} color="#B7C7E1" /></TouchableOpacity><TextInput value={draft} onChangeText={setDraft} placeholder={`Message #${selectedChannel.code}`} placeholderTextColor="#657998" style={styles.roomInput} multiline /><TouchableOpacity><Ionicons name="happy-outline" size={20} color="#F8B84A" /></TouchableOpacity><TouchableOpacity onPress={sendMessage} style={[styles.roomSend, !draft.trim() && styles.roomSendDisabled]}><Ionicons name="send" size={17} color="#BFD6FF" /></TouchableOpacity></View>
  </KeyboardAvoidingView>;

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.modeTabs}><View style={[styles.modeTab,styles.modeActive]}><Text style={styles.modeOn}>Community</Text></View><TouchableOpacity style={styles.modeTab} onPress={() => setMode('chat')}><Text style={styles.modeOff}>Chat mentor</Text></TouchableOpacity></View>
    <View style={styles.topbar}>
      <Text style={styles.title}>Community</Text>
      <View style={styles.topActions}><TouchableOpacity style={styles.roundButton}><Ionicons name="search-outline" size={19} color="#B8C8E4" /></TouchableOpacity><TouchableOpacity style={styles.roundButton}><Ionicons name="notifications-outline" size={19} color="#B8C8E4" /><View style={styles.dot} /></TouchableOpacity></View>
    </View>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.serverCard}>
        <View style={styles.serverLine}><View style={styles.pill}><View style={styles.pillDot} /><Text style={styles.pillText}>MY COMMUNITY</Text></View><Text style={styles.online}>• 42 Online</Text></View>
        <View style={styles.serverMain}><View style={styles.serverIcon}><Text style={styles.serverIconText}>SE</Text></View><View><Text style={styles.serverTitle}>Software Engineering</Text><Text style={styles.serverSub}>{currentTerm} • {university || 'FPT University'}</Text></View></View>
        <View style={styles.metaRow}><View style={styles.meta}><Ionicons name="calendar-outline" size={12} color="#8092B1" /><Text style={styles.metaText}>Fall 2026</Text></View><View style={styles.meta}><Ionicons name="school-outline" size={12} color="#8092B1" /><Text style={styles.metaText}>{university || 'FPT University'}</Text></View><View style={styles.meta}><Ionicons name="people-outline" size={12} color="#8092B1" /><Text style={styles.metaText}>248 Members</Text></View></View>
      </View>

      <View style={styles.channelSearch}><Ionicons name="search-outline" size={15} color="#7F94B5" /><TextInput value={channelQuery} onChangeText={setChannelQuery} placeholder="Tìm kênh hoặc môn học..." placeholderTextColor="#6D819F" style={styles.channelSearchInput}/></View><Text style={styles.sectionLabel}>CHANNELS</Text>
      <Text style={styles.groupLabel}>GENERAL</Text>
      {renderChannel({ code: 'general' }, `Thảo luận chung trong ${currentTerm}`, 7)}
      <Text style={styles.groupLabel}>COURSES</Text>
      {courseChannels.filter(course => `${course.code} ${course.name}`.toLowerCase().includes(channelQuery.trim().toLowerCase())).map((course, index) => renderChannel(course, `Chỉ thảo luận về ${course.name}`, index === 0 ? 3 : index === 2 ? 9 : null))}{channelQuery.trim() && !courseChannels.some(course => `${course.code} ${course.name}`.toLowerCase().includes(channelQuery.trim().toLowerCase())) ? <Text style={styles.noChannel}>Không tìm thấy kênh phù hợp.</Text> : null}

      <View style={styles.activeTitleRow}><Text style={styles.sectionLabel}>ACTIVE NOW</Text><View style={styles.divider} /></View>
      <View style={styles.activeCard}><View style={styles.avatars}><View style={[styles.avatar, { backgroundColor: '#F59E0B' }]}><Text style={styles.avatarText}>HN</Text></View><View style={[styles.avatar, { backgroundColor: '#10B981', marginLeft: -8 }]}><Text style={styles.avatarText}>LT</Text></View><View style={[styles.avatar, { backgroundColor: '#8B5CF6', marginLeft: -8 }]}><Text style={styles.avatarText}>PM</Text></View></View><View><Text style={styles.activeText}>• 42 students online</Text><Text style={styles.activeSub}>in {currentTerm} Community</Text></View></View>

      <View style={styles.chatHeader}><View style={styles.chatHash}><Text style={styles.chatHashText}>#</Text></View><View><Text style={styles.chatTitle}>{selectedChannel.code}</Text><Text style={styles.chatSubtitle}>{selectedChannel.name}</Text></View><View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View></View>
      <View style={styles.chatPanel}>
        {loading ? <Text style={styles.loading}>Đang tải cuộc trò chuyện...</Text> : messages.map((message, index) => {
          const own = message.user === (fullName || currentUser?.fullName);
          return <View key={message._id || message.id || index} style={[styles.messageRow, own && styles.messageOwn]}><View style={[styles.messageAvatar, own && styles.messageAvatarOwn]}><Text style={styles.messageInitial}>{String(message.user || 'P').slice(0, 2).toUpperCase()}</Text></View><View style={styles.messageBody}><View style={styles.messageMeta}><Text style={styles.messageUser}>{message.user}</Text><Text style={styles.messageTime}>{new Date(message.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text></View><Text style={styles.messageText}>{message.text}</Text></View></View>;
        })}
      </View>
    </ScrollView>
    <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder={`Nhắn #${selectedChannel.code}`} placeholderTextColor="#697B99" style={styles.input} multiline /><TouchableOpacity onPress={sendMessage} style={[styles.sendButton, !draft.trim() && styles.sendDisabled]}><Ionicons name="send" size={18} color="#fff" /></TouchableOpacity></View>
  </KeyboardAvoidingView>;
}

const baseStyles = StyleSheet.create({
  chatPage: { flex: 1, backgroundColor: '#0B1730' }, roomTopbar: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#1D2D47' }, roomTitleWrap: { flex: 1 }, roomNameLine: { flexDirection: 'row', alignItems: 'center', gap: 5 }, roomHash: { color: '#6FA3FF', fontSize: 19, fontWeight: '800' }, roomName: { color: '#F6F9FE', fontSize: 15, fontWeight: '800' }, roomMembers: { color: '#7084A4', fontSize: 10, marginLeft: 4 }, roomMeta: { color: '#536988', fontSize: 9, marginTop: 2 }, roomContent: { paddingHorizontal: 16, paddingBottom: 14 }, roomDivider: { height: 1, backgroundColor: '#233550', marginTop: 29 }, welcomeChip: { alignSelf: 'center', flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 14, backgroundColor: '#182944', borderWidth: 1, borderColor: '#304969', marginTop: -13, marginBottom: 20 }, welcomeText: { color: '#93A9C8', fontSize: 10 }, roomMessage: { flexDirection: 'row', gap: 10, marginBottom: 17 }, roomAvatar: { width: 31, height: 31, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }, roomAvatarText: { color: '#fff', fontSize: 9, fontWeight: '800' }, roomMessageBody: { flex: 1 }, roomMessageMeta: { flexDirection: 'row', alignItems: 'baseline', gap: 7 }, roomUser: { color: '#F1F6FF', fontSize: 13, fontWeight: '800' }, roomTime: { color: '#5E7290', fontSize: 9 }, roomMessageText: { color: '#C4D1E4', fontSize: 13, lineHeight: 19, marginTop: 3 }, reactions: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 }, reaction: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, height: 21, borderRadius: 11, borderWidth: 1, borderColor: '#31455F', backgroundColor: '#182842' }, reactionCount: { color: '#86A0C3', fontSize: 9, fontWeight: '700' }, replyText: { color: '#4D8DFF', fontSize: 10, fontWeight: '700' }, typing: { flexDirection: 'row', alignItems: 'center', height: 30, marginLeft: 6 }, typingDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#0B1730' }, typingText: { color: '#607795', fontSize: 10, marginLeft: 5 }, roomComposer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 9, margin: 8, marginTop: 0, borderRadius: 14, backgroundColor: '#172641', borderWidth: 1, borderColor: '#2C4160' }, plusButton: { width: 27, height: 27, borderRadius: 8, backgroundColor: '#233653', alignItems: 'center', justifyContent: 'center' }, roomInput: { flex: 1, maxHeight: 74, paddingVertical: 7, color: '#EDF4FF', fontSize: 13 }, roomSend: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }, roomSendDisabled: { opacity: 0.45 },
  page: { flex: 1, backgroundColor: '#0B1730' }, topbar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1E2D47' }, title: { color: '#F8FBFF', fontSize: 20, fontWeight: '800' }, topActions: { flexDirection: 'row', gap: 10 }, roundButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#172641', borderWidth: 1, borderColor: '#32435E', justifyContent: 'center', alignItems: 'center' }, dot: { position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: 3, backgroundColor: '#FBBF24' }, content: { padding: 16, paddingBottom: 18 }, serverCard: { backgroundColor: '#17243B', borderRadius: 14, borderWidth: 1, borderColor: '#334866', borderTopColor: '#2563EB', padding: 14 }, serverLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A3547', borderColor: '#8B6418', borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4, gap: 5 }, pillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#3B82F6' }, pillText: { color: '#F5BE55', fontSize: 9, fontWeight: '800' }, online: { color: '#22C55E', fontSize: 11, fontWeight: '700' }, serverMain: { flexDirection: 'row', gap: 11, alignItems: 'center', marginTop: 14 }, serverIcon: { backgroundColor: '#1D4ED8', width: 41, height: 41, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }, serverIconText: { color: '#BFD6FF', fontWeight: '800', fontSize: 15 }, serverTitle: { color: '#F6F8FD', fontSize: 15, fontWeight: '800' }, serverSub: { color: '#8295B3', fontSize: 11, marginTop: 3 }, metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }, meta: { flexDirection: 'row', gap: 5, alignItems: 'center', borderWidth: 1, borderColor: '#344862', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 }, metaText: { color: '#93A4BF', fontSize: 9 }, sectionLabel: { color: '#6F86A6', fontWeight: '800', fontSize: 10, letterSpacing: 1, marginTop: 20, marginBottom: 9 }, groupLabel: { color: '#607694', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 6, marginBottom: 5 }, channel: { flexDirection: 'row', alignItems: 'center', minHeight: 47, paddingHorizontal: 10, borderRadius: 10, gap: 9, marginBottom: 3 }, channelActive: { backgroundColor: '#142C56', borderWidth: 1, borderColor: '#2453A2' }, hash: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#1E2C43', justifyContent: 'center', alignItems: 'center' }, hashActive: { backgroundColor: '#1E5BD1' }, hashText: { color: '#7990B0', fontSize: 17, fontWeight: '800' }, hashTextActive: { color: '#fff' }, channelCopy: { flex: 1 }, channelName: { color: '#A4B4CF', fontSize: 13, fontWeight: '700' }, channelNameActive: { color: '#F8FBFF' }, channelDescription: { color: '#526784', fontSize: 9, marginTop: 1 }, badge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' }, badgeText: { color: 'white', fontSize: 9, fontWeight: '800' }, activeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, divider: { flex: 1, height: 1, backgroundColor: '#2A3A55', marginTop: 12 }, activeCard: { backgroundColor: '#17243B', borderRadius: 12, borderWidth: 1, borderColor: '#334866', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, avatars: { flexDirection: 'row' }, avatar: { width: 27, height: 27, borderRadius: 14, borderWidth: 2, borderColor: '#17243B', justifyContent: 'center', alignItems: 'center' }, avatarText: { color: '#fff', fontSize: 8 }, activeText: { color: '#32D583', fontSize: 11, fontWeight: '800' }, activeSub: { color: '#8092B1', fontSize: 9, marginTop: 3 }, chatHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 9, gap: 9 }, chatHash: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' }, chatHashText: { color: '#fff', fontWeight: '900', fontSize: 18 }, chatTitle: { color: '#F4F7FC', fontSize: 15, fontWeight: '800' }, chatSubtitle: { color: '#7E91B0', fontSize: 9, marginTop: 1 }, live: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }, liveText: { color: '#46D58C', fontSize: 9, fontWeight: '800' }, chatPanel: { backgroundColor: '#101F37', borderColor: '#2B405E', borderWidth: 1, borderRadius: 13, padding: 12, gap: 12 }, loading: { color: '#9EB0CC', textAlign: 'center', paddingVertical: 18 }, messageRow: { flexDirection: 'row', gap: 9 }, messageOwn: { opacity: 1 }, messageAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }, messageAvatarOwn: { backgroundColor: '#2563EB' }, messageInitial: { color: '#fff', fontSize: 9, fontWeight: '800' }, messageBody: { flex: 1 }, messageMeta: { flexDirection: 'row', alignItems: 'center', gap: 7 }, messageUser: { color: '#D7E5FA', fontSize: 12, fontWeight: '800' }, messageTime: { color: '#647896', fontSize: 9 }, messageText: { color: '#AEBED5', lineHeight: 18, fontSize: 12, marginTop: 2 }, composer: { flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#20334F', backgroundColor: '#0B1730', alignItems: 'flex-end' }, input: { flex: 1, maxHeight: 84, color: '#EAF1FF', backgroundColor: '#172641', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13 }, sendButton: { width: 43, height: 43, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }, sendDisabled: { backgroundColor: '#33435E' },
});

const styles = { ...baseStyles };
// Community dùng cùng bộ trắng – navy với phần còn lại của PSIFU.
Object.assign(styles, {
  segment: { flexDirection: 'row', margin: 12, padding: 4, borderRadius: 13, backgroundColor: '#EEF4FC', gap: 4 },
  segmentItem: { flex: 1, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#102A56' },
  segmentText: { color: '#536E99', fontSize: 11, fontWeight: '800' },
  segmentTextActive: { color: '#FFFFFF' },
  modeTabs: { flexDirection: 'row', margin: 12, marginBottom: 0, padding: 4, borderRadius: 13, backgroundColor: '#EAF1FA' },
  modeTab: { flex: 1, height: 37, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeActive: { backgroundColor: '#102A56' },
  modeOn: { color: '#FFFFFF', fontWeight: '900', fontSize: 11 },
  modeOff: { color: '#526F98', fontWeight: '800', fontSize: 11 },
  channelSearch: { height: 42, backgroundColor: '#F4F7FC', borderWidth: 1, borderColor: '#C9D6E8', borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, marginTop: 16 },
  channelSearchInput: { flex: 1, color: '#102A56', fontSize: 11 },
  noChannel: { color: '#71829D', fontSize: 10, paddingVertical: 12, textAlign: 'center' },
  chatPage: { flex: 1, backgroundColor: '#FFFFFF' }, page: { flex: 1, backgroundColor: '#FFFFFF' },
  roomTopbar: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#DCE6F4' }, roomHash: { color: '#173F83', fontSize: 19, fontWeight: '800' }, roomName: { color: '#102A56', fontSize: 15, fontWeight: '800' }, roomMembers: { color: '#64748B', fontSize: 10, marginLeft: 4 }, roomMeta: { color: '#71829D', fontSize: 9, marginTop: 2 }, roomDivider: { height: 1, backgroundColor: '#DCE6F4', marginTop: 29 }, welcomeChip: { alignSelf: 'center', flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 14, backgroundColor: '#EEF4FC', borderWidth: 1, borderColor: '#C9D6E8', marginTop: -13, marginBottom: 20 }, welcomeText: { color: '#536E99', fontSize: 10 },
  roomUser: { color: '#102A56', fontSize: 13, fontWeight: '800' }, roomTime: { color: '#71829D', fontSize: 9 }, roomMessageText: { color: '#355476', fontSize: 13, lineHeight: 19, marginTop: 3 }, reaction: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, height: 21, borderRadius: 11, borderWidth: 1, borderColor: '#C9D6E8', backgroundColor: '#F4F7FC' }, reactionCount: { color: '#536E99', fontSize: 9, fontWeight: '700' }, replyText: { color: '#173F83', fontSize: 10, fontWeight: '700' }, typingDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#FFFFFF' }, typingText: { color: '#64748B', fontSize: 10, marginLeft: 5 }, roomComposer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 9, margin: 8, marginTop: 0, borderRadius: 14, backgroundColor: '#F4F7FC', borderWidth: 1, borderColor: '#C9D6E8' }, plusButton: { width: 27, height: 27, borderRadius: 8, backgroundColor: '#E8EFF8', alignItems: 'center', justifyContent: 'center' }, roomInput: { flex: 1, maxHeight: 74, paddingVertical: 7, color: '#102A56', fontSize: 13 },
  topbar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#DCE6F4' }, title: { color: '#102A56', fontSize: 20, fontWeight: '800' }, roundButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F4F7FC', borderWidth: 1, borderColor: '#C9D6E8', justifyContent: 'center', alignItems: 'center' }, dot: { position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: 3, backgroundColor: '#173F83' },
  serverCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#C9D6E8', borderTopColor: '#102A56', padding: 14 }, pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF4FC', borderColor: '#C9D6E8', borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4, gap: 5 }, pillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#173F83' }, pillText: { color: '#173F83', fontSize: 9, fontWeight: '800' }, online: { color: '#173F83', fontSize: 11, fontWeight: '700' }, serverIcon: { backgroundColor: '#102A56', width: 41, height: 41, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }, serverIconText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 }, serverTitle: { color: '#102A56', fontSize: 15, fontWeight: '800' }, serverSub: { color: '#64748B', fontSize: 11, marginTop: 3 }, meta: { flexDirection: 'row', gap: 5, alignItems: 'center', borderWidth: 1, borderColor: '#DCE6F4', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 }, metaText: { color: '#536E99', fontSize: 9 }, sectionLabel: { color: '#536E99', fontWeight: '800', fontSize: 10, letterSpacing: 1, marginTop: 20, marginBottom: 9 }, groupLabel: { color: '#64748B', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 6, marginBottom: 5 },
  channelActive: { backgroundColor: '#EEF4FC', borderWidth: 1, borderColor: '#B8CDF0' }, hash: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#E8EFF8', justifyContent: 'center', alignItems: 'center' }, hashActive: { backgroundColor: '#102A56' }, hashText: { color: '#536E99', fontSize: 17, fontWeight: '800' }, channelName: { color: '#355476', fontSize: 13, fontWeight: '700' }, channelNameActive: { color: '#102A56' }, channelDescription: { color: '#71829D', fontSize: 9, marginTop: 1 }, badge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: '#173F83', justifyContent: 'center', alignItems: 'center' }, divider: { flex: 1, height: 1, backgroundColor: '#DCE6F4', marginTop: 12 }, activeCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#C9D6E8', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 27, height: 27, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }, activeText: { color: '#173F83', fontSize: 11, fontWeight: '800' }, activeSub: { color: '#64748B', fontSize: 9, marginTop: 3 },
  chatHash: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#102A56', alignItems: 'center', justifyContent: 'center' }, chatTitle: { color: '#102A56', fontSize: 15, fontWeight: '800' }, chatSubtitle: { color: '#71829D', fontSize: 9, marginTop: 1 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#173F83' }, liveText: { color: '#173F83', fontSize: 9, fontWeight: '800' }, chatPanel: { backgroundColor: '#F8FAFD', borderColor: '#DCE6F4', borderWidth: 1, borderRadius: 13, padding: 12, gap: 12 }, loading: { color: '#536E99', textAlign: 'center', paddingVertical: 18 }, messageAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#315A9D', alignItems: 'center', justifyContent: 'center' }, messageAvatarOwn: { backgroundColor: '#102A56' }, messageUser: { color: '#102A56', fontSize: 12, fontWeight: '800' }, messageTime: { color: '#71829D', fontSize: 9 }, messageText: { color: '#355476', lineHeight: 18, fontSize: 12, marginTop: 2 }, composer: { flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#DCE6F4', backgroundColor: '#FFFFFF', alignItems: 'flex-end' }, input: { flex: 1, maxHeight: 84, color: '#102A56', backgroundColor: '#F4F7FC', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13 }, sendButton: { width: 43, height: 43, borderRadius: 12, backgroundColor: '#102A56', alignItems: 'center', justifyContent: 'center' }, sendDisabled: { backgroundColor: '#9AAAC0' },
});
