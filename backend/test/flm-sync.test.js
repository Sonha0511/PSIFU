const test = require('node:test');
const assert = require('node:assert/strict');
const { parseSearchResult, parseSyllabus, quizContext } = require('../src/flm-sync');

test('finds syllabus details and normalizes quiz context', () => {
  const search = '<tr><td>13891</td><td>PRN212</td><td><a href="/gui/role/student/SyllabusDetails?sylID=13891">PRN212 syllabus</a></td></tr>';
  assert.equal(parseSearchResult(search, 'PRN212'), 'https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=13891');
  const html = '<table id="table-detail"><tr><td>Course Name English:</td><td>Basic .NET</td></tr><tr><td>Subject Code:</td><td>PRN212</td></tr><tr><td>Pre-Requisite:</td><td>PRO192</td></tr><tr><td>Description:</td><td>Build desktop apps.</td></tr><tr><td>StudentTasks:</td><td>Practice</td></tr></table><a href="/download/1/S/PRN212.zip">download</a>';
  const parsed = parseSyllabus(html, 'PRN212', 'https://flm.fpt.edu.vn/details');
  assert.equal(parsed.title, 'Basic .NET');
  assert.equal(parsed.downloads[0], 'https://flm.fpt.edu.vn/download/1/S/PRN212.zip');
  assert.match(quizContext({ sourceText: parsed.sourceText }), /Build desktop apps/);
});

test('quiz context prefers extracted source text', () => {
  assert.equal(quizContext({ sourceText: 'from FLM', description: 'fallback' }), 'from FLM');
});
