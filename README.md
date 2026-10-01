# PSIFU

Mã nguồn được tách thành hai ứng dụng độc lập:

- `frontend`: ứng dụng Expo/React Native, giữ các màn hình demo hiện tại.
- `backend`: REST API Express kết nối MongoDB database `psifu`.

## Chạy ứng dụng

1. Trong `backend`, sao chép `.env.example` thành `.env`, sau đó điền `MONGODB_URI` của MongoDB đã có.
2. Chạy `npm install` và `npm run dev` trong `backend`.
3. Trong `frontend`, sao chép `.env.example` thành `.env`, chỉnh `EXPO_PUBLIC_API_URL` cho phù hợp môi trường chạy.
4. Chạy `npm install` và `npm start` trong `frontend`.

Backend tự khởi tạo bốn tài khoản mẫu lúc khởi chạy lần đầu: `admin@psifu.vn` / `admin123` và các tài khoản mentor (mật khẩu `mentor123`).

## MongoDB Atlas

Backend là lớp duy nhất kết nối MongoDB; mobile và admin web chỉ gọi REST API. Để migrate dữ liệu local sang Atlas, đặt `ATLAS_MONGODB_URI` trong `backend/.env` (không commit URI), sau đó chạy:

```powershell
cd backend
npm run migrate:atlas
```

Lệnh mặc định dừng nếu Atlas đã có dữ liệu. Sau khi phần kiểm tra số lượng trả về `passed`, thay `MONGODB_URI` trong `backend/.env` bằng URI Atlas rồi chạy lại backend. Để quay về local, đặt lại `MONGODB_URI=mongodb://127.0.0.1:27017/psifu`.
