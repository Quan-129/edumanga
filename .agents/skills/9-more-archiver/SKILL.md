---
name: 9-more-archiver
description: >-
  Use this skill to identify, organize, and archive miscellaneous .md files from the project root
  into docs/9.More/, and automatically generate or update an easy-to-read master index report (docs/9.More/README.md).
---

# Skill: Thu Gom & Quản Lý Tài Liệu Bổ Sung (`9-more-archiver`)

Skill này đảm nhận vai trò **Documentation Archiver & Knowledge Organizer**. Chuyên trách phát hiện các file tài liệu Markdown (`.md`) phát sinh ở thư mục gốc (như bản kế hoạch `implementation_plan.md`, báo cáo `walkthrough.md`, ghi chú khảo sát...), gom vào thư mục **`docs/9.More/`** và lập bảng mục lục tổng hợp trực quan tại **`docs/9.More/README.md`**.

---

## 🎯 Mục Tiêu Chính

1. **Giữ thư mục gốc luôn tinh gọn**: Thư mục gốc chỉ giữ lại `README.md` (trang chủ) và `AGENTS.md` (quy tắc).
2. **Lưu trữ tài liệu có hệ thống**: Mọi tài liệu phát sinh trong quá trình phát triển (kế hoạch, review, kiến trúc cũ, ghi chú kỹ thuật) được phân loại và lưu trữ an toàn trong `docs/9.More/`.
3. **Mục lục báo cáo tổng quan (`docs/9.More/README.md`)**: Cung cấp bản tóm tắt súc tích, dễ hiểu về nội dung, mục đích và đường dẫn của từng tài liệu để người dùng và AI Agent có thể tra cứu nhanh trong 3 giây.

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Rà Soát Các File Markdown Ở Thư Mục Gốc
- Kiểm tra danh sách file `.md` ở thư mục gốc.
- **Ngoại lệ bắt buộc giữ lại ở root**:
  - `README.md`
  - `AGENTS.md`
- **Các file cần gom**:
  - `implementation_plan.md`
  - `walkthrough.md`
  - Bất kỳ file `.md` tạm thời, báo cáo kỹ thuật hoặc ghi chú nghiên cứu phát sinh.

### Bước 2: Di Chuyển File Vào `docs/9.More/`
- Đảm bảo thư mục `docs/9.More/` tồn tại.
- Di chuyển (hoặc sao chép nội dung và xóa file gốc) các file cần gom vào `docs/9.More/`.

### Bước 3: Tạo / Cập Nhật Báo Cáo Tổng Hợp `docs/9.More/README.md`
- Đọc nội dung tóm tắt của từng file trong `docs/9.More/`.
- Soạn thảo hoặc cập nhật file `docs/9.More/README.md` theo cấu trúc:
  1. **Tổng quan thư mục**: Mục đích lưu trữ.
  2. **Bảng phân loại & mục lục chi tiết**: Tên tài liệu, Mô tả nội dung chính, Ngày tạo/cập nhật, Đường dẫn liên kết.
  3. **Tóm tắt nhanh từng tài liệu**: 2-3 gạch đầu dòng giải thích giá trị của tài liệu đó.

### Bước 4: Cập Nhật WORKLOG & Báo Cáo Người Dùng
- Ghi nhận hành động thu gom vào `docs/0.Log/WORKLOG.md`.
- Thông báo cho người dùng về danh sách các file đã được gom và link đến bản báo cáo tổng hợp.
