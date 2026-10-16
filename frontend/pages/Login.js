import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, NativeModules, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../data/database';
import AuthSnowflakes from '../components/AuthSnowflakes';

export default function Login({ onLoginSuccess, onSwitchToRegister, onForgotPassword, prefilledEmail = '', isDarkMode = false }) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
  const s = useMemo(() => createStyles(isDarkMode, isDesktop), [isDarkMode, isDesktop]);
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const canUseNativeGoogle = Boolean(NativeModules.RNGoogleSignin);
  const isWeb = Platform.OS === 'web';
  useEffect(() => setEmail(prefilledEmail), [prefilledEmail]);
  useEffect(() => {
    if (!googleClientId || !canUseNativeGoogle) return;
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({ webClientId: googleClientId });
  }, [canUseNativeGoogle, googleClientId]);
  useEffect(() => {
    if (!isWeb || !googleClientId || typeof document === 'undefined') return undefined;
    if (window.google?.accounts?.id) return undefined;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [googleClientId, isWeb]);
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
    if (isWeb) {
      if (!window.google?.accounts?.id) return setError('Google chưa sẵn sàng. Vui lòng thử lại.');
      setLoading(true); setError('');
      const handleCredential = async response => {
        try {
          const result = await Database.loginWithGoogle(response.credential);
          if (result.success) onLoginSuccess(result.user);
          else setError(result.msg || 'Không thể đăng nhập bằng Google.');
        } catch (webError) { setError(webError?.message || 'Không thể đăng nhập bằng Google.'); }
        finally { setLoading(false); }
      };
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleCredential, ux_mode: 'popup' });
      window.google.accounts.id.prompt(notification => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) setLoading(false);
      });
      return;
    }
    if (!canUseNativeGoogle) return setError('Google Sign-In cần bản PSIFU Development Build; Expo Go chỉ dùng để xem giao diện và đăng nhập thường.');
    setLoading(true); setError('');
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
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
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.shell}>
        {isDesktop && <View style={s.story}>
          <AuthSnowflakes />
          <View style={s.storyBrand}><Image source={require('../assets/logo.png')} style={s.storyLogo} resizeMode="contain" /><Text style={s.storyBrandName}>PSIFU</Text></View>
          <View style={s.storyContent}>
            <Text style={s.eyebrow}>PEOPLE SKILLS · INSTANT FOR YOU</Text>
            <Text style={[s.storyTitle, { fontSize: 42, lineHeight: 51 }]}>Học đúng người.{`\n`}Hỏi đúng lúc.</Text>
            <Text style={s.storyCopy}>Không gian mentoring dành cho sinh viên FPT — kết nối, học tập và tiến bộ cùng cộng đồng.</Text>
            <View style={s.benefits}>
              <Benefit icon="people-outline" text="Mentoring 1-on-1 đáng tin cậy" styles={s} />
              <Benefit icon="calendar-outline" text="Lịch học và trao đổi trong một nơi" styles={s} />
              <Benefit icon="shield-checkmark-outline" text="Thanh toán và tài khoản được bảo vệ" styles={s} />
            </View>
          </View>
          <Text style={s.storyFoot}>PSIFU · FPT University Mentoring</Text>
        </View>}
        <View style={s.card}>
          {!isDesktop && <View style={s.brand}><Image source={require('../assets/logo.png')} style={s.logo} resizeMode="contain" /><View><Text style={s.brandName}>PSIFU</Text><Text style={s.brandSub}>FPT UNIVERSITY MENTORING</Text></View></View>}
          <View style={s.hero}><Text style={[s.title, { fontSize: isDesktop ? 31 : 27, lineHeight: isDesktop ? 38 : 34 }]}>Chào mừng trở lại</Text><Text style={s.subtitle}>Đăng nhập để tiếp tục hành trình cùng Mentor và cộng đồng PSIFU.</Text></View>
          <View style={s.form}>
            <Text style={s.label}>Email</Text><View style={[s.inputWrap, error && s.inputError]}><Ionicons name="mail-outline" size={20} color={s.icon.color} /><TextInput style={s.input} placeholder="name@fpt.edu.vn" placeholderTextColor={s.placeholder.color} value={email} onChangeText={v => { setEmail(v); setError(''); }} autoCapitalize="none" keyboardType="email-address" autoComplete="email" /></View>
            <View style={s.passwordLabel}><Text style={s.label}>Mật khẩu</Text><TouchableOpacity onPress={onForgotPassword}><Text style={s.forgotText}>Quên mật khẩu?</Text></TouchableOpacity></View><View style={[s.inputWrap, error && s.inputError]}><Ionicons name="lock-closed-outline" size={20} color={s.icon.color} /><TextInput style={s.input} placeholder="Nhập mật khẩu" placeholderTextColor={s.placeholder.color} value={password} onChangeText={v => { setPassword(v); setError(''); }} secureTextEntry={!showPassword} autoComplete="current-password" onSubmitEditing={login} /><TouchableOpacity hitSlop={10} onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={s.icon.color} /></TouchableOpacity></View>
            {error ? <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={17} color="#E35D6A"/><Text style={s.error}>{error}</Text></View> : null}
            <TouchableOpacity style={[s.loginGlowButton, loading && s.disabled]} onPress={login} disabled={loading}><Text style={s.primaryText}>{loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}</Text><Ionicons name="arrow-forward" size={18} color="#FFF"/></TouchableOpacity>
            {googleClientId ? <><View style={s.divider}><View style={s.dividerLine}/><Text style={s.dividerText}>hoặc tiếp tục với</Text><View style={s.dividerLine}/></View><TouchableOpacity style={[s.googleButton, loading && s.disabled]} onPress={loginWithGoogle} disabled={loading}><Text style={s.googleMark}>G</Text><Text style={s.googleText}>Google</Text></TouchableOpacity></> : null}
          </View>
          <View style={s.bottom}><Text style={s.bottomText}>Chưa có tài khoản? </Text><TouchableOpacity onPress={onSwitchToRegister}><Text style={s.link}>Đăng ký ngay</Text></TouchableOpacity></View>
          <View style={s.notice}><Ionicons name="shield-checkmark-outline" size={16} color={s.icon.color} /><Text style={s.noticeText}>Kết nối bảo mật với hệ thống PSIFU</Text></View>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Benefit({ icon, text, styles }) { return <View style={styles.benefit}><View style={styles.benefitIcon}><Ionicons name={icon} size={18} color="#BFD3FF"/></View><Text style={styles.benefitText}>{text}</Text></View>; }

