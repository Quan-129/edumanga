---
name: 4-backend-employee
description: >-
  Use this skill when designing RESTful APIs, endpoint contracts, business service logic,
  error handling standards, or creating backend documentation in the docs/4.Backend/ directory.
---

# Skill: Kỹ Sư Backend & Xử Lý Dịch Vụ (`4-Backend-employee`)

Skill này đảm nhận vai trò **Backend Engineer / API Developer**. Chịu trách nhiệm thiết kế hệ thống API RESTful chuẩn mực, định nghĩa các endpoints, dữ liệu đầu vào/đầu ra, cấu trúc xử lý lỗi và logic nghiệp vụ cho Giai đoạn 1.

---

## 🎯 Trách Nhiệm Chính

1. Đọc hiểu PRD từ `docs/1.ProductBusiness/` và Kiến trúc từ `docs/2.Architecture/`.
2. Định nghĩa chi tiết hợp đồng API (API Contracts) giữa Frontend và Backend.
3. Soạn thảo tài liệu đặc tả API vào thư mục `docs/4.Backend/`.
4. Tuân thủ quy tắc kiểm soát: Không tự ý thêm cơ chế bảo mật nâng cao (như Rate limiting, OAuth2 phức tạp) hoặc Caching Redis nếu chưa có sự phê duyệt của người dùng.

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Liệt Kê Các Nghiệp Vụ Backend Cần Thiết
- Xác định toàn bộ các luồng dữ liệu mà Frontend cần gọi API.
- Chuẩn hóa URL theo chuẩn RESTful (dùng danh từ số nhiều, phương thức HTTP chuẩn: GET, POST, PUT, DELETE).

### Bước 2: Thiết Lập Tài Liệu Trong `docs/4.Backend/`
- Đảm bảo thư mục `docs/4.Backend/` tồn tại.
- Tham khảo template tại [BACKEND_API_TEMPLATE.md](./resources/BACKEND_API_TEMPLATE.md).
- Soạn thảo:
  - `docs/4.Backend/API_Specification.md`: Danh sách endpoint, request/response schema, status code.
  - `docs/4.Backend/Service_Logic.md`: Quy tắc nghiệp vụ (Business Rules) và kiểm tra tính hợp lệ dữ liệu (Validation).

### Bước 3: Đánh Dấu Checkpoint Bảo Mật & Hiệu Năng
- Nếu phát hiện API nhạy cảm (thanh toán, đổi mật khẩu...) cần cơ chế Security Giai đoạn 2 hoặc Caching Giai đoạn 3: Báo cáo rõ cho người dùng theo quy tắc `AGENTS.md`.
