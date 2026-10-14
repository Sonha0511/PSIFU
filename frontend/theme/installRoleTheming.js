import { StyleSheet } from 'react-native';
import { getActiveRole, getRoleTheme, sharedTheme } from './roleTheme';

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
const themedColor = (value, property, styleName, theme) => {
  if(typeof value!=='string')return value;
  const meaning=semanticColor(value,theme); if(meaning)return meaning;
  if(value.startsWith('rgba')||value.startsWith('hsla')) {
    if(property==='borderColor'||property.endsWith('BorderColor'))return theme.border;
    return value;
  }
  const c=classify(value); if(!c)return value;
  const root=/screen|page|container|app|modal$/i.test(styleName);
  if(property==='shadowColor')return c.blue||c.purple?theme.glow:value;
  if(property==='borderColor'||property.endsWith('BorderColor'))return theme.border;
  if(property==='backgroundColor') {
    if(root&&(c.light>.72||c.light<.24))return theme.background;
    if(c.light>.94)return theme.surface;
    if(c.light>.82)return c.blue||c.purple?theme.tint:theme.surfaceMuted;
    if(c.light<.2)return root?theme.background:theme.surface;
    if(c.blue)return theme.primary;
    if(c.purple)return theme.secondary;
    if(c.warm)return theme.reward;
    return theme.surfaceElevated;
  }
  if(property==='color'||property.endsWith('Color')) {
    if(c.light>.9)return sharedTheme.white;
    if(c.light<.25&&c.sat<.75)return theme.text;
    if(c.sat<.24)return theme.textSecondary;
    if(c.blue)return theme.primary;
    if(c.purple)return theme.secondary;
    if(c.warm)return theme.reward;
    return theme.textSecondary;
  }
  return value;
};
const transformStyle = (style,styleName,theme) => {
  if(!style||typeof style!=='object'||Array.isArray(style))return style;
  const next={...style};
  for(const property of Object.keys(next))next[property]=themedColor(next[property],property,styleName,theme);
  return next;
};

// Existing screens were built before the role system and contain local color values.
// Delay StyleSheet compilation until a style is read so the same component can render
// Aurora for a mentee and Midnight for a mentor without duplicating every screen.
StyleSheet.create = styles => {
  const cache={mentee:new Map(),mentor:new Map()};
  return new Proxy(styles,{
    get(target,property){
      if(typeof property!=='string'||!(property in target))return target[property];
      const role=getActiveRole(); const roleCache=cache[role];
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
