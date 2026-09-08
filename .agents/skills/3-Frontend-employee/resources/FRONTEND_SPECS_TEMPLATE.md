# TÀI LIỆU ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (FRONTEND & UI/UX SPECS) 🎨

> **Dự án**: `<Tên Dự Án>`  
> **Kỹ sư Frontend phụ trách**: `Frontend Employee (AI Agent)`  
> **Giai đoạn áp dụng**: `Giai đoạn 1 (Core UI & User Interactions)`

---

## 🎨 1. HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM & TOKENS)

### 1.1. Bảng Màu (Color Palette)
- **Primary Color (Chủ đạo)**: `#4F46E5` (Indigo / Hiện đại & Chuyên nghiệp)
- **Secondary Color (Phụ trợ)**: `#06B6D4` (Cyan / Năng động)
- **Background (Nền)**:
  - *Light Mode*: `#F8FAFC`
  - *Dark Mode*: `#0F172A`
- **Surface / Card**: `#FFFFFF` / `#1E293B`
- **Text Color**:
  - *Primary Text*: `#0F172A` / `#F8FAFC`
  - *Muted Text*: `#64748B` / `#94A3B8`
- **Feedback Colors**:
  - *Success*: `#10B981` | *Warning*: `#F59E0B` | *Error*: `#EF4444` | *Info*: `#3B82F6`

### 1.2. Typography (Phông Chữ & Cỡ Chữ)
- **Font Family**: `'Inter', 'Outfit', system-ui, sans-serif`
- **Scale**:
  - `h1`: 32px / Bold (700)
  - `h2`: 24px / SemiBold (600)
  - `h3`: 18px / Medium (500)
  - `body`: 14px - 16px / Regular (400)
  - `small / caption`: 12px / Regular (400)

---

## 📱 2. DANH SÁCH MÀN HÌNH & LUỒNG GIAO DIỆN (UI SCREENS & WIREFRAME FLOW)

| STT | Tên Màn Hình | Route / URL | Mục Đích & Thành Phần Chính | Trạng Thái |
| :-: | :--- | :--- | :--- | :-: |
| 1 | Trang Chủ (Landing/Dashboard) | `/` | Tổng quan, thanh điều hướng, các thẻ số liệu thống kê | Hoàn thiện |
| 2 | Đăng nhập / Đăng ký | `/auth/login` | Form nhập email, password, nút chuyển đổi | Hoàn thiện |
| 3 | Quản lý Dữ liệu chính | `/items` | Bảng dữ liệu, bộ lọc tìm kiếm, nút Thêm/Sửa/Xóa | Hoàn thiện |
| 4 | Chi tiết & Chỉnh sửa | `/items/:id` | Modal hoặc trang form chi tiết | Hoàn thiện |

---

## 🧩 3. ĐẶC TẢ CÁC COMPONENT TÁI SỬ DỤNG (REUSABLE COMPONENTS)

1. **`Button`**:
   - Biến thể: `primary`, `secondary`, `outline`, `danger`.
   - Trạng thái: `default`, `hover`, `active`, `loading (spinner)`, `disabled`.
2. **`InputField` / `SelectField`**:
   - Label, Placeholder, Error message validation, Helper text.
3. **`DataTable`**:
   - Header sắp xếp, Phân trang (Pagination), Trạng thái rỗng (Empty State), Loading skeleton.
4. **`Modal / Dialog`**:
   - Backdrop mờ, Nút đóng (X), Tiêu đề, Nội dung, Footer hành động (Cancel / Confirm).
5. **`Toast Notification`**:
   - Thông báo nổi góc màn hình (Success, Error, Info) tự đóng sau 3 giây.

---

## ⚡ 4. GỢI Ý NÂNG CẤP HIỆU NĂNG CHO GIAI ĐOẠN 3 (PERFORMANCE CHECKPOINT)
- 🟣 *Giai đoạn 3 (Cần phê duyệt)*: Tối ưu kích thước bundle, triển khai Code-splitting / Lazy loading cho các component nặng, Virtualized scrolling cho bảng dữ liệu lớn.
