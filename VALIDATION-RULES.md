# PSIFU — Quy tắc validation và hành vi dữ liệu

> Cập nhật theo mã nguồn ngày 23/10/2026. Đây là tài liệu mô tả **hành vi đang được triển khai**, chủ yếu tại `backend/src/server.js`, `backend/src/account-security.js` và `backend/src/booking-policy.js`. Khi frontend và backend khác nhau, backend là nguồn quyết định cuối cùng.

## 1. Quy ước chung

- Dữ liệu từ client không được xem là đáng tin. Các kiểm tra liên quan đến danh tính, quyền, tiền/Xu, trạng thái và quyền sở hữu phải được thực hiện lại ở backend.
- Email được `trim`, chuyển về chữ thường trước khi so sánh ở phần lớn luồng.
- API thành công thường trả `200` hoặc `201`; lỗi dữ liệu trả `400`; chưa đăng nhập `401`; không đủ quyền `403`; không tìm thấy `404`; xung đột trạng thái/dữ liệu `409`; vượt giới hạn `429`; dịch vụ ngoài chưa sẵn sàng `502/503`.
- Các thao tác tiền quan trọng dùng cập nhật có điều kiện và/hoặc MongoDB transaction để tránh trừ tiền hai lần, âm số dư hoặc xử lý lặp.
- Validation ở giao diện chỉ giúp trải nghiệm tốt hơn, không thay thế validation backend.

## 2. Xác thực, phiên đăng nhập và phân quyền

### 2.1 Access token

- Route có `requireAuth` yêu cầu header `Authorization: Bearer <token>`.
- JWT phải đúng chữ ký, có issuer `psifu-api` và còn hạn. Token hiện có hạn 7 ngày.
- `sub`, `email` và `sessionVersion` trong token phải khớp user hiện tại.
- Đổi/reset mật khẩu hoặc “đăng xuất tất cả thiết bị” tăng `sessionVersion`; mọi token cũ mất hiệu lực.
- Nếu server thiếu `JWT_SECRET`, API trả `503` thay vì cho phép truy cập.

### 2.2 Quyền theo vai trò và quyền sở hữu

- Vai trò trong database chỉ gồm `mentee`, `mentor`, `admin`.
- `requireRole(...)` chặn mọi vai trò không nằm trong danh sách cho phép.
- `requireSelfOrAdmin` chỉ cho phép người dùng thao tác dữ liệu có email trùng token; admin là ngoại lệ.
- Các route tài chính, tài khoản ngân hàng, payout, settings, document unlock và support ticket cá nhân đều áp dụng kiểm tra danh tính.
- Lịch hẹn/chat riêng chỉ cho participant tương ứng hoặc admin truy cập.
- Tài khoản có cờ `protected` không thể bị admin đổi role qua API hiện tại.

**Ví dụ**

- Mentee A gửi body có email của Mentee B để mở khóa tài liệu: `403`.
- Mentor gọi API chỉ dành cho admin: `403`.
- Token được cấp trước lần đổi mật khẩu: `401` ở lần gọi tiếp theo.

## 3. Đăng ký, đăng nhập và hồ sơ

### 3.1 Đăng ký

| Trường | Quy tắc backend |
|---|---|
| `email` | Bắt buộc đúng dạng cơ bản `name@domain.tld`; trim + lowercase; phải duy nhất |
| `fullName` | Sau trim dài từ 2 đến 80 ký tự |
| `password` | Chuỗi, ít nhất 8 ký tự và tối đa 72 byte UTF-8 |
| `role` | Chỉ nhận `mentee` hoặc `mentor`; không được tự đăng ký `admin` |

- Email trùng trả `409`.
- Tài khoản mới nhận 20 Xu, `isFirstLogin=true`.
- Hiện tại đăng ký thường đặt `emailVerified=true`; không có bước bắt buộc xác minh email trong luồng này.

### 3.2 Đăng nhập thường

