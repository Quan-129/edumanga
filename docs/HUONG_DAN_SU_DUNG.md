# 📖 HƯỚNG DẪN SỬ DỤNG CHI TIẾT - EDUMANGA HUB
*Hệ thống Website Đọc Truyện Tranh Học Tập & Tự Động Xuất Bản Không Cần Code*

---

## 📑 MỤC LỤC
1. [Khởi Động Nhanh (Quick Start)](#1-khởi-động-nhanh-quick-start)
2. [Dành Cho Người Sáng Tác & Quản Trị (Zero-Code Content Creator)](#2-dành-cho-người-sáng-tác--quản-trị-zero-code-content-creator)
   - [2.1. Quy ước đặt tên thư mục & file](#21-quy-ước-đặt-tên-thư-mục--file)
   - [2.2. Cách thêm một Môn Học mới](#22-cách-thêm-một-môn-học-mới)
   - [2.3. Cách thêm một Chương Truyện mới](#23-cách-thêm-một-chương-truyện-mới)
   - [2.4. Cấu trúc chuẩn của file JSON kịch bản](#24-cấu-trúc-chuẩn-của-file-json-kịch-bản)
   - [2.5. Cơ chế Đồng bộ Tự động (Auto-Watcher) & Phím Tắt](#25-cơ-chế-đồng-bộ-tự-động-auto-watcher--phím-tắt)
3. [Dành Cho Độc Giả & Người Học (Reader & Student Guide)](#3-dành-cho-độc-giả--người-học-reader--student-guide)
   - [3.1. Khám phá & Quản lý Tủ Sách Cá Nhân](#31-khám-phá--quản-lý-tủ-sách-cá-nhân)
   - [3.2. Chế độ Đọc Đa Dạng (Webtoon & Trang Đơn)](#32-chế-độ-đọc-đa-dạng-webtoon--trang-đơn)
   - [3.3. Tính Năng Học Tập Tương Tác (Study Mode & Flashcard Quiz)](#33-tính-năng-học-tập-tương-tác-study-mode--flashcard-quiz)
   - [3.4. Xem Toàn Bộ Kịch Bản Thoại (Script Inspector)](#34-xem-toàn-bộ-kịch-bản-thoại-script-inspector)
   - [3.5. Bảng Phím Tắt Tiện Lợi (Cheat Sheet)](#35-bảng-phím-tắt-tiện-lợi-cheat-sheet)
4. [Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#4-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. Khởi Động Nhanh (Quick Start)

Chỉ với 1 dòng lệnh duy nhất trong thư mục dự án:

```bash
python scripts/dev_server.py
```

- Trình duyệt sẽ mở tại địa chỉ: **`http://localhost:8080/index.html`**
- Server sẽ tự động quét toàn bộ thư mục và khởi chạy trình giám sát file ngầm (**Auto-Watcher**).

---

## 2. Dành Cho Người Sáng Tác & Quản Trị (Zero-Code Content Creator)

### 2.1. Quy ước đặt tên thư mục & file

Hệ thống được thiết kế theo nguyên lý **File-based CMS**: Cấu trúc thư mục của bạn chính là cấu trúc hiển thị trên Web.

```text
Dự án manga/
├── 1. Nhập môn trí tuệ nhân tạo/      <-- [Số thứ tự]. [Tên Môn Học]
│   └── 1. Manga/
│       ├── Chương 1/
│       │   ├── Chuong_1_AI.json       <-- File kịch bản, ảnh base64, bóng thoại
│       │   └── Chuong_1_AI.pdf        <-- File PDF đọc/tải ngoại tuyến (Tùy chọn)
│       └── Chương 2/
│           ├── Chuong_2_AI.json
│           └── Chuong_2_AI.pdf
├── 2. Tư tưởng Hồ Chí Minh/
├── 3. N2/
└── 4. Pháp luật đại cương/
```

---

### 2.2. Cách thêm một Môn Học mới

1. Tạo thư mục mới ở thư mục gốc theo dạng: `5. Triết học Mác - Lênin` (hoặc bất kỳ tên môn học nào bạn muốn).
2. Tạo thư mục con `1. Manga/Chương 1/` bên trong.
3. Thả file `.json` hoặc `.pdf` vào đó.
4. **Không cần code thêm gì cả!** Trong vòng 2 giây, website sẽ tự động xuất hiện môn học mới trên Trang Chủ và Danh Mục Bộ Lọc.

---

### 2.3. Cách thêm một Chương Truyện mới

1. Trong thư mục môn học tương ứng, tạo thư mục con (ví dụ: `Chương 3`).
2. Thả file `Chương 3.json` (và `Chương 3.pdf` nếu có) vào.
3. Hệ thống sẽ tự bóc tách các trang truyện và đưa Chương 3 lên web.

---

### 2.4. Cấu trúc chuẩn của file JSON kịch bản

Hệ thống hỗ trợ đọc trực tiếp cấu trúc JSON từ công cụ tạo manga:

```json
{
  "name": "Chương 1: Tiêu đề chương",
  "author": "Tên tác giả / Nhóm dịch",
  "characters": [
    {
      "name": "Tên nhân vật",
      "role": "Vai trò trong truyện",
      "appearance": "Mô tả ngoại hình",
      "clothing": "Mô tả trang phục",
      "referenceBase64": "..." // Ảnh chân dung nhân vật (base64)
    }
  ],
  "pages": [
    {
      "base64": "...", // Ảnh trang truyện (base64)
      "dialogue": "PANEL 1: Minh nói gì...\nPANEL 2: Lan nói gì...",
      "overlays": [
        {
          "id": "b-1",
          "text": "Nội dung lời thoại hiển thị trên khung tranh",
          "x": 25.5,     // Tọa độ ngang (tính theo % từ 0 đến 100)
          "y": 20.0,     // Tọa độ dọc (tính theo % từ 0 đến 100)
          "fontSize": 14, // Cỡ chữ
          "width": 30     // Độ rộng tối đa của bóng thoại (%)
        }
      ]
    }
  ]
}
```

---

### 2.5. Cơ chế Đồng bộ Tự động (Auto-Watcher) & Phím Tắt

- **Tự động ngầm**: Mỗi khi bạn bấm `Ctrl + S` lưu file JSON/PDF trong máy, Auto-Watcher sẽ phát hiện và cập nhật sau **2.5 giây**.
- **Đồng bộ thủ công tức thì**:
  - Nhấp vào nút **<i class="fas fa-sync-alt"></i>** ở góc phải thanh Header.
  - Hoặc bấm tổ hợp phím **`Ctrl + Shift + S`** (hoặc `Cmd + Shift + S` trên Mac).
- **Công nghệ Incremental Cache**: Hệ thống lưu lại dấu vết file (`.cache_registry.json`). Những chương cũ không bị thay đổi sẽ được nạp từ bộ nhớ đệm chỉ trong **~0.49 giây**, tuyệt đối không gây giật lag máy tính.

---

## 3. Dành Cho Độc Giả & Người Học (Reader & Student Guide)

### 3.1. Khám phá & Quản lý Tủ Sách Cá Nhân
- **Tìm kiếm trực tiếp (Live Search)**: Gõ tên môn học, tác giả hoặc từ khóa vào thanh tìm kiếm ở đầu trang để nhận kết quả ngay tức thì.
- **Bộ lọc môn học (Pill Filters)**: Chọn nhanh môn `AI`, `Tư Tưởng HCM`, `Tiếng Nhật N2`, `Pháp Luật`.
- **Thanh Đọc Tiếp (Continue Reading)**: Website tự động ghi nhớ vị trí chương và số trang bạn đang đọc dở dang.
- **Tủ Sách Yêu Thích**:
  - Nhấn nút **"Lưu Vào Tủ Sách"** ở trang chi tiết truyện.
  - Bấm biểu tượng Bookmark **<i class="far fa-bookmark"></i>** ở đầu trang hoặc dưới thanh điều hướng di động để xem danh sách truyện đã lưu.

---

### 3.2. Chế độ Đọc Đa Dạng (Webtoon & Trang Đơn)
Trong giao diện đọc truyện (`reader.html`), bấm vào biểu tượng **Cài Đặt <i class="fas fa-cog"></i>** hoặc phím **`M`**:

| Chế độ đọc | Biểu tượng | Thiết bị tối ưu | Trải nghiệm |
| :--- | :---: | :--- | :--- |
| **Webtoon** | ↕️ | Điện thoại & Màn hình dọc | Cuộn dọc liên tục, vuốt ngón tay mượt mà. |
| **Trang Đơn** | 📄 | Tablet, Laptop & Desktop | Lật từng trang truyện chuẩn tỷ lệ Webtoon, hiển thị trọn vẹn từng khung hình. |

*Ngoài ra, bạn có thể chuyển đổi giữa 3 màu nền: **OLED Đen Tuyệt Đối**, **Dark Xanh Đậm**, hoặc **Sepia Ấm Áp** để chống mỏi mắt.*

---

### 3.3. Tính Năng Học Tập Tương Tác (Study Mode & Flashcard Quiz)
EduManga Hub được trang bị các công cụ học tập độc quyền:

1. **Hiển Thị Bong Bóng Thoại Manga (Mặc định)**:
   - Tất cả lời thoại, thuật ngữ chuyên ngành và từ vựng Kanji (kèm Furigana) được căn chỉnh chuẩn xác trên từng khung tranh.
   - Bấm phím **`B`** để Bật / Tắt nhanh bóng thoại nếu muốn ngắm tranh minh họa thuần túy.
2. **Chế Độ Đố Vui (Flashcard Quiz Mode)**:
   - Bật trong mục Cài Đặt (`Cài Đặt` -> `Chế độ đố vui`).
   - Lời thoại và đáp án sẽ được **làm mờ bí ẩn**.
   - Người học tự suy nghĩ câu trả lời hoặc nhớ lại từ vựng, sau đó **chạm nhẹ vào bóng thoại để giải mã đáp án**!

---

### 3.4. Xem Toàn Bộ Kịch Bản Thoại (Script Inspector)
- Nhấn vào nút **<i class="fas fa-comment-alt"></i>** trên thanh công cụ hoặc bấm phím **`S`**.
- Cửa sổ kịch bản toàn văn của trang hiện tại sẽ mở ra (`PANEL 1: Minh nói gì...`, `PANEL 2: Lan nói gì...`).
- Tích hợp nút **"Sao Chép Lời Thoại"** để bạn dễ dàng lưu từ vựng hoặc đưa vào Anki/Quizlet ôn bài.

---

### 3.5. Bảng Phím Tắt Tiện Lợi (Cheat Sheet)

| Phím tắt | Thao tác |
| :---: | :--- |
| `→` hoặc `PageDown` | Sang trang kế tiếp |
| `←` hoặc `PageUp` | Lùi về trang trước |
| `F` | Bật / Tắt chế độ Toàn màn hình (Fullscreen) |
| `S` | Mở cửa sổ Kịch bản lời thoại trang hiện tại |
| `B` | Ẩn / Hiện bong bóng thoại nhân vật |
| `M` | Ẩn / Hiện thanh công cụ điều hướng |
| `Ctrl + Shift + S` | Tự động quét & đồng bộ dữ liệu mới từ thư mục |

---

## 4. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### Q1: Tôi mới thêm file JSON vào thư mục nhưng trên Web chưa thấy xuất hiện?
* **Cách 1**: Nhấn nút **<i class="fas fa-sync-alt"></i>** ở góc phải Header hoặc bấm `Ctrl + Shift + S`.
* **Cách 2**: Kiểm tra xem file JSON có đúng định dạng chuẩn không (chứa `pages` hoặc `characters`).
* **Cách 3**: Đảm bảo terminal đang chạy lệnh `python scripts/dev_server.py`.

### Q2: Tôi muốn làm mới lại toàn bộ ảnh từ đầu thì làm thế nào?
* Bạn chỉ cần xóa file đệm `data/.cache_registry.json`. Lần quét tiếp theo hệ thống sẽ bóc tách lại mới 100%.

### Q3: Muốn tải bản PDF về in ấn hoặc xem offline?
* Vào trang **Chi Tiết Bộ Truyện** (`detail.html?id=...`), cạnh mỗi chương có nút đỏ **"Tải PDF"** để tải trực tiếp file PDF chất lượng cao.

---
*EduManga Hub - Nền tảng truyện tranh giáo dục đa phương tiện.*
