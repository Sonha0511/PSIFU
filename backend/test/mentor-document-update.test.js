const { test } = require('node:test');
const assert = require('node:assert/strict');
const { applyMentorDocumentUpdate } = require('../src/mentor-document-update');

const pdf = {
  fileUri: 'https://res.cloudinary.com/psifu/raw/upload/v1/csd201.pdf',
  cloudinaryPublicId: 'psifu/mentor-documents/demo/csd201',
  fileSize: 122697,
  fileName: 'CSD201.pdf',
  mimeType: 'application/pdf',
};

test('mentor document edits persist replacement PDF metadata', () => {
  const document = { title: 'Old', fileUri: 'https://res.cloudinary.com/psifu/raw/upload/v1/old.pdf' };
  applyMentorDocumentUpdate(document, { title: 'CSD201', status: 'PUBLISHED', ...pdf });
  assert.equal(document.title, 'CSD201');
  assert.equal(document.status, 'PUBLISHED');
  for (const [key, value] of Object.entries(pdf)) assert.equal(document[key], value);
});

test('mentor cannot overwrite ownership or AI-managed fields', () => {
  const document = { mentorEmail: 'mentor@psifu.online', aiSummary: 'trusted' };
  applyMentorDocumentUpdate(document, { mentorEmail: 'other@example.com', aiSummary: 'fake' });
  assert.equal(document.mentorEmail, 'mentor@psifu.online');
  assert.equal(document.aiSummary, 'trusted');
});

test('replacement file must be a Cloudinary PDF', () => {
  assert.throws(
    () => applyMentorDocumentUpdate({}, { ...pdf, fileUri: 'https://example.com/file.pdf' }),
    (error) => error.status === 400,
  );
  assert.throws(
    () => applyMentorDocumentUpdate({}, { ...pdf, fileName: 'malware.exe' }),
    (error) => error.status === 400,
  );
});
