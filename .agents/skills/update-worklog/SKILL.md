---
name: update-worklog
description: >-
  Use this skill when completing a working session, implementing a feature or bugfix,
  or automatically logging development progress, technical decisions, and next steps into docs/0.Log/WORKLOG.md.
---

# Skill: Tự Động Cập Nhật Nhật Ký Công Việc (`update-worklog`)

Skill này hướng dẫn quy trình tự động ghi nhận nhật ký công việc (Dev Diary / Worklog) sau mỗi phiên làm việc hoặc sau khi hoàn thành một khối công việc cụ thể. File đầu ra luôn được quản lý tại **`docs/0.Log/WORKLOG.md`**.

---

## 🎯 Mục Tiêu

1. **Lưu vết tiến độ tự động**: Ghi lại những gì đã hoàn thành một cách chi tiết, có phân loại (`[Feature]`, `[Bugfix]`, `[Refactor]`, `[Config / DevOps]`).
2. **Ghi lại các quyết định kỹ thuật (ADR)**: Lưu lý do tại sao lại chọn một công nghệ, thư viện hoặc giải pháp kiến trúc cụ thể.
3. **Quản lý danh sách việc cần làm (Next Steps)**: Đảm bảo khi bắt đầu phiên làm việc tiếp theo, AI và người dùng có thể nắm bắt ngay trạng thái hiện tại.

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Thu Thập Ngữ Cảnh Phiên Làm Việc
1. **Rà soát các file đã thay đổi**:
   - Kiểm tra các file vừa tạo mới, chỉnh sửa hoặc xóa trong phiên làm việc.
   - Kiểm tra `git status`, `git diff` hoặc lịch sử hội thoại gần nhất.
2. **Tổng hợp thông tin chính**:
   - Mục tiêu của phiên làm việc vừa rồi là gì?
   - Những tính năng nào đã chạy thử thành công?
   - Những quyết định kiến trúc nào đã được đưa ra?

### Bước 2: Kiểm Tra File `docs/0.Log/WORKLOG.md`
- Đảm bảo thư mục `docs/0.Log/` tồn tại.
- Nếu file `docs/0.Log/WORKLOG.md` chưa tồn tại:
  - Khởi tạo file mới với phần tiêu đề và nguyên tắc ghi dựa trên [WORKLOG_TEMPLATE.md](./resources/WORKLOG_TEMPLATE.md).

### Bước 3: Soạn Entry Mới và Chèn Vào Đầu File
- Điền đầy đủ thông tin theo mẫu cấu trúc:
  - **Mốc thời gian**: Định dạng `[YYYY-MM-DD HH:mm] - <Tiêu đề ngắn gọn>`
  - **🎯 Mục tiêu**: 1-2 câu tóm tắt mục đích chính của phiên.
  - **✅ Công việc đã hoàn thành**: Phân loại rõ ràng `[Feature]`, `[Bugfix]`, `[Refactor]`, `[Config / DevOps]`.
  - **💡 Quyết định Kỹ thuật & Kiến trúc**: Lý do lựa chọn giải pháp.
  - **⚠️ Thách thức & Khắc phục**: Ghi lại các lỗi đã xử lý.
  - **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**: Checklist các đầu việc cụ thể cần làm tiếp.
- **Quy tắc chèn**: Luôn chèn entry mới vào **ngay bên dưới phần giới thiệu tiêu đề** (ở đầu danh sách các phiên) để đảm bảo phiên mới nhất luôn nằm trên cùng.

### Bước 4: Báo Cáo Hoàn Thành
- Thông báo ngắn gọn cho người dùng về nội dung vừa được tự động ghi vào `docs/0.Log/WORKLOG.md`.
