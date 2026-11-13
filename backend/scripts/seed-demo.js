require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const SEED = 'demo-2026-11-14-v1';
const PASSWORD = process.env.DEMO_PASSWORD || 'Psifu@Demo2026';
const mongoUri = process.argv.includes('--atlas') ? process.env.ATLAS_MONGODB_URI : process.env.MONGODB_URI;
const now = new Date('2026-11-13T14:00:00.000Z');
const id = value => new mongoose.Types.ObjectId(value);

const accounts = [
  { _id:id('691700000000000000000001'), email:'demo.mentee@psifu.online', fullName:'Nguyễn Minh Anh', role:'mentee', university:'FPT University', major:'Computing', specialization:'SE', track:'NodeJS', currentTerm:'Kỳ 5', academicYear:'Năm 3', fptK:'K19', studentId:'SE190001', userXu:320, escrowXu:60, availableXu:0 },
  { _id:id('691700000000000000000002'), email:'demo.mentor@psifu.online', fullName:'Lê Hoàng Nam', role:'mentor', university:'FPT University', major:'Computing', specialization:'SE', track:'Full-stack', specialty:'Full-stack Engineer · Java & React', mentorBio:'Mentor hỗ trợ CSD201, PRJ301 và FER202 theo lộ trình thực hành.', mentorCredentials:'Cựu sinh viên FPT University; 5 năm kinh nghiệm phát triển sản phẩm.', mentorCourses:['CSD201','PRJ301','FER202'], mentorFee:80, mentorAvailability:{accepting:true,slots:[{day:'Thứ Bảy',ranges:['09:00','14:00','19:30']},{day:'Chủ Nhật',ranges:['09:00','15:00']}]}, userXu:0, escrowXu:0, availableXu:760, bankAccount:{bankName:'MB Bank',accountNumber:'0912345678',accountHolder:'LE HOANG NAM',bin:'970422'} },
  { _id:id('691700000000000000000003'), email:'demo.admin@psifu.online', fullName:'Quản trị PSIFU Demo', role:'admin', university:'FPT University', userXu:0, escrowXu:0, availableXu:0, protected:true }
];

