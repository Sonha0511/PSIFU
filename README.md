# PSIFU

Mã nguồn được tách thành hai ứng dụng độc lập:

- `frontend`: ứng dụng Expo/React Native, giữ các màn hình demo hiện tại.
- `backend`: REST API Express kết nối MongoDB database `psifu`.

## Chạy ứng dụng

1. Trong `backend`, sao chép `.env.example` thành `.env`, sau đó điền `MONGODB_URI` của MongoDB đã có.
2. Chạy `npm install` và `npm run dev` trong `backend`.
3. Trong `frontend`, sao chép `.env.example` thành `.env`, chỉnh `EXPO_PUBLIC_API_URL` cho phù hợp môi trường chạy.
4. Chạy `npm install` và `npm start` trong `frontend`.

Backend tự đồng bộ danh mục mentor công khai nhưng không đặt mật khẩu dùng chung cho các hồ sơ thật. Để chuẩn bị môi trường trình diễn, chạy `npm run seed:demo` trong `backend` và xem tài khoản/kịch bản tại `DEMO-NGAY-14-11-2026.md`.

## Đồng bộ FLM cho Quiz AI

Đặt `FLM_SYNC_ENABLED=true`, `FLM_SESSION_COOKIE` từ một tài khoản FLM chuyên dụng và tùy chọn `FLM_SYNC_INTERVAL_HOURS=24` trong môi trường backend. Job chỉ tạo/cập nhật tài liệu ở trạng thái `DRAFT`; admin phải duyệt trước khi mentee nhìn thấy. Nội dung syllabus đã chuẩn hóa được lưu trong `sourceText` và Quiz AI chỉ dùng trường này làm ngữ cảnh. Có thể chạy thủ công bằng `node scripts/sync-flm-documents.js`. Khi phiên FLM hết hạn, job giữ nguyên dữ liệu cũ và ghi lỗi yêu cầu cập nhật cookie.

## MongoDB Atlas

Backend là lớp duy nhất kết nối MongoDB; mobile và admin web chỉ gọi REST API. Để migrate dữ liệu local sang Atlas, đặt `ATLAS_MONGODB_URI` trong `backend/.env` (không commit URI), sau đó chạy:

```powershell
cd backend
npm run migrate:atlas
```

Lệnh mặc định dừng nếu Atlas đã có dữ liệu. Sau khi phần kiểm tra số lượng trả về `passed`, thay `MONGODB_URI` trong `backend/.env` bằng URI Atlas rồi chạy lại backend. Để quay về local, đặt lại `MONGODB_URI=mongodb://127.0.0.1:27017/psifu`.
