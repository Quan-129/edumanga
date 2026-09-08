---
name: 5-database-employee
description: >-
  Use this skill when designing database schemas, ERD diagrams, SQL DDL scripts,
  data dictionaries, or creating database documentation in the docs/5.Database/ directory.
---

# Skill: Kỹ Sư Cơ Sở Dữ Liệu (`5-Database-employee`)

Skill này đảm nhận vai trò **Database Engineer / Data Architect**. Chịu trách nhiệm thiết kế mô hình dữ liệu quan hệ (ERD Diagram), định nghĩa các bảng, khóa chính/khóa ngoại, từ điển dữ liệu và kịch bản khởi tạo Schema DDL cho Giai đoạn 1.

---

## 🎯 Trách Nhiệm Chính

1. Đọc hiểu thực thể và quan hệ nghiệp vụ từ `docs/1.ProductBusiness/` và `docs/4.Backend/`.
2. Thiết kế cấu trúc cơ sở dữ liệu chuẩn hóa (3NF) để tránh dư thừa dữ liệu và đảm bảo toàn vẹn dữ liệu.
3. Xuất sơ đồ ERD trực quan (Mermaid) và kịch bản SQL vào thư mục `docs/5.Database/`.
4. Tuân thủ quy tắc kiểm soát: Không tự ý cấu hình phân vùng (Partitioning), Sharding hay đánh chỉ mục quá mức nếu chưa được phê duyệt cho Giai đoạn 3.

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Phân Tích Thực Thể & Quan Hệ (Entities & Relations)
- Liệt kê các đối tượng dữ liệu cần lưu trữ (Users, Items, Categories, Orders...).
- Xác định quan hệ giữa các bảng: 1-1, 1-Nhiều, Nhiều-Nhiều.

### Bước 2: Thiết Lập Tài Liệu Trong `docs/5.Database/`
- Đảm bảo thư mục `docs/5.Database/` tồn tại.
- Tham khảo template tại [DATABASE_DESIGN_TEMPLATE.md](./resources/DATABASE_DESIGN_TEMPLATE.md).
- Soạn thảo:
  - `docs/5.Database/ERD_Diagram.md`: Sơ đồ quan hệ thực thể bằng cú pháp Mermaid.
  - `docs/5.Database/Data_Dictionary.md`: Bảng tra cứu chi tiết từng cột, kiểu dữ liệu, ràng buộc.
  - `docs/5.Database/Schema_Design.sql`: Kịch bản DDL tạo bảng sẵn sàng chạy vào Database.

### Bước 3: Đánh Dấu Checkpoint Tối Ưu Hiệu Năng
- Nếu có bảng dữ liệu dự kiến phình to nhanh chóng (lịch sử giao dịch, logs, notifications): Ghi nhận vào kế hoạch Giai đoạn 3 và xin phép người dùng trước khi triển khai tối ưu sâu.
