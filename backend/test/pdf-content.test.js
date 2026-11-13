const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cloudinaryPdfUrl, normalizePdfText, extractPdfBuffer } = require('../src/pdf-content');

test('only Cloudinary HTTPS PDF delivery URLs are accepted', () => {
  assert.equal(cloudinaryPdfUrl('https://res.cloudinary.com/demo/raw/upload/v1/course.pdf'), true);
  assert.equal(cloudinaryPdfUrl('https://res.cloudinary.com/demo/image/upload/v1/course.pdf'), true);
  assert.equal(cloudinaryPdfUrl('https://example.com/course.pdf'), false);
  assert.equal(cloudinaryPdfUrl('http://res.cloudinary.com/demo/raw/upload/course.pdf'), false);
  assert.equal(cloudinaryPdfUrl('https://res.cloudinary.com/demo/raw/upload/course.exe'), false);
});

test('PDF text is normalized and capped for the AI context', () => {
  assert.equal(normalizePdfText('  CSD201   Big-O\r\n\n\nStack   LIFO  '), 'CSD201 Big-O\n\nStack LIFO');
  assert.equal(normalizePdfText('x'.repeat(70000)).length, 60000);
});

test('invalid binary data is rejected before parsing', async () => {
  await assert.rejects(extractPdfBuffer(Buffer.from('not a pdf')), (error) => error.status === 422);
});
