import React, {useEffect,useSyncExternalStore} from 'react';
import {Alert,Modal,ScrollView,StyleSheet,Text,TouchableOpacity,View} from 'react-native';

let queue=[];
const listeners=new Set();
const notify=()=>listeners.forEach(listener=>listener());
const subscribe=listener=>{listeners.add(listener);return()=>listeners.delete(listener)};
const snapshot=()=>queue[0]||null;

// React Native Web does not implement native Alert.alert dialogs.
Alert.alert=(title,message,buttons,options)=>{
  queue=[...queue,{title:String(title||''),message:String(message||''),buttons:buttons?.length?buttons:[{text:'Đóng'}],options}];
  notify();
};

function installBrowserLayout() {
  if(typeof document==='undefined')return()=>{};
  let viewport=document.querySelector('meta[name="viewport"]');
  if(!viewport){viewport=document.createElement('meta');viewport.name='viewport';document.head.appendChild(viewport)}
  viewport.content='width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content';
  const style=document.createElement('style');
  style.id='psifu-mobile-layout';
  style.textContent=`
    html,body{margin:0;width:100%;min-height:100%;background:#EEF1F8;-webkit-text-size-adjust:100%;color-scheme:only light;}
    html{overflow-y:auto;overscroll-behavior-y:none;}
    body{min-height:100dvh;overflow-y:auto;}
    #root{position:relative;width:100%;min-height:var(--psifu-height,100dvh);height:var(--psifu-height,100dvh);display:flex;overflow:visible;background:#F8FAFF;}
    #root>div{flex:1;min-height:0;min-width:0;}
    [data-testid="home-scroll"]{overflow-y:auto!important;overscroll-behavior-y:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable;}
    input,textarea{font-size:16px!important;box-sizing:border-box;}
    input,textarea,[contenteditable]{scroll-margin:24px;}
    [role="button"],button{touch-action:manipulation;}
    *{-webkit-tap-highlight-color:transparent;}
    :focus-visible{outline:2px solid #155EEF;outline-offset:2px;}
    @media (min-width:1024px){
      #root{width:calc(100% - 48px);max-width:1280px;margin-inline:auto;border-inline:1px solid rgba(109,63,242,.12);box-shadow:0 0 42px rgba(40,31,72,.10);}
    }
    @media (min-width:1600px){
      #root{max-width:1360px;}
    }
  `;
  document.head.appendChild(style);
  const update=()=>{
    const visual=window.visualViewport;
    // Do not reset zoom: accessibility pinch zoom must remain available.
    if(visual&&visual.scale!==1)return;
    document.documentElement.style.setProperty('--psifu-height',(visual?.height||window.innerHeight)+'px');
    document.documentElement.style.setProperty('--psifu-top',(visual?.offsetTop||0)+'px');
  };
  const focus=event=>{
    if(!['INPUT','TEXTAREA'].includes(event.target.tagName))return;
    setTimeout(()=>{if(event.target===document.activeElement)event.target.scrollIntoView({block:'nearest',inline:'nearest'});},300);
  };
  update();window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);window.visualViewport?.addEventListener('scroll',update);document.addEventListener('focusin',focus);
  return()=>{style.remove();window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);window.visualViewport?.removeEventListener('scroll',update);document.removeEventListener('focusin',focus)};
}

export default function PlatformUI({children}) {
  const dialog=useSyncExternalStore(subscribe,snapshot,()=>null);
  useEffect(installBrowserLayout,[]);
  const finish=button=>{
    queue=queue.slice(1);notify();
    Promise.resolve().then(()=>button?.onPress?.()).catch(error=>Alert.alert('Chưa thực hiện được',error.message||'Vui lòng thử lại.'));
  };
  const dismiss=()=>{if(dialog?.options?.cancelable){finish(dialog.buttons.find(button=>button.style==='cancel'));dialog.options.onDismiss?.();}};
  return <View style={s.app}>{children}<Modal visible={!!dialog} transparent animationType="fade" onRequestClose={dismiss}><View style={s.overlay}><ScrollView style={s.dialog} contentContainerStyle={s.content}><Text accessibilityRole="header" style={s.title}>{dialog?.title}</Text>{!!dialog?.message&&<Text style={s.message}>{dialog.message}</Text>}<View style={s.actions}>{dialog?.buttons.map((button,index)=><TouchableOpacity key={index} onPress={()=>finish(button)} style={[s.button,button.style==='cancel'&&s.cancel]}><Text style={[s.buttonText,button.style==='cancel'&&s.cancelText,button.style==='destructive'&&{color:'#B42318'}]}>{button.text||'Đóng'}</Text></TouchableOpacity>)}</View></ScrollView></View></Modal></View>;
}
const s=StyleSheet.create({app:{flex:1,minHeight:0,backgroundColor:'#F8FAFF'},overlay:{flex:1,backgroundColor:'rgba(15,23,42,.45)',padding:24,justifyContent:'center',alignItems:'center'},dialog:{maxHeight:'85%',width:'100%',maxWidth:420,flexGrow:0,backgroundColor:'#fff',borderRadius:18},content:{padding:22},title:{fontSize:19,fontWeight:'800',color:'#102A56'},message:{fontSize:15,lineHeight:23,marginTop:12,color:'#475569'},actions:{gap:10,marginTop:20},button:{minHeight:46,borderRadius:10,backgroundColor:'#155EEF',alignItems:'center',justifyContent:'center',padding:12},buttonText:{fontSize:15,fontWeight:'700',color:'#fff'},cancel:{backgroundColor:'#EAF1FF'},cancelText:{color:'#155EEF'}});
