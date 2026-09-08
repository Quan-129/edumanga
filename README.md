# 📚 EduManga Hub - Nền Tảng Đọc Manga Học Tập & Chuyên Đề Đa Thiết Bị

> **EduManga Hub** là giải pháp website đọc truyện tranh học tập hiện đại, mượt mà và tối ưu hóa trải nghiệm tương tác trên mọi kích thước màn hình (Mobile, Tablet, Desktop).

---

## 🌟 Tính Năng Nổi Bật

- 📱 **Trải Nghiệm Responsive Cao Cấp**: Giao diện OLED/Dark Mode với hiệu ứng Glassmorphism sắc nét, thân thiện với màn hình cảm ứng di động.
- 📖 **Trình Đọc Manga Đa Chế Độ (Manga Reader Engine)**:
  - **Webtoon (Cuộn dọc)**: Vuốt đọc liên tục mượt mà, tự động nạp ảnh thông minh (Lazy-loading).
  - **Trang Đơn (Single Page)**: Hiển thị từng trang chuẩn tỷ lệ tự nhiên, lật trang nhanh chóng bằng nút bấm hoặc phím tắt.
  - **Cử chỉ thông minh**: Chạm cạnh trái/phải để lật trang, chạm giữa để ẩn/hiện thanh công cụ.
- 💡 **Chế Độ Học Tập Tương Tác (Interactive Study Mode)**:
  - **Lớp phủ bong bóng kiến thức**: Hiển thị ghi chú giải thích ngữ pháp, thuật toán trực tiếp trên khung tranh.
  - **Đố vui / Flashcard Quiz**: Tự động làm mờ nội dung thoại, click để khám phá câu trả lời.
- 📂 **Kho Dữ Liệu 4 Môn Học Thực Tế**:
  - `Tiếng Nhật N2`: Chương 1 & Chương 2 (kèm dàn nhân vật Minh, Khoa, Lan...).
  - `Tư Tưởng Hồ Chí Minh`: Chương 1 Phần 1, Phần 2 và Bản Gộp Full (kèm dàn nhân vật lịch sử & hiện đại).
  - `Nhập Môn AI` & `Pháp Luật Đại Cương`: Kịch bản mẫu và khung dữ liệu tương tác.
- 🔖 **Tủ Sách & Lịch Sử Tự Động**: Tự động lưu tiến độ đọc và quản lý danh sách yêu thích qua `localStorage`.
- 📥 **Tải File PDF Gốc**: Tích hợp nút tải trực tiếp file PDF chất lượng cao cho từng chương học.

---

## 🛠️ Công Nghệ Sử Dụng

| Hạng mục | Công nghệ | Mục đích |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, Modern CSS3 (CSS Variables, Glassmorphism, Grid/Flexbox) | Giao diện OLED Dark siêu nhẹ, tải tức thì |
| **Icons & Typography** | Font Awesome 6, Google Fonts (Be Vietnam Pro, Outfit) | Thiết kế sang trọng, hỗ trợ hiển thị tiếng Việt hoàn hảo |
| **Logic & Engine** | Vanilla JavaScript (ES6+, Intersection Observer, Web Storage API) | Không phụ thuộc framework cồng kềnh, chạy cực mượt |
| **Data & Pipeline** | Python (Pillow, JSON, Base64) | Tự động bóc tách và tối ưu hóa tài nguyên từ kịch bản gốc |

---

## 📁 Cấu Trúc Thư Mục

```text
Dự án manga/
├── index.html                  # Giao diện Trang chủ (Danh mục 4 môn, Tìm kiếm, Tủ sách)
├── detail.html                 # Trang Chi tiết bộ truyện (Dàn nhân vật, Danh sách chương)
├── reader.html                 # Trình đọc Manga đa chế độ & Chế độ học tập
├── css/
│   ├── style.css               # Design system, CSS variables, Dark Mode OLED, Glassmorphism
│   ├── components.css          # Thẻ Manga Card, Character Roster, Search Dropdown, Modals
│   └── reader.css              # Giao diện Reader Engine, Webtoon/Flip modes, Bubble Overlays
├── js/
│   ├── app.js                  # Xử lý Trang chủ, lọc môn học, Live search, Tủ sách
│   ├── detail.js               # Xử lý hiển thị thông tin truyện, popup nhân vật, tải PDF
│   ├── reader.js               # Engine đọc truyện, cử chỉ cảm ứng, phím tắt, lưu lịch sử
│   └── study-mode.js           # Engine lớp phủ kiến thức & chế độ đố vui Flashcard
├── data/
│   └── manga.json              # File manifest dữ liệu tập trung của toàn bộ 4 bộ môn
├── assets/
│   ├── covers/                 # Ảnh bìa môn học
│   ├── characters/             # Ảnh chân dung dàn nhân vật
│   └── chapters/               # Các trang ảnh truyện đã được tối ưu hóa
├── scripts/
│   ├── dev_server.py           # Server chính tích hợp Auto-Watcher & API /api/sync
│   ├── auto_scanner.py         # Bộ quét động & cache mtime (< 0.5s)
│   └── generate_missing_covers.py # Tạo ảnh bìa và avatar tự động
└── docs/
    └── 0.Log/
        └── WORKLOG.md          # Nhật ký phát triển và ghi chú kỹ thuật
```

---

## ⚡ Hệ Thống Tự Động Xuất Bản (Zero-Code Content Pipeline)

Bạn **không cần viết thêm bất kỳ dòng code nào** khi thêm truyện/chương mới:

1. Thả file `.json` hoặc `.pdf` vào bất kỳ thư mục môn học nào (hoặc tạo thư mục môn mới như `5. Triết học Mác - Lênin/...`).
2. Server ngầm (Auto-Watcher) sẽ phát hiện thay đổi trong **2 giây** và tự động cập nhật lên Web.
3. Hoặc trên trình duyệt, nhấn nút `<i class="fas fa-sync-alt"></i>` hoặc phím tắt **`Ctrl + Shift + S`** để đồng bộ ngay tức thì!

---

## 🚀 Hướng Dẫn Khởi Chạy

```bash
# Khởi động server với tính năng Tự Động Lắng Nghe & Đồng Bộ:
python scripts/dev_server.py
```

Mở trình duyệt và truy cập: **`http://localhost:8080/index.html`**