- Email phải tồn tại; không tồn tại trả `404` với code `EMAIL_NOT_FOUND`.
- Mật khẩu phải khớp; sai trả `401` với code `WRONG_PASSWORD`.
- Hỗ trợ chuyển đổi bản ghi mật khẩu plaintext cũ sang bcrypt sau lần đăng nhập đúng.
- Giới hạn nhóm auth: tối đa 8 request/15 phút theo rate limiter.

### 3.3 Đăng nhập Google

- `idToken` bắt buộc, tối đa 4.096 ký tự.
- Server xác minh token trực tiếp với Google và kiểm tra `aud`, `iss`, `email_verified`, email và `sub`.
- Email đã liên kết với Google subject khác trả `409`.
- Thiếu `GOOGLE_WEB_CLIENT_ID` trả `503`; Google lỗi/không phản hồi phù hợp trả `502`.

### 3.4 Cập nhật hồ sơ và settings

- Chỉ các trường trong allowlist mới được cập nhật: `fullName`, `avatarUrl`, `university`, `academicYear`, `fptK`, `studentId`, `major`, `specialization`, `track`, `currentTerm`, `mentorBio`, `mentorCourses`, `mentorAvailability`, `notificationPreferences`, `isFirstLogin`.
- `fullName`, nếu gửi, phải dài 2–80 ký tự sau trim.
- Settings chỉ nhận `notificationPreferences` và `mentorAvailability` khi giá trị là object.
- Các field lạ bị bỏ qua.

## 4. Mật khẩu và OTP

- Mật khẩu mới: tối thiểu 8 ký tự, tối đa 72 byte UTF-8. Với ký tự tiếng Việt/emoji, giới hạn byte có thể đạt trước giới hạn ký tự.
- Đổi mật khẩu yêu cầu mật khẩu hiện tại đúng và mật khẩu mới khác mật khẩu cũ.
- Cập nhật đồng thời bị phát hiện bằng điều kiện password + `sessionVersion`; xung đột trả `409`.
- OTP gồm 6 chữ số ngẫu nhiên, chỉ lưu hash, có hạn 10 phút và gắn với đúng purpose (`password-reset`).
- OTP sai, hết hạn hoặc sai purpose trả `400`.
- Gửi OTP tối đa 5 lần/15 phút theo IP + email.
- API gửi reset không tiết lộ email có tồn tại hay không (cùng một thông báo thành công).
- Reset thành công xóa OTP và vô hiệu hóa các phiên cũ.

## 5. Ví, Xu và tiền VND

### 5.1 Ba loại số dư

| Trường | Ý nghĩa | Ai dùng |
|---|---|---|
| `userXu` | Xu khả dụng để đặt lịch/mở tài liệu | Chủ yếu Mentee |
| `escrowXu` | Xu đang bị giữ cho booking | Mentee |
| `availableXu` | Doanh thu đã giải ngân, có thể yêu cầu rút | Mentor |

- Tỷ giá nghiệp vụ hiện tại: **1 Xu = 1.000 VND**.
- Không có API cho client tự đặt số dư. Giao diện cũng thông báo Xu chỉ thay đổi qua giao dịch đã xác minh.

### 5.2 Điểm danh

- Mỗi ngày UTC chỉ nhận 1 Xu một lần, dựa trên `YYYY-MM-DD` từ `toISOString()`.
- Lần thứ hai cùng ngày trả `409`.
- Cộng Xu và tạo transaction `DAILY_CHECK_IN` trong cùng database transaction.

**Ví dụ:** 20 Xu → điểm danh thành công → 21 Xu; gọi lại cùng ngày vẫn 21 Xu.

### 5.3 Nạp Xu bằng PayOS

- Chỉ nhận một trong các gói: `50`, `100`, `200`, `500` Xu.
- Email trong body phải trùng email trong token.
- Số tiền tạo đơn do server tính: `coins × 1.000 VND`; client không quyết định giá.
- Webhook phải có HMAC signature hợp lệ và mã thành công từ PayOS.
- Số tiền PayOS báo về phải bằng chính xác số tiền của đơn.
- Chỉ đơn `PENDING` mới được settle; đơn `PAID` được xử lý idempotent, không cộng lại.
- Cập nhật đơn `PAID`, cộng Xu, ghi transaction và notification trong cùng transaction.
- Trang return không tự cộng Xu; chỉ webhook đã xác minh hoặc reconciliation với PayOS mới cộng.
- Frontend kiểm tra chuỗi QR bắt đầu `000201` và có CRC dạng `6304XXXX`; đây là kiểm tra hiển thị bổ sung.

