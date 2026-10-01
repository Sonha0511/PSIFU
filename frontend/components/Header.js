import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ studentName, userXu }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.welcomeText}>Xin chào, 👋</Text>
        <Text style={styles.nameText} numberOfLines={1}>{studentName}</Text>
      </View>
      <View style={styles.walletCard}>
        <View style={styles.coinIcon}><Ionicons name="diamond" size={14} color="#FFFFFF" /></View>
        <View><Text style={styles.walletLabel}>PSIFU Xu</Text><Text style={styles.walletValue}>{userXu} <Text style={styles.walletUnit}>Xu</Text></Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  welcomeText: { fontSize: 13, color: '#64748b' },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', maxWidth: 180 },
  walletCard: { backgroundColor: '#EFF7FF', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#C9E5FF', minWidth: 106 },
  coinIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#1976D2', alignItems: 'center', justifyContent: 'center' },
  walletLabel: { fontSize: 8, color: '#53729A', fontWeight: '800', textTransform: 'uppercase' },
  walletValue: { fontSize: 15, color: '#102A56', fontWeight: '900', marginTop: 1 },
  walletUnit: { fontSize: 9, color: '#1976D2', fontWeight: '800' },
});
