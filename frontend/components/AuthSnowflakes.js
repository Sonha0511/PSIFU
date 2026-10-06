import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const FLAKES = [{ top: -20, right: -25, size: 112, delay: 0 }, { top: '64%', left: -42, size: 94, delay: 520 }, { bottom: -32, right: -18, size: 104, delay: 900 }];

function Flake({ top, right, bottom, left, size, delay }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { const animation = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(spin, { toValue: 1, duration: 10000, useNativeDriver: true }), Animated.timing(spin, { toValue: 0, duration: 10000, useNativeDriver: true })])); animation.start(); return () => animation.stop(); }, [delay, spin]);
  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });
  return <Animated.View style={[styles.flake, { top, right, bottom, left, width: size, height: size, transform: [{ rotate: rotation }] }]}><View style={[styles.line, styles.vertical]} /><View style={[styles.line, styles.horizontal]} /><View style={[styles.line, styles.diagonalA]} /><View style={[styles.line, styles.diagonalB]} /><View style={[styles.core, { width: size * .16, height: size * .16, borderRadius: size }]} /></Animated.View>;
}
export default function AuthSnowflakes() { return <View pointerEvents="none" style={styles.layer}>{FLAKES.map((flake, index) => <Flake key={index} {...flake} />)}</View>; }
const styles = StyleSheet.create({ layer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' }, flake: { position: 'absolute', opacity: .48, alignItems: 'center', justifyContent: 'center' }, line: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#B8CEF9', borderRadius: 2 }, vertical: { transform: [{ rotate: '90deg' }] }, diagonalA: { transform: [{ rotate: '45deg' }] }, diagonalB: { transform: [{ rotate: '-45deg' }] }, core: { backgroundColor: '#D9E6FC' } });
