# QUY TẮC KIẾN TRÚC MÃ NGUỒN (5-TIER MODULAR ARCHITECTURE RULES) 📐

Mọi AI Agent và Lập trình viên khi tham gia phát triển dự án này **BẮT BUỘC** phải tuân thủ nghiêm ngặt các quy tắc kiến trúc sau:

---

## 🏛 1. CẤU TRÚC 5 TẦNG MÃ NGUỒN (`src/`)

Mọi file mã nguồn mới hoặc logic chỉnh sửa phải được đặt đúng vào 1 trong 5 thư mục chuyên môn tương ứng:

1. **`src/1.Frontend/`**: Chuyên trách toàn bộ giao diện người dùng, DOM Rendering, Components (`CircularNode.js`, `EditModal.js`, `Toast.js`), Views (`TimetableGrid.js`, `BackpackView.js`, `GradesView.js`) và **Modular CSS (`src/1.Frontend/styles/`)**.
   - **Bắt buộc chia nhỏ CSS**: Toàn bộ CSS phải phân tách theo từng Component/View (`1.variables.css`, `2.navbar.css`, `3.timetable-grid.css`, `4.grade-solver.css`, `5.backpack-drive.css`, `6.modals.css`, `7.markdown-editor.css`, `8.responsive.css`), giữ mỗi file < 250–300 dòng.
2. **`src/2.Backend/`**: Chuyên trách các thuật toán nghiệp vụ thuần túy (Pure Functions), bộ giải điểm mục tiêu (`GradeSolverService`), bộ phân tích lịch học (`TimetableParser`) và các tiện ích ngày giờ.
3. **`src/3.Database/`**: Chuyên trách State Management trung tâm (`state.js`), cấu trúc Model dữ liệu, tầng lưu trữ (`LocalStorageEngine`) và dữ liệu mẫu (`SeedData.js`).
4. **`src/4.Security/`**: Chuyên trách làm sạch dữ liệu đầu vào (`sanitizer.js` - `escapeHtml`), kiểm tra tính hợp lệ của URL (`urlValidator.js`) và thiết lập bảo vệ chống XSS.
5. **`src/5.Performance/`**: Chuyên trách quản lý vòng đời Service Worker PWA (`pwaManager.js`), tối ưu hóa render và quản lý tài nguyên khi ẩn tab (`visibilityOptimizer.js`).

---

## 🚫 2. CÁC ĐIỀU CẤM KỴ (STRICT CONSTRAINTS)

- ❌ **CẤM viết dồn code vào 1 file khổng lồ (Monolithic File > 300 dòng)**: Mọi file JS, CSS và HTML đều phải giữ nhỏ gọn, đúng trách nhiệm đơn lẻ (Single Responsibility).
- ❌ **CẤM hardcode hàng trăm dòng template/modal tĩnh vào `index.html`**: `index.html` phải là **App Shell tối giản (< 120–150 dòng)**, mọi modal và dynamic layout phải được componentize trong `src/1.Frontend/components/`.
- ❌ **CẤM dồn toàn bộ CSS vào một file `style.css` duy nhất**: File `style.css` ở thư mục gốc chỉ được dùng làm Master Aggregator (`@import`) hoặc nạp trực tiếp qua `<link>` trong `index.html`.
- ❌ **CẤM truy cập trực tiếp DOM từ tầng Backend hoặc Database**: Tầng Backend chỉ nhận dữ liệu đầu vào và trả về kết quả thuần túy (Pure Logic), không gọi `document.getElementById()`.
- ❌ **CẤM hardcode dữ liệu mẫu rải rác**: Mọi dữ liệu mặc định phải nằm trong `src/3.Database/storage/SeedData.js`.
- ❌ **CẤM inject chuỗi người dùng vào `innerHTML` mà không qua hàm `escapeHtml()`** từ `src/4.Security/sanitizer.js`.

---

## ⚡ 3. NGUYÊN TẮC CÔNG NGHỆ

- Sử dụng chuẩn **Native ES Modules** (`import` / `export`) trực tiếp trên trình duyệt hiện đại (`type="module"`), tuyệt đối không cài thêm các bundler nặng nề để đảm bảo deploy tức thì qua GitHub Pages.
- Luôn cập nhật [WORKLOG.md](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/docs/0.Log/WORKLOG.md) sau mỗi phiên làm việc.

---

## 📁 4. QUY TẮC THU GOM TÀI LIỆU BỔ SUNG (`docs/9.More/`)

- Thư mục gốc dự án chỉ được chứa **`README.md`** và **`AGENTS.md`**.
- Mọi tài liệu Markdown phát sinh trong quá trình phát triển (kế hoạch thực thi `implementation_plan.md`, báo cáo `walkthrough.md`, bản vẽ nháp, ghi chú kỹ thuật...) **BẮT BUỘC** phải được gom vào thư mục **`docs/9.More/`** theo skill `9-more-archiver`.
- File **`docs/9.More/README.md`** phải được tự động cập nhật để liệt kê, tóm tắt và dẫn link chi tiết đến từng tài liệu bên trong.

