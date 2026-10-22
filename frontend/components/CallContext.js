import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { getAccessToken, SOCKET_URL } from '../data/api';
import JitsiSession from './JitsiSession';

const CallContext = createContext({ startCall: () => {} });

export const useCalls = () => useContext(CallContext);

export function CallProvider({ children }) {
  const socketRef = useRef(null);
  const tokenRef = useRef(null);
  const timeoutRef = useRef(null);
  const [call, setCall] = useState(null);

  const clearTimer = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); timeoutRef.current = null; };
  const finish = useCallback(() => { clearTimer(); setCall(null); }, []);

  const connect = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) { socketRef.current?.disconnect(); socketRef.current = null; tokenRef.current = null; return null; }
    if (socketRef.current && tokenRef.current === token) return socketRef.current;
    socketRef.current?.disconnect();
    const socket = io(SOCKET_URL, { transports: ['websocket'], auth: { token }, reconnection: true, reconnectionDelay: 700, reconnectionDelayMax: 5000 });
    socket.on('call:incoming', payload => setCall(current => current?.phase === 'meeting' ? current : { ...payload, phase: 'incoming' }));
    socket.on('call:accepted', payload => setCall(current => current?.callId === payload.callId ? { ...current, booking: payload.booking || current.booking, phase: 'meeting' } : current));
    socket.on('call:rejected', payload => setCall(current => current?.callId === payload.callId ? { ...current, phase: 'rejected' } : current));
    socket.on('call:ended', payload => setCall(current => current?.callId === payload.callId ? null : current));
    socketRef.current = socket;
    tokenRef.current = token;
    return socket;
  }, []);

  useEffect(() => {
    let alive = true;
    const ensure = () => { if (alive) connect().catch(() => {}); };
    ensure();
    const timer = setInterval(ensure, 5000);
    return () => { alive = false; clearInterval(timer); clearTimer(); socketRef.current?.disconnect(); socketRef.current = null; tokenRef.current = null; };
  }, [connect]);

  const startCall = useCallback(async (booking, displayName) => {
    if (!booking) return { ok: false, message: 'Cuộc trò chuyện chưa gắn với lịch mentoring.' };
    if (String(booking.status || '').toLowerCase() !== 'đã xác nhận') return { ok: false, message: 'Mentor cần xác nhận lịch trước khi gọi.' };
    const socket = await connect();
    if (!socket) return { ok: false, message: 'Bạn cần đăng nhập lại để thực hiện cuộc gọi.' };
    return new Promise(resolve => {
      socket.emit('call:initiate', { bookingId: booking.id || booking._id }, response => {
        if (!response?.ok) return resolve({ ok: false, message: response?.message || 'Chưa thể bắt đầu cuộc gọi.' });
        setCall({ callId: response.callId, booking: response.booking || booking, peerName: response.peerName, displayName, phase: 'outgoing' });
        clearTimer();
        timeoutRef.current = setTimeout(() => setCall(current => current?.callId === response.callId ? { ...current, phase: 'missed' } : current), 30000);
        resolve({ ok: true });
      });
    });
  }, [connect]);

  const accept = async () => { const socket = await connect(); if (!socket || !call) return; clearTimer(); socket.emit('call:accept', { callId: call.callId }); setCall(current => ({ ...current, phase: 'meeting' })); };
  const reject = async () => { const socket = await connect(); if (socket && call) socket.emit('call:reject', { callId: call.callId }); finish(); };
  const end = async () => { const socket = await connect(); if (socket && call) socket.emit('call:end', { callId: call.callId }); finish(); };

  return <CallContext.Provider value={{ startCall }}>
    {children}
    {call?.phase === 'meeting' ? <Modal visible animationType="slide" onRequestClose={end}><JitsiSession booking={call.booking} displayName={call.displayName} onLeave={end}/></Modal> : null}
    {call && call.phase !== 'meeting' ? <Modal visible transparent animationType="fade" onRequestClose={call.phase === 'incoming' ? reject : end}><View style={s.backdrop}><View style={s.card}><View style={s.avatar}><Ionicons name="videocam" size={34} color="#fff"/></View><Text style={s.name}>{call.peerName || 'PSIFU Mentor'}</Text><Text style={s.status}>{call.phase === 'incoming' ? 'Cuộc gọi video đến' : call.phase === 'outgoing' ? 'Đang gọi…' : call.phase === 'rejected' ? 'Người nhận đã từ chối' : 'Không có phản hồi'}</Text>{call.phase === 'outgoing' && <ActivityIndicator color="#155EEF" style={{marginTop:16}}/>}<View style={s.actions}>{call.phase === 'incoming' ? <><TouchableOpacity style={[s.action,s.reject]} onPress={reject}><Ionicons name="call" size={24} color="#fff"/></TouchableOpacity><TouchableOpacity style={[s.action,s.accept]} onPress={accept}><Ionicons name="videocam" size={24} color="#fff"/></TouchableOpacity></> : <TouchableOpacity style={[s.action,s.reject]} onPress={end}><Ionicons name="call" size={24} color="#fff"/></TouchableOpacity>}</View></View></View></Modal> : null}
  </CallContext.Provider>;
}

const s=StyleSheet.create({backdrop:{flex:1,backgroundColor:'rgba(5,18,42,.82)',alignItems:'center',justifyContent:'center',padding:24},card:{width:'100%',maxWidth:360,backgroundColor:'#fff',borderRadius:28,padding:28,alignItems:'center'},avatar:{width:82,height:82,borderRadius:41,backgroundColor:'#155EEF',alignItems:'center',justifyContent:'center'},name:{fontSize:22,fontWeight:'900',color:'#102A56',marginTop:18,textAlign:'center'},status:{fontSize:13,color:'#64748B',marginTop:7},actions:{flexDirection:'row',gap:36,marginTop:30},action:{width:62,height:62,borderRadius:31,alignItems:'center',justifyContent:'center'},reject:{backgroundColor:'#E5484D',transform:[{rotate:'135deg'}]},accept:{backgroundColor:'#16A66A'}});
