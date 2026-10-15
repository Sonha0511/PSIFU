export const sharedTheme={white:'#FFFFFF',success:'#34C98F',warning:'#F3B562',error:'#FF667C',radius:{sm:8,md:14,lg:20,xl:24},motion:{fast:160,normal:220}};

const variants={
  mentee:{
    light:{name:'mentee-light',appearance:'light',background:'#F7F5FC',surface:'#FFFFFF',surfaceElevated:'#FFFBFD',surfaceMuted:'#F0ECF8',primary:'#6D3FF2',primaryPressed:'#5427CF',secondary:'#F04F83',accent:'#00A98F',reward:'#F29A2E',text:'#251D35',textSecondary:'#665D75',textMuted:'#948A9F',border:'rgba(109,63,242,.17)',tint:'rgba(109,63,242,.10)',nav:'rgba(252,250,255,.97)',glow:'#9A7BEE',palette:['#6D3FF2','#E94F86','#00A98F','#F29A2E','#3679D9'],soft:['#EEE8FF','#FDE9F0','#E2F7F2','#FFF0DA','#E7EFFC']},
    dark:{name:'mentee-dark',appearance:'dark',background:'#121117',surface:'#1C1924',surfaceElevated:'#24202E',surfaceMuted:'#191620',primary:'#B29AFF',primaryPressed:'#9274EF',secondary:'#FF82A8',accent:'#52D6C1',reward:'#FFC36A',text:'#FAF7FF',textSecondary:'#C8BDD2',textMuted:'#94899E',border:'#3B3247',tint:'rgba(178,154,255,.14)',nav:'rgba(24,21,31,.97)',glow:'#A58BFA',palette:['#B29AFF','#FF82A8','#52D6C1','#FFC36A','#71A7FF'],soft:['#2C2540','#382330','#203A37','#3A3023','#22334B']}
  },
  mentor:{
    light:{name:'mentor-light',appearance:'light',background:'#F4F7F8',surface:'#FFFFFF',surfaceElevated:'#FAFCFC',surfaceMuted:'#EAF1F2',primary:'#356ED4',primaryPressed:'#2755AB',secondary:'#7659D9',accent:'#008F89',reward:'#E6952F',text:'#1E2930',textSecondary:'#596970',textMuted:'#87959A',border:'rgba(53,110,212,.17)',tint:'rgba(53,110,212,.10)',nav:'rgba(249,252,252,.97)',glow:'#67A6D8',palette:['#356ED4','#008F89','#7659D9','#E6952F','#D85A76'],soft:['#E5EEFC','#E1F4F1','#EEEAFB','#FBEDD9','#F9E7EC']},
    dark:{name:'mentor-dark',appearance:'dark',background:'#111419',surface:'#1A1F27',surfaceElevated:'#222934',surfaceMuted:'#171B22',primary:'#73A4F5',primaryPressed:'#5686D5',secondary:'#A68AE8',accent:'#47C8BF',reward:'#F2BB62',text:'#F4F6F8',textSecondary:'#B7C0C7',textMuted:'#838E97',border:'#333C48',tint:'rgba(115,164,245,.13)',nav:'rgba(21,25,31,.98)',glow:'#62B9C3',palette:['#73A4F5','#47C8BF','#A68AE8','#F2BB62','#F0788D'],soft:['#223147','#1E3736','#302943','#3A3123','#3A252D']}
  }
};

let activeRole='mentee',activeAppearance='light';
const liveTheme=role=>new Proxy({}, {get:(_target,property)=>variants[role][activeAppearance][property],ownKeys:()=>Reflect.ownKeys(variants[role][activeAppearance]),getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true})});
const liveThemes={mentee:liveTheme('mentee'),mentor:liveTheme('mentor')};
export const getRoleTheme=(role=activeRole,appearance)=>appearance?variants[role==='mentor'?'mentor':'mentee'][appearance==='dark'?'dark':'light']:liveThemes[role==='mentor'?'mentor':'mentee'];
export const roleThemes={mentee:variants.mentee.light,mentor:variants.mentor.dark};
export const setActiveRole=role=>{activeRole=role==='mentor'?'mentor':'mentee'};
export const getActiveRole=()=>activeRole;
export const setActiveAppearance=mode=>{activeAppearance=mode==='dark'?'dark':'light'};
export const getActiveAppearance=()=>activeAppearance;
