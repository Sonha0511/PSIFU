const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const parser = require('@babel/parser');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const parse = file => parser.parse(read(file), { sourceType: 'module', plugins: ['jsx'] });
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}

test('PayOS payment is not shadowed by the package-selection screen', () => {
  const source = read('App.js');
  let guard;
  walk(parse('App.js'), node => {
    if (node.type === 'IfStatement' && node.consequent.type === 'ReturnStatement' && source.slice(node.consequent.start, node.consequent.end).includes('<TopUpScreen')) guard = source.slice(node.test.start, node.test.end);
  });
  assert.ok(guard);
  assert.equal(vm.runInNewContext(guard, {showTopUpModal:true,showPayOSPayment:true}), false);
  assert.equal(vm.runInNewContext(guard, {showTopUpModal:true,showPayOSPayment:false}), true);
});

test('PayOS QR is rendered inside the app without opening an external checkout', () => {
  const source = read('components/PayOSPayment.js');
  assert.match(source, /from 'react-native-qrcode-svg'/);
  assert.match(source, /<QRCode value=\{order\.qrCode\}/);
  assert.match(source, /quietZone=\{20\}/);
  assert.match(source, /ecl="L"/);
  assert.match(source, /\^000201/);
  assert.match(source, /6304\[0-9A-F\]/);
  assert.doesNotMatch(source, /Linking\.openURL|checkoutUrl|api\.qrserver\.com/);
});

test('all active chat surfaces subscribe to realtime socket messages', () => {
  for (const file of ['components/Community.js','components/HomeLiveChat.js','components/DirectMessage.js','components/CommunityRoom.js']) {
    const source = read(file);
    assert.match(source, /socket\.on\(['"]chat:message['"]/i, `${file} must receive realtime messages`);
    assert.match(source, /socket\.emit\(['"]chat:join['"]/i, `${file} must join its realtime room`);
  }
});

test('Community hooks all execute before the chat-tab early return', () => {
  const source = read('components/Community.js');
  const branch = source.indexOf("if (section === 'chat') return");
  assert.ok(branch > 0);
  walk(parse('components/Community.js'), node => {
    if (node.type === 'CallExpression' && /^use[A-Z]/.test(node.callee.name || '')) assert.ok(node.end < branch, `${node.callee.name} must precede the conditional return`);
  });
});

test('pending bookings cannot enable the meeting button', () => {
  const source = read('components/SessionDetail.js');
  let expression;
  walk(parse('components/SessionDetail.js'), node => {
    if (node.type === 'VariableDeclarator' && node.id.name === 'confirmed') expression = source.slice(node.init.start, node.init.end);
  });
  assert.ok(expression);
  assert.equal(vm.runInNewContext(expression, {bookingStatus:'chờ mentor xác nhận'}), false);
  assert.equal(vm.runInNewContext(expression, {bookingStatus:'đã xác nhận'}), true);
  assert.equal(vm.runInNewContext(expression, {bookingStatus:'đã hủy'}), false);
});

test('direct-message camera starts authenticated call signaling and rejects unconfirmed calls', () => {
  const source = read('components/DirectMessage.js');
  const calls = read('components/CallContext.js');
  assert.match(source, /import \{ useCalls \} from ['"]\.\/CallContext['"]/);
  assert.match(source, /onPress=\{call\}/);
  assert.match(source, /String\(booking\.status \|\| ''\)\.toLowerCase\(\) !== 'đã xác nhận'/);
  assert.match(calls, /socket\.emit\('call:initiate'/);
  assert.match(calls, /socket\.on\('call:incoming'/);
  assert.match(calls, /socket\.emit\('call:accept'/);
  assert.match(calls, /<JitsiSession booking=\{call\.booking\}/);
});

test('mentor home never labels pending bookings as confirmed', () => {
  const source = read('components/MentorHub.js');
  let expression;
  walk(parse('components/MentorHub.js'), node => {
    if (node.type === 'VariableDeclarator' && node.id.name === 'confirmed') expression = source.slice(node.init.start, node.init.end);
  });
  assert.ok(expression);
  for (const status of ['Chờ mentor xác nhận', 'Đã hủy', 'Hoàn thành']) {
    assert.equal(vm.runInNewContext(expression, {item:{status}}), false);
  }
  assert.equal(vm.runInNewContext(expression, {item:{status:'Đã xác nhận'}}), true);
});

test('role theme is installed before the application screen tree', () => {
  const entry = read('index.js');
  assert.ok(entry.indexOf("./theme/installRoleTheming") < entry.indexOf("./AppRoot"));
  const app = read('App.js');
  assert.match(app, /setActiveRole\(user\.role\)/);
  assert.match(app, /setActiveRole\(['"]mentee['"]\)/);
  const installer = read('theme/installRoleTheming.js');
  assert.match(installer, /StyleSheet\.create\s*=\s*styles\s*=>/);
  assert.match(installer, /getActiveRole\(\)/);
});

function api(fetch) {
  const source = read('data/api.js').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '').replace('await wait(1500)', 'await Promise.resolve()');
  const context = {fetch, AbortController, setTimeout, clearTimeout, process:{env:{}}, Platform:{OS:'android'}, AsyncStorage:{}, SecureStore:{getItemAsync:async()=>null}};
  context.AsyncStorage.getItem = async () => null;
  vm.createContext(context);
  vm.runInContext(source + '\nthis.request = request;', context);
  return context.request;
}
const response = (status, body) => ({ok:status<400,status,headers:{get:()=> 'application/json'},json:async()=>body});

test('financial POST errors are not automatically retried', async () => {
  let calls=0;
  const request=api(async()=>{calls++;return response(502,{msg:'provider error'});});
  await assert.rejects(request('/payments/payos/topups',{method:'POST'}), /provider error/);
  assert.equal(calls,1);
});
test('GET can recover from a temporary server error', async () => {
  let calls=0;
  const request=api(async()=>++calls===1?response(503,{msg:'waking'}):response(200,{success:true}));
  assert.equal((await request('/bookings')).success,true);
  assert.equal(calls,2);
});
test('a stalled write request is aborted with an actionable error', async () => {
  const request=api((url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})))));
  await assert.rejects(request('/bookings',{method:'POST',timeoutMs:5}), /quá thời gian chờ/);
});
