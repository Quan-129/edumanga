# 🚀 HƯỚNG DẪN CẤU HÌNH GOOGLE FIREBASE & DEPLOY RA INTERNET

Tài liệu này hướng dẫn bạn từng bước:
1. **Tạo Firebase Project miễn phí trong 1 phút** để lấy API Key.
2. **Kích hoạt Đăng nhập Google & Email** và dán bảo mật Firestore Rules.
3. **Deploy Web App lên Vercel / Cloudflare Pages** với tên miền HTTPS miễn phí.

---

## PHẦN 1: TẠO PROJECT FIREBASE & LẤY API KEY (Miễn Phí 100%)

### Bước 1: Tạo Dự Án Firebase
1. Truy cập vào **[Firebase Console](https://console.firebase.google.com/)** và đăng nhập bằng tài khoản Google của bạn.
2. Bấm **`Add project`** (Thêm dự án).
3. Đặt tên dự án (ví dụ: `edumanga-hub`).
4. Tắt tùy chọn *Google Analytics* (hoặc để mặc định) ➔ Bấm **`Create project`**.

### Bước 2: Kích Hoạt Đăng Nhập (Authentication)
1. Trong menu bên trái, vào **Build** ➔ **Authentication** ➔ Bấm **`Get started`**.
2. Tại tab **Sign-in method**, kích hoạt 2 phương thức:
   - **Google**: Bấm chọn ➔ Bật công tắc `Enable` ➔ Chọn email hỗ trợ ➔ Bấm `Save`.
   - **Email/Password**: Bấm chọn ➔ Bật công tắc `Enable` ➔ Bấm `Save`.

### Bước 3: Kích Hoạt Cơ Sở Dữ Liệu (Cloud Firestore)
1. Trong menu bên trái, vào **Build** ➔ **Firestore Database** ➔ Bấm **`Create database`**.
2. Chọn vị trí lưu trữ (khuyên dùng `asia-southeast1 (Singapore)` hoặc `asia-east1` để đạt tốc độ nhanh nhất tại Việt Nam).
3. Chọn chế độ **Start in production mode** ➔ Bấm `Next` ➔ `Enable`.
4. Sau khi tạo xong, chuyển sang tab **Rules** (Quy tắc), sao chép nội dung từ file [`firestore.rules`](../firestore.rules) dán vào và bấm **`Publish`**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Bước 4: Lấy Bộ Khóa Cấu Hình (Firebase Config)
1. Bấm vào biểu tượng bánh răng ⚙️ ở góc trên bên trái ➔ Chọn **`Project settings`**.
2. Cuộn xuống phần **Your apps** ➔ Bấm vào biểu tượng Web `</>`.
3. Đặt tên App (ví dụ: `EduManga Web`) ➔ Bấm **`Register app`**.
4. Sao chép các trường trong `firebaseConfig` và dán vào file [`js/firebase-config.js`](../js/firebase-config.js):
```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "edumanga-hub.firebaseapp.com",
  projectId: "edumanga-hub",
  storageBucket: "edumanga-hub.appspot.com",
  messagingSenderId: "123456789...",
  appId: "1:123456789:web:abcdef..."
};
```

---

## PHẦN 2: DEPLOY WEB APP LÊN VERCEL HOẶC CLOUDFLARE PAGES

### Lựa Chọn A: Deploy Lên Vercel (Khuyên Dùng - Đơn Giản Nhất)
1. Đăng ký tài khoản miễn phí tại **[Vercel.com](https://vercel.com/)**.
2. Kết nối với tài khoản **GitHub** của bạn.
3. Đẩy mã nguồn dự án lên một kho lưu trữ GitHub (ví dụ: `edumanga-hub`).
4. Trên Dashboard của Vercel: Bấm **`Add New...`** ➔ **`Project`** ➔ Chọn repository của bạn.
5. Để các thiết lập mặc định (Framework Preset: *Other*) ➔ Bấm **`Deploy`**.
6. Sau khoảng 30 giây, Vercel sẽ cấp cho bạn đường link trực tuyến (ví dụ: `https://edumanga-hub.vercel.app`).

### Lựa Chọn B: Deploy Lên Cloudflare Pages
1. Đăng nhập vào **[Cloudflare Dashboard](https://dash.cloudflare.com/)** ➔ Chọn **Workers & Pages**.
2. Bấm **`Create application`** ➔ Chọn tab **Pages** ➔ **Connect to Git**.
3. Chọn repo GitHub chứa dự án ➔ Bấm **`Begin setup`**.
4. Build command để trống, Output directory để `/` ➔ Bấm **`Save and Deploy`**.
5. Nhận đường dẫn siêu tốc (ví dụ: `https://edumanga-hub.pages.dev`).

---

## PHẦN 3: CẤP QUYỀN TÊN MIỀN TRÊN FIREBASE AUTHENTICATION

Sau khi deploy xong và có đường link trang web (ví dụ `edumanga-hub.vercel.app`):
1. Vào **Firebase Console** ➔ **Authentication** ➔ Chọn tab **Settings** ➔ **Authorized domains**.
2. Bấm **`Add domain`** ➔ Nhập tên miền web của bạn (ví dụ `edumanga-hub.vercel.app`).
3. Bấm **`Save`** là hoàn tất! Người dùng có thể đăng nhập Google 1-chạm mượt mà trên website thật.
