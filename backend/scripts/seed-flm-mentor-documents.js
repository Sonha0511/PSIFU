require('dotenv').config();
const mongoose = require('mongoose');
const { sourceHash } = require('../src/flm-sync');

const sources = [
  ['ACC101','Principles of Accounting','https://flm.fpt.edu.vn/download/14030/S/1_ACC101_Chapter%208-11.zip',14030],
  ['AID301c','AI in Production','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12630',12630],
  ['AIE301m','AI for Trading','https://flm.fpt.edu.vn/download/11258/S/1_mat1.zip',11703],
  ['AIM301m','AI for Medicine','https://flm.fpt.edu.vn/download/10573/S/1_mat1.zip',11175],
  ['CEA201','Computer Organization and Architecture','https://flm.fpt.edu.vn/download/13245/S/1_CEA201.zip',13245],
  ['CSD201','Data Structures and Algorithm','https://flm.fpt.edu.vn/download/863/S/1_CSD201.zip',10368],
  ['CSI104','Introduction to Computer Science','https://flm.fpt.edu.vn/download/9982/S/1_CSI104.zip',11210],
  ['DAT301m','AI Development','https://flm.fpt.edu.vn/download/13293/S/1_mat1.zip',13293],
  ['DBI202','Database Systems','https://flm.fpt.edu.vn/download/6453/S/1_DBI202.zip',12039],
  ['DWP301c','Web Development with Python','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12631',12631],
  ['ECO121','Macroeconomic','https://flm.fpt.edu.vn/download/10046/S/1_ECOchap1-8.zip',13599],
  ['ENM402','Business English – Level 2','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12226',12226],
  ['ENW493c','Research method and academic writing skills','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12547',12547],
  ['EXE101','Experiential Entrepreneurship 1','https://flm.fpt.edu.vn/download/10358/S/1_Slides.zip',10358],
  ['EXE201','Experiential Entrepreneurship 2','https://flm.fpt.edu.vn/download/10361/S/1_EXE201.zip',10361],
  ['GRA497','Capstone Project Multimedia Communications','https://flm.fpt.edu.vn/download/14061/S/1_GRA497_1.zip',14061],
  ['HCM202','Ho Chi Minh Ideology','https://drive.google.com/drive/folders/1CXun-a8RbmtyG688cPd3cweXGzsBJKjG?usp=drive_link',14634],
  ['IOT102','Internet of Things','https://flm.fpt.edu.vn/download/12225/S/1_IOT102.zip',12400],
  ['JPD113','Elementary Japanese 1 - A1.1','https://flm.fpt.edu.vn/download/13883/S/1_JPD113.zip',14469],
  ['JPD123','Elementary Japanese 1 - A1.2','https://flm.fpt.edu.vn/download/13871/S/2_JPD123.zip',14470],
  ['LAB211','OOP with Java Lab','https://flm.fpt.edu.vn/download/6697/S/1_LAB211.zip',10021],
  ['MAD101','Discrete mathematics','https://flm.fpt.edu.vn/download/13144/S/1_MAD101_Part1.zip',13144],
  ['MAE101','Mathematics for Engineering','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=13137',13137],
  ['MAS291','Statistics & Probability','https://flm.fpt.edu.vn/download/13136/S/2_MAS291.zip',13136],
  ['MKT101','Marketing Principles','https://flm.fpt.edu.vn/download/4369/S/1_MKT101.zip',13458],
  ['MLN111','Philosophy of Marxism – Leninism','https://drive.google.com/drive/folders/1Nyu57RSoUOZVaRMVLITBTHY6Qx3fNcYs?usp=sharing',14667],
  ['MLN122','Political economics of Marxism – Leninism','https://drive.google.com/drive/folders/1XcbHIj0ddQ8ZFXJ3VEzYc4hhOA-53yNP?usp=drive_link',14642],
  ['MLN131','Scientific socialism','https://drive.google.com/drive/folders/1QupRI2q9CcG8rycs1V7Hqd1iGvfzv1Q5?usp=drive_link',14636],
  ['MSM201c','Meta social media marketing Management','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=14392',14392],
  ['NLP301c','Natural Language Processing','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12549',12549],
  ['NWC204','Computer Networking','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=14520',14520],
  ['OBE102c','Organizational Behavior','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=14195',14195],
  ['OJT202','On-the-job training','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12016',12016],
  ['OSG202','Operating System','https://flm.fpt.edu.vn/download/12841/S/1_OSG202.zip',13166],
  ['PMG201c','Project management','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12548',12548],
  ['PRE301','Public Relations principles and strategies','https://flm.fpt.edu.vn/download/13450/S/1_PRE301_Ph%E1%BA%A7n%201.zip',13651],
  ['PRF192','Programming Fundamentals','https://flm.fpt.edu.vn/download/12223/S/1_PRF192_Slides_1.zip',12223],
  ['PRJ301','Java Web Application Development','https://flm.fpt.edu.vn/download/12674/S/1_PRJ301.zip',13165],
  ['PRN212','Basic Cross-Platform Application Programming With .NET','https://flm.fpt.edu.vn/download/12705/S/1_PRN212.zip',13891],
  ['PRO192','Object-Oriented Programming','https://flm.fpt.edu.vn/download/3421/S/1_PRO192.zip?v=1668500535',12038],
  ['SSG104','Communication and In-Group Working Skills','https://flm.fpt.edu.vn/download/10084/S/1_SSG104.zip',11845],
  ['SSL101c','Academic Skills for University Success','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=12594',12594],
  ['SWE201c','Introduction to Software Engineering','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=14443',14443],
  ['SWP391','Software Development Project','https://flm.fpt.edu.vn/download/13273/S/1_SWP391.zip',14177],
  ['SWR302','Software Requirement','https://flm.fpt.edu.vn/download/10020/S/1_SWR302.zip',14176],
  ['SWT301','Software Testing','https://flm.fpt.edu.vn/download/12660/S/1_SWT301.zip',14178],
  ['VNR202','History of the Communist Party of Viet Nam','https://drive.google.com/drive/folders/1CXun-a8RbmtyG688cPd3cweXGzsBJKjG?usp=drive_link',14637],
  ['WDU203c','UI/UX Design','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=13164',13164],
  ['WED201c','Web Design','https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=13172',13172],
];

