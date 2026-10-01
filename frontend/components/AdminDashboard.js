import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Database } from '../data/database';

const roles = ['mentee', 'mentor', 'admin'];
export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const loadUsers = useCallback(async () => setUsers(await Database.getAllUsers()), []);
  useEffect(() => { loadUsers(); }, [loadUsers]);
  const changeRole = async (user) => {
    if (user.protected) return Alert.alert('Tài khoản hệ thống', 'Tài khoản Admin/Mentor mẫu được bảo vệ, không thể thay đổi hoặc xóa.');
    const nextRole = roles[(roles.indexOf(user.role || 'mentee') + 1) % roles.length];
    if (await Database.updateUserRole(user.email, nextRole)) { await loadUsers(); }
  };
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Quản trị hệ thống PSIFU</Text><Text style={styles.sub}>Nhấn vào role để chuyển: mentee → mentor → admin.</Text>
    {users.map(user => <View style={styles.row} key={user.email}><View style={{flex:1}}><Text style={styles.name}>{user.fullName}</Text><Text style={styles.email}>{user.email}{user.specialty ? ` · ${user.specialty}` : ''}</Text></View><TouchableOpacity onPress={() => changeRole(user)} style={[styles.role, user.protected && styles.locked]}><Text style={styles.roleText}>{user.protected ? 'Hệ thống' : user.role}</Text></TouchableOpacity></View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({container:{padding:20},title:{fontSize:23,fontWeight:'bold',color:'#0284c7'},sub:{color:'#64748b',marginVertical:10},row:{backgroundColor:'#fff',padding:14,borderRadius:12,marginBottom:10,flexDirection:'row',alignItems:'center'},name:{fontWeight:'bold',color:'#1e293b'},email:{fontSize:12,color:'#64748b',marginTop:3},role:{backgroundColor:'#0284c7',padding:9,borderRadius:8},locked:{backgroundColor:'#64748b'},roleText:{color:'#fff',fontWeight:'bold',fontSize:11}});
