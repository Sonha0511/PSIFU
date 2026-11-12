require('dotenv').config();
const mongoose = require('mongoose');
const { syncFlmDocuments } = require('../src/flm-sync');

(async () => {
  const uri = process.env.ATLAS_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MongoDB URI is missing.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const users = mongoose.connection.collection('users');
  const courses = mongoose.connection.collection('courses');
  const documents = mongoose.connection.collection('mentordocuments');
  const [mentorRows, courseRows] = await Promise.all([
    users.find({ role: 'mentor' }, { projection: { mentorCourses: 1 } }).toArray(),
    courses.find({}, { projection: { code: 1 } }).toArray(),
  ]);
  const codes = [...new Set([...courseRows.map(row => row.code), ...mentorRows.flatMap(row => row.mentorCourses || [])])];
  const summary = await syncFlmDocuments({ documents, courseCodes: codes, cookie: process.env.FLM_SESSION_COOKIE });
  console.log(JSON.stringify(summary));
  await mongoose.disconnect();
})().catch(async error => {
  console.error(JSON.stringify({ success: false, code: error.code || 'FLM_SYNC_FAILED', message: error.message }));
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
