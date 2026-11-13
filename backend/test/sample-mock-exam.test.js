const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sampleMockExam } = require('../src/sample-mock-exam');

test('CSD201 fallback contains 20 valid multiple-choice questions', () => {
  const questions = sampleMockExam({ course: 'CSD201' }, 'medium');
  assert.equal(questions.length, 20);
  assert.ok(questions.every((item) => item.options.length === 4 && item.answerIndex >= 0 && item.answerIndex < 4));
});

test('fallback is not silently reused for unrelated courses', () => {
  assert.equal(sampleMockExam({ course: 'PRJ301' }, 'medium'), null);
});
