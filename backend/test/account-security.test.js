const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { validNewPassword, matchesPassword, changePassword } = require('../src/account-security');

test('password bounds account for bcrypt UTF-8 byte limit', () => {
  assert.equal(validNewPassword('1234567'), false);
  assert.equal(validNewPassword('12345678'), true);
  assert.equal(validNewPassword('x'.repeat(73)), false);
  assert.equal(validNewPassword('漢'.repeat(25)), false);
});
test('legacy plaintext works but stored bcrypt hash cannot authenticate', async () => {
  const hash = await bcrypt.hash('correct-password', 4);
  assert.equal(await matchesPassword('legacy-password', 'legacy-password', bcrypt), true);
  assert.equal(await matchesPassword('correct-password', hash, bcrypt), true);
  assert.equal(await matchesPassword(hash, hash, bcrypt), false);
});
test('authenticated password change revokes older sessions atomically', async () => {
  const user = {_id:'user1',password:await bcrypt.hash('old-password',4),sessionVersion:2};
  let update;
  const User = {findById:async()=>user,findOneAndUpdate:async(filter,patch)=>{assert.equal(filter.password,user.password);update=patch;return {...user,password:patch.$set.password,sessionVersion:3};}};
  const result=await changePassword({User,bcrypt,userId:user._id,newPassword:'new-password',rounds:4});
  assert.equal(await bcrypt.compare('new-password',result.password),true);
  assert.equal(update.$inc.sessionVersion,1);
  assert.ok(update.$unset.otpHash !== undefined);
});
test('unchanged password and concurrent update are rejected', async () => {
  let writes=0;
  const User={findById:async()=>({_id:'u',password:'old-password'}),findOneAndUpdate:async()=>{writes++;return null;}};
  for(const [newPassword,status] of [['old-password',400],['new-password',409]]) {
    await assert.rejects(changePassword({User,bcrypt,userId:'u',newPassword,rounds:4}),e=>e.status===status);
  }
  assert.equal(writes,1);
});
