const crypto = require('crypto');

const FLM_ORIGIN = 'https://flm.fpt.edu.vn';
const cleanText = value => String(value || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
const sourceHash = value => crypto.createHash('sha256').update(String(value || '')).digest('hex');
const absoluteUrl = value => new URL(String(value || ''), FLM_ORIGIN).href;

const parseSearchResult = (html, course) => {
  const links = [...String(html || '').matchAll(/href=["']([^"']*SyllabusDetails\?sylID=\d+)["']/gi)];
  if (!links.length) return null;
  const exact = links.find(match => cleanText(String(html).slice(Math.max(0, match.index - 600), match.index + 300)).toLowerCase().includes(String(course).toLowerCase()));
  return absoluteUrl((exact || links[0])[1]);
};

const parseSyllabus = (html, course, detailUrl) => {
  const text = cleanText(html).slice(0, 60000);
  const downloads = [...String(html || '').matchAll(/href=["']([^"']*\/download\/[^"']+)["']/gi)].map(match => absoluteUrl(match[1]));
  const titleMatch = text.match(/Course Name English:\s*(.+?)\s*(?:Subject Code:|Learning-Teaching Method:)/i);
  const descriptionMatch = text.match(/Description:\s*(.+?)\s*(?:StudentTasks:|Tools:|Scoring Scale:)/i);
  const prerequisiteMatch = text.match(/Pre-Requisite:\s*(.+?)\s*Description:/i);
  const sourceText = [
    `Mã môn: ${course}`,
    `Tên môn: ${titleMatch?.[1] || course}`,
    prerequisiteMatch?.[1] ? `Môn tiên quyết: ${prerequisiteMatch[1]}` : '',
    descriptionMatch?.[1] ? `Mô tả dễ hiểu: ${descriptionMatch[1]}` : '',
    text,
  ].filter(Boolean).join('\n').slice(0, 60000);
  return {
    course,
    title: titleMatch?.[1] || course,
    detailUrl,
    downloads: [...new Set(downloads)],
    sourceText,
    hash: sourceHash(sourceText + downloads.join('|')),
  };
};

const flmRequest = async (url, cookie) => {
  const response = await fetch(url, { headers: { cookie, 'user-agent': 'PSIFU-FLM-Sync/1.0' }, redirect: 'follow' });
  const html = await response.text();
  if (!response.ok) throw new Error(`FLM HTTP ${response.status}`);
  if (/\/Login(?:[?"']|$)/i.test(response.url) || /Sign in using @fpt\.edu\.vn/i.test(html)) {
    const error = new Error('Phiên FLM đã hết hạn. Hãy cập nhật FLM_SESSION_COOKIE.');
    error.code = 'FLM_AUTH_REQUIRED';
    throw error;
  }
  return html;
};

async function syncFlmDocuments({ documents, courseCodes, cookie, now = new Date() }) {
  if (!cookie) throw Object.assign(new Error('Thiếu FLM_SESSION_COOKIE.'), { code: 'FLM_AUTH_REQUIRED' });
  const summary = { checked: 0, created: 0, changed: 0, unchanged: 0, missing: [], errors: [] };
  for (const rawCode of [...new Set(courseCodes.map(value => String(value).trim()).filter(Boolean))]) {
    try {
      const code = rawCode;
      const searchUrl = `${FLM_ORIGIN}/gui/role/student/SyllabusManagement?searchOn=Code&keyword=${encodeURIComponent(code)}`;
      const resultUrl = parseSearchResult(await flmRequest(searchUrl, cookie), code);
      summary.checked += 1;
      if (!resultUrl) { summary.missing.push(code); continue; }
      const parsed = parseSyllabus(await flmRequest(resultUrl, cookie), code, resultUrl);
      const existing = await documents.findOne({ sourceType: 'FLM', course: code });
      if (existing?.sourceHash === parsed.hash) { summary.unchanged += 1; continue; }
      const record = {
        mentorEmail: 'system.library@psifu.online', mentorName: 'PSIFU Learning Library',
        title: `${code} · ${parsed.title}`, course: code, category: 'FLM Course Material',
        description: `Tài liệu chính thức từ FLM, được chuẩn hóa để mentee dễ học. Nguồn: ${parsed.detailUrl}`,
        fileName: parsed.downloads.length ? `${code}-FLM.zip` : `${code}-FLM-syllabus`,
        fileUri: parsed.downloads[0] || parsed.detailUrl,
        mimeType: parsed.downloads.length ? 'application/zip' : 'text/html',
        fee: 0, previewPages: 0, pages: 0, status: 'DRAFT',
        sourceType: 'FLM', sourceUrl: parsed.detailUrl, sourceHash: parsed.hash,
        sourceVersion: parsed.hash.slice(0, 12), sourceUpdatedAt: now, sourceText: parsed.sourceText,
        sourceFiles: parsed.downloads.map(url => ({ url, name: decodeURIComponent(url.split('/').pop().split('?')[0]), mimeType: 'application/zip' })),
        syncStatus: existing ? 'CHANGED_REVIEW_REQUIRED' : 'IMPORTED',
      };
      await documents.updateOne({ sourceType: 'FLM', course: code }, { $set: record, $setOnInsert: { unlocks: 0, revenue: 0, createdAt: now } }, { upsert: true });
      if (existing) summary.changed += 1; else summary.created += 1;
    } catch (error) {
      if (error.code === 'FLM_AUTH_REQUIRED') throw error;
      summary.errors.push({ course: rawCode, message: error.message });
    }
  }
  return summary;
}

const quizContext = document => String(document.sourceText || document.aiSummary || document.description || '').slice(0, 30000);

module.exports = { cleanText, parseSearchResult, parseSyllabus, sourceHash, syncFlmDocuments, quizContext };
