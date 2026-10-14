# Rà soát Mentee / Mentor — 14/10/2026

> Cập nhật: đã triển khai một đợt sửa sau báo cáo này. Xem `FIXES-2026-10-14.md` để phân biệt mục đã sửa, kết quả kiểm tra và phần còn tồn tại. Các phát hiện bên dưới mô tả trạng thái trước sửa.

## Kết luận và phạm vi

Chưa đạt điều kiện phát hành. Đây là kiểm tra tĩnh mã nguồn hiện tại, lần theo route trong frontend/App.js, callback và API liên quan. Không phải xác nhận đã chạy toàn bộ màn hình trên thiết bị hoặc đã kiểm tra PayOS production. Không thay đổi code chức năng trong lần rà này. Các thay đổi sẵn có trong working tree được giữ nguyên.

P0: rủi ro tiền/quyền riêng tư. P1: luồng chính bị chặn hoặc sai. P2: chức năng thiếu, dữ liệu hiển thị sai hoặc UX. Không coi icon trang trí là lỗi; các mục dưới là nút/chức năng có ngữ nghĩa thao tác nhưng thiếu hành động thực tế.

## Chặn phát hành

1. **P0 — Trạng thái booking có thể phát sinh hoàn tiền/giải ngân nhiều lần.** `backend/src/server.js:263`: chỉ chặn khi trạng thái mới bằng trạng thái hiện tại; không kiểm tra chuyển trạng thái hợp lệ. Chuỗi hoàn thành → hủy hoặc hủy → xác nhận → hủy vẫn đi vào các nhánh thay đổi số dư. Cập nhật ví và booking cũng không nguyên tử. Cần state machine, điều kiện cập nhật nguyên tử và giao dịch/idempotency. Chỉ tái hiện bằng dữ liệu test, không dùng ví thật.
2. **P0 — Chat riêng chưa ràng buộc đúng người tham gia.** `backend/src/server.js:115`: một mentee có booking với mentor được chấp nhận mà không so khớp mentee trong roomId. Biết roomId của mentee khác cùng mentor có thể vượt kiểm tra này. Cần định danh phòng và thành viên bằng ID ổn định, kiểm tra cả GET/POST. Chưa thử khai thác tài khoản thật.
3. **P1 — Không tới được màn QR PayOS.** `frontend/App.js:391–392`: onContinue chỉ bật showPayOSPayment nhưng showTopUpModal vẫn true; early return TopUpScreen chạy trước PayOSPayment. Tái hiện: Xu → nạp → tiếp tục. Đây là lỗi frontend trước cả bước gọi API tạo QR.
4. **P1 — Chuyển Community sang Chat mentor vi phạm thứ tự hooks.** `frontend/components/Community.js:44,57,65`: return có điều kiện đứng trước useEffect. Chuyển tab làm thay đổi số hooks giữa các render.
5. **P1 — Quên mật khẩu chưa gửi OTP lần đầu.** `frontend/pages/ForgotPassword.js:2` chỉ điều hướng; `frontend/App.js:368` đặt autoSend=false cho VerifyEmail. Người dùng phải bấm gửi lại mới gửi yêu cầu.
6. **P1 — Chờ xác nhận bị coi là đã xác nhận.** `BookingHub.js`, `SessionDetail.js:10`, `DirectMessage.js` kiểm tra includes('xác nhận'), khớp cả 'Chờ mentor xác nhận'. SessionDetail có thể mở nút tham gia trước khi mentor chấp nhận. Dùng trạng thái chính xác, chung enum.
7. **P1 — Booking trùng giờ có race.** `backend/src/server.js:10,262`: kiểm tra exists rồi mới tạo, không có ràng buộc unique cho slot. Hai request đồng thời có thể cùng vượt kiểm tra và trừ Xu. Cần cơ chế giữ slot/ngăn trùng nguyên tử.

## Mentee — các màn và luồng

