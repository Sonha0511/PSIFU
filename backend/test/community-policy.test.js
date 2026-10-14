const {test}=require('node:test');const assert=require('node:assert/strict');
const {mentorChannel,canAccessMentorChannel}=require('../src/community-policy');
test('mentor channels exclude mentees from reading and writing',()=>{
  for(const write of [false,true])assert.equal(canAccessMentorChannel('mentor-community::general','mentee',write),false);
  assert.equal(canAccessMentorChannel('mentor-community::general','mentor',true),true);
  assert.equal(canAccessMentorChannel('mentor-community::announcements','mentor',true),false);
  assert.equal(canAccessMentorChannel('mentor-community::announcements','admin',true),true);
});
test('unknown channels never fall back to generic community access',()=>{
  assert.equal(mentorChannel('mentor-community::unknown'),false);
  assert.equal(canAccessMentorChannel('mentor-community::general::bypass','mentor'),false);
  assert.equal(mentorChannel('fpt::Kỳ 1::general'),null);
});
