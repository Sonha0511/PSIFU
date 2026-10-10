import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const slides = [
  { title: 'Kết nối tri thức,\nchạm tới thành công', body: 'PSIFU là nơi sinh viên chia sẻ tài liệu, học hỏi và tìm mentor phù hợp.', tag: 'HOÀN TOÀN MIỄN PHÍ', icon: '✦' },
  { title: 'Hoàn thiện hồ sơ\ncủa bạn', body: 'Thêm ngành học, kỳ học và mục tiêu để cộng đồng hiểu bạn hơn.', tag: 'BƯỚC 1 · TẠO HỒ SƠ', icon: '◌' },
  { title: 'Tìm mentor\nđồng hành', body: 'Khám phá mentor, đặt lịch tư vấn và nhận sự hỗ trợ đúng lúc.', tag: 'BƯỚC 2 · KẾT NỐI MENTOR', icon: '↗' }
];

export default function Onboarding({ onFinish }) {
  const [page, setPage] = useState(0);
  const slide = slides[page];
  const next = () => page === slides.length - 1 ? onFinish() : setPage(page + 1);

  return (
    <SafeAreaView style={styles.screen}>
      <View pointerEvents="none" style={styles.glowOne} />
      <View pointerEvents="none" style={styles.glowTwo} />
      <View pointerEvents="none" style={styles.specks}>{Array.from({ length: 28 }, (_, i) => <View key={i} style={[styles.speck, { left: `${(i * 37) % 96}%`, top: `${(i * 19) % 96}%`, opacity: 0.22 + (i % 4) * 0.16 }]} />)}</View>
      <TouchableOpacity style={styles.skip} onPress={onFinish}><Text style={styles.skipText}>Bỏ qua</Text></TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.logoLine}><Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" /><Text style={styles.logoText}>PSIFU</Text></View>
        <View style={styles.orb}><Text style={styles.orbIcon}>{slide.icon}</Text><View style={styles.orbRing} /></View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        <TouchableOpacity style={styles.tagButton} onPress={next}><Text style={styles.tag}>{page === slides.length - 1 ? 'BẮT ĐẦU NGAY' : slide.tag}</Text></TouchableOpacity>
      </View>
      <View style={styles.footer}><View style={styles.dots}>{slides.map((_, index) => <View key={index} style={[styles.dot, index === page && styles.dotActive]} />)}</View><TouchableOpacity style={styles.next} onPress={next}><Text style={styles.nextText}>{page === slides.length - 1 ? 'Vào ứng dụng' : 'Tiếp tục  →'}</Text></TouchableOpacity></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#075ab5', overflow: 'hidden' },
  glowOne: { position: 'absolute', width: 390, height: 390, borderRadius: 195, backgroundColor: '#1598ed', opacity: 0.45, top: -115, left: -100 },
  glowTwo: { position: 'absolute', width: 460, height: 460, borderRadius: 230, backgroundColor: '#012c70', opacity: 0.68, bottom: -205, right: -125 },
  specks: { ...StyleSheet.absoluteFillObject }, speck: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: '#dff6ff', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 5 },
  skip: { alignSelf: 'flex-end', marginTop: 12, marginRight: 24, paddingVertical: 12, paddingHorizontal: 8 }, skipText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 30 },
  logoLine: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 22, left: 28 }, logo: { width: 43, height: 43 }, logoText: { marginLeft: 8, color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  orb: { width: 196, height: 196, borderRadius: 98, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center', marginBottom: 45, shadowColor: '#7dd3fc', shadowOpacity: 0.9, shadowRadius: 30, elevation: 9 },
  orbRing: { position: 'absolute', width: 225, height: 225, borderRadius: 112, borderWidth: 2, borderColor: 'rgba(186,230,253,0.35)' }, orbIcon: { color: '#fff', fontSize: 98, fontWeight: '300' },
  title: { color: '#fff', textAlign: 'center', fontSize: 34, lineHeight: 43, fontWeight: '800' }, body: { color: '#dbeafe', textAlign: 'center', fontSize: 16, lineHeight: 24, marginTop: 17, maxWidth: 330 },
  tagButton: { marginTop: 32, borderWidth: 2, borderColor: '#e0f2fe', borderRadius: 15, paddingHorizontal: 22, paddingVertical: 14, backgroundColor: 'rgba(2,132,199,0.26)' }, tag: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.6 },
  footer: { alignItems: 'center', paddingBottom: 32 }, dots: { flexDirection: 'row', gap: 10, marginBottom: 21 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' }, dotActive: { width: 25, backgroundColor: '#fff' }, next: { padding: 8 }, nextText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
