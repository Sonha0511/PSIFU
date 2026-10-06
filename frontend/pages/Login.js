import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Database } from '../data/database';
import AuthSnowflakes from '../components/AuthSnowflakes';

export default function Login({ onLoginSuccess, onSwitchToRegister, onForgotPassword, prefilledEmail = '' }) {
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  useEffect(() => setEmail(prefilledEmail), [prefilledEmail]);
  useEffect(() => { if (googleClientId) GoogleSignin.configure({ webClientId: googleClientId }); }, [googleClientId]);
  const login = async () => {
    if (!email.trim() || !password) return setError('Vui lòng nhập email và mật khẩu.');
    setLoading(true); setError('');
    const result = await Database.checkLogin(email.trim(), password);
    setLoading(false);
    if (result.success) onLoginSuccess(result.user);
    else setError(result.msg || 'Không thể đăng nhập lúc này. Vui lòng thử lại.');
  };
  const loginWithGoogle = async () => {
    if (!googleClientId) return setError('Đăng nhập Google chưa được cấu hình cho bản ứng dụng này.');
    setLoading(true); setError('');
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult?.idToken || signInResult?.data?.idToken;
      if (!idToken) throw new Error('Google chưa trả về thông tin xác thực.');
      const result = await Database.loginWithGoogle(idToken);
      if (result.success) onLoginSuccess(result.user);
      else setError(result.msg || 'Không thể đăng nhập bằng Google.');
    } catch (signInError) {
      if (signInError?.code !== 'SIGN_IN_CANCELLED') setError(signInError?.message || 'Không thể đăng nhập bằng Google.');
    } finally { setLoading(false); }
  };
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"><View style={s.card}><AuthSnowflakes />
    <View style={s.brand}><Image source={require('../assets/logo.png')} style={s.logo} resizeMode="contain" /><View><Text style={s.brandName}>PSIFU</Text><Text style={s.brandSub}>FPT UNIVERSITY MENTORING</Text></View></View>
    <View style={s.hero}><Text style={s.title}>Chào mừng bạn trở lại</Text><Text style={s.subtitle}>Đăng nhập để tiếp tục học cùng Mentor và cộng đồng PSIFU.</Text></View>
    <View style={s.form}><Text style={s.label}>Email</Text><View style={[s.inputWrap, error && s.inputError]}><Ionicons name="mail-outline" size={21} color="#183B73" /><TextInput style={s.input} placeholder="Nhập email của bạn" placeholderTextColor="#8A9AB5" value={email} onChangeText={v => { setEmail(v); setError(''); }} autoCapitalize="none" keyboardType="email-address" autoComplete="email" /></View>
      <View style={s.passwordLabel}><Text style={s.label}>Mật khẩu</Text><TouchableOpacity onPress={onForgotPassword}><Text style={s.forgotText}>Quên mật khẩu?</Text></TouchableOpacity></View><View style={[s.inputWrap, error && s.inputError]}><Ionicons name="lock-closed-outline" size={21} color="#183B73" /><TextInput style={s.input} placeholder="Nhập mật khẩu" placeholderTextColor="#8A9AB5" value={password} onChangeText={v => { setPassword(v); setError(''); }} secureTextEntry={!showPassword} autoComplete="current-password" /><TouchableOpacity hitSlop={10} onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#183B73" /></TouchableOpacity></View>
      {error ? <Text style={s.error}>{error}</Text> : null}<TouchableOpacity style={[s.primaryButton, loading && s.disabled]} onPress={login} disabled={loading}><Text style={s.primaryText}>{loading ? 'ĐANG ĐĂNG NHẬP...' : 'Đăng nhập  →'}</Text></TouchableOpacity>
      <View style={s.divider}><View style={s.dividerLine}/><Text style={s.dividerText}>hoặc</Text><View style={s.dividerLine}/></View>
      <TouchableOpacity style={[s.googleButton, loading && s.disabled]} onPress={loginWithGoogle} disabled={loading}><Text style={s.googleMark}>G</Text><Text style={s.googleText}>Tiếp tục với Google</Text></TouchableOpacity>
    </View><View style={s.bottom}><Text style={s.bottomText}>Chưa có tài khoản? </Text><TouchableOpacity onPress={onSwitchToRegister}><Text style={s.link}>Đăng ký ngay</Text></TouchableOpacity></View><View style={s.notice}><Ionicons name="shield-checkmark-outline" size={17} color="#2664E8" /><Text style={s.noticeText}>Không cần xác thực email để bắt đầu.</Text></View>
  </View></ScrollView></KeyboardAvoidingView>;
}
const s = StyleSheet.create({ screen:{flex:1,backgroundColor:'#F1F3F9'},scroll:{flexGrow:1,justifyContent:'center',padding:18},card:{width:'100%',maxWidth:460,alignSelf:'center',overflow:'hidden',backgroundColor:'#FFF',borderRadius:16,paddingHorizontal:28,paddingTop:30,paddingBottom:26,shadowColor:'#1E40AF',shadowOpacity:.18,shadowRadius:16,elevation:5},brand:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9},logo:{width:48,height:48,borderRadius:10},brandName:{fontSize:21,fontWeight:'900',color:'#0F3675',letterSpacing:.5},brandSub:{fontSize:9,fontWeight:'700',color:'#2360B9',letterSpacing:.5,marginTop:2},hero:{marginTop:32},title:{color:'#112F65',fontSize:26,fontWeight:'800',textAlign:'center'},subtitle:{color:'#526987',fontSize:15,lineHeight:22,textAlign:'center',marginTop:9,paddingHorizontal:5},form:{marginTop:28},label:{fontSize:15,fontWeight:'800',color:'#152D5C'},passwordLabel:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:18,marginBottom:8},inputWrap:{height:54,flexDirection:'row',alignItems:'center',gap:11,backgroundColor:'#F0F2FD',borderRadius:11,paddingHorizontal:14,borderWidth:1,borderColor:'#E2E7F4'},inputError:{borderColor:'#E07171'},input:{flex:1,fontSize:16,color:'#142E5E'},forgotText:{fontSize:14,color:'#2463EE',fontWeight:'700'},error:{fontSize:14,color:'#C23434',marginTop:9,lineHeight:20},primaryButton:{height:54,borderRadius:11,backgroundColor:'#2864E8',alignItems:'center',justifyContent:'center',marginTop:20,shadowColor:'#2864E8',shadowOpacity:.27,shadowRadius:7,elevation:3},disabled:{opacity:.6},primaryText:{color:'#FFF',fontSize:17,fontWeight:'800'},divider:{flexDirection:'row',alignItems:'center',gap:10,marginVertical:18},dividerLine:{height:1,backgroundColor:'#E2E7F4',flex:1},dividerText:{fontSize:13,color:'#71829D'},googleButton:{height:52,borderRadius:11,borderWidth:1,borderColor:'#D9E0EC',backgroundColor:'#FFF',flexDirection:'row',justifyContent:'center',alignItems:'center',gap:10},googleMark:{fontSize:20,fontWeight:'900',color:'#4285F4'},googleText:{fontSize:16,fontWeight:'800',color:'#263B60'},bottom:{marginTop:20,flexDirection:'row',justifyContent:'center'},bottomText:{fontSize:14,color:'#536987'},link:{fontSize:14,color:'#2463EE',fontWeight:'800'},notice:{marginTop:23,minHeight:34,borderRadius:12,backgroundColor:'#F3F5FD',flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',paddingHorizontal:10},noticeText:{fontSize:12,color:'#5C7192'} });
