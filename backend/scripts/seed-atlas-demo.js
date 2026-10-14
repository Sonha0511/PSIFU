/*
 * Adds a small, coherent demo dataset to MongoDB Atlas without deleting or
 * replacing user-created data. Dry-run is the default; pass --apply to write.
 * Every inserted document has a deterministic _id, so reruns are idempotent.
 */
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const uri = process.env.ATLAS_MONGODB_URI;
const dbName = process.env.DB_NAME || 'psifu';
const apply = process.argv.includes('--apply');
const seedVersion = 'psifu-demo-v1';
if (!uri) throw new Error('Thiếu ATLAS_MONGODB_URI trong backend/.env');

const id = key => new ObjectId(crypto.createHash('sha256').update(`${seedVersion}:${key}`).digest('hex').slice(0, 24));
const daysFromNow = (days, hour = 19) => {
  const date = new Date(); date.setDate(date.getDate() + days); date.setHours(hour, 0, 0, 0); return date;
};
const dateTime = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:00`;
const stamped = (key, value, createdAt = new Date()) => ({ _id:id(key), ...value, createdAt, updatedAt:createdAt, seedVersion });

async function upsertMany(collection, documents) {
  if (!documents.length) return { collection, planned:0, inserted:0, matched:0 };
  if (!apply) return { collection, planned:documents.length, inserted:0, matched:0 };
  const result = await collection.bulkWrite(documents.map(document => ({
    updateOne:{filter:{_id:document._id},update:{$setOnInsert:document},upsert:true},
  })),{ordered:false});
  return { collection:collection.collectionName, planned:documents.length, inserted:result.upsertedCount, matched:result.matchedCount };
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    const mentees = await db.collection('users').find({role:'mentee'}).project({email:1,fullName:1,currentTerm:1,major:1,specialization:1}).limit(4).toArray();
    const mentors = await db.collection('users').find({role:'mentor'}).project({email:1,fullName:1}).limit(3).toArray();
    if (!mentees.length) throw new Error('Atlas chưa có tài khoản Mentee. Hãy đăng ký hoặc đăng nhập Google ít nhất một lần trước khi seed.');
    if (!mentors.length) throw new Error('Atlas chưa có Mentor. Hãy khởi động backend một lần để tạo system users.');

    const mentee = mentees[0];
    const mentorA = mentors.find(row=>row.email==='mentor.data@psifu.vn') || mentors[0];
    const mentorB = mentors.find(row=>row.email==='mentor.se@psifu.vn') || mentors[1] || mentors[0];
    const futureA=daysFromNow(2,19), futureB=daysFromNow(5,20), past=daysFromNow(-7,18);
    const bookings=[
      stamped('booking-upcoming-confirmed',{mentorEmail:mentorA.email,mentorName:mentorA.fullName,menteeEmail:mentee.email,menteeName:mentee.fullName,course:'MLN111',dateTime:dateTime(futureA),note:'Ôn tập các khái niệm trọng tâm và chuẩn bị câu hỏi thảo luận.',fee:40,status:'Đã xác nhận'}),
      stamped('booking-upcoming-pending',{mentorEmail:mentorB.email,mentorName:mentorB.fullName,menteeEmail:mentee.email,menteeName:mentee.fullName,course:'CSD201',dateTime:dateTime(futureB),note:'Cần hỗ trợ cây, đồ thị và độ phức tạp thuật toán.',fee:50,status:'Chờ mentor xác nhận'}),
      stamped('booking-completed',{mentorEmail:mentorA.email,mentorName:mentorA.fullName,menteeEmail:mentee.email,menteeName:mentee.fullName,course:'MAS291',dateTime:dateTime(past),note:'Ôn xác suất và thống kê.',fee:40,status:'Đã hoàn thành',rating:{score:5,comment:'Mentor giải thích dễ hiểu và có ví dụ thực tế.',createdAt:daysFromNow(-6,9)}}),
    ];
    const chats=[
      stamped('chat-home-1',{roomId:'homepage-live',user:'Minh Khoa',authorEmail:mentee.email,role:'MENTEE',text:'Mọi người có tài liệu ôn MLN111 theo mindmap không?'},daysFromNow(-1,20)),
      stamped('chat-home-2',{roomId:'homepage-live',user:mentorA.fullName,authorEmail:mentorA.email,role:'MENTOR',text:'Mình sẽ chia sẻ checklist các chương quan trọng trong tối nay nhé.'},daysFromNow(-1,20)),
      stamped('chat-home-3',{roomId:'homepage-live',user:'Thu Hà',authorEmail:mentees[1]?.email||mentee.email,role:'MENTEE',text:'Cảm ơn mentor, phần ví dụ liên hệ thực tế sẽ rất hữu ích ạ.'},daysFromNow(-1,21)),
      stamped('chat-community-1',{roomId:'community::MLN111',user:mentorA.fullName,authorEmail:mentorA.email,role:'MENTOR',text:'Tuần này chúng ta thảo luận mối quan hệ giữa vật chất và ý thức.'},daysFromNow(-2,19)),
      stamped('chat-community-2',{roomId:'community::MLN111',user:mentee.fullName,authorEmail:mentee.email,role:'MENTEE',text:'Em đã chuẩn bị một ví dụ từ chuyển đổi số để trao đổi trong buổi học.'},daysFromNow(-2,20)),
      stamped('chat-mentor-general',{roomId:'mentor-community::general',user:mentorB.fullName,authorEmail:mentorB.email,role:'MENTOR',text:'Mọi người nhớ cập nhật lịch rảnh cho tuần mới nhé.'},daysFromNow(-1,9)),
    ];
    const notifications=[
      stamped('notice-booking-confirmed',{userEmail:mentee.email,title:'Lịch mentoring đã được xác nhận',body:`${mentorA.fullName} đã xác nhận buổi MLN111 vào ${dateTime(futureA)}.`,type:'APPOINTMENT',read:false}),
      stamped('notice-community',{userEmail:mentee.email,title:'Thảo luận MLN111 đang sôi nổi',body:'Có chủ đề mới về mối quan hệ giữa vật chất và ý thức.',type:'COMMUNITY',read:false}),
      stamped('notice-reward',{userEmail:mentee.email,title:'Duy trì chuỗi học tập',body:'Điểm danh hôm nay để nhận thêm 1 Xu.',type:'WALLET',read:true},daysFromNow(-1,8)),
      stamped('notice-mentor-booking',{userEmail:mentorB.email,title:'Bạn có yêu cầu mentoring mới',body:`${mentee.fullName} muốn đặt lịch hỗ trợ CSD201.`,type:'APPOINTMENT',read:false}),
    ];
    const transactions=[
      stamped('tx-welcome',{userEmail:mentee.email,type:'WELCOME_BONUS',amount:20,status:'SUCCESS',metadata:{description:'Quà chào mừng PSIFU',seedVersion}},daysFromNow(-20,8)),
      stamped('tx-checkin',{userEmail:mentee.email,type:'DAILY_CHECK_IN',amount:1,status:'SUCCESS',metadata:{description:'Điểm danh hằng ngày',seedVersion}},daysFromNow(-1,8)),
      stamped('tx-booking',{userEmail:mentee.email,type:'BOOKING_ESCROW',amount:-40,status:'SUCCESS',metadata:{description:'Giữ Xu cho lịch MLN111',seedVersion}},new Date()),
    ];
    const questions=[
      stamped('question-mln111',{menteeName:mentee.fullName,major:mentee.major||'Computing',currentTerm:mentee.currentTerm||'Kỳ 8',question:'Làm sao phân biệt phương pháp biện chứng và phương pháp siêu hình qua ví dụ thực tế?',status:'new'}),
      stamped('question-study-plan',{menteeName:mentees[1]?.fullName||mentee.fullName,major:'Computing',currentTerm:'Kỳ 4',question:'Nên phân bổ thời gian giữa project và ôn thi cuối kỳ như thế nào?',status:'answered'},daysFromNow(-3,14)),
    ];
    const premiumDocuments=[
      stamped('premium-mln111-map',{title:'Mindmap tổng quan MLN111',university:'FPT University',major:'Computing',term:'Kỳ 8',course:'MLN111',description:'Bản mô tả thư viện demo. File thật sẽ được bổ sung qua luồng Mentor Documents.',sourceType:'PREMIUM_LIBRARY'}),
      stamped('premium-csd201-checklist',{title:'Checklist ôn tập CSD201',university:'FPT University',major:'Computing',term:'Kỳ 3',course:'CSD201',description:'Danh sách chủ đề cần nắm trước kỳ thi.',sourceType:'PREMIUM_LIBRARY'}),
    ];

    const plans=[
      ['bookings',bookings],['chatmessages',chats],['notifications',notifications],
      ['transactions',transactions],['questions',questions],['premiumdocuments',premiumDocuments],
    ];
    const results=[];
    for(const [name,documents] of plans)results.push(await upsertMany(db.collection(name),documents));
    if(apply){
      await db.collection('users').updateOne({_id:mentorA._id},{$set:{mentorBio:'Đồng hành cùng sinh viên bằng lộ trình ngắn gọn, ví dụ thực tế và phản hồi sau mỗi buổi.',mentorFee:40,mentorCourses:['MLN111','MAS291'],mentorAvailability:{accepting:true,slots:[{day:'Thứ Ba',ranges:['19:00 - 21:00']},{day:'Thứ Bảy',ranges:['09:00 - 11:00']}]}}});
      await db.collection('users').updateOne({_id:mentorB._id},{$set:{mentorBio:'Mentor Software Engineering, tập trung thuật toán, kiến trúc và định hướng project.',mentorFee:50,mentorCourses:['CSD201','DBI202','SWP391'],mentorAvailability:{accepting:true,slots:[{day:'Thứ Tư',ranges:['20:00 - 22:00']},{day:'Chủ Nhật',ranges:['14:00 - 17:00']}]}}});
    }
    console.table(results);
    console.log(apply?'Seed Atlas hoàn tất; dữ liệu hiện có không bị ghi đè.':'Dry-run hoàn tất. Chạy lại với --apply để ghi dữ liệu.');
    console.log(`Mentee nhận dữ liệu demo: ${mentee.email}`);
  } finally { await client.close(); }
}
main().catch(error=>{console.error(`Seed thất bại: ${error.message}`);process.exitCode=1});
