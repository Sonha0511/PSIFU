// Offline UI fixtures only. No production database, provider calls or real accounts.
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../dist-web-preview');
const docId='000000000000000000000001';
const activities=new Map();const messages=new Map();
const people={mentee:{id:'preview-mentee',email:'mentee@preview.invalid',fullName:'Mentee kiểm thử',role:'mentee',university:'FPT University',major:'Computing',specialization:'AI',fptK:'K20',studentId:'AI000001',currentTerm:'Kỳ 3',academicYear:'Năm 1',isFirstLogin:false,userXu:42,escrowXu:50},mentor:{id:'preview-mentor',email:'mentor@preview.invalid',fullName:'Mentor kiểm thử',role:'mentor',university:'FPT University',currentTerm:'Kỳ 3',major:'Computing',specialization:'AI',isFirstLogin:false,userXu:0,availableXu:100,mentorCourses:['CSD201'],mentorFee:50,mentorAvailability:{accepting:true,slots:[]}}};
const booking={id:'000000000000000000000002',mentorEmail:people.mentor.email,mentorName:people.mentor.fullName,menteeEmail:people.mentee.email,menteeName:people.mentee.fullName,status:'Chờ mentor xác nhận',course:'CSD201',fee:50,dateTime:'2026-10-20 18:00'};
const document={id:docId,title:'Học liệu kiểm thử giao diện',mentorEmail:people.mentor.email,mentorName:people.mentor.fullName,course:'CSD201',term:'Kỳ 3',fee:0,description:'Dữ liệu giả lập cục bộ để kiểm tra giao diện, không phải tài liệu thật.',status:'PUBLISHED'};
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:4179');
  const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  if(url.pathname.startsWith('/api/')){
    let text='';for await(const chunk of req)text+=chunk;let body;try{body=JSON.parse(text||'{}')}catch{return json({msg:'Bad JSON'},400)}
    const role=req.headers.authorization==='Bearer preview-mentor'?'mentor':'mentee';const user=people[role];const p=url.pathname.slice(4);
    if(p==='/auth/login'){const match=Object.values(people).find(person=>person.email===body.email);return match&&body.password==='preview-only'?json({success:true,user:match,accessToken:'preview-'+match.role}):json({success:false,msg:'Dùng tài khoản preview và mật khẩu preview-only.'},401);}
    if(p==='/auth/me')return req.headers.authorization?json({success:true,user}):json({msg:'Chưa đăng nhập'},401);
    if(p==='/mentors')return json([people.mentor]);if(p==='/bookings')return json([booking]);
    if(p==='/courses')return json([{code:'CSD201',name:'Data Structures and Algorithms',term:url.searchParams.get('term')||'Kỳ 3'}]);
    if(p==='/mentor-documents')return json([document]);if(p.startsWith('/document-unlocks/'))return json([docId]);
    if(p==='/document-activity')return json([...activities.values()].filter(row=>row.userEmail===user.email));
    if(p===`/mentor-documents/${docId}/activity`){const key=user.email+docId;const activity={...activities.get(key),...body,userEmail:user.email,documentId:docId,id:key};activities.set(key,activity);return json({success:true,activity});}
    if(p===`/mentor-documents/${docId}/access`)return json({success:true,document});
    if(p.startsWith('/premium/subscription/'))return json({isPremium:false});if(p.startsWith('/notifications/'))return json([]);
    if(p==='/wallet/history')return json([]);
    if(p.endsWith('/settings'))return json({notificationPreferences:{appointment:true,chat:true,wallet:true}});
    if(p.startsWith('/chats/')){const room=decodeURIComponent(p.slice(7));if(req.method==='POST'){const row={id:String(Date.now()),user:user.fullName,authorEmail:user.email,role:user.role.toUpperCase(),text:body.text,createdAt:new Date().toISOString()};messages.set(room,[...(messages.get(room)||[]),row]);return json(row,201);}return json(messages.get(room)||[]);}
    return json({success:false,msg:'Endpoint này không được giả lập trong preview.'},404);
  }
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+path.sep))return json({msg:'Forbidden'},403);
  const ext=path.extname(file);const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.ttf':'font/ttf','.svg':'image/svg+xml'};
  try{const data=await fs.promises.readFile(file);res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}
});
server.listen(4179,'127.0.0.1',()=>console.log('Offline UI preview: http://127.0.0.1:4179 (fixture users only)'));
