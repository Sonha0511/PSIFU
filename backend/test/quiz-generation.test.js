const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDifficulty, quizPrompt, parseQuiz } = require('../src/quiz-generation');

test('only supported AI difficulty levels are accepted', () => {
  assert.equal(normalizeDifficulty('Easy'), 'easy');
  assert.equal(normalizeDifficulty('MEDIUM'), 'medium');
  assert.equal(normalizeDifficulty('hard'), 'hard');
  assert.equal(normalizeDifficulty('expert'), null);
});

test('prompt delegates difficulty and exact question count to Gemini', () => {
  const prompt = quizPrompt({ title: 'CSD201', course: 'CSD201' }, 'hard', 50, 'Big-O and trees');
  assert.match(prompt, /chính xác 50 câu/);
  assert.match(prompt, /ĐỘ KHÓ HARD/);
  assert.match(prompt, /edge case/);
});

test('parser requires the complete requested exam', () => {
  const item = { question: 'Q?', options: ['A', 'B', 'C', 'D'], answerIndex: 1, explanation: 'Because' };
  assert.equal(parseQuiz(JSON.stringify({ questions: Array.from({ length: 50 }, () => item) }), 50).length, 50);
  assert.throws(() => parseQuiz(JSON.stringify({ questions: [item] }), 50), /1\/50/);
});
