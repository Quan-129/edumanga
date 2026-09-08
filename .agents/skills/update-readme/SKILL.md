---
name: update-readme
description: >-
  Use this skill when the user asks to create or update the project's README.md file,
  or when documentation needs to be refreshed to accurately reflect the latest project features,
  tech stack, directory structure, and setup/run instructions.
---

# Skill: Update README (`update-readme`)

Skill này hướng dẫn quy trình tự động quét toàn bộ codebase, phân tích trạng thái thực tế của dự án và tạo hoặc cập nhật file `README.md` một cách chuyên nghiệp, đầy đủ và trực quan.

---

## 🎯 Mục Tiêu

Tạo ra một file `README.md` đạt chuẩn chất lượng cao:
- **Rõ ràng & súc tích**: Người đọc (dev khác, khách hàng, nhà đầu tư) hiểu ngay dự án làm gì chỉ trong 10 giây đầu.
- **Phản ánh đúng thực tế**: Cập nhật chính xác tech stack, dependencies, biến môi trường và các lệnh chạy.
- **Trực quan & chuyên nghiệp**: Có badges, bảng so sánh/công nghệ, checklist tính năng và sơ đồ thư mục rõ ràng.

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Quét và Phân Tích Codebase
1. **Kiểm tra file cấu hình dự án**:
   - Web/Node: `package.json`, `pnpm-lock.yaml`, `vite.config.js`, `tsconfig.json`, `next.config.js`
   - Python: `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile`
   - Khác: `composer.json`, `pom.xml`, `go.mod`, `Cargo.toml`, `Dockerfile`, `docker-compose.yml`
2. **Quét cấu trúc thư mục**: Liệt kê các thư mục chính (`src/`, `components/`, `api/`, `models/`, `docs/`, `public/`).
3. **Phân tích tính năng đã hoàn thiện**:
   - Đọc qua các entry point chính (ví dụ `index.html`, `src/App.tsx`, `main.py`, `server.js`).
   - Kiểm tra các route, controller, module chức năng để lập danh sách tính năng thực tế.
4. **Kiểm tra biến môi trường**: Đọc `.env.example` hoặc các file config để liệt kê biến môi trường cần thiết.

### Bước 2: Đọc `README.md` Hiện Tại (Nếu có)
- Kiểm tra xem dự án đã có `README.md` chưa.
- Giữ lại các thông tin tùy biến quan trọng của người dùng (ví dụ: liên kết demo đặc thù, ghi chú bản quyền, thông tin cá nhân của tác giả) nếu người dùng đã cấu hình trước đó.

### Bước 3: Soạn Thảo và Cập Nhật `README.md`
- Tham khảo mẫu cấu trúc tại [README_TEMPLATE.md](./resources/README_TEMPLATE.md).
- Điền đầy đủ các phần:
  1. **Tiêu đề & Slogan**: Tên dự án kèm emoji và 1 câu giới thiệu giá trị cốt lõi.
  2. **Badges**: Trạng thái, license, công nghệ chính.
  3. **Mục lục**: Giúp người đọc dễ điều hướng.
  4. **Giới thiệu**: Đặt vấn đề và giải pháp của dự án.
  5. **Tính năng nổi bật (Features Checklist)**: Đánh dấu `[x]` các tính năng đã chạy được, `[ ]` tính năng dự kiến.
  6. **Bảng Công nghệ (Tech Stack Table)**: Liệt kê Frontend, Backend, Database, Tools.
  7. **Sơ đồ cấu trúc thư mục**: Dùng khối code `text` dạng cây gọn gàng.
  8. **Hướng dẫn Cài đặt & Khởi chạy**: Các lệnh CLI chính xác (clone, install, config env, run dev, build).
  9. **Bảng Biến môi trường**: Tên biến, bắt buộc hay không, giá trị mặc định và mô tả.
  10. **Lộ trình phát triển (Roadmap) & Đóng góp (Contributing)**.

### Bước 4: Kiểm Tra và Hoàn Thiện
- Đảm bảo tất cả link nội bộ trong mục lục hoạt động tốt.
- Đảm bảo cú pháp Markdown chuẩn xác, không có link hỏng hoặc code block thiếu đóng thẻ.
- Báo cáo ngắn gọn cho người dùng những điểm vừa được cập nhật trong `README.md`.
