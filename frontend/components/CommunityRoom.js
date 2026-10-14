import React, {useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Alert,KeyboardAvoidingView,Platform,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Database} from '../data/database';
import {io} from 'socket.io-client';
import {getAccessToken,SOCKET_URL} from '../data/api';

export default function CommunityRoom({roomId,title,user,onBack,readOnly=false}) {
  const [messages,setMessages]=useState([]),[draft,setDraft]=useState(''),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[error,setError]=useState(''),[olderBusy,setOlderBusy]=useState(false),[hasMore,setHasMore]=useState(true);
  const alive=useRef(true),sendLock=useRef(false),loadLock=useRef(false),historyLock=useRef(false);
  const merge=rows=>setMessages(previous=>[...new Map([...previous,...rows].map(row=>[row.id||row._id,row])).values()].sort((a,b)=>String(a.id||a._id).localeCompare(String(b.id||b._id))));
  const load=async()=>{if(loadLock.current)return;loadLock.current=true;try{const rows=await Database.getChatMessages(roomId);if(alive.current){merge(rows);setError('');}}catch(e){if(alive.current)setError(e.message||'Không tải được tin nhắn.');}finally{loadLock.current=false;if(alive.current)setLoading(false);}};
  useEffect(()=>{let socket;alive.current=true;load();(async()=>{const token=await getAccessToken();if(!alive.current)return;socket=io(SOCKET_URL,{transports:['websocket'],auth:{token},reconnection:true,reconnectionDelay:700,reconnectionDelayMax:5000});socket.on('connect',()=>socket.emit('chat:join',roomId));socket.on('chat:message',message=>{if(message.roomId===roomId)merge([message])});socket.on('reconnect',load)})().catch(()=>{});const fallback=setInterval(()=>{if(!socket?.connected)load()},12000);return()=>{alive.current=false;clearInterval(fallback);socket?.disconnect()}},[roomId]);
  const older=async()=>{const before=messages[0]?.id||messages[0]?._id;if(!before||historyLock.current)return;historyLock.current=true;setOlderBusy(true);try{const rows=await Database.getChatHistory(roomId,before);if(alive.current){merge(rows);setHasMore(rows.length===50)}}catch(e){if(alive.current)Alert.alert('Không tải được lịch sử',e.message)}finally{historyLock.current=false;if(alive.current)setOlderBusy(false)}};
  const send=async()=>{const text=draft.trim();if(!text||sendLock.current||readOnly)return;sendLock.current=true;setSending(true);try{const saved=await Database.saveChatMessage(roomId,{text,user:user.fullName});if(alive.current){merge([saved]);setDraft(previous=>previous===draft?'':previous)}}catch(e){if(alive.current)Alert.alert('Chưa gửi được tin nhắn',e.message||'Nội dung vẫn được giữ lại.')}finally{sendLock.current=false;if(alive.current)setSending(false)}};
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS==='ios'?'padding':Platform.OS==='android'?'height':undefined}>
    <View style={s.header}><TouchableOpacity onPress={onBack} accessibilityLabel="Quay lại"><Ionicons name="arrow-back" size={24} color="#155EEF"/></TouchableOpacity><Text style={s.title}>{title}</Text><TouchableOpacity onPress={load} accessibilityLabel="Tải lại"><Ionicons name="refresh" size={24} color="#155EEF"/></TouchableOpacity></View>
    {!!error&&<Text style={s.error}>{error}</Text>}
    {loading?<ActivityIndicator style={{margin:20}}/>:<ScrollView style={{flex:1}} contentContainerStyle={s.feed} keyboardShouldPersistTaps="handled">
      {hasMore&&messages.length>=50&&<TouchableOpacity disabled={olderBusy} onPress={older}><Text style={s.meta}>{olderBusy?'Đang tải…':'Tải tin nhắn cũ hơn'}</Text></TouchableOpacity>}
      {!messages.length&&<Text style={s.meta}>Chưa có tin nhắn trong kênh này.</Text>}
      {messages.map(row=><View key={row.id||row._id} style={[s.message,row.authorEmail===user.email&&s.mine]}><Text style={s.author}>{row.user} · {row.role}</Text><Text style={s.text}>{row.text}</Text><Text style={s.meta}>{new Date(row.createdAt).toLocaleString('vi-VN')}</Text></View>)}
    </ScrollView>}
    {readOnly?<Text style={s.meta}>Kênh thông báo chỉ quản trị viên được đăng.</Text>:<View style={s.composer}><TextInput multiline maxLength={2000} value={draft} onChangeText={setDraft} placeholder="Nhắn tin trong kênh…" style={s.input}/><TouchableOpacity accessibilityLabel="Gửi tin nhắn" disabled={sending||!draft.trim()} onPress={send}><Ionicons name="send" size={25} color={sending||!draft.trim()?'#94A3B8':'#155EEF'}/></TouchableOpacity></View>}
  </KeyboardAvoidingView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#F8FAFF'},header:{flexDirection:'row',alignItems:'center',gap:12,padding:16,backgroundColor:'#fff'},title:{flex:1,fontSize:18,fontWeight:'800',color:'#102A56'},feed:{padding:16,gap:12},message:{padding:12,borderRadius:12,backgroundColor:'#fff',borderWidth:1,borderColor:'#E0E8F5'},mine:{backgroundColor:'#EAF1FF'},author:{fontWeight:'700',color:'#102A56'},text:{fontSize:15,lineHeight:22,color:'#102A56',marginTop:6},meta:{fontSize:12,lineHeight:18,color:'#64748B',paddingVertical:8},error:{padding:12,color:'#B42318'},composer:{flexDirection:'row',gap:12,alignItems:'center',padding:12,backgroundColor:'#fff'},input:{flex:1,minHeight:44,maxHeight:120,fontSize:16,backgroundColor:'#F1F5F9',padding:10,borderRadius:12}});
