import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRoleTheme, sharedTheme } from '../theme/roleTheme';
const theme=getRoleTheme('mentee');

export default function MyCourses({ courses = [], currentTerm, major, onBack, onOpenCourse, onCommunity, onLoadCourses }) {
  const [term,setTerm]=useState(currentTerm||'Kỳ 1'), [items,setItems]=useState(courses), [search,setSearch]=useState(''), [showTerms,setShowTerms]=useState(false), [loading,setLoading]=useState(false), [error,setError]=useState('');
  const sequence=useRef(0);
  useEffect(()=>{setItems(courses);setTerm(currentTerm||'Kỳ 1');},[courses,currentTerm]);
  useEffect(()=>()=>{sequence.current+=1},[]);
  const changeTerm=async value=>{
    const id=++sequence.current; setTerm(value);setShowTerms(false);setLoading(true);setError('');
    try {const result=await onLoadCourses(value);if(id===sequence.current)setItems(result);}
    catch(e){if(id===sequence.current){setItems([]);setError(e.message||'Không tải được môn học.');}}
    finally{if(id===sequence.current)setLoading(false);}
  };
  const list=items.filter(course=>`${course.code} ${course.name}`.toLowerCase().includes(search.toLowerCase()));
  return <View style={s.screen}>
    <View style={s.header}><TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color={theme.text}/></TouchableOpacity><Text style={s.title}>Môn học của tôi</Text></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.termCard}><Text style={s.termTitle}>{major||'Lộ trình học tập'}</Text><Text style={s.termLabel}>{term} · {items.length} môn học</Text><TouchableOpacity style={s.docs} onPress={()=>setShowTerms(!showTerms)}><Text style={s.docsText}>Chọn học kỳ</Text></TouchableOpacity></View>
      {showTerms&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:12}}>{Array.from({length:9},(_,i)=>'Kỳ '+(i+1)).map(value=><TouchableOpacity key={value} onPress={()=>changeTerm(value)} style={s.changeText}><Text>{value}</Text></TouchableOpacity>)}</View>}
      <TextInput value={search} onChangeText={setSearch} placeholder="Tìm mã hoặc tên môn học…" placeholderTextColor={theme.textMuted} style={{padding:14,backgroundColor:theme.surface,color:theme.text,borderWidth:1,borderColor:theme.border,borderRadius:12,marginVertical:12}}/>
      {loading?<ActivityIndicator/>:error?<View><Text>{error}</Text><TouchableOpacity onPress={()=>changeTerm(term)}><Text style={s.docsText}>Thử lại</Text></TouchableOpacity></View>:<>
      {!list.length&&<Text>Không có môn học phù hợp.</Text>}
      {list.map(course=><View key={course.id||course.code} style={s.card}><View style={{flex:1}}><Text style={s.code}>{course.code}</Text><Text style={s.name}>{course.name}</Text><View style={s.actions}><TouchableOpacity style={s.docs} onPress={()=>onOpenCourse(course)}><Text style={s.docsText}>Tài liệu</Text></TouchableOpacity><TouchableOpacity style={s.community} onPress={()=>onCommunity(course,term)}><Text style={s.communityText}>Cộng đồng môn học</Text></TouchableOpacity></View></View></View>)}</>}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({ screen:{flex:1,backgroundColor:theme.background},header:{height:53,backgroundColor:theme.surface,borderBottomWidth:1,borderColor:theme.border,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:9},title:{color:theme.text,fontSize:15,fontWeight:'900'},headerRight:{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:11},user:{width:25,height:25,borderRadius:13,backgroundColor:theme.primary,alignItems:'center',justifyContent:'center'},userText:{color:sharedTheme.white,fontSize:9,fontWeight:'900'},content:{padding:13,paddingBottom:30},termCard:{backgroundColor:theme.surfaceElevated,borderRadius:15,padding:13,borderWidth:1,borderColor:theme.border},termLabel:{color:theme.accent,fontSize:8,fontWeight:'900'},termTitle:{color:theme.text,fontSize:13,fontWeight:'900',marginTop:3},termCopy:{color:theme.textSecondary,fontSize:8,marginTop:3,maxWidth:'75%'},change:{position:'absolute',right:10,top:10,backgroundColor:theme.surface,borderRadius:8,padding:7},changeText:{color:theme.primary,fontSize:8,fontWeight:'900',textAlign:'center'},termStats:{flexDirection:'row',gap:6,marginTop:9},stat:{color:theme.textSecondary,fontSize:7,fontWeight:'800',backgroundColor:theme.tint,paddingHorizontal:6,paddingVertical:4,borderRadius:5},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:17,marginBottom:8},section:{color:theme.text,fontSize:12,fontWeight:'900'},dot:{color:theme.primary,fontSize:8},fall:{color:theme.accent,fontSize:8,fontWeight:'900',backgroundColor:theme.tint,paddingHorizontal:7,paddingVertical:4,borderRadius:6,overflow:'hidden'},card:{backgroundColor:theme.surface,borderRadius:13,borderWidth:1,borderColor:theme.border,padding:11,flexDirection:'row',gap:8,marginBottom:8},icon:{width:36,height:39,borderRadius:8,alignItems:'center',justifyContent:'center'},iconText:{color:theme.primary,fontSize:8,fontWeight:'900'},courseTop:{flexDirection:'row',justifyContent:'space-between'},code:{color:theme.accent,fontSize:8,fontWeight:'900'},name:{color:theme.text,fontSize:10,fontWeight:'900',marginTop:2},sub:{color:theme.textSecondary,fontSize:7,marginTop:3},actions:{flexDirection:'row',gap:6,marginTop:7},docs:{flex:1,height:28,borderRadius:7,backgroundColor:theme.tint,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:3},docsText:{color:theme.primary,fontSize:7,fontWeight:'900'},community:{flex:1.3,height:28,borderRadius:7,backgroundColor:theme.primary,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:3},communityText:{color:sharedTheme.white,fontSize:7,fontWeight:'900'},notice:{marginTop:5,flexDirection:'row',gap:6,padding:9,backgroundColor:theme.surfaceMuted,borderRadius:9},noticeText:{color:theme.textSecondary,fontSize:8,flex:1} });
