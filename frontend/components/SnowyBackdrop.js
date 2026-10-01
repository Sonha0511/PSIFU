import React from 'react';
import { StyleSheet, View } from 'react-native';

// Decorative layer shared by PSIFU's midnight-blue screens. It intentionally stays behind content.
export default function SnowyBackdrop() {
  return <View pointerEvents="none" style={styles.layer}>
    <View style={styles.glowOne} /><View style={styles.glowTwo} />
    {DOTS.map((dot, index) => <View key={index} style={[styles.dot, dot]} />)}
  </View>;
}
const DOTS = [
  { top: '5%', left: '9%', width: 3, height: 3, opacity: .8 }, { top: '10%', right: '12%', width: 5, height: 5, opacity: .55 },
  { top: '18%', left: '78%', width: 2, height: 2, opacity: .85 }, { top: '28%', left: '7%', width: 4, height: 4, opacity: .4 },
  { top: '35%', right: '8%', width: 3, height: 3, opacity: .8 }, { top: '47%', left: '18%', width: 2, height: 2, opacity: .7 },
  { top: '58%', right: '18%', width: 4, height: 4, opacity: .45 }, { top: '69%', left: '5%', width: 3, height: 3, opacity: .75 },
  { top: '76%', left: '84%', width: 2, height: 2, opacity: .8 }, { top: '91%', left: '26%', width: 4, height: 4, opacity: .45 },
];
const styles = StyleSheet.create({ layer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#12264A' }, glowOne: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#2357A8', opacity: .22, top: -135, right: -75 }, glowTwo: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: '#0B5DB8', opacity: .13, bottom: -190, left: -115 }, dot: { position: 'absolute', borderRadius: 10, backgroundColor: '#FFFFFF' } });
