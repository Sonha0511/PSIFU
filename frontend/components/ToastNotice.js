import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ToastNotice({ notice, onClose }) {
  const translateY = useRef(new Animated.Value(140)).current;
  useEffect(() => {
    if (!notice) return undefined;
    translateY.setValue(140);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 180 }).start();
    const timer = setTimeout(onClose, 4200);
    return () => clearTimeout(timer);
  }, [notice, onClose, translateY]);
  const pan = useMemo(() => PanResponder.create({ onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 8, onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(-18, gesture.dy)), onPanResponderRelease: (_event, gesture) => { if (Math.abs(gesture.dy) > 45) Animated.timing(translateY, { toValue: gesture.dy < 0 ? -150 : 160, duration: 160, useNativeDriver: true }).start(onClose); else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start(); } }), [onClose, translateY]);
  if (!notice) return null;
  const icon = notice.type === 'error' ? 'alert-circle' : notice.type === 'info' ? 'information-circle' : 'checkmark-circle';
  return <Animated.View {...pan.panHandlers} style={[styles.wrap, { transform: [{ translateY }] }]}><View style={[styles.icon, notice.type === 'error' && styles.error, notice.type === 'info' && styles.info]}><Ionicons name={icon} size={21} color="#FFFFFF" /></View><View style={styles.copy}><Text style={styles.title}>{notice.title}</Text><Text style={styles.message}>{notice.message}</Text></View><View style={styles.grabber} /></Animated.View>;
}
const styles = StyleSheet.create({ wrap:{position:'absolute',left:16,right:16,bottom:20,minHeight:73,backgroundColor:'#102A56',borderRadius:17,padding:13,paddingRight:24,flexDirection:'row',alignItems:'center',gap:10,zIndex:100,elevation:14,shadowColor:'#102A56',shadowOpacity:.28,shadowRadius:12},icon:{width:38,height:38,borderRadius:12,backgroundColor:'#173F83',alignItems:'center',justifyContent:'center'},error:{backgroundColor:'#A93A3A'},info:{backgroundColor:'#315A9D'},copy:{flex:1},title:{color:'#FFFFFF',fontWeight:'900',fontSize:12},message:{color:'#D7E5F7',fontSize:10,lineHeight:15,marginTop:3},grabber:{position:'absolute',right:8,top:27,width:4,height:20,borderRadius:2,backgroundColor:'#6682AB'}});
