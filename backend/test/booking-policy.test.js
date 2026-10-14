const { test } = require('node:test');
const assert = require('node:assert/strict');
const { STATUS: s, canTransition, legacyRoom, isParticipant } = require('../src/booking-policy');

test('pending requires mentor confirmation; mentee can cancel only', () => {
  assert.equal(canTransition(s.pending, s.confirmed, 'mentor'), true);
  assert.equal(canTransition(s.pending, s.completed, 'mentor'), false);
  assert.equal(canTransition(s.pending, s.confirmed, 'mentee'), false);
  assert.equal(canTransition(s.confirmed, s.completed, 'mentee'), false);
  assert.equal(canTransition(s.pending, s.cancelled, 'mentee'), true);
});
test('terminal states cannot refund or release again, even for admin', () => {
  for (const role of ['mentee', 'mentor', 'admin'])
    for (const from of [s.cancelled, s.completed])
      for (const to of Object.values(s)) assert.equal(canTransition(from, to, role), false);
});
test('confirmed session can complete or cancel, not return to pending', () => {
  assert.equal(canTransition(s.confirmed, s.completed, 'mentor'), true);
  assert.equal(canTransition(s.confirmed, s.cancelled, 'mentor'), true);
  assert.equal(canTransition(s.confirmed, s.pending, 'mentor'), false);
});
test('private chat authorization uses identities, never display name', () => {
  const booking = { mentorEmail: 'my-mentor@example.com', menteeEmail: 'a@example.com', menteeName: 'Same Name' };
  assert.equal(isParticipant(booking, { role: 'mentee', email: 'b@example.com' }), false);
  assert.equal(isParticipant(booking, { role: 'mentee', email: 'a@example.com' }), true);
  assert.equal(isParticipant(booking, { role: 'mentor', email: booking.mentorEmail }), true);
  assert.equal(legacyRoom(booking), 'mentor-chat-my-mentor@example.com-Same Name');
});
