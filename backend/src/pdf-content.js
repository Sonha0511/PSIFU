const { PDFParse } = require('pdf-parse');

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_SOURCE_CHARS = 60000;

function cloudinaryPdfUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && /\/upload\//.test(url.pathname) && /\.pdf$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function normalizePdfText(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_SOURCE_CHARS);
}

async function extractPdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 5 || buffer.subarray(0, 5).toString() !== '%PDF-') {
    throw Object.assign(new Error('Tệp Cloudinary không phải PDF hợp lệ.'), { status: 422 });
  }
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = normalizePdfText(result.text);
    if (text.length < 120) {
      throw Object.assign(new Error('PDF không có đủ văn bản để tạo AI Mock Exam. Hãy dùng PDF có lớp chữ, không chỉ chứa ảnh quét.'), { status: 422 });
    }
    return { text, pages: Number(result.total || result.numpages || 0) };
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function extractPdfText(fileUri, fetchImpl = fetch) {
  if (!cloudinaryPdfUrl(fileUri)) {
    throw Object.assign(new Error('Đường dẫn PDF Cloudinary không hợp lệ.'), { status: 400 });
  }
  const response = await fetchImpl(fileUri, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) {
    throw Object.assign(new Error(`Cloudinary chưa cho phép đọc PDF (${response.status}).`), { status: 422 });
  }
  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (declaredSize > MAX_PDF_BYTES) {
    throw Object.assign(new Error('PDF vượt quá giới hạn 50 MB.'), { status: 413 });
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_PDF_BYTES) {
    throw Object.assign(new Error('PDF vượt quá giới hạn 50 MB.'), { status: 413 });
  }
  return extractPdfBuffer(buffer);
}

module.exports = { extractPdfText, extractPdfBuffer, normalizePdfText, cloudinaryPdfUrl };
