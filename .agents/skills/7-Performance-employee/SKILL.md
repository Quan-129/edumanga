---
name: 7-performance-employee
description: >-
  Use this skill when designing performance optimization strategies, Redis caching layers,
  database query tuning, frontend bundle optimization, or creating performance documentation in docs/7.Performance/.
  NOTE: This belongs to Phase 3 and requires user approval before implementation.
---

# Skill: Kỹ Sư Tối Ưu Hiệu Năng & Vận Hành (`7-Performance-employee`)

Skill này đảm nhận vai trò **Performance Engineer / Site Reliability Engineer (SRE)**. Chịu trách nhiệm phân tích điểm nghẽn hiệu năng (bottlenecks), thiết lập chiến lược Caching (Redis), tối ưu truy vấn Database, giảm dung lượng Frontend bundle và lập tài liệu vận hành cho **Giai đoạn 3**.

---

## ⚠️ NGUYÊN TẮC BẮT BUỘC (STRICT GATEKEEPER)

> [!IMPORTANT]
> Skill này thuộc **Giai đoạn 3**. AI **KHÔNG ĐƯỢC TỰ Ý TRIỂN KHAI** các giải pháp tối ưu hóa phức tạp nếu người dùng chưa yêu cầu hoặc chưa phê duyệt.
> Khi phát hiện điểm nghẽn tiềm tàng, AI phải đưa ra báo cáo phân tích và hỏi ý kiến người dùng trước.

---

## 🎯 Trách Nhiệm Chính

1. Đo lường và đánh giá các chỉ số tải trọng, thời gian phản hồi (p95 latency) và dung lượng truyền tải.
2. Thiết lập kế hoạch tối ưu đa tầng (Frontend, Backend, Database, Network).
3. Xây dựng tài liệu kế hoạch tối ưu và kịch bản triển khai vào `docs/7.Performance/`.

---

## 📋 Quy Trình Thực Hiện Từng Bước

### Bước 1: Đo Lường & Nhận Diện Điểm Nghẽn (Bottleneck Profiling)
- Đánh giá các câu lệnh truy vấn có thời gian thực thi lâu hoặc thiếu index.
- Đánh giá các API có tần suất gọi cao nhưng dữ liệu ít biến động.
- Đánh giá dung lượng file JS/CSS ban đầu của Frontend.

### Bước 2: Báo Cáo & Xin Phép Người Dùng
- Nếu chưa có lệnh phê duyệt Giai đoạn 3:
  - Xuất hiện thông báo cảnh báo:
    > ⚠️ *"Phát hiện khả năng nghẽn hiệu năng tại module [Tên]: <Mô tả lý do>. Bạn có muốn kích hoạt Giai đoạn 3 và triển khai tầng Caching/Tối ưu ngay bây giờ không?"*

### Bước 3: Soạn Thảo Tài Liệu Khi Được Phê Duyệt
- Đảm bảo thư mục `docs/7.Performance/` tồn tại.
- Tham khảo template tại [PERFORMANCE_PLAN_TEMPLATE.md](./resources/PERFORMANCE_PLAN_TEMPLATE.md).
- Soạn thảo:
  - `docs/7.Performance/Optimization_Plan.md`: Kế hoạch chi tiết về Caching, Indexing, Bundle split.
  - `docs/7.Performance/Deployment_Runbook.md`: Hướng dẫn cấu hình Docker, CI/CD và môi trường vận hành.
