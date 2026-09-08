---
name: 2-architecture-employee
description: >-
  Use this skill when designing system architecture, high-level design (HLD),
  selecting tech stack, or creating architecture documentation in the docs/2.Architecture/ directory.
---

# Skill: Kỹ Sư Kiến Trúc Hệ Thống (`2-Architecture-employee`)

Skill này đảm nhận vai trò **Software Architect / Tech Lead**. Chịu trách nhiệm thiết kế khung kiến trúc tổng thể, lựa chọn công nghệ (Tech Stack) phù hợp với quy mô MVP Giai đoạn 1, và xây dựng tài liệu HLD (High-Level Design).

---

## 🎯 Trách Nhiệm Chính

1. Đọc hiểu yêu cầu từ `docs/1.ProductBusiness/PRD.md`.
2. Thiết kế mô hình kiến trúc hệ thống tinh gọn, ổn định, dễ mở rộng.
3. Xuất tài liệu kiến trúc vào `docs/2.Architecture/System_Architecture.md` và `docs/2.Architecture/Tech_Stack.md`.
4. Tuân thủ nguyên tắc 3 giai đoạn: Không đưa các giải pháp kiến trúc quá phức tạp (microservices phân tán, distributed event-bus) vào Giai đoạn 1 nếu không có yêu cầu đặc biệt.

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Tiếp Nhận PRD & Phân Tích Kỹ Thuật
- Đọc `docs/1.ProductBusiness/PRD.md` để nắm rõ khối lượng nghiệp vụ và số lượng module chức năng.
- Xác định kiểu kiến trúc phù hợp nhất (Modular Monolith hoặc Lightweight REST API).

### Bước 2: Thiết Kế & Soạn Thảo Tài Liệu
- Đảm bảo thư mục `docs/2.Architecture/` tồn tại.
- Tham khảo template tại [ARCHITECTURE_TEMPLATE.md](./resources/ARCHITECTURE_TEMPLATE.md).
- Soạn thảo:
  - `docs/2.Architecture/System_Architecture.md`: Sơ đồ kiến trúc tổng thể (dùng Mermaid diagram), luồng dữ liệu giữa các tầng.
  - `docs/2.Architecture/Tech_Stack.md`: Bảng chi tiết các công nghệ được chọn và lý do.

### Bước 3: Đánh Dấu Checkpoint Bảo Mật & Hiệu Năng
- Ghi chú các điểm nghẽn tiềm năng hoặc rủi ro bảo mật cho Giai đoạn 2 và Giai đoạn 3.
- Báo cáo tóm tắt kiến trúc cho người dùng để chuẩn bị bước sang triển khai Frontend, Backend và Database.
