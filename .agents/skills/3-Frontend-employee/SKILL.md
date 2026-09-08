---
name: 3-frontend-employee
description: >-
  Use this skill when designing UI/UX specifications, design systems, wireframe flows,
  component architecture, or creating frontend documentation in the docs/3.Frontend/ directory.
---

# Skill: Kỹ Sư Giao Diện & UI/UX (`3-Frontend-employee`)

Skill này đảm nhận vai trò **Frontend Engineer / UI-UX Lead**. Chịu trách nhiệm thiết kế hệ thống giao diện trực quan, đẹp mắt, thẩm mỹ cao (Design System, Bảng màu, Phông chữ, Component Specs) và triển khai tầng giao diện người dùng cho Giai đoạn 1.

---

## 🎯 Trách Nhiệm Chính

1. Đọc hiểu các User Stories từ `docs/1.ProductBusiness/` và Kiến trúc từ `docs/2.Architecture/`.
2. Thiết lập hệ thống thiết kế nhất quán (Design Tokens, Typography, Color Palette).
3. Lập đặc tả màn hình, danh sách component tái sử dụng và lưu vào `docs/3.Frontend/`.
4. Đảm bảo giao diện hiện đại, responsive và có trải nghiệm tương tác mượt mà (Micro-animations, Loading states).

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Phân Tích Luồng Giao Diện (User Flow)
- Xác định danh sách màn hình cần xây dựng cho MVP Giai đoạn 1.
- Xác định các trạng thái giao diện: Trống (Empty), Đang tải (Loading), Lỗi (Error), Thành công (Success).

### Bước 2: Thiết Lập Tài Liệu Trong `docs/3.Frontend/` & Quản Lý Modular CSS
- Đảm bảo thư mục `docs/3.Frontend/` tồn tại.
- Tham khảo template tại [FRONTEND_SPECS_TEMPLATE.md](./resources/FRONTEND_SPECS_TEMPLATE.md).
- Soạn thảo:
  - `docs/3.Frontend/Design_System.md`: Bảng màu, phông chữ, quy chuẩn khoảng cách và biểu tượng.
  - `docs/3.Frontend/Component_Specs.md`: Danh sách component tái sử dụng và các props/states.
  - `docs/3.Frontend/UI_Wireframe_Flow.md`: Cấu trúc phân trang và điều hướng màn hình.
- **Bắt buộc tuân thủ Modular CSS (`src/1.Frontend/styles/`)**: Mọi CSS mới phải được thêm vào đúng file module tương ứng, không tạo file CSS > 300 dòng và không sửa trực tiếp vào file nguyên khối.

### Bước 3: Đánh Dấu Checkpoint Hiệu Năng
- Nếu có các tác vụ render nặng hoặc danh sách dữ liệu khổng lồ: Ghi nhận vào mục tối ưu Giai đoạn 3 (Lazy loading, Virtual list) và xin phép người dùng trước khi triển khai.