**Ví dụ:** chọn 100 Xu → server tạo đơn 100.000 VND. Webhook báo 99.000 VND → từ chối settle, không cộng Xu.

### 5.4 Đặt lịch và Escrow

- Phí lấy từ `mentor.mentorFee`; nếu thiếu dùng mặc định 50 Xu.
- Phí phải là số hữu hạn và không âm.
- Khi đặt lịch, điều kiện cập nhật yêu cầu `userXu >= fee`; nếu không đủ trả `400`.
- Thành công: `userXu -= fee`, `escrowXu += fee`, transaction `BOOKING_ESCROW` có amount âm và status `HELD`.
- Khi hủy: `escrowXu -= fee`, hoàn `userXu += fee` và ghi `BOOKING_REFUND`.
- Khi hoàn thành: `escrowXu -= fee`, `availableXu` của Mentor tăng bằng fee và ghi `BOOKING_RELEASE`.
- Nếu escrow không đủ lúc kết thúc/hủy, trả `409`; không tiếp tục làm lệch ví.
- Gửi lại cùng một trạng thái là idempotent, không chuyển tiền lần hai.

**Ví dụ:** Mentee có 200 Xu, đặt lịch 150 Xu → `userXu=50`, `escrowXu=150`. Hủy lịch → `userXu=200`, `escrowXu=0`. Nếu hoàn thành → Mentee còn 50 Xu, escrow về 0, Mentor tăng 150 `availableXu`.

### 5.5 Mở khóa tài liệu

- Chỉ tài liệu `PUBLISHED` mới được mở khóa.
- Email body phải trùng token.
- Nếu đã unlock, API trả thành công với `alreadyUnlocked=true` và không trừ thêm.
- Điều kiện cập nhật yêu cầu `userXu >= fee`.
- Sau khi trừ Xu, hệ thống tạo quyền unlock, tăng `unlocks`/`revenue`, tạo transaction.
- Nếu tạo unlock lỗi, Xu được hoàn; duplicate key cũng được xử lý như đã unlock.
- Tài liệu phí 0 được đọc mà không cần bản ghi unlock.

### 5.6 Rút Xu của Mentor

- Chỉ Mentor, đúng chủ tài khoản, có tài khoản ngân hàng đã chọn.
- `amountXu` phải là số nguyên và tối thiểu 50 Xu.
- Số dư `availableXu` phải lớn hơn hoặc bằng số rút.
- Khi tạo yêu cầu: trừ ngay `availableXu`, tạo payout `PROCESSING`; `amountVnd = amountXu × 1.000`.
- Nếu khâu tạo payout lỗi, số Xu đã trừ được hoàn lại.
- Admin chỉ được chuyển payout đang `PROCESSING` sang `SUCCESS`, `FAILED` hoặc `CANCELLED`.
- `FAILED` bắt buộc có `failureReason`.
- `FAILED/CANCELLED`: hoàn toàn bộ Xu về `availableXu`, transaction thành `REFUNDED`.
- `SUCCESS`: giữ phần đã trừ, transaction thành `SUCCESS`.
- Payout đã xử lý không được cập nhật lại (`409`).

## 6. Tài khoản ngân hàng

- Bắt buộc `bankName`, `accountNumber`, `accountHolder`.
- Số tài khoản chỉ gồm 6–19 chữ số.
- Tên chủ tài khoản được trim và chuyển uppercase.
- Thêm vào danh sách không cho trùng `accountNumber` (`409`).
- Chỉ chọn được một account ID có trong danh sách của Mentor.
- Không trả toàn bộ số tài khoản trong email thông báo; chỉ hiển thị 4 số cuối.

## 7. Booking và lịch Mentor

### 7.1 Tạo booking

