# TÀI LIỆU ĐẶC TẢ API & LOGIC DỊCH VỤ (BACKEND & API SPECIFICATION) ⚙️

> **Dự án**: `<Tên Dự Án>`  
> **Kỹ sư Backend phụ trách**: `Backend Employee (AI Agent)`  
> **Giai đoạn áp dụng**: `Giai đoạn 1 (Core RESTful API & Service Logic)`

---

## 🌐 1. NGUYÊN TẮC THIẾT KẾ API (API CONVENTIONS)

- **Base URL**: `/api/v1`
- **Định dạng dữ liệu trao đổi**: `application/json`
- **Cấu trúc phản hồi chuẩn (Standard Response Wrapper)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Thao tác thành công",
    "data": {},
    "error": null,
    "timestamp": "2026-09-04T16:00:00.000Z"
  }
  ```
- **Cấu trúc phản hồi lỗi (Error Response)**:
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Dữ liệu đầu vào không hợp lệ",
    "data": null,
    "error": {
      "code": "VALIDATION_FAILED",
      "details": ["Email không đúng định dạng"]
    },
    "timestamp": "2026-09-04T16:00:00.000Z"
  }
  ```

---

## 📋 2. DANH SÁCH ENDPOINTS CHI TIẾT (API ENDPOINTS SPEC)

### 2.1. Module Xác Thực (Authentication)

#### `POST /api/v1/auth/login`
- **Mô tả**: Đăng nhập tài khoản bằng email & mật khẩu.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "usr_01",
        "email": "user@example.com",
        "name": "Nguyễn Văn A"
      }
    }
  }
  ```

---

### 2.2. Module Nghiệp Vụ Chính (`/items`)

| Phương thức (Method) | Endpoint | Mô tả | Yêu cầu xác thực |
| :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/items` | Lấy danh sách có phân trang & tìm kiếm | Có |
| `GET` | `/api/v1/items/:id` | Lấy chi tiết một mục | Có |
| `POST` | `/api/v1/items` | Tạo mới một mục | Có |
| `PUT / PATCH` | `/api/v1/items/:id` | Cập nhật thông tin mục | Có |
| `DELETE` | `/api/v1/items/:id` | Xóa một mục | Có |

---

## 🧠 3. LOGIC NGHIỆP VỤ & VALIDATION (SERVICE LOGIC)

1. **Validation Rules**:
   - Mọi dữ liệu đầu vào từ client đều được kiểm tra kiểu dữ liệu, độ dài và các ký tự cấm trước khi đưa vào Service layer.
2. **Business Rules**:
   - Quy tắc 1: Không cho phép tạo trùng lặp tên mục trong cùng một tài khoản.
   - Quy tắc 2: Tự động gắn `createdAt`, `updatedAt` cho mọi bản ghi.

---

## 🔒 4. CHECKPOINT BẢO MẬT & HIỆU NĂNG CHO GIAI ĐOẠN 2 & 3
- 🟡 *Giai đoạn 2 (Security)*: Thêm Rate-limiting chống Spam/DDoS (ví dụ: tối đa 60 requests/phút), thêm kiểm tra CSRF token, phân quyền chi tiết (RBAC). *(Chỉ làm khi được duyệt)*.
- 🟣 *Giai đoạn 3 (Performance)*: Thêm bộ nhớ đệm Cache cho endpoint `GET /items` để giảm tải Database. *(Chỉ làm khi được duyệt)*.