async function main() {
  const uri = process.env.ATLAS_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MongoDB URI is missing.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const documents = mongoose.connection.collection('mentordocuments');
  const operations = sources.map(source => {
      const [code, courseTitle, fileUri, syllabusId] = source;
      const isZip = /\.zip(?:\?|$)/i.test(fileUri);
      const document = {
        mentorEmail: 'system.library@psifu.online',
        mentorName: 'PSIFU Learning Library',
        title: `${code} · ${courseTitle}`,
        fileName: isZip ? `${code}-FLM.zip` : `${code}-FLM-link`,
        fileUri,
        fileSize: 0,
        mimeType: isZip ? 'application/zip' : 'text/html',
        term: '',
        course: code,
        specialty: 'FPT University',
        category: 'FLM System Import',
        description: `Nguồn được nhập từ FPT University Learning Materials để Admin duyệt và phân phối. Syllabus: https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=${syllabusId}`,
        fee: 0,
        previewPages: 0,
        status: 'DRAFT',
        pages: 0,
        sourceType: 'FLM',
        sourceUrl: `https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylID=${syllabusId}`,
        sourceHash: sourceHash(`${code}|${courseTitle}|${fileUri}|${syllabusId}`),
        sourceVersion: sourceHash(`${code}|${courseTitle}|${fileUri}|${syllabusId}`).slice(0, 12),
        sourceUpdatedAt: new Date(),
        sourceText: `Mã môn: ${code}. Tên môn: ${courseTitle}. Đây là tài liệu chính thức trên FPT University Learning Materials. Nội dung chi tiết đang chờ đồng bộ từ syllabus để tạo quiz chính xác.`,
        sourceFiles: [{ name: isZip ? `${code}-FLM.zip` : `${code}-FLM-link`, url: fileUri, mimeType: isZip ? 'application/zip' : 'text/html' }],
        syncStatus: 'WAITING_FOR_FULL_CONTENT',
      };
      return { updateOne: { filter: { mentorEmail: document.mentorEmail, course: code, category: document.category }, update: { $set: document, $setOnInsert: { unlocks: 0, revenue: 0, createdAt: new Date() } }, upsert: true } };
  });
  const result = operations.length ? await documents.bulkWrite(operations) : null;
  const seeded = await documents.countDocuments({ category: 'FLM System Import', status: 'DRAFT' });
  console.log(JSON.stringify({ sourceCourses: sources.length, operations: operations.length, matched: result?.matchedCount || 0, modified: result?.modifiedCount || 0, upserted: result?.upsertedCount || 0, draftSystemDocuments: seeded }));
  await mongoose.disconnect();
}

main().catch(async error => {
  console.error(error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