- Chỉ role `mentee` được đặt lịch.
- `dateTime` phải đúng `YYYY-MM-DD HH:mm`, parse được theo UTC+7 và nằm trong tương lai.
- Mentor phải tồn tại, đang nhận lịch và mở đủ 60 phút bao trùm giờ bắt đầu.
- Không được trùng/chồng với booking chưa hủy của cùng Mentor trong khoảng dưới 60 phút.
- `course` bị cắt tối đa 80 ký tự; `note` trim và cắt tối đa 2.000 ký tự.
- Việc khóa slot, trừ tiền và tạo booking/transaction chạy trong transaction; `bookingRevision` giúp tuần tự hóa đặt slot cạnh tranh.

### 7.2 Chuyển trạng thái

Trạng thái hợp lệ:

- `Chờ mentor xác nhận`
- `Đã xác nhận`
- `Đã hoàn thành`
- `Đã hủy`

Luồng cho phép:

- Pending → Confirmed hoặc Cancelled.
- Confirmed → Completed hoặc Cancelled.
- Mentee chỉ được chuyển sang Cancelled.
- Mentor/admin có thể thực hiện transition hợp lệ còn lại.
- Completed và Cancelled là trạng thái cuối.
- Chỉ participant của booking hoặc admin được cập nhật.

### 7.3 Đánh giá

- Chỉ Mentee sở hữu booking được đánh giá.
- Booking phải `Đã hoàn thành` và chưa từng đánh giá.
- Điểm phải là số nguyên từ 1 đến 5.
- Comment được trim và cắt tối đa 1.000 ký tự.

## 8. Chat và cuộc gọi

- Tin nhắn REST bắt buộc có nội dung sau trim, tối đa 2.000 ký tự.
- Chat booking chỉ participant/admin truy cập; ID booking phải là Mongo ObjectId hợp lệ.
- Kênh Mentor áp dụng quyền đọc/ghi theo role trong `canAccessMentorChannel`.
- Socket phải có JWT hợp lệ và `sessionVersion` khớp.
- Socket chỉ được join room sau khi server kiểm tra quyền.
- Khởi tạo cuộc gọi yêu cầu booking ID hợp lệ, người gọi thuộc booking và booking ở trạng thái `Đã xác nhận`.
- Chỉ đúng người nhận mới accept/reject; chỉ hai participant mới end call.
- Pending call tự hết hiệu lực sau 60 giây.

## 9. Tài liệu Mentor và upload

- Chỉ Mentor/admin được tạo và sửa tài liệu; Mentor chỉ thao tác tài liệu của mình.
- Khi sửa, chỉ nhận: `title`, `course`, `category`, `description`, `fee`, `previewPages`, `status`.
- Catalog công khai chỉ trả tài liệu `PUBLISHED`.
- Upload tài liệu chỉ dành cho Mentor, email body phải trùng token.
- File name xin chữ ký upload phải kết thúc bằng `.pdf` (không phân biệt hoa thường).
- Cloudinary phải đủ cấu hình; thiếu trả `503`.
- Quyền đọc file đầy đủ: chủ tài liệu, tài liệu miễn phí hoặc user đã unlock.
- Activity tài liệu chỉ được cập nhật khi tài liệu còn `PUBLISHED` và user có quyền đọc.

## 10. Premium và Quiz AI

- Premium chỉ được coi là active khi plan=`PREMIUM`, status=`ACTIVE`, `expiresAt` còn trong tương lai.
- Mock payment Premium bị tắt ở production và chỉ cho chính chủ.
- Giới hạn Quiz theo tháng UTC; mặc định FREE 3 lượt, PREMIUM 30 lượt (có thể đổi bằng biến môi trường).
- Vượt quota trả `429`; FREE dùng code `PREMIUM_REQUIRED`, Premium dùng `LIMIT_REACHED`.
- Quiz chỉ được tạo từ tài liệu `PUBLISHED` và user đã unlock hoặc tài liệu miễn phí.
- Rate limit AI: 6 request/15 phút.
- Kết quả Gemini phải parse được JSON, có ít nhất 3 câu; lấy tối đa 5 câu.
- Mỗi câu phải có nội dung, đúng 4 đáp án và `answerIndex` là số nguyên 0–3.
- Chuỗi được cắt giới hạn: câu hỏi 600, mỗi đáp án 240, giải thích 800 ký tự.
- Chỉ tăng lượt sử dụng sau khi Gemini tạo thành công.

