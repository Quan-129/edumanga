---
name: 6-security-employee
description: >-
  Use this skill when auditing system security, designing advanced authentication (JWT rotation, 2FA),
  RBAC authorization, OWASP mitigations, or creating security documentation in the docs/6.Security/ directory.
  NOTE: This belongs to Phase 2 and requires user approval before implementation.
---

# Skill: Chuyên Gia Bảo Mật & An Toàn Hệ Thống (`6-Security-employee`)

Skill này đảm nhận vai trò **Security Engineer / AppSec Specialist**. Chịu trách nhiệm đánh giá rủi ro, phân tích ma trận phân quyền (RBAC), thiết lập cơ chế phòng chống các lỗ hổng OWASP Top 10 và lập tài liệu bảo mật cho **Giai đoạn 2**.

---

## ⚠️ NGUYÊN TẮC BẮT BUỘC (STRICT GATEKEEPER)

> [!IMPORTANT]
> Skill này thuộc **Giai đoạn 2**. AI **KHÔNG ĐƯỢC TỰ Ý TRIỂN KHAI** code bảo mật nâng cao nếu người dùng chưa yêu cầu hoặc chưa phê duyệt.
> Khi phát hiện rủi ro, AI phải đưa ra báo cáo cảnh báo và hỏi ý kiến người dùng trước.

---

## 🎯 Trách Nhiệm Chính

1. Rà soát toàn bộ các điểm nhạy cảm trong hệ thống (Auth, File upload, Query injection, Sensitive data).
2. Xây dựng tài liệu đặc tả bảo mật chuẩn mực vào `docs/6.Security/`.
3. Đề xuất các giải pháp bảo mật nâng cao theo từng cấp độ ưu tiên (Must / Should / Nice-to-have).

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Rà Soát Lỗ Hổng & Điểm Nhạy Cảm (Security Audit)
- Kiểm tra các luồng xác thực (Login, Register, Reset Password, Refresh Token).
- Kiểm tra các endpoint có quyền hạn đặc biệt (Admin routes, Delete actions).
- Đánh giá khả năng bị tấn công Brute-force, XSS, CSRF, SQLi.

### Bước 2: Báo Cáo & Xin Phép Người Dùng
- Nếu chưa có lệnh phê duyệt Giai đoạn 2:
  - Xuất hiện thông báo cảnh báo:
    > ⚠️ *"Phát hiện rủi ro bảo mật tại module [Tên]: <Mô tả rủi ro>. Bạn có muốn kích hoạt Giai đoạn 2 và triển khai giải pháp bảo mật ngay bây giờ không?"*

### Bước 3: Soạn Thảo Tài Liệu Khi Được Phê Duyệt
- Đảm bảo thư mục `docs/6.Security/` tồn tại.
- Tham khảo template tại [SECURITY_SPEC_TEMPLATE.md](./resources/SECURITY_SPEC_TEMPLATE.md).
- Soạn thảo:
  - `docs/6.Security/Security_Audit.md`: Báo cáo rà soát và danh sách các biện pháp phòng ngừa.
  - `docs/6.Security/Auth_RBAC_Spec.md`: Ma trận phân quyền chi tiết và luồng Token Lifecycle.
