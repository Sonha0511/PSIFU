import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../data/database';

export default function ChangePassword({email,onBack,onForgot}) {
  const [current,setCurrent]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[show,setShow]=useState({}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const lock=useRef(false);
  const submit=async()=>{
    if(lock.current)return;
    if(!current||password.length<8||password===current||password!==confirm){setError('Nhập mật khẩu hiện tại, mật khẩu mới ít nhất 8 ký tự, khác mật khẩu cũ và xác nhận trùng khớp.');return;}
    lock.current=true;setBusy(true);setError('');
    try{await Database.changePassword(current,password);setCurrent('');setPassword('');setConfirm('');Alert.alert('Đã đổi mật khẩu','Các phiên đăng nhập khác đã hết hiệu lực. Bạn vẫn đăng nhập trên thiết bị này.',[{text:'Đóng',onPress:onBack}]);}
    catch(e){setError(e?.message||'Không thể đổi mật khẩu. Vui lòng thử lại.');}
    finally{lock.current=false;setBusy(false);}
  };
  const field=(label,key,value,setValue)=><View key={key}><Text style={s.label}>{label}</Text><View style={s.inputWrap}><TextInput value={value} onChangeText={setValue} editable={!busy} style={s.input} secureTextEntry={!show[key]} autoCapitalize="none" autoCorrect={false} textContentType={key==='current'?'password':'newPassword'}/><TouchableOpacity accessibilityLabel={show[key]?'Ẩn mật khẩu':'Hiện mật khẩu'} onPress={()=>setShow(previous=>({...previous,[key]:!previous[key]}))}><Ionicons name={show[key]?'eye-off-outline':'eye-outline'} size={22} color="#155EEF"/></TouchableOpacity></View></View>;
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <View style={s.top}><TouchableOpacity onPress={onBack} disabled={busy}><Ionicons name="arrow-back" size={24} color="#102A56"/></TouchableOpacity><Text style={s.topTitle}>Đổi mật khẩu</Text></View>
    <Text style={s.copy}>{email}</Text>
    {field('Mật khẩu hiện tại','current',current,setCurrent)}
    {field('Mật khẩu mới','password',password,setPassword)}
    {field('Xác nhận mật khẩu mới','confirm',confirm,setConfirm)}
    <Text style={s.rule}>Ít nhất 8 ký tự, tối đa 72 byte. Đổi mật khẩu sẽ đăng xuất các thiết bị khác.</Text>
    {!!error&&<Text accessibilityRole="alert" style={[s.copy,{color:'#B42318'}]}>{error}</Text>}
    <TouchableOpacity disabled={busy} style={[s.button,busy&&{opacity:.5}]} onPress={submit}><Text style={s.buttonText}>{busy?'Đang lưu…':'Đổi mật khẩu'}</Text></TouchableOpacity>
    <TouchableOpacity disabled={busy} onPress={onForgot}><Text style={s.forgot}>Quên mật khẩu hiện tại? Xác minh qua email</Text></TouchableOpacity>
  </ScrollView></KeyboardAvoidingView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#FAFAFF'},content:{padding:16,paddingBottom:30},top:{height:42,flexDirection:'row',alignItems:'center',gap:13},topTitle:{flex:1,color:'#102A56',fontSize:15,fontWeight:'900'},profile:{width:31,height:31,borderRadius:16,backgroundColor:'#155EEF',alignItems:'center',justifyContent:'center'},account:{backgroundColor:'#EEF2FF',borderRadius:10,padding:10,flexDirection:'row',gap:8,alignItems:'center',marginTop:12},accountTitle:{fontSize:9,color:'#155EEF',fontWeight:'900'},accountSub:{fontSize:8,color:'#536E99',marginTop:2},title:{fontSize:18,color:'#102A56',fontWeight:'900',marginTop:14},copy:{fontSize:10,color:'#64748B',marginTop:4,marginBottom:9},label:{color:'#233B62',fontSize:10,fontWeight:'800',marginTop:13,marginBottom:6},inputWrap:{height:46,borderRadius:10,backgroundColor:'#fff',borderWidth:1,borderColor:'#DFE6F2',alignItems:'center',paddingHorizontal:12,flexDirection:'row',gap:8},input:{flex:1,color:'#102A56',fontSize:12},strength:{marginTop:13},strengthLabel:{fontSize:8,color:'#64748B'},strengthValue:{position:'absolute',right:0,fontSize:8,color:'#64748B'},bars:{flexDirection:'row',gap:4,marginTop:6},bar:{height:4,flex:1,borderRadius:3,backgroundColor:'#E5EAF3'},barOn:{backgroundColor:'#155EEF'},rules:{backgroundColor:'#EEF2FF',borderRadius:11,padding:12,marginTop:14},rulesTitle:{color:'#102A56',fontSize:10,fontWeight:'900',marginBottom:6},rule:{color:'#64748B',fontSize:9,lineHeight:16},button:{height:47,borderRadius:11,backgroundColor:'#155EEF',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7,marginTop:17},buttonText:{fontSize:11,color:'#fff',fontWeight:'900'},forgot:{fontSize:9,color:'#155EEF',fontWeight:'800',textAlign:'center',marginTop:14},footer:{fontSize:8,color:'#8A9BB5',textAlign:'center',marginTop:28}});
