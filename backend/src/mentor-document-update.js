const CONTENT_FIELDS = [
  'title',
  'course',
  'category',
  'description',
  'fee',
  'previewPages',
  'status',
];

const FILE_FIELDS = [
  'fileUri',
  'cloudinaryPublicId',
  'fileSize',
  'fileName',
  'mimeType',
];

const ADMIN_FIELDS = ['mentorEmail', 'mentorName', 'aiSummary'];

function validatePdfUpdate(body) {
  if (!FILE_FIELDS.some((key) => body[key] !== undefined)) return;
  if (!/^https:\/\/res\.cloudinary\.com\//i.test(String(body.fileUri || ''))) {
    const error = new Error('Đường dẫn PDF Cloudinary không hợp lệ.');
    error.status = 400;
    throw error;
  }
  if (!String(body.fileName || '').toLowerCase().endsWith('.pdf')) {
    const error = new Error('Tên tệp cập nhật phải có định dạng PDF.');
    error.status = 400;
    throw error;
  }
  if (String(body.mimeType || '').toLowerCase() !== 'application/pdf') {
    const error = new Error('Loại tệp cập nhật phải là application/pdf.');
    error.status = 400;
    throw error;
  }
}

function applyMentorDocumentUpdate(document, body, isAdmin = false) {
  validatePdfUpdate(body);
  const allowed = isAdmin
    ? [...CONTENT_FIELDS, ...FILE_FIELDS, ...ADMIN_FIELDS]
    : [...CONTENT_FIELDS, ...FILE_FIELDS];
  for (const key of allowed) {
    if (body[key] !== undefined) document[key] = body[key];
  }
  return document;
}

module.exports = { applyMentorDocumentUpdate, CONTENT_FIELDS, FILE_FIELDS };