## 11. Support, câu hỏi và nội dung người dùng

### 11.1 Support ticket đăng nhập

- `reporterEmail` phải trùng token.
- Bắt buộc có `reason` và `detail` không rỗng sau trim.
- Frontend hiện yêu cầu detail ít nhất 10 ký tự, nhưng backend chưa áp dụng mức tối thiểu này.
- Admin chỉ đặt status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.

### 11.2 Guest support

- Tên khách sau trim tối thiểu 2 ký tự, bị cắt tối đa 80 ký tự.
- Email là tùy chọn; nếu có phải đúng dạng email cơ bản.
- Message dài 1–2.000 ký tự sau trim.
- Chỉ lấy tối đa 12 mục transcript AI; mỗi text bị cắt 500 ký tự.
- Quyền truy cập dựa trên token ngẫu nhiên; database chỉ lưu hash token.
- Hội thoại `CLOSED` không nhận tin nhắn mới.
- Guest support rate limit 30 request/15 phút.
- Status hội thoại admin chỉ gồm `WAITING`, `ACTIVE`, `RESOLVED`, `CLOSED`.

### 11.3 Câu hỏi và chat

- Câu hỏi cộng đồng: bắt buộc, sau trim tối đa 2.000 ký tự.
- `menteeName` và `major` bị cắt 80 ký tự; `currentTerm` cắt 40 ký tự.
- Tin nhắn chat: bắt buộc, sau trim tối đa 2.000 ký tự.

## 12. Release Android và tracking

