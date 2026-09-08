# TÀI LIỆU KẾ HOẠCH TỐI ƯU HIỆU NĂNG & QUY MÔ (PERFORMANCE & SCALING PLAN) ⚡

> **Dự án**: `<Tên Dự Án>`  
> **Kỹ sư Tối ưu & Vận hành phụ trách**: `Performance Employee (AI Agent)`  
> **Giai đoạn áp dụng**: `Giai đoạn 3 (High Performance & Scale) - CẦN PHÊ DUYỆT`

---

## ⏱ 1. TIÊU CHUẨN HIỆU NĂNG MỤC TIÊU (SERVICE LEVEL OBJECTIVES - SLO)

| Chỉ Số (Metric) | Tiêu Chuẩn Mục Tiêu | Công Cụ Đo Lường |
| :--- | :--- | :--- |
| **API Response Time (p95)** | < 200ms cho các truy vấn dữ liệu thông thường | Apache Benchmark / k6 / Autocannon |
| **Frontend Initial Load (LCP)** | < 1.5 giây trên mạng 4G tiêu chuẩn | Google Lighthouse / WebPageTest |
| **Database Query Execution Time** | < 50ms cho 99% các truy vấn SELECT | Database Slow Query Log |
| **Throughput (Tải tối đa)** | 5,000 requests/phút không phát sinh lỗi 5xx | Stress Testing Tool |

---

## ⚡ 2. CHIẾN LƯỢC BỘ NHỚ ĐỆM (CACHING STRATEGY)

### 2.1. In-Memory & Redis Caching
- **Đối tượng Cache**: Các dữ liệu đọc nhiều nhưng ít thay đổi (ví dụ: Danh mục, Cấu hình hệ thống, Bảng giá, Dữ liệu trang chủ).
- **Mô hình Cache**: `Cache-Aside Pattern` (Look-aside).
- **Thời gian sống (TTL)**: 5 - 15 phút tùy loại dữ liệu.
- **Chiến lược vô hiệu hóa (Cache Invalidation)**: Tự động xóa key cache khi có thao tác POST/PUT/DELETE vào dữ liệu tương ứng.

### 2.2. HTTP & Static Asset Caching
- Cấu hình `Cache-Control: public, max-age=31536000, immutable` cho các file tĩnh (JS, CSS, Images có hash tên file).

---

## 🗄 3. TỐI ƯU HÓA CƠ SỞ DỮ LIỆU (DATABASE OPTIMIZATION)

1. **Composite Indexing**: Đánh chỉ mục kết hợp cho các mệnh đề `WHERE` và `ORDER BY` thường xuyên đi cùng nhau.
2. **Connection Pooling**: Giới hạn và tái sử dụng kết nối Database (ví dụ: Pool size = 20 - 50).
3. **Phân trang bằng Keyset/Cursor**: Thay thế `OFFSET / LIMIT` truyền thống bằng Cursor pagination khi số bản ghi vượt quá 100,000 dòng.

---

## 📦 4. TỐI ƯU HÓA FRONTEND (FRONTEND OPTIMIZATION)

1. **Code Splitting & Dynamic Import**: Tách bundle theo từng route để giảm dung lượng file ban đầu tải về.
2. **Tối ưu hình ảnh**: Tự động chuyển đổi định dạng ảnh sang `WebP` hoặc `AVIF` và sử dụng Responsive `srcset`.
3. **Tree-shaking & Minification**: Loại bỏ code thừa, nén Gzip / Brotli trên Web Server.

---

## 🚀 5. HƯỚNG DẪN TRIỂN KHAI & TỰ ĐỘNG HÓA (DEPLOYMENT RUNBOOK)

- Cấu hình Docker multi-stage build để tạo Image siêu nhẹ (< 150MB).
- Pipeline CI/CD tự động chạy linter, unit test, build và deploy lên máy chủ.