function createStyles(dark, desktop) {
  const p = dark ? { bg:'#0D1118',card:'#171C26',input:'#202735',text:'#F5F7FB',muted:'#A4AFBF',border:'#303A4B',primary:'#6793F4',primarySolid:'#4F78E7',soft:'#20283A',icon:'#8FB0F7' } : { bg:'#F2F5FA',card:'#FFFFFF',input:'#F8FAFD',text:'#172033',muted:'#68758A',border:'#DDE4EF',primary:'#275FD8',primarySolid:'#275FD8',soft:'#EFF4FF',icon:'#416DBD' };
  return StyleSheet.create({
    screen:{flex:1,backgroundColor:p.bg},scroll:{flexGrow:1,justifyContent:'center',padding:desktop?32:0},shell:{width:'100%',maxWidth:1080,alignSelf:'center',flexDirection:desktop?'row':'column',minHeight:desktop?680:undefined,backgroundColor:p.card,borderRadius:desktop?28:0,overflow:'hidden',shadowColor:'#07152F',shadowOpacity:dark?.35:.15,shadowRadius:28,elevation:8},
    story:{width:'46%',backgroundColor:'rgba(20,37,75,1)',padding:46,justifyContent:'space-between',overflow:'hidden'},storyBrand:{flexDirection:'row',alignItems:'center',gap:10},storyLogo:{width:44,height:44,borderRadius:12},storyBrandName:{color:'#FFF',fontSize:21,fontWeight:'900',letterSpacing:1.2},storyContent:{zIndex:1},eyebrow:{color:'#9FC0FF',fontSize:11,fontWeight:'900',letterSpacing:1.6},storyTitle:{color:'#FFF',fontSize:42,lineHeight:51,fontWeight:'900',marginTop:18},storyCopy:{color:'#C2CEE3',fontSize:16,lineHeight:25,marginTop:18,maxWidth:360},benefits:{gap:13,marginTop:34},benefit:{flexDirection:'row',alignItems:'center',gap:11},benefitIcon:{width:36,height:36,borderRadius:11,backgroundColor:'rgba(122,159,238,.16)',alignItems:'center',justifyContent:'center'},benefitText:{color:'#E7EDF8',fontSize:14,fontWeight:'700'},storyFoot:{color:'#8697B7',fontSize:11,fontWeight:'700',letterSpacing:.6},
    card:{flex:1,minHeight:desktop?680:'100%',backgroundColor:p.card,paddingHorizontal:desktop?56:24,paddingTop:desktop?64:38,paddingBottom:32,justifyContent:'center'},brand:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9},logo:{width:45,height:45,borderRadius:11},brandName:{fontSize:20,fontWeight:'900',color:p.text,letterSpacing:.7},brandSub:{fontSize:9,fontWeight:'800',color:p.primary,letterSpacing:.6,marginTop:2},hero:{marginTop:desktop?0:32},title:{color:p.text,fontSize:desktop?31:27,fontWeight:'900',textAlign:desktop?'left':'center'},subtitle:{color:p.muted,fontSize:15,lineHeight:23,textAlign:desktop?'left':'center',marginTop:10,maxWidth:420},form:{marginTop:31},label:{fontSize:13,fontWeight:'800',color:p.text,marginBottom:8},passwordLabel:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:18},inputWrap:{height:56,flexDirection:'row',alignItems:'center',gap:11,backgroundColor:p.input,borderRadius:13,paddingHorizontal:15,borderWidth:1,borderColor:p.border},inputError:{borderColor:'#E35D6A'},input:{flex:1,fontSize:16,color:p.text,outlineStyle:'none'},icon:{color:p.icon},placeholder:{color:dark?'#748196':'#919CAF'},forgotText:{fontSize:13,color:p.primary,fontWeight:'800',marginBottom:8},errorBox:{marginTop:12,backgroundColor:dark?'#352027':'#FFF0F2',borderRadius:10,padding:10,flexDirection:'row',alignItems:'center',gap:7},error:{flex:1,fontSize:13,color:dark?'#FF9DA8':'#B93645',lineHeight:19},loginGlowButton:{height:55,borderRadius:13,backgroundColor:dark?'rgba(79,120,231,1)':'rgba(39,95,216,1)',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,marginTop:20,shadowColor:p.primarySolid,shadowOpacity:.24,shadowRadius:9,elevation:3},disabled:{opacity:.58},primaryText:{color:'#FFF',fontSize:15,fontWeight:'900',letterSpacing:.4},divider:{flexDirection:'row',alignItems:'center',gap:10,marginVertical:18},dividerLine:{height:1,backgroundColor:p.border,flex:1},dividerText:{fontSize:12,color:p.muted},googleButton:{height:52,borderRadius:13,borderWidth:1,borderColor:p.border,backgroundColor:p.card,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:10},googleMark:{fontSize:19,fontWeight:'900',color:'#4285F4'},googleText:{fontSize:15,fontWeight:'800',color:p.text},bottom:{marginTop:22,flexDirection:'row',justifyContent:'center'},bottomText:{fontSize:14,color:p.muted},link:{fontSize:14,color:p.primary,fontWeight:'900'},notice:{marginTop:22,minHeight:36,borderRadius:11,backgroundColor:p.soft,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',paddingHorizontal:10},noticeText:{fontSize:12,color:p.muted,fontWeight:'600'}
  });
}