| Màn/luồng | Phát hiện trong code | Mức |
|---|---|---|
| Setup hồ sơ | ProfileSetup.js:8 khởi tạo ngành/nhánh theo phần tử đầu tiên, vẫn mặc định SE; không buộc chọn chủ động. | P1 |
| Hoàn tất setup | App.js:201 cập nhật nhiều state nhưng thiếu studentId và currentUser; mở sửa ngay có thể thấy dữ liệu cũ và lưu đè mã sinh viên rỗng. | P1 |
| Profile | ProfileHub.js hiển thị ngành Kỹ thuật phần mềm cố định; lịch sử/số liệu có dữ liệu mẫu. | P2 |
| Sửa hồ sơ | Modal trong App.js dùng View, thiếu vùng cuộn/né bàn phím cho nhiều trường. Các input sửa trực tiếp state chung nên hủy không khôi phục bản nháp. Lưu thất bại trả false nhưng handleSaveProfile không thông báo lỗi. | P1/P2 |
| Cài đặt Profile | Nhiều dòng như mật khẩu, email, riêng tư, phiên đăng nhập, ngôn ngữ/giao diện chưa nối hành động; callback đổi mật khẩu từ App không được ProfileHub nhận. Toggle cục bộ chưa đồng nghĩa đã lưu server. | P2 |
| Home | HomeDashboard có lịch hẹn mẫu khi không có booking; giờ/trạng thái và streak có nội dung cố định, không đáng tin như dữ liệu thật. | P2 |
| Home chat | Composer hiện đã giới hạn cao 48, không còn cấu hình giãn như ảnh cũ. Tuy nhiên modal thiếu xử lý né bàn phím; gửi lỗi xóa tin optimistic mà không khôi phục draft/thông báo. Cần kiểm chứng cuộn trên APK mới. | P2 |
| Daily Rewards | Gamification: 'Tìm hiểu cách sử dụng Xu' là View/Text không có onPress; nhiệm vụ đọc tài liệu không có điều hướng; quiz chỉ thông báo. Streak/tuần/tiến độ cố định. | P2 |
| Tìm mentor | FindMentor: chọn môn không thực sự lọc mentor; một số nút theo môn không làm gì. Filter/notification chỉ thông báo placeholder. | P2 |
| Hồ sơ mentor | MentorProfile: chat/download chưa nối hành động thực tế; có thống kê/đánh giá/khung giờ mẫu. | P2 |
| Đặt lịch | AppointmentFlow không khóa gửi khi đang xử lý; đổi ngày nhanh có thể bị response ngày cũ ghi đè. Thiếu Xu làm unmount form, mất ngày/giờ/note khi quay về sau nạp. | P1 |
| Danh sách lịch | BookingHub Upcoming loại hoàn thành nhưng chưa loại hủy; tổng Xu giữ cộng cả booking không còn giữ. Icon search/options/notification đầu màn chưa nối callback; ô tìm kiếm và tab lọc riêng có hoạt động. | P2 |
| Chi tiết lịch | SessionDetail 'Đổi lịch'/'Hủy lịch' là View, không thao tác được. Trạng thái pending bị nhận nhầm confirmed như mục chặn phát hành. | P1 |
| Đánh giá lịch | BookingHub chưa refresh booking sau gửi; có thể mở lại dữ liệu rating cũ. Cần hiển thị lỗi khi server từ chối và khóa gửi lặp. | P2 |
| Đổi tên người dùng | App.js:167,284,339 lọc booking bằng menteeName thay vì menteeEmail/ID; đổi tên có thể làm mất booking khỏi danh sách dù server vẫn trả về. | P1 |
| My Courses | Search/notification/menu chưa có thao tác; Community thiếu onPress. Đổi kỳ chỉ đổi giữa hai giá trị; onOpenCourse trong App bỏ qua môn được chọn và mở kho tài liệu chung. | P2 |
| Kho tài liệu | MyDocuments có tiến độ mẫu theo index, không phải tiến độ đọc được lưu. | P2 |
| Đọc tài liệu | DocumentReader mở fileUri qua ứng dụng ngoài; nhánh này không có nút quiz. Không có fileUri thì hiển thị bài C mẫu, không phải nội dung tài liệu tương ứng. | P1/P2 |
| Quiz AI | QuizScreen dùng 3 câu cố định; số câu/thời gian và cấu hình không phản ánh bài thật. Nút tiếp theo gọi select(0); làm lại gọi onComplete để thoát. App tiêu thụ lượt khi mở luồng quiz, chưa chứng minh tạo bài AI thực. | P1 |
| Community chat | Lỗi gửi có thể thêm tin cục bộ trông như gửi thành công. Reactions/reply thiếu hành động; trạng thái đang gõ là mẫu. | P1/P2 |

## Mentor — các màn và luồng

