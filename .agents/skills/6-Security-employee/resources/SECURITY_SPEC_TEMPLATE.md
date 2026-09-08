# TÀI LIỆU ĐẶC TẢ BẢO MẬT & AN TOÀN HỆ THỐNG (SECURITY SPECIFICATION & AUDIT) 🔒

> **Dự án**: `<Tên Dự Án>`  
> **Chuyên gia Bảo mật phụ trách**: `Security Employee (AI Agent)`  
> **Giai đoạn áp dụng**: `Giai đoạn 2 (Advanced Security & Hardening) - CẦN PHÊ DUYỆT`

---

## 🛡 1. MA TRẬN PHÂN QUYỀN TRUY CẬP (ROLE-BASED ACCESS CONTROL - RBAC)

| Tài Nguyên (Resource) | Hành Động (Action) | Khách vãng lai (Guest) | Người dùng (User) | Quản trị viên (Admin) |
| :--- | :--- | :---: | :---: | :---: |
| **Hồ sơ cá nhân** | Xem / Sửa | ❌ | ✅ (Chỉ của mình) | ✅ (Toàn quyền) |
| **Dữ liệu Items** | Xem danh sách | ✅ (Public) | ✅ | ✅ |
| **Dữ liệu Items** | Tạo mới / Sửa | ❌ | ✅ | ✅ |
| **Dữ liệu Items** | Xóa vĩnh viễn | ❌ | ❌ | ✅ |
| **Quản trị hệ thống** | Cấu hình / Xem Log | ❌ | ❌ | ✅ |

---

## 🔐 2. CƠ CHẾ XÁC THỰC NÂNG CAO (ADVANCED AUTHENTICATION)

1. **JWT Dual-Token Pattern**:
   - `Access Token`: Thời gian sống ngắn (15 phút), chứa claims cơ bản, lưu trong bộ nhớ / HttpOnly cookie.
   - `Refresh Token`: Thời gian sống dài (7 ngày), lưu trong Database kèm cơ chế **Token Rotation** (vô hiệu hóa token cũ khi cấp mới).
2. **Băm Mật Khẩu (Password Hashing)**:
   - Sử dụng `Argon2id` hoặc `Bcrypt` với Salt rounds >= 12.
3. **Chính Sách Khóa Tài Khoản (Brute-force Protection)**:
   - Tự động tạm khóa tài khoản 15 phút nếu nhập sai mật khẩu quá 5 lần liên tiếp.

---

## 🛑 3. PHÒNG CHỐNG CÁC LỖ HỔNG PHỔ BIẾN (OWASP TOP 10 MITIGATION)

| Lỗ Hổng | Nguy Cơ | Biện Pháp Phòng Chống Triển Khai |
| :--- | :--- | :--- |
| **SQL Injection (SQLi)** | Rò rỉ / Phá hủy DB | 100% sử dụng Parameterized Queries / ORM, không ghép chuỗi thô |
| **Cross-Site Scripting (XSS)** | Đánh cắp session | Tự động Escape HTML, cấu hình Content Security Policy (CSP) |
| **CSRF** | Giả mạo yêu cầu | Sử dụng `SameSite=Strict` Cookie hoặc CSRF Token Header |
| **Data Exposure** | Lộ dữ liệu nhạy cảm | Ẩn `password_hash`, secret keys khỏi mọi API Response |
| **DDoS / Spam** | Làm sập máy chủ | Cấu hình IP Rate Limiter (Ví dụ: 60 requests/phút/IP) |

---

## 📜 4. CHÍNH SÁCH BẢO MẬT & AUDIT TRAIL (AUDIT LOGGING)

- Ghi nhận lịch sử mọi hành động nhạy cảm (Đổi mật khẩu, Xóa dữ liệu, Thay đổi quyền Admin) vào bảng `audit_logs` với: `user_id`, `action`, `ip_address`, `user_agent`, `timestamp`.