- Version phải theo SemVer, ví dụ `1.0.0`, `v1.1.0`, có thể có pre-release/build suffix.
- `apkUrl`, nếu có, phải bắt đầu bằng `http://` hoặc `https://`.
- Status chỉ gồm `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Release `PUBLISHED` bắt buộc có APK URL.
- Version phải duy nhất; trùng trả `409`.
- `releaseNotes`: chuỗi nhiều dòng hoặc array; trim, bỏ dòng rỗng, tối đa 30 dòng.
- `fileSizeBytes` được ép số và chặn tối thiểu 0.
- Download chỉ cho release Android đã publish và có APK URL.
- User-Agent tracking bị cắt 500 ký tự; source tracking web bị cắt 80 ký tự; IP chỉ lưu SHA-256 hash.

## 13. Phân trang, ngày tháng và ObjectId

- Phân trang admin: `page >= 1`, `1 <= limit <= 100`; mặc định page 1, limit 20.
- Dashboard admin yêu cầu `from <= to`; chuỗi ngày không parse được bị từ chối.
- API availability yêu cầu ngày đúng dạng `YYYY-MM-DD`.
- Các route nhạy với ID thường kiểm tra Mongo ObjectId trước khi query và trả `404` nếu sai.
- Lịch nghiệp vụ được parse với UTC+7, trong khi điểm danh/quota tháng dùng ngày UTC; cần lưu ý ở thời điểm sát nửa đêm Việt Nam.

## 14. Ma trận ví dụ kiểm thử nhanh

| Trường hợp | Kết quả mong đợi |
|---|---|
| Đăng ký email `ABC@Example.com ` | Lưu thành `abc@example.com` nếu chưa tồn tại |
| Mật khẩu 7 ký tự | `400` |
| Mật khẩu 40 emoji (trên 72 byte) | `400` |
| Mentee gọi API admin | `403` |
| OTP sau 10 phút | `400` |
| Nạp 75 Xu | `400`, vì không thuộc gói cho phép |
| Webhook PayOS đúng chữ ký nhưng sai amount | Không cộng Xu |
| Đặt lịch trong quá khứ | `400` |
| Hai người đặt cùng slot gần như đồng thời | Chỉ một booking thành công |
| Mentee hoàn thành booking | `409` vì Mentee chỉ được hủy |
| Hủy booking hai lần | Lần hai idempotent, không hoàn Xu lần nữa |
| Unlock cùng tài liệu hai lần | Thành công idempotent, chỉ trừ một lần |
| Rút 49 Xu | `400` |
| Rút 50.5 Xu | `400` vì không phải số nguyên |
| Thêm số tài khoản có chữ | `400` |
| Đánh giá 6 sao | `400` |
| Gửi message chỉ có khoảng trắng | `400` |
| Publish release không có APK URL | `400` |

## 15. Khoảng trống validation đang tồn tại

Các mục sau là ghi nhận từ code hiện tại, **không phải quy tắc đã được bảo vệ đầy đủ**:

1. Schema tiền/Xu dùng `Number`, chưa có validator chung bắt buộc số nguyên, không âm hoặc giới hạn tối đa cho mọi đường ghi dữ liệu.
2. API tạo/sửa tài liệu Mentor chưa validate chặt `fee`, `previewPages`, `status`, tiêu đề, MIME/file size; có nguy cơ fee âm, `NaN` hoặc status tùy ý nếu client gọi trực tiếp.
3. API tạo tài liệu cho phép spread `req.body`, khác với API sửa có allowlist; nên dùng DTO/allowlist và validate server-side.
4. Upload chỉ kiểm tra phần mở rộng tên `.pdf`, chưa xác thực MIME, magic bytes và giới hạn dung lượng tại bước xin signature.
5. `mentorAvailability`, `notificationPreferences`, `mentorCourses` và nhiều field hồ sơ mới chỉ kiểm tra kiểu object/allowlist, chưa kiểm tra cấu trúc con, độ dài hoặc enum.
6. Ngày `YYYY-MM-DD` có thể đúng regex nhưng không phải ngày lịch thực (ví dụ `2026-02-31`); route availability chưa kiểm tra round-trip ngày.
7. `course` của booking có thể rỗng; note có thể rỗng. Nếu đây là trường bắt buộc về nghiệp vụ cần bổ sung validate.
8. Support ticket backend chưa giới hạn độ dài `reason/detail`; yêu cầu tối thiểu 10 ký tự hiện chỉ có ở frontend.
9. Rating comment bị cắt âm thầm thay vì trả lỗi khi quá 1.000 ký tự; một số field khác cũng tương tự.
10. Danh sách/filter status ở vài API admin được nhận trực tiếp mà chưa kiểm tra enum.
11. `GET /api/users/:email/settings` hiện không thể hiện middleware auth ngay tại route; cần xác nhận chủ đích vì có thể lộ settings theo email.
12. Tỷ lệ 1 Xu = 1.000 VND đang hard-code ở nhiều nơi; nên gom thành một constant cấu hình duy nhất.
13. Quy tắc thời gian chưa thống nhất: booking dùng UTC+7, check-in và quota Quiz dùng UTC. Người dùng Việt Nam có thể gặp lệch ngày/tháng gần 00:00.
14. Luồng Premium production hiện chưa có cổng thanh toán thật trong endpoint được mô tả; mock endpoint bị vô hiệu hóa ở production.

## 16. Checklist khi thêm API mới

- Xác định endpoint public hay cần `requireAuth`.
- Kiểm tra role và ownership ở backend.
- Chỉ nhận field trong allowlist; trim/normalize trước khi validate.
- Validate kiểu, required, min/max, enum, định dạng và quan hệ giữa các field.
- Không nhận giá/phí/số dư cuối cùng từ client; đọc và tính ở server.
- Với tiền/Xu: số nguyên, không âm, có giới hạn trên, cập nhật có điều kiện và transaction.
- Thiết kế idempotency cho webhook, thanh toán, hoàn tiền và thao tác có thể retry.
- Validate transition trạng thái, không chỉ enum trạng thái.
- Không làm lộ việc email/tài khoản tồn tại trong luồng nhạy cảm.
- Giới hạn độ dài nội dung, kích thước file, rate limit và dữ liệu log.
- Trả status code + thông báo lỗi nhất quán.
- Thêm test cho biên dưới, biên trên, dữ liệu sai kiểu, gọi lặp và hai request đồng thời.

