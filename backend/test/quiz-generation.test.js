const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDifficulty, quizPrompt, parseQuiz, splitQuizContext } = require('../src/quiz-generation');

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

test('source is divided into five balanced Gemini batches', () => {
  const chunks = splitQuizContext('x'.repeat(30000), 5);
  assert.equal(chunks.length, 5);
  assert.deepEqual(chunks.map((chunk) => chunk.length), [6000, 6000, 6000, 6000, 6000]);
});

test('server provides an actionable message when AI quota is exhausted', () => {
  const server = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'src', 'server.js'), 'utf8');
  assert.match(server, /demo\.mentee@psifu\.online'\?50/);
  assert.match(server, /Bạn đã dùng hết \$\{limit\} lượt tạo AI Mock Exam/);
});