| Màn/luồng | Phát hiện trong code | Mức |
|---|---|---|
| Dashboard | MentorHub active chỉ loại hủy, vẫn tính hoàn thành vào lịch đang hoạt động; Today Sessions chưa lọc đúng ngày. Lỗi tải được chuyển thành danh sách rỗng. | P2 |
| Lịch rảnh | Back gọi onNavigate('home') khi đã ở home, không đổi view nội bộ; có thể không quay lại. Lưu lịch không cập nhật mentor ở App, remount có thể nạp cấu hình cũ; lịch rỗng được thay bằng defaultSlots. | P1 |
| Calendar | Back gọi onNavigate('mentor') khi đang ở mentor, không đổi view calendar. | P1 |
| Tab Schedule | App.js:549 dùng BookingHub chung không truyền vai trò; nội dung/chat vẫn theo mentee, menteeName nhận tên mentor. Cần route và participant đúng vai trò. | P1 |
| Chat mentee | DirectMessage tạo roomId từ tên mentee; đổi tên làm đổi phòng, trùng tên gây va chạm. Gửi lỗi mất bản nháp và không giải thích. | P1 |
| Community mentor | MentorCommunity còn thẻ bài viết mẫu; menu/download chưa có hành động. Chọn chat từ danh sách không chuyển đúng cuộc trò chuyện vì callback App bỏ qua booking. | P2 |
| Hồ sơ mentor | MentorProfileHub giới hạn COURSE_OPTIONS vào bốn môn IT, không hỗ trợ ngành khác. Cần kiểm thử lỗi lưu và đồng bộ dữ liệu parent. | P2 |
| Tài liệu mentor | CRUD/upload/share có code thực, không phải toàn bộ nút đều chết. Tài liệu mới dùng term 'Kỳ hiện tại' thay giá trị học kỳ thực; form cần kiểm thử bàn phím, file lớn, mất mạng. | P2 |
| Ví/ngân hàng/rút tiền | MentorWallet có validation, loading và xử lý lỗi. Chưa chạy giao dịch/payout thật, không thể kết luận end-to-end đã đạt. Cần kiểm thử số dư, yêu cầu lặp, thất bại, lịch sử và quyền sở hữu bằng môi trường test. | Chưa xác minh runtime |

## Lỗi dùng chung và hạ tầng liên quan trực tiếp màn hình

- `frontend/data/api.js`: retry tối đa 8 lần cả request ghi khi lỗi network/5xx, không có fetch timeout/abort. Có thể chờ lâu và lặp thao tác khi server đã xử lý nhưng response bị mất. Không nên retry POST tài chính nếu chưa có idempotency.
- `PayOSPayment.js`: timeout UI 15 giây không hủy request; response muộn và bấm retry có thể chồng yêu cầu. Không lấy việc spinner dừng làm bằng chứng request đã kết thúc.
- `backend/src/server.js:265`: sort thời gian tăng dần rồi limit(25), chỉ trả 25 tin đầu. Cuộc trò chuyện lâu sẽ không thấy tin mới khi reload/poll; cần lấy trang mới nhất và phân trang lịch sử.
- Parser roomId chat dùng `[^-]+` cho email mentor; email chứa dấu '-' có thể bị tách sai.
- Backend GET bookings còn fallback theo tên mentee; cần rà bỏ khả năng lẫn lịch giữa người trùng tên sau khi migrate dữ liệu cũ.
- Danh sách env người dùng gửi có `PAYOS_CANCEL_UR`, khác tên backend cần `PAYOS_CANCEL_URL`. Chưa xác nhận cấu hình deploy đã được sửa; không cần gửi giá trị secret vào chat.
- Header/navigation còn phối hợp header App và header từng component; cần thống nhất quyền sở hữu header rồi kiểm tra từng route. Chưa đánh dấu tất cả màn là lỗi header chỉ từ code.
- `keyboardDismissMode='on-drag'` chỉ đóng bàn phím khi kéo, không đảm bảo đưa input đang focus lên trên bàn phím. Phải kiểm thử form Profile, booking note, chat, upload và ngân hàng trên thiết bị.
- Không có script test trong package.json frontend/backend. Không tìm thấy bộ test nghiệp vụ trong lượt tìm repo này. Build/export thành công không chứng minh các callback, tiền và quyền truy cập đúng.

## Thứ tự sửa và tiêu chí nghiệm thu

1. Khóa lỗi quyền chat, trạng thái escrow và booking trùng; thêm test backend cho chuyển trạng thái, request đồng thời và quyền sở hữu.
2. Sửa PayOS navigation + timeout/idempotency; test tạo QR, hủy, hết hạn, mất mạng, webhook lặp và refresh sau thanh toán bằng môi trường kiểm thử.
3. Sửa hooks Community và OTP; chạy từ đăng ký/đăng nhập tới reset mật khẩu.
4. Sửa định danh booking/chat, xác nhận/hủy/hoàn thành/rating; kiểm thử hai tài khoản Mentee và Mentor, cả đổi tên/trùng tên.
5. Thay dữ liệu mẫu, hoàn thiện hoặc ẩn rõ chức năng chưa hỗ trợ. Không thay nút chết bằng thông báo chung rồi coi đã hoàn thành.
6. Kiểm thử APK Android trên máy nhỏ: focus trường cuối, gõ nhiều dòng, kéo tới cuối, đóng bàn phím, Back hệ thống, xoay/background/reopen; kiểm tra cả hai vai trò và mạng chậm/mất mạng.
7. Chỉ xác nhận sẵn sàng deploy khi có kết quả thực tế cho từng mục; phần chưa thử phải ghi rõ, không suy ra từ build thành công.
