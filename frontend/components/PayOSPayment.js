import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Database } from '../data/database';

const C = { ink:'#F7F9FF', muted:'#9BAAC4', navy:'#071426', surface:'#0D1D33', line:'#213755', blue:'#4C82FF', violet:'#8B5CF6', cyan:'#58E0FF', gold:'#F7C873' };

export default function PayOSPayment({ coins, email, onPaid, onCancel }) {
  const [order, setOrder] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [left, setLeft] = useState(120), [expired, setExpired] = useState(false), [checking, setChecking] = useState(false);
  const creating = useRef(false), verifying = useRef(false), paid = useRef(false), generation = useRef(0);
  const createOrder = async () => {
    if (creating.current) return;
    creating.current = true; paid.current = false;
    const current = ++generation.current;
    setLoading(true); setError(''); setOrder(null); setExpired(false); setLeft(120);
    try { const result = await Database.createPayosTopup(email, coins); if (current === generation.current) setOrder(result); }
    catch (e) { if (current === generation.current) setError(e?.data?.msg || e?.message || 'Không thể tạo đơn nạp Xu.'); }
    finally { creating.current = false; if (current === generation.current) setLoading(false); }
  };
  useEffect(() => { createOrder(); return () => { generation.current += 1; }; }, [email, coins]);
  const verify = async manual => {
    if (!order || verifying.current || paid.current) return;
    verifying.current = true; setChecking(true);
    const current = generation.current;
    try {
      const result = await Database.getPayosOrder(order.orderCode);
      if (current !== generation.current) return;
      if (result.status === 'PAID') { paid.current = true; onPaid(result); return; }
      if (manual) Alert.alert('Trạng thái giao dịch', ['CANCELLED','EXPIRED','FAILED'].includes(result.status) ? 'Đơn đã hủy, hết hạn hoặc thất bại.' : 'PayOS chưa xác nhận. Nếu đã chuyển khoản, vui lòng chờ thêm một chút.');
    } catch (e) { if (manual && current === generation.current) Alert.alert('Không kiểm tra được', e?.message || 'Vui lòng thử lại.'); }
    finally { verifying.current = false; if (current === generation.current) setChecking(false); }
  };
  useEffect(() => {
    if (!order || expired) return;
    const countdown = setInterval(() => setLeft(value => Math.max(0, value - 1)), 1000);
    const polling = setInterval(() => verify(false), 5000);
    return () => { clearInterval(countdown); clearInterval(polling); };
  }, [order, expired]);
  useEffect(() => { if (left === 0) setExpired(true); }, [left]);
  const time = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  if (loading) return <State title="Đang tạo mã QR" copy="PSIFU đang kết nối an toàn với PayOS…" action="HỦY VÀ QUAY LẠI" onAction={onCancel} loading />;
  if (error) return <State icon="alert-circle-outline" title="Không thể tạo giao dịch" copy={error} action="THỬ LẠI" onAction={createOrder} secondary="QUAY LẠI" onSecondary={onCancel} />;
  if (expired) return <State icon="time-outline" title="Đang chờ xác nhận" copy="Đã quá 2 phút. Nếu bạn đã chuyển khoản, giao dịch vẫn được hệ thống kiểm tra an toàn." action={checking ? 'ĐANG KIỂM TRA…' : 'KIỂM TRA LẠI'} onAction={() => verify(true)} secondary="TẠO ĐƠN MỚI" onSecondary={createOrder} />;
  return <View style={s.screen}><View style={s.glowA}/><View style={s.glowB}/><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <View style={s.header}><TouchableOpacity accessibilityLabel="Quay lại" style={s.iconButton} onPress={onCancel}><Ionicons name="chevron-back" size={21} color={C.ink}/></TouchableOpacity><View><Text style={s.eyebrow}>PAYOS · VIETQR</Text><Text style={s.title}>Quét mã để nạp Xu</Text></View><View style={s.secure}><Ionicons name="shield-checkmark" size={16} color={C.cyan}/></View></View>
    <View style={s.summary}><View><Text style={s.summaryLabel}>TỔNG THANH TOÁN</Text><Text style={s.amount}>{Number(order.amount).toLocaleString('vi-VN')} <Text style={s.currency}>đ</Text></Text><Text style={s.coinLine}>Nhận {coins} Xu vào ví PSIFU</Text></View><View style={s.timer}><View style={s.liveDot}/><Text style={s.timerText}>{time}</Text></View></View>
    <View style={s.qrCard}><View style={s.qrHalo}><View style={s.qrFrame}>{order.qrCode ? <QRCode value={order.qrCode} size={218} color="#071426" backgroundColor="#FFFFFF" ecl="M" /> : <Text style={s.missing}>PayOS chưa trả về mã QR.</Text>}</View></View><Text style={s.scanTitle}>Mở ứng dụng ngân hàng để quét</Text><Text style={s.scanCopy}>Giữ nguyên số tiền và nội dung chuyển khoản. Bạn không cần rời khỏi PSIFU.</Text></View>
    <View style={s.status}><ActivityIndicator size="small" color={C.cyan}/><View style={{flex:1}}><Text style={s.statusTitle}>Đang tự động xác nhận</Text><Text style={s.statusCopy}>Xu sẽ được cộng ngay khi PayOS phản hồi thành công.</Text></View></View>
    <TouchableOpacity disabled={checking} style={[s.primary, checking && s.disabled]} onPress={() => verify(true)}><Ionicons name="refresh" size={17} color="#fff"/><Text style={s.primaryText}>{checking ? 'ĐANG KIỂM TRA…' : 'KIỂM TRA TRẠNG THÁI'}</Text></TouchableOpacity>
    <TouchableOpacity style={s.secondary} onPress={onCancel}><Text style={s.secondaryText}>Quay lại chọn gói Xu</Text></TouchableOpacity>
  </ScrollView></View>;
}

