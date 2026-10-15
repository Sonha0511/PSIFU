import { StyleSheet } from 'react-native';
import { getActiveAppearance, getActiveRole, getRoleTheme, sharedTheme } from './roleTheme';

const originalCreate = StyleSheet.create.bind(StyleSheet);
const semantic = {
  success: new Set(['#10b981','#16a34a','#15803d','#22c55e','#139d62','#0b9661','#14a668','#16803c','#32d583','#44d995']),
  warning: new Set(['#f59e0b','#d97706','#b45309','#c76b00','#facc15','#f0b86b','#f7c873']),
  error: new Set(['#ef4444','#e11d48','#d92d20','#df3f3f','#c21c3a','#ff6b7a','#b42318']),
};
const normalize = value => typeof value === 'string' ? value.toLowerCase() : value;
const rgb = value => {
  const hex = normalize(value);
  if (!hex?.startsWith('#')) return null;
  const body = hex.slice(1);
  const full = body.length === 3 ? body.split('').map(char => char + char).join('') : body.slice(0, 6);
  if (full.length !== 6) return null;
  return [0,2,4].map(index => parseInt(full.slice(index,index+2),16));
};
const classify = value => {
  const parts=rgb(value); if(!parts)return null;
  const [r,g,b]=parts; const max=Math.max(r,g,b),min=Math.min(r,g,b);
  return {r,g,b,max,min,light:(max+min)/510,sat:max===0?0:(max-min)/max,blue:b>r*1.12&&b>g*.95,purple:b>g*1.12&&r>g*.82,warm:r>b*1.25&&g>b*.72};
};
const semanticColor = (value,theme) => {
  const key=normalize(value);
  if(semantic.success.has(key))return sharedTheme.success;
  if(semantic.warning.has(key))return theme.reward;
  if(semantic.error.has(key))return sharedTheme.error;
  return null;
};
const hashStyle = value => String(value || '').split('').reduce((total,char)=>((total*31)+char.charCodeAt(0))>>>0,0);
const paletteColor = (styleName,theme) => {
  const name=String(styleName||'').toLowerCase();
  if(/wallet|coin|xu|reward|premium|price|fee|star/.test(name))return theme.reward;
  if(/success|online|verified|complete|check/.test(name))return sharedTheme.success;
  if(/chat|community|message|people/.test(name))return theme.accent;
  if(/mentor|course|document|school|learn/.test(name))return theme.palette[4];
  if(/profile|avatar|user|account/.test(name))return theme.secondary;
  return theme.palette[hashStyle(name)%theme.palette.length];
};
const softColor = (styleName,theme) => theme.soft[hashStyle(styleName)%theme.soft.length];
const themedColor = (value, property, styleName, theme) => {
  if(typeof value!=='string')return value;
  const meaning=semanticColor(value,theme); if(meaning)return meaning;
  if(value.startsWith('rgba')||value.startsWith('hsla')) {
    if(property==='borderColor'||property.endsWith('BorderColor'))return theme.border;
    if(property==='backgroundColor'&&theme.appearance==='light'&&!/glow|sparkle|overlay|backdrop|shadow/.test(String(styleName).toLowerCase()))return softColor(styleName,theme);
    return value;
  }
  const c=classify(value); if(!c)return value;
  const root=/screen|page|container|app|modal$/i.test(styleName);
  if(property==='shadowColor')return c.blue||c.purple?theme.glow:value;
  if(property==='borderColor'||property.endsWith('BorderColor'))return theme.border;
  if(property==='backgroundColor') {
    if(root&&(c.light>.72||c.light<.24))return theme.background;
    if(c.light>.94)return theme.surface;
    if(c.light>.82)return c.blue||c.purple?softColor(styleName,theme):theme.surfaceMuted;
    if(c.light<.2)return root?theme.background:theme.surface;
    if(c.blue||c.purple)return paletteColor(styleName,theme);
    if(c.warm)return theme.reward;
    return theme.surfaceElevated;
  }
  if(property==='color'||property.endsWith('Color')) {
    if(c.light>.9)return /button|btn|primary|active|selected|submit|book|join|claim|avatar|badge|on|save|login|register/i.test(styleName)?sharedTheme.white:theme.text;
    if(c.light<.25&&c.sat<.75)return theme.text;
    if(c.sat<.24)return theme.textSecondary;
    if(c.blue||c.purple)return paletteColor(styleName,theme);
    if(c.warm)return theme.reward;
    return theme.textSecondary;
  }
  return value;
};
const transformStyle = (style,styleName,theme) => {
  if(!style||typeof style!=='object'||Array.isArray(style))return style;
  const next={...style};
  for(const property of Object.keys(next))next[property]=themedColor(next[property],property,styleName,theme);
  const name=String(styleName||'').toLowerCase();
  const interactive=/btn|button|submit|primary|active|selected|book|join|claim|topup|login|register/.test(name);
  const card=/card|panel|section|tile|group|modal|sheet|wallet|hero/.test(name)&&!/content|row|title|text|label|header/.test(name);
  const badge=/badge|tag|chip|pill|status|role/.test(name)&&!/text|label/.test(name);
  if(interactive&&next.backgroundColor&&next.backgroundColor!==theme.surface){
    next.shadowColor=paletteColor(styleName,theme);next.shadowOpacity=.22;next.shadowRadius=Math.max(Number(next.shadowRadius)||0,7);next.elevation=Math.max(Number(next.elevation)||0,3);
  }
  if(card&&next.backgroundColor){
    next.shadowColor=theme.glow;next.shadowOpacity=theme.appearance==='dark'?.10:.07;next.shadowRadius=Math.max(Number(next.shadowRadius)||0,10);next.elevation=Math.max(Number(next.elevation)||0,2);
    if(next.borderWidth===undefined){next.borderWidth=1;next.borderColor=theme.border;}
  }
  if(badge&&next.backgroundColor&&next.backgroundColor!==theme.surface){next.shadowColor=paletteColor(styleName,theme);next.shadowOpacity=.16;next.shadowRadius=4;}
  return next;
};

// Existing screens were built before the role system and contain local color values.
// Delay StyleSheet compilation until a style is read so the same component can render
// Aurora for a mentee and Midnight for a mentor without duplicating every screen.
StyleSheet.create = styles => {
  const cache={'mentee:light':new Map(),'mentee:dark':new Map(),'mentor:light':new Map(),'mentor:dark':new Map()};
  return new Proxy(styles,{
    get(target,property){
      if(typeof property!=='string'||!(property in target))return target[property];
      const role=getActiveRole(),appearance=getActiveAppearance(); const roleCache=cache[`${role}:${appearance}`];
      if(!roleCache.has(property)){
        const theme=getRoleTheme(role);
        roleCache.set(property,originalCreate({value:transformStyle(target[property],property,theme)}).value);
      }
      return roleCache.get(property);
    },
    ownKeys:target=>Reflect.ownKeys(target),
    getOwnPropertyDescriptor:(target,property)=>({configurable:true,enumerable:true,value:target[property]}),
  });
};
