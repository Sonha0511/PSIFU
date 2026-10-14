const { test } = require('node:test');
const assert = require('node:assert/strict');
const { activityUpdate } = require('../src/document-activity');
test('bookmark is available before unlocking, progress and rating are not',()=>{
  assert.deepEqual(activityUpdate({saved:true},false),{saved:true});
  assert.throws(()=>activityUpdate({rating:5},false),e=>e.status===403);
  assert.throws(()=>activityUpdate({status:'completed'},false),e=>e.status===403);
});
test('only validated per-user fields are accepted',()=>{
  assert.deepEqual(activityUpdate({userEmail:'other',rating:4,revenue:1000},true),{rating:4});
  for(const body of [{rating:0},{rating:6},{rating:1.5},{rating:'5'},{saved:'true'},{status:'50%'},{}])assert.throws(()=>activityUpdate(body,true),e=>e.status===400);
  assert.ok(activityUpdate({status:'reading'},true).lastOpenedAt instanceof Date);
});