function State({ icon, title, copy, action, onAction, secondary, onSecondary, loading }) { return <View style={s.state}><View style={s.glowA}/><View style={s.stateCard}>{loading ? <ActivityIndicator size="large" color={C.cyan}/> : <Ionicons name={icon} size={38} color={C.cyan}/>}<Text style={s.stateTitle}>{title}</Text><Text style={s.stateCopy}>{copy}</Text><TouchableOpacity style={s.primary} onPress={onAction}><Text style={s.primaryText}>{action}</Text></TouchableOpacity>{secondary && <TouchableOpacity style={s.secondary} onPress={onSecondary}><Text style={s.secondaryText}>{secondary}</Text></TouchableOpacity>}</View></View>; }

const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:C.navy,overflow:'hidden'},content:{padding:18,paddingTop:24,paddingBottom:36},glowA:{position:'absolute',width:260,height:260,borderRadius:130,backgroundColor:'rgba(76,130,255,.16)',top:-100,right:-90},glowB:{position:'absolute',width:220,height:220,borderRadius:110,backgroundColor:'rgba(139,92,246,.12)',bottom:20,left:-130},
  header:{flexDirection:'row',alignItems:'center',gap:12},iconButton:{width:42,height:42,borderRadius:14,backgroundColor:'rgba(255,255,255,.07)',borderWidth:1,borderColor:'rgba(255,255,255,.10)',alignItems:'center',justifyContent:'center'},eyebrow:{color:C.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.5},title:{color:C.ink,fontSize:20,fontWeight:'900',marginTop:3},secure:{marginLeft:'auto',width:38,height:38,borderRadius:19,backgroundColor:'rgba(88,224,255,.10)',alignItems:'center',justifyContent:'center'},
  summary:{marginTop:22,borderRadius:20,padding:20,backgroundColor:C.surface,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',shadowColor:'#000',shadowOpacity:.28,shadowRadius:20,shadowOffset:{width:0,height:10},elevation:8},summaryLabel:{color:C.muted,fontSize:9,fontWeight:'800',letterSpacing:1.1},amount:{color:C.ink,fontSize:29,fontWeight:'900',marginTop:6},currency:{fontSize:16,color:C.gold},coinLine:{color:'#B8C7E2',fontSize:12,marginTop:5},timer:{flexDirection:'row',alignItems:'center',gap:7,borderRadius:999,paddingHorizontal:11,paddingVertical:8,backgroundColor:'rgba(88,224,255,.08)',borderWidth:1,borderColor:'rgba(88,224,255,.20)'},liveDot:{width:6,height:6,borderRadius:3,backgroundColor:C.cyan},timerText:{color:C.cyan,fontSize:12,fontWeight:'900'},
  qrCard:{marginTop:14,borderRadius:24,padding:18,alignItems:'center',backgroundColor:'rgba(13,29,51,.92)',borderWidth:1,borderColor:C.line},qrHalo:{padding:8,borderRadius:25,backgroundColor:'rgba(76,130,255,.22)'},qrFrame:{width:242,height:242,borderRadius:18,backgroundColor:'#fff',padding:12,alignItems:'center',justifyContent:'center'},missing:{color:'#7C2D12',textAlign:'center'},scanTitle:{color:C.ink,fontSize:15,fontWeight:'900',marginTop:17},scanCopy:{color:C.muted,fontSize:12,lineHeight:18,textAlign:'center',marginTop:6,maxWidth:290},
  status:{marginTop:14,padding:14,borderRadius:16,flexDirection:'row',gap:11,alignItems:'center',backgroundColor:'rgba(88,224,255,.07)',borderWidth:1,borderColor:'rgba(88,224,255,.14)'},statusTitle:{color:C.ink,fontSize:12,fontWeight:'900'},statusCopy:{color:C.muted,fontSize:10,lineHeight:15,marginTop:2},primary:{minHeight:50,width:'100%',borderRadius:15,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,marginTop:14,shadowColor:C.blue,shadowOpacity:.34,shadowRadius:13,shadowOffset:{width:0,height:7},elevation:7},primaryText:{color:'#fff',fontSize:11,fontWeight:'900',letterSpacing:.45},disabled:{opacity:.6},secondary:{minHeight:44,width:'100%',alignItems:'center',justifyContent:'center',marginTop:6},secondaryText:{color:'#ADC0DE',fontSize:11,fontWeight:'800'},
  state:{flex:1,backgroundColor:C.navy,alignItems:'center',justifyContent:'center',padding:22,overflow:'hidden'},stateCard:{width:'100%',borderRadius:24,padding:25,alignItems:'center',backgroundColor:C.surface,borderWidth:1,borderColor:C.line},stateTitle:{fontSize:20,fontWeight:'900',color:C.ink,textAlign:'center',marginTop:15},stateCopy:{fontSize:12,lineHeight:19,color:C.muted,textAlign:'center',marginTop:8}
});
