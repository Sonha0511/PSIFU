const DIFFICULTIES = {
  easy: 'Câu hỏi trực tiếp, kiểm tra định nghĩa, khái niệm và nhận biết một bước. Phương án nhiễu rõ ràng nhưng hợp lý với người mới học.',
  medium: 'Câu hỏi vận dụng, yêu cầu mô phỏng ngắn, so sánh hoặc áp dụng kiến thức trong một đến hai bước.',
  hard: 'Câu hỏi phân tích nâng cao, kết hợp nhiều ý trong tài liệu, tập trung edge case, trace thuật toán và trade-off về độ phức tạp.',
};

function normalizeDifficulty(value) {
  const difficulty = String(value || '').trim().toLowerCase();
  return Object.hasOwn(DIFFICULTIES, difficulty) ? difficulty : null;
}

function quizPrompt(document, difficulty, count, context) {
  return `Bạn là giảng viên ra đề PSIFU. Tạo chính xác ${count} câu trắc nghiệm bằng tiếng Việt dựa CHỈ trên nội dung nguồn bên dưới.

ĐỘ KHÓ ${difficulty.toUpperCase()}: ${DIFFICULTIES[difficulty]}

Yêu cầu:
- Phủ đều các chương/chủ đề có trong nguồn, không tập trung quá nhiều vào một đoạn.
- Không lặp lại câu hỏi hoặc chỉ đổi cách diễn đạt.
- Mỗi câu có đúng 4 phương án, đúng chính xác 1 phương án.
- Phương án đúng phải nằm ở vị trí ngẫu nhiên, phân bố tương đối đều giữa A/B/C/D.
- Giải thích ngắn gọn và chỉ dựa trên tài liệu.
- Không hỏi về URL, metadata, số trang hay tên hệ thống.
- Không bịa kiến thức ngoài nguồn.

Tài liệu: ${String(document.title || '').slice(0, 180)}
Môn học: ${String(document.course || '').slice(0, 120)}
NỘI DUNG NGUỒN:
${context}

Chỉ trả JSON hợp lệ dạng {"questions":[{"question":"...","options":["...","...","...","..."],"answerIndex":0,"explanation":"..."}]}. answerIndex từ 0 đến 3. Không dùng markdown.`;
}

function parseQuiz(text, expectedCount) {
  const clean = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const quiz = JSON.parse(clean);
  if (!Array.isArray(quiz.questions) || quiz.questions.length < expectedCount) {
    throw new Error(`Gemini chỉ trả về ${quiz.questions?.length || 0}/${expectedCount} câu. Vui lòng thử lại.`);
  }
  const questions = quiz.questions.slice(0, expectedCount).map((item) => ({
    question: String(item.question || '').slice(0, 600),
    options: Array.isArray(item.options) ? item.options.slice(0, 4).map((value) => String(value).slice(0, 240)) : [],
    answerIndex: Number(item.answerIndex),
    explanation: String(item.explanation || '').slice(0, 800),
  }));
  if (questions.some((item) => !item.question || item.options.length !== 4 || !Number.isInteger(item.answerIndex) || item.answerIndex < 0 || item.answerIndex > 3)) {
    throw new Error('Định dạng câu hỏi Gemini không hợp lệ.');
  }
  return questions;
}

function splitQuizContext(context, parts = 5) {
  const source = String(context || '').trim();
  const size = Math.ceil(source.length / parts);
  return Array.from({ length: parts }, (_, index) => {
    const start = index * size;
    const end = Math.min(source.length, (index + 1) * size);
    return source.slice(start, end).trim();
  }).filter(Boolean);
}

module.exports = { DIFFICULTIES, normalizeDifficulty, quizPrompt, parseQuiz, splitQuizContext };