const main = async () => {
  if (!mongoUri) throw new Error(process.argv.includes('--atlas') ? 'Thiếu ATLAS_MONGODB_URI trong backend/.env' : 'Thiếu MONGODB_URI trong backend/.env');
  await mongoose.connect(mongoUri,{serverSelectionTimeoutMS:15000});
  const db=mongoose.connection.db, password=await bcrypt.hash(PASSWORD,10);
  const users=db.collection('users'), bookings=db.collection('bookings'), documents=db.collection('mentordocuments');
  for(const account of accounts) { const {_id,...profile}=account; await users.updateOne({email:account.email},{$set:{...profile,password,emailVerified:true,emailVerificationRequired:false,isFirstLogin:false,hasCheckedInToday:false,sessionVersion:0,demoSeed:SEED,updatedAt:now},$setOnInsert:{_id,createdAt:new Date('2026-10-16T02:00:00.000Z')}},{upsert:true}); }

  const docs=[
    {_id:id('691700000000000000000101'),title:'CSD201 — Cấu trúc dữ liệu và giải thuật: Ôn tập trọng tâm',course:'CSD201',term:'Kỳ 3',category:'Ôn thi',description:'Tổng hợp Big-O, linked list, stack, queue, tree và các thuật toán sắp xếp.',fee:0,previewPages:2,pages:28,status:'PUBLISHED',sourceText:'Big-O mô tả tốc độ tăng của thời gian hoặc bộ nhớ theo kích thước đầu vào. Stack tuân theo LIFO, queue tuân theo FIFO. Binary search cần dữ liệu đã sắp xếp và có độ phức tạp O(log n).',aiSummary:'Tài liệu ôn tập nhanh CSD201, phù hợp để minh họa Quiz AI.',fileUri:'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'},
    {_id:id('691700000000000000000102'),title:'PRJ301 — Checklist xây dựng Java Web Application',course:'PRJ301',term:'Kỳ 4',category:'Project guide',description:'Checklist MVC, Servlet/JSP, JDBC, authentication và triển khai.',fee:15,previewPages:2,pages:34,status:'PUBLISHED',sourceText:'Mô hình MVC tách Model, View và Controller. Servlet tiếp nhận request, gọi tầng nghiệp vụ và chuyển dữ liệu sang JSP. PreparedStatement giúp truyền tham số an toàn và giảm rủi ro SQL injection.',aiSummary:'Hướng dẫn triển khai đồ án PRJ301 theo từng mốc.',fileUri:'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
  ];
  for(const doc of docs) { const {_id,...content}=doc; await documents.updateOne({_id},{$set:{...content,mentorEmail:'demo.mentor@psifu.online',mentorName:'Lê Hoàng Nam',mimeType:'application/pdf',fileName:`${doc.course}-demo.pdf`,fileSize:13264,unlocks:doc.fee?12:25,revenue:doc.fee?180:0,demoSeed:SEED,updatedAt:now},$setOnInsert:{createdAt:new Date('2026-10-20T03:00:00.000Z')}},{upsert:true}); }

  const bookingRows=[
    ['691700000000000000000201','2026-11-08 09:00','CSD201','Đã hoàn thành',80,'Ôn cây nhị phân và thuật toán duyệt cây.'],
    ['691700000000000000000202','2026-11-14 09:00','PRJ301','Đã xác nhận',80,'Review cấu trúc project trước buổi bảo vệ.'],
    ['691700000000000000000203','2026-11-16 19:30','FER202','Chờ mentor xác nhận',80,'Hỏi về state management và tối ưu render.']
  ];
  const demoBookingIds=bookingRows.map(row=>id(row[0]));
  await bookings.deleteMany({$or:[{menteeEmail:'demo.mentee@psifu.online'},{mentorEmail:'demo.mentor@psifu.online'}],_id:{$nin:demoBookingIds}});
  for(const [oid,dateTime,course,status,fee,note] of bookingRows) await bookings.updateOne({_id:id(oid)},{$set:{mentorEmail:'demo.mentor@psifu.online',mentorName:'Lê Hoàng Nam',menteeEmail:'demo.mentee@psifu.online',menteeName:'Nguyễn Minh Anh',dateTime,course,status,fee,note,meetingLink:`https://kmeet.infomaniak.com/psifu-${oid}`,demoSeed:SEED,updatedAt:now},$unset:{rating:''},$setOnInsert:{createdAt:new Date(`${dateTime.slice(0,10)}T02:00:00.000Z`)}},{upsert:true});

  await db.collection('documentunlocks').updateOne({userEmail:'demo.mentee@psifu.online',documentId:docs[1]._id},{$set:{demoSeed:SEED,updatedAt:now},$setOnInsert:{createdAt:new Date('2026-11-10T03:00:00.000Z')}},{upsert:true});
  await db.collection('documentactivities').deleteMany({userEmail:'demo.mentee@psifu.online',documentId:{$in:docs.map(doc=>doc._id)}});
  await db.collection('chatmessages').deleteMany({$or:[{authorEmail:{$in:['demo.mentee@psifu.online','demo.mentor@psifu.online']}},{roomId:{$in:demoBookingIds.map(value=>`booking-chat-${value}`)}}]});
  const transactions=[['DAILY_CHECK_IN',1,'Điểm danh hằng ngày'],['DOCUMENT_UNLOCK',-15,'Mở khóa tài liệu PRJ301'],['BOOKING_ESCROW',-80,'Giữ chỗ lịch mentor']];
  await db.collection('transactions').deleteMany({demoSeed:SEED});
  await db.collection('transactions').insertMany(transactions.map(([type,amount,note],i)=>({userEmail:'demo.mentee@psifu.online',type,amount,status:'SUCCESS',metadata:{note},demoSeed:SEED,createdAt:new Date(now.getTime()-i*86400000),updatedAt:now})));
  await db.collection('notifications').deleteMany({demoSeed:SEED});
  await db.collection('notifications').insertMany([
    {userEmail:'demo.mentee@psifu.online',title:'Mentor đã xác nhận lịch',body:'Lịch PRJ301 lúc 09:00 ngày 14/11 đã được xác nhận.',type:'BOOKING',read:false},
    {userEmail:'demo.mentee@psifu.online',title:'Tài liệu mới cho bạn',body:'Checklist PRJ301 đã sẵn sàng trong Tài liệu của tôi.',type:'DOCUMENT',read:false},
    {userEmail:'demo.mentor@psifu.online',title:'Bạn có yêu cầu đặt lịch mới',body:'Nguyễn Minh Anh muốn học FER202 lúc 19:30 ngày 16/11.',type:'BOOKING',read:false}
  ].map((x,i)=>({...x,demoSeed:SEED,createdAt:new Date(now.getTime()-i*3600000),updatedAt:now})));
  await db.collection('supporttickets').updateOne({demoSeed:SEED},{$set:{reporterEmail:'demo.mentee@psifu.online',reporterRole:'mentee',reason:'BOOKING',detail:'Em muốn đổi khung giờ lịch FER202 sang buổi tối.',status:'OPEN',demoSeed:SEED,updatedAt:now},$setOnInsert:{createdAt:new Date('2026-11-12T04:00:00.000Z')}},{upsert:true});
  console.log(JSON.stringify({success:true,seed:SEED,accounts:accounts.map(x=>({role:x.role,email:x.email})),password:PASSWORD,documents:docs.length,bookings:bookingRows.length},null,2));
  await mongoose.disconnect();
};
main().catch(async error=>{console.error(error.message);await mongoose.disconnect().catch(()=>{});process.exit(1);});
