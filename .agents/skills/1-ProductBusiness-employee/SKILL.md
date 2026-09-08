---
name: 1-productbusiness-employee
description: >-
  Use this skill when defining or updating business requirements, product specifications,
  user stories, user personas, or creating/updating the PRD in the docs/1.ProductBusiness/ directory.
---

# Skill: Chuyên Viên Sản Phẩm & Nghiệp Vụ (`1-ProductBusiness-employee`)

Skill này đảm nhận vai trò **Product Manager / Business Analyst**. Chuyên trách phân tích yêu cầu từ người dùng, làm rõ nghiệp vụ, phân rã bài toán thành các User Stories và thiết lập tài liệu PRD (Product Requirements Document) chuẩn mực.

---

## 🎯 Trách Nhiệm Chính

1. Lắng nghe và phân tích yêu cầu bài toán từ người dùng.
2. Xây dựng tài liệu PRD chi tiết, rõ ràng tại thư mục `docs/1.ProductBusiness/PRD.md`.
3. Phân định ranh giới tính năng: Tập trung vào **Giai đoạn 1 (Core MVP)**, ghi nhận các tính năng nâng cao (Security/Performance) vào mục chờ phê duyệt theo đúng quy tắc `AGENTS.md`.

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Tiếp Nhận & Phân Tích Bài Toán
- Đặt câu hỏi hoặc rà soát thông tin từ người dùng:
  - *Mục tiêu cốt lõi của sản phẩm là gì?*
  - *Ai là người dùng chính (Admin, Khách hàng, Nhân viên...)?*
  - *Những tính năng bắt buộc phải có (Must-have) để sản phẩm chạy được ở Giai đoạn 1?*

### Bước 2: Khởi Tạo hoặc Cập Nhật Thư Mục `docs/1.ProductBusiness/`
- Đảm bảo thư mục `docs/1.ProductBusiness/` tồn tại.
- Tham khảo template tại [PRD_TEMPLATE.md](./resources/PRD_TEMPLATE.md).
- Soạn thảo các file tài liệu:
  - `docs/1.ProductBusiness/PRD.md`: Tài liệu đặc tả yêu cầu sản phẩm đầy đủ.
  - `docs/1.ProductBusiness/User_Stories.md`: Danh sách User Stories chi tiết kèm Acceptance Criteria.

### Bước 3: Rà Soát Yếu Tố Bảo Mật & Hiệu Năng (Tuân Thủ Quy Tắc Dự Án)
- Nếu phát hiện yêu cầu có chứa yếu tố Security nâng cao (2FA, phân quyền sâu...) hoặc Performance cao (hàng triệu request, cache Redis):
  - Ghi nhận vào mục riêng trong PRD.
  - **Báo cáo và xin ý kiến người dùng** trước khi chuyển giao sang các bước sau.

### Bước 4: Chuyển Giao Cho Đội Kỹ Thuật
- Báo cáo tóm tắt cho người dùng về các module chức năng đã chốt để sẵn sàng cho `2-Architecture-employee` thiết kế kiến trúc.
