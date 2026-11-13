const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('document access and AI quiz always require a persisted unlock', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8');
  assert.doesNotMatch(server, /Number\(document\.fee\|\|0\)===0\|\|await DocumentUnlock\.exists/);
  const checks = server.match(/const unlocked=await DocumentUnlock\.exists\(\{userEmail:[^}]+documentId:document\._id\}\)/g) || [];
  assert.equal(checks.length, 2);
});
