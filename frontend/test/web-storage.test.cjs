const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../data/api.js'),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
function boot(os,store,secure){const context={Platform:{OS:os},process:{env:{}},AsyncStorage:store,SecureStore:secure,setTimeout,clearTimeout,AbortController};vm.createContext(context);vm.runInContext(source+'\nthis.api={setAccessToken,getAccessToken,clearAccessToken};',context);return context.api;}
test('web token persists/reloads/logs out without native SecureStore',async()=>{
  const data=new Map();const store={getItem:async k=>data.get(k)||null,setItem:async(k,v)=>data.set(k,v),removeItem:async k=>data.delete(k)};
  const forbidden=new Proxy({},{get(){throw Error('Native SecureStore called on web')}});
  const api=boot('web',store,forbidden);await api.setAccessToken('test-token');assert.equal(await boot('web',store,forbidden).getAccessToken(),'test-token');await api.clearAccessToken();assert.equal(await boot('web',store,forbidden).getAccessToken(),null);
});
test('native tokens stay in SecureStore',async()=>{
  const data=new Map();const secure={getItemAsync:async k=>data.get(k)||null,setItemAsync:async(k,v)=>data.set(k,v),deleteItemAsync:async k=>data.delete(k)};
  const store={getItem:async()=>null,setItem:async()=>{throw Error('Token leaked into AsyncStorage')},removeItem:async()=>{}};
  const api=boot('ios',store,secure);await api.setAccessToken('native-token');assert.equal(await boot('ios',store,secure).getAccessToken(),'native-token');
});
