
# 📓 NHẬT KÝ CÔNG VIỆC (WORKLOG) - DỰ ÁN MANGA HỌC TẬP (EDUMANGA HUB)

Nơi ghi lại toàn bộ tiến trình phát triển, các quyết định kiến trúc kỹ thuật (ADR) và danh sách việc cần làm tiếp theo cho dự án EduManga Hub.

---

## [2026-09-12 06:40] - Bước 4 (Nghe Điền): Ẩn Đáp Án Ở Placeholder, Thể Hiện Ô Ký Tự Romaji & Chỉ Show Kanji Kèm Furigana Phía Trên Khi Check Đúng

### 🎯 Mục tiêu
- Xử lý phản hồi của người dùng: *"nó đang hiện luôn đáp án ở bước 4 và ở trên kia kí tự tôi muốn thể hiện dạng romaji đi check đúng thì mới show kanji kèm furigana phía trên bạn hiểu không"*.
- **Vấn đề trước đây**:
  1. Placeholder ô nhập liệu lộ liễu từ mục tiêu: `✍️ Nghe và gõ từ bị khuyết (Ví dụ: jinsei)...`.
  2. Số lượng ô trống trong câu cloze tính theo số âm tiết Hiragana (`じんせい` = 4 dấu chấm `[ • • • • ]`), trong khi người học gõ phím dạng Romaji bằng bàn phím thông thường (6 chữ cái `jinsei`), dẫn đến việc số lượng ô không khớp với số phím gõ.
  3. Khi check đúng, từ vựng và furigana hiển thị ngang hàng nhau trong ngoặc vuông (`人生 【じんせい】`) thay vì hiển thị Furigana nằm ở ngay phía trên Kanji.
- **Giải pháp**:
  1. **Ẩn hoàn toàn đáp án ở Placeholder**:
     - Cập nhật placeholder thành: `✍️ Nghe và gõ từ bị khuyết bằng Romaji hoặc Hiragana...` (tuyệt đối không lộ từ ví dụ).
     - Rút gọn gợi ý phím tắt thành: `Phím Space: Nghe lại • Enter: Kiểm tra • Tab: Gợi ý`.
  2. **Thể hiện ô ký tự theo chuẩn Romaji**:
     - Tính số ô trống dựa trên độ dài chuỗi Romaji mục tiêu (`targetRomaji.length`, ví dụ `jinsei` có 6 ô ký tự).
     - Trạng thái chưa gõ: hiển thị dấu gạch dưới `[ _ ][ _ ][ _ ][ _ ][ _ ][ _ ]`.
     - Trạng thái gõ phím thời gian thực: người học gõ ký tự Romaji nào thì ký tự đó lập tức điền vào ô tương ứng (`filled`) với hiệu ứng scale nổi bật.
  3. **Chỉ hiển thị Kanji kèm Furigana phía trên khi check đúng**:
     - Trước khi check đúng: chỉ hiển thị nhóm ô Romaji.
     - Sau khi người học bấm Kiểm tra (hoặc Enter) và kết quả chính xác: nhóm ô biến thành khối Ruby căn dọc (`.cloze-target-ruby`), trong đó Furigana Hiragana (`じんせい`) màu vàng neon nằm **ngay phía trên**, và chữ Kanji (`人生`) màu xanh ngọc bích nằm ở phía dưới với cỡ chữ lớn 2.3rem.
     - Tăng độ trễ chuyển câu lên 1400ms để người học vừa nghe phát âm cả câu vừa kịp quan sát chữ Kanji và Furigana.
     - Nâng cấp `revealDictationAnswer()` để nạp Romaji cho người học khi xem gợi ý.

### ✅ Công việc đã hoàn thành
- **[Logic Bước 4 Nghe Điền Romaji & Ruby Furigana] ([`js/mimikara-practice-service.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-practice-service.js))**:
  - `renderStep4Dictation()`: tính số ô theo Romaji, ẩn đáp án ở placeholder, render ruby furigana trên Kanji khi `dictationState === 'correct'`.
  - `handleDictationInput()`: cập nhật ký tự Romaji live vào các ô `cloze-slot-char`.
  - `checkDictationAnswer()`: tăng transition delay lên 1400ms.
- **[CSS Furigana Trên Kanji & Ô Ký Tự Romaji] ([`css/mimikara-practice.css`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/css/mimikara-practice.css))**:
  - Thiết kế `.cloze-target-ruby` với `flex-direction: column`, `.cloze-target-furigana` (order: 1) ở trên, `.cloze-target-term` (order: 2) ở dưới.
  - Định dạng `.cloze-slot-char.empty` và `.cloze-slot-char.filled` dạng Romaji monospace.
- **[Nâng Cache-Buster lên v=4.2] ([`index.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/index.html), [`detail.html`](file:///g:/My%20Drive/hk261/Dự%20án manga/detail.html), [`reader.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/reader.html))**: Nâng cache buster lên `?v=4.2`.

---

## [2026-09-12 06:25] - Tinh Chỉnh Thời Điểm Phát Audio: Bước 2 Chỉ Phát Khi Ghép Đúng Cặp, Bước 3 Chỉ Phát Sau Khi Bấm Enter

### 🎯 Mục tiêu
- Đáp ứng yêu cầu người dùng: "ở bước 2 sau khi chọn 1 cặp tương ứng mới phát audio tương ứng đó, bước 3 khi nào gõ xong bấm enter mới phát audio".
- **Vấn đề trước đây**:
  - Ở Bước 2 (Ghép cặp): Ngay khi click vào 1 thẻ ở cột trái, hệ thống đã vội phát âm thanh từ vựng, làm mất tính hồi hộp thử thách ghép cặp.
  - Ở Bước 3 (Gõ từ): Khi vừa nạp câu hỏi, hệ thống tự động phát âm thanh từ vựng ngay lập tức, khiến người học nghe thấy trước khi tự suy nghĩ và gõ đáp án.
- **Giải pháp**:
  1. **Bước 2 (Ghép cặp 5x5)**:
     - Gỡ bỏ lệnh `this.speak(card.term)` khi người học mới chỉ click chọn 1 thẻ đơn lẻ trong `selectMatchCard`.
     - Chỉ kích hoạt `this.speak(left.term)` khi 2 thẻ được chọn ghép chính xác thành một cặp tương ứng trong `checkMatchingPair()`.
  2. **Bước 3 (Gõ phản xạ 2 chiều)**:
     - Gỡ bỏ lệnh tự động phát audio trong `renderStep3Typing()` khi vừa nạp câu hỏi.
     - Chỉ phát âm thanh `this.speak(q.word.term)` khi người học gõ xong và nhấn phím **Enter** (hoặc bấm nút "Kiểm Tra") trong `checkTypingAnswer()`.

### ✅ Công việc đã hoàn thành
- **[Logic Kích Hoạt Audio Chuẩn Xác] ([`js/mimikara-practice-service.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-practice-service.js))**:
  - Chỉnh sửa `selectMatchCard()`: không phát âm khi click thẻ đơn lẻ.
  - Chỉnh sửa `renderStep3Typing()`: không phát âm khi nạp câu.
  - Chỉnh sửa `checkTypingAnswer()`: phát âm từ vựng ngay khi nhấn Enter kiểm tra câu trả lời.
- **[Nâng Cache-Buster lên v=4.1] ([`index.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/index.html), [`detail.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/detail.html), [`reader.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/reader.html))**: Nâng cache buster lên `?v=4.1`.

---

## [2026-09-12 00:20] - Tối Ưu Triệt Để Responsive Co Giãn Tràn Viền Toàn Màn Hình (2K / 4K / 1080p Ultra-Wide)

### 🎯 Mục tiêu
- Xử lý vấn đề người học phản hồi: "nó đang bị kiểu như vầy chưa ứng với toàn màn hình nè" (kèm ảnh chụp màn hình 2560x1330).
- **Nguyên nhân**: Mặc dù khung modal đã mở rộng 100vw, nhưng các khối nội dung bên trong vẫn bị kẹp cứng ở `max-width: 840px` và chiều cao cố định `min-height: 540px`, dẫn tới việc trên màn hình lớn 2K/4K, thẻ Flashcard chỉ chiếm ~32% chiều rộng và ~40% chiều cao, để lại khoảng trống màu đen khổng lồ xung quanh.
- **Giải pháp**:
  1. **Bước 1 (Flashcard 3D)**: Mở rộng `max-width: min(1200px, 92vw)` và chiều cao `calc(100vh - 270px)` (tối đa 800px). Font chữ Kanji mở rộng linh hoạt theo `clamp(5.2rem, 11vh, 8.2rem)`, Furigana `clamp(2.2rem, 4.5vh, 3.2rem)`, Mindmap chiết tự mở rộng 960px.
  2. **Bước 2 (Ghép Cặp 5x5)**: Mở rộng `max-width: min(1360px, 94vw)`, thẻ ghép cao 110px, chữ Kanji 2.6rem dễ bấm.
  3. **Bước 3 (Gõ Từ)**: Mở rộng `max-width: min(1200px, 92vw)`, chữ Kanji đề bài `clamp(4.2rem, 8.5vh, 6.5rem)`.
  4. **Bước 4 (Nghe Điền)**: Mở rộng `max-width: min(1260px, 92vw)`, cỡ chữ câu nghe điền 2.6rem.
  5. **Bước 5 (Ninja Leo Tháp)**: Mở rộng `max-width: min(1400px, 95vw)` và chiều cao đấu trường tới 840px.

### ✅ Công việc đã hoàn thành
- **[CSS Co Giãn Màn Hình Lớn] ([`css/mimikara-practice.css`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/css/mimikara-practice.css))**: Cập nhật toàn bộ các quy tắc kích thước theo tỉ lệ `vh` và `vw` với `clamp()`, xóa bỏ giới hạn cứng 840px.
- **[Nâng Cache-Buster lên v=4.0] ([`index.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/index.html), [`detail.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/detail.html), [`reader.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/reader.html))**: Nâng cache buster lên `?v=4.0`.

---

## [2026-09-12 00:05] - Triển Khai Chế Độ Toàn Màn Hình (Fullscreen Mode) Cho Phiên Học & Minigame Leo Tháp

### 🎯 Mục tiêu
- Đáp ứng yêu cầu người dùng: "tôi muốn phiên học ở chế độ toàn màn hình cho dễ nhìn".
- Trước đây: Cửa sổ modal học từ vựng bị giới hạn `max-width: 1120px` với viền đen bao quanh; khu vực minigame Leo Tháp bị bóp nghẹt ở `max-width: 860px` và chiều cao 520px, khiến giao diện trên màn hình lớn (1080p, 2K) có nhiều khoảng trống đen lãng phí, chữ và cành cây bị thu nhỏ.
- **Giải pháp**:
  1. Tự động chuyển modal sang **Chế độ Toàn Màn Hình (`.is-fullscreen`)** ngay khi người dùng bắt đầu bất kỳ phiên học nào (`startChunkPractice`) hoặc chế độ Leo Tháp Vô Tận (`startEndlessClimbing`).
  2. Bổ sung nút **Toàn màn hình / Thu nhỏ** (`#mimikaraBtnFullscreen`) cạnh nút đóng `X` trên Header của Modal, hỗ trợ bật/tắt linh hoạt và tích hợp HTML5 Fullscreen API (`requestFullscreen()`).
  3. Mở rộng không gian hiển thị:
     - Toàn bộ khung modal chiếm trọn 100vw x 100vh không viền đen.
     - Minigame Ninja Leo Tháp được mở rộng lên `max-width: 1180px`, chiều cao mở rộng tới `calc(100vh - 210px)` (tối đa 760px).
     - Canvas tự động co giãn theo tỉ lệ chuẩn `820 / 540` với `object-fit: contain`, giữ trọn độ sắc nét, nhân vật và cành cây lớn hơn ~35%, cực kỳ đã mắt và dễ quan sát.
     - Các bước Flashcard, Ghép cặp, Gõ từ, Nghe điền đều được mở rộng diện tích hiển thị thoáng đãng.

### ✅ Công việc đã hoàn thành
- **[CSS Chế Độ Toàn Màn Hình] ([`css/mimikara-practice.css`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/css/mimikara-practice.css))**:
  - Thêm class `.is-fullscreen` cho modal container (100vw x 100vh, 0 padding, 0 border-radius).
  - Tối ưu kích thước mở rộng cho `.mimikara-climber-wrapper` (1180px) và `.mimikara-climber-arena` (cao tới 760px).
  - Thêm styles cho nút `.mimikara-btn-fullscreen`.
- **[Logic Bật/Tắt & Đồng Bộ API Fullscreen] ([`js/mimikara-practice-service.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-practice-service.js))**:
  - Thêm nút Fullscreen vào `ensureModalDOM()`.
  - Triển khai `toggleFullscreen(forceState)` và `updateFullscreenButtonIcon()`.
  - Tự động kích hoạt fullscreen khi vào `startChunkPractice` và `startEndlessClimbing`.
  - Tự động thu nhỏ về modal card khi bấm "Dừng phiên" hoặc đóng modal.
- **[Đáp Ứng Tỉ Lệ Co Giãn Canvas] ([`js/mimikara-climber-engine.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-climber-engine.js))**:
  - Cập nhật wrapper canvas sang class `.mimikara-climber-arena` và thiết lập `aspect-ratio: 820 / 540; object-fit: contain;`.
- **[Nâng Cache-Buster lên v=3.9] ([`index.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/index.html), [`detail.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/detail.html), [`reader.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/reader.html))**:
  - Nâng cache buster cho cả CSS và script bundle lên `?v=3.9`.

---

## [2026-09-11 23:40] - Sửa Xung Đột Phím Gõ: Loại Bỏ Phím 'R', Chỉ Dùng Phím 'Space' Để Nghe Lại Âm Thanh Trong Minigame Leo Tháp

### 🎯 Mục tiêu
- Khắc phục lỗi xung đột phím (key collision): Trước đây minigame dùng cả phím `R` và `Space` để nghe lại âm thanh. Khi gặp các từ vựng chứa chữ cái `r` trong Romaji (ví dụ `kirei`, `toru`, `renshuu`, `shinseki`...), việc bấm phím `r` để gõ chữ bị engine chặn lại và chuyển thành lệnh phát âm thanh.
- **Giải pháp**:
  1. Loại bỏ hoàn toàn phím tắt `KeyR` khỏi sự kiện `keydown`.
  2. Chỉ dùng duy nhất phím `Space` để nghe lại phát âm thanh (không bao giờ xung đột vì Romaji chỉ gồm các chữ cái `a-z` viết liền không dấu cách).
  3. Cập nhật nhãn hướng dẫn phím bấm trên HUD banner (`[Phím Space nghe lại]`) và tip bàn phím dưới đáy canvas.

### ✅ Công việc đã hoàn thành
- **[Sửa Logic Bắt Phím] ([`js/mimikara-climber-engine.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-climber-engine.js))**:
  - `handleKeyDown`: Chỉ kiểm tra `e.code === 'Space'` để kích hoạt `this.replayCurrentAudio()`.
  - Cập nhật tooltip nút loa, tip góc canvas và thanh gợi ý HUD về `[Phím Space nghe lại]`.
- **[Nâng Cache-Buster lên v=3.8] ([`index.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/index.html), [`detail.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/detail.html), [`reader.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/reader.html))**:
  - Đảm bảo trình duyệt tải ngay logic mới nhất.

---

## [2026-09-11 23:30] - Tối Ưu UX Chế Độ Leo Tháp: Ẩn Đáp Án Romaji (Chỉ Hiện Gạch Dưới _ Theo Số Ký Tự) & Ẩn Chữ Kanji Ở Thử Thách Audio

### 🎯 Mục tiêu
- Khắc phục tình trạng "lộ đáp án" trước khi gõ trong minigame Ninja Leo Tháp:
  - Trước đây: Các ô Romaji hiển thị toàn bộ chữ cái (ví dụ `j i n s e i`) trước khi người học bắt đầu gõ.
  - Thử thách Audio: Thẻ câu hỏi và thanh HUD hiển thị cả icon loa lẫn chữ Kanji `🔊 人生`, khiến người học nhìn thấy chữ thay vì thuần luyện nghe.
- **Yêu cầu mới**:
  1. Các ô ký tự Romaji ban đầu chỉ hiển thị dấu gạch dưới `_` để người học nhận biết độ dài/số ký tự từ vựng.
  2. Chỉ khi người học gõ đúng ký tự (`i < inputIndex`), ô đó mới chuyển sang nền xanh lá rực rỡ và hiển thị ký tự đã gõ.
  3. Nếu gõ sai, ô hiện tại nháy đỏ và hiển thị ký tự vừa gõ sai để cảnh báo.
  4. Ở các cành cây phía trên (chưa tới lượt), hiển thị chuỗi gạch dưới `_ _ _ _ _` thay vì độ dài thô.
  5. Ở thử thách Audio: Thẻ bài chỉ hiển thị duy nhất biểu tượng loa `🔊` cỡ lớn màu cyan; thanh gợi ý HUD hiển thị `Mục tiêu: 🔊 Nghe âm thanh [Phím R hoặc Space nghe lại]`, tuyệt đối không để lộ từ Kanji.

### ✅ Công việc đã hoàn thành
- **[Ẩn Đáp Án & Hiển Thị Động Ký Tự Romaji] ([`js/mimikara-climber-engine.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-climber-engine.js))**:
  - Cập nhật hàm `renderTargetRomajiBoxes`: Mặc định vẽ `_` với màu chữ mờ. Khi gõ đúng hiển thị ký tự với `#16a34a`. Khi gõ sai hiển thị ký tự sai với `#b91c1c`.
  - Cập nhật `setupBranches`: Với `type === 'audio'`, `display` chỉ còn duy nhất icon `'🔊'`.
  - Cập nhật `renderBranches`: Thẻ Audio chỉ vẽ biểu tượng loa 22px; cành trên hiển thị `_ _ _ _ _`.
  - Cập nhật `updateHUD`: Giữ bí mật từ vựng cho cành Audio.
- **[Nâng Cache-Buster lên v=3.7] ([`index.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/index.html), [`detail.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/detail.html), [`reader.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/reader.html))**:
  - Nâng cache buster lên `?v=3.7` để trình duyệt tự động nạp code mới ngay lập tức.
- **[Kiểm Thử Trực Tiếp Trên Trình Duyệt]**:
  - Đã xác thực trên Canvas: Lúc bắt đầu cành 1 chỉ hiện `_ _ _ _ _` và `🔊 NGHE 🔊`. Khi gõ phím `f` ký tự đầu tiên chuyển xanh `f`, các ô sau vẫn là `_ _ _ _`.

---

## [2026-09-11 23:10] - Triển Khai Chế Độ 6: Minigame Ninja Leo Tháp 15 Cành (Marathon Shuffle) & Đấu Trường Vô Tận

### 🎯 Mục tiêu
- Hiện thực hóa cơ chế game lấy cảm hứng từ *Keyboard Jump* (`gameplay.mp4`):
  - Biến phần kết thúc phiên học 5 từ thành bài kiểm tra "Boss Fight" leo tháp **15 cành cây Marathon Shuffle** (5 Kanji + 5 Nghĩa tiếng Việt + 5 Audio phát âm).
  - Vượt qua 15 cành cây mới tính là hoàn thành phiên học; nếu hết 5 tim cho phép người học chọn "Leo lại tháp (hồi 5 tim)" hoặc "Về bước 1 ôn lại" (Hướng 1).
  - Thêm chế độ **Leo Tháp Vô Tận (Endless Climber)** cho toàn bộ Unit để thi đấu điểm kỷ lục.

### ✅ Công việc đã hoàn thành
- **[Động Cơ Game Canvas 2D Độc Lập] ([`js/mimikara-climber-engine.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-climber-engine.js))**:
  - Xây dựng lớp `MimikaraClimberGame` chạy 60 FPS Canvas:
    - Bố cục 15 cành cây gỗ thông zigzag với mảng tuyết, lá kim và các thẻ nhiệm vụ trực quan.
    - Thuật toán xáo trộn ngẫu nhiên thông minh (Smart Shuffle) đảm bảo không trùng từ liền kề.
    - Vi chuyển động gõ: Gõ đúng nhích bước rướn người + mặt cười híp `^ ^`; gõ sai khựng giật lại + ô đỏ + mặt hoảng `• _ •`.
    - Cú nhảy parabol uốn cong, tiếp đất bung 2 cụm khói mây trắng (*dust clouds*) + camera cuộn dọc mượt mà.
    - Âm thanh Web Audio API tổng hợp offline (tiếng phím cơ, tiếng nhảy whoosh, tiếng tiếp đất, tiếng nhạc chiến thắng) + tích hợp giọng đọc Web Speech API cho cành Audio.
    - Hệ thống tính điểm Combo bội số 312 (`+624`, `+1248`, `+1560`).
    - Modal Game Over khi hết 5 tim: Nút *Leo lại tháp ngay* hoặc *Về bước 1 ôn lại*.
- **[Cấu Hình Bật/Tắt & Tích Hợp Stepper Funnel] ([`js/mimikara-config.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-config.js), [`js/mimikara-practice-service.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-practice-service.js))**:
  - Thêm `climbing: true` vào `modes` và `definitions`.
  - Kết nối `startStep6Climbing()` và `startEndlessClimbing(unitId)`.
  - Thêm Banner Đấu Trường Leo Tháp Vô Tận tại giao diện danh sách phiên Unit.
- **[Nâng Cache-Buster lên v=3.6] ([`index.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/index.html), [`detail.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/detail.html), [`reader.html`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/reader.html))**:
  - Nhúng file `js/mimikara-climber-engine.js?v=3.6` và nâng phiên bản toàn bộ bundle.
- **[Kiểm Thử Thực Tế Trình Duyệt]**:
  - Đã kiểm tra trực tiếp trên trình duyệt qua subagent: Canvas arena hiển thị mượt mà, gõ Romaji nhân vật rướn bước, nhảy parabol tiếp đất bung khói, camera cuộn chính xác từ cành 0 ➔ 1 ➔ 2.

---

## [2026-09-11 22:20] - Xử Lý Triệt Để Bộ Nhớ Đệm Trình Duyệt (Browser Cache Buster v3.5) & Đồng Bộ Tiêu Đề Modal Động

### 🎯 Mục tiêu
- Khắc phục hiện tượng người dùng đã cấu hình `translation: false` trong [`js/mimikara-config.js`](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-config.js) nhưng khi tải lại trang ở trình duyệt cá nhân vẫn thấy Bước 5 hoặc tiêu đề cũ.
- Nguyên nhân: Trình duyệt (Chrome/Edge) giữ lại file `js/mimikara-config.js?v=3.4` trong Disk/Memory Cache, cùng với việc DOM modal giữ lại tiêu đề cũ nếu không được cập nhật động khi mở lại.

### ✅ Công việc đã hoàn thành
- **[Tăng Cache-Busting Version lên v=3.5] ([index.html](file:///g:/My%20Drive/hk261/Dự%20án%20manga/index.html), [detail.html](file:///g:/My%20Drive/hk261/Dự%20án%20manga/detail.html), [reader.html](file:///g:/My%20Drive/hk261/Dự%20án%20manga/reader.html))**:
  - Cập nhật toàn bộ các thẻ nạp script lên query string `?v=3.5` để ép trình duyệt tải ngay file cấu hình và service mới nhất khi bấm F5.
- **[Hàm Cập Nhật Phụ Đề Động & Hỗ Trợ LocalStorage Override] ([js/mimikara-practice-service.js](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-practice-service.js))**:
  - Thêm phương thức `updateHeaderSubtitle()` và gọi mỗi khi `openModal()` hoặc `ensureModalDOM()`, đảm bảo dòng chữ `Học từ vựng N bước...` luôn được làm mới tức thì theo danh sách bước đang bật.
  - Cho phép `getActiveSteps()` đọc thêm từ `localStorage.getItem('edumanga_mimikara_config')` (nếu có ghi đè từ DevTools).
- **[Thêm Hàm Tiện Ích Trực Tiếp Trên Console] ([js/mimikara-config.js](file:///g:/My%20Drive/hk261/Dự%20án%20manga/js/mimikara-config.js))**:
  - Cung cấp hàm `window.setMimikaraMode('translation', false/true)` để người dùng có thể test bật/tắt ngay lập tức từ cửa sổ Console mà không cần tải lại trang.
- **[Kiểm Thử Thực Tế Trình Duyệt]**:
  - Xác nhận trên trình duyệt: Khi `translation: false`, tiêu đề phụ hiển thị chuẩn xác `Học từ vựng 4 bước: Flashcard ➔ Ghép Cặp ➔ Gõ Từ ➔ Nghe Điền` và thanh Stepper chỉ hiển thị đúng 4 pills `1..4`.

---

## [2026-09-11 22:00] - Triển Khai File Cấu Hình Bật/Tắt Chế Độ Học & Dynamic Stepper Funnel Tự Động Co Giãn Đôn Bước

### 🎯 Mục tiêu
- Tạo file cấu hình độc lập [`js/mimikara-config.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-config.js>) cho phép người dùng bật/tắt (on/off) 5 chế độ học linh hoạt theo nhu cầu cá nhân.
- Xây dựng cơ chế **Dynamic Stepper Funnel**: Khi tắt bất kỳ chế độ nào (ví dụ tắt Chế độ 3: `typing: false`), toàn bộ giao diện thanh Stepper, số thứ tự các bước và luồng học sẽ tự động **co lại và đôn lên liền mạch** (từ `1..5` thành `1..4` gồm Flashcard ➔ Ghép Cặp ➔ Nghe Điền ➔ Luyện Dịch), không bao giờ bị khuyết hổng hay ngắt quãng.

### ✅ Công việc đã hoàn thành
- **[Tạo File Cấu Hình Trực Quan] ([`js/mimikara-config.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-config.js>))**:
  - Định nghĩa biến toàn cục `window.MIMIKARA_CONFIG` gồm bảng công tắc `modes` (`flashcard`, `matching`, `typing`, `dictation`, `translation`) và danh mục `definitions` chứa tên, icon và mô tả của từng bước.
- **[Engine Co Giãn & Đôn Số Thứ Tự Động] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Thêm các phương thức lõi: `getActiveSteps()`, `startFirstActiveStep()`, `goToStepById(stepId)`, `startNextActiveStep(currentStepId)`, `getNextActiveStepInfo(currentStepId)`.
  - Tự động tính toán lại số bước hiển thị (`stepNumber = 1..N`) và nhãn nút chuyển tiếp (ví dụ: `🎉 Xuất Sắc! Sang Bước 3: Nghe Điền ➔` khi Bước 3 cũ bị tắt).
  - Khởi động phiên học từ bước đầu tiên đang BẬT thay vì mặc định Flashcard.
  - Tự động bỏ qua các bước tắt và chuyển thẳng sang bước tiếp theo đang bật; khi hoàn thành bước cuối cùng thì kích hoạt màn hình Victory.
  - Cập nhật phụ đề tiêu đề modal và màn hình Victory phản ánh chính xác số lượng và danh sách các bước đang bật.
- **[Cập Nhật Cache Buster v3.4 & Nhúng Script] ([`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>), [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>), [`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>))**:
  - Nâng chuỗi phiên bản query lên `?v=3.4` và nhúng `js/mimikara-config.js` ở đầu danh sách nạp dữ liệu.
- **[Kiểm Thử Thực Tế Trình Duyệt]**:
  - Đã kiểm tra cả 2 trường hợp:
    1. Đầy đủ 5 bước: Stepper hiển thị `Bước 1: Flashcard ➔ Bước 2: Ghép Cặp ➔ Bước 3: Gõ Từ ➔ Bước 4: Nghe Điền ➔ Bước 5: Luyện Dịch`.
    2. Tắt Bước 3 (`typing: false`): Stepper tự động đôn lên thành 4 bước `1. Flashcard ➔ 2. Ghép Cặp ➔ 3. Nghe Điền ➔ 4. Luyện Dịch`. Xong Ghép Cặp chuyển thẳng qua Nghe Điền thành công mỹ mãn.

---

## [2026-09-11 15:05] - Khắc Phục Lỗi Câu Ngắn & Lồng Hết Vào 1 Khối Ở Bước 5 (Offline JS Bundle & Smart Chunk Splitter)

### 🎯 Mục tiêu
- Xử lý triệt để phản hồi lỗi từ người dùng: Ở Bước 5, một số câu (như câu STT #5: `夫婦`) bị rơi về câu ví dụ ngắn sách giáo khoa (`愛情に満ちた夫婦。`) và dồn toàn bộ nội dung dịch vào 1 khối duy nhất `[1] Vợ chồng tràn đầy tình yêu thương.`.
- Đảm bảo dữ liệu câu phức N2 và các khối phân mảnh luôn nạp được 100% trên cả giao thức `file:///` (mở trực tiếp không qua web server) lẫn `http://localhost:8080`.

### ✅ Công việc đã hoàn thành
- **[Đóng Gói Dữ Liệu Offline JavaScript Bundle] ([`data/mimikara_n2_translations.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/data/mimikara_n2_translations.js>), [`data/mimikara_n2_units.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/data/mimikara_n2_units.js>), [`data/kanji_radicals_n2.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/data/kanji_radicals_n2.js>))**:
  - Chuyển đổi toàn bộ các file JSON sang biến JS toàn cục (`window.MIMIKARA_N2_TRANSLATIONS`, `window.MIMIKARA_N2_UNITS`, `window.MIMIKARA_KANJI_RADICALS`) và nhúng trực tiếp qua thẻ `<script>` vào `index.html`, `detail.html`, `reader.html`.
  - Giúp ứng dụng hoạt động mượt mà không bị trình duyệt chặn CORS khi mở file qua đường dẫn `file:///`.
- **[Bộ Tách Khối Câu Thông Minh Dự Phòng (Smart Sentence Chunk Splitter)] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Xây dựng phương thức `splitSentenceIntoChunks()`: tự động phân tích ngữ pháp, ngắt vế theo dấu phẩy, trợ từ và liên từ N2 (`ためには`, `にあたって`, `ながら`, `ことこそが`, v.v.), đảm bảo KHÔNG BAO GIỜ bị dồn vào 1 khối duy nhất.
  - Tìm kiếm linh hoạt đa thuộc tính (STT chuỗi, STT số nguyên, hoặc theo chữ Hán `term`), khắc phục 100% lỗi câu #5 (`夫婦`).
- **[Kiểm Thử Thực Tế Trình Duyệt]**:
  - Xác nhận Câu #5 (`夫婦`) hiển thị câu phức N2 hoàn chỉnh: `お互いの価値観や仕事を尊重し合いながら支え合うことこそが、円満な夫婦関係を長く保つ秘訣である。` với đầy đủ 5 khối tách rời trên cả 2 chế độ Dịch Xuôi và Dịch Ngược.

## [2026-09-11 14:50] - Triển Khai Bước 5: Luyện Dịch Câu Phức N2 (Scrambled Chunk Translation Puzzle) Đa Chiều Cho Mimikara N2

### 🎯 Mục tiêu
- Khắc phục điểm yếu chí mạng của người học khi đối mặt với câu phức dài, nhiều vế ở trình độ JLPT N2 (Đọc hiểu Dokkai & Diễn đạt Sakubun).
- Triển khai **Bước 5: Luyện Dịch Câu Phức N2** dưới dạng trò chơi xếp khối ngữ nghĩa giải đố (Scrambled Chunk Translation Puzzle), yêu cầu người học ghép các cụm từ logic theo đúng cấu trúc câu N2.
- Hỗ trợ **Cần gạt 2 chế độ (Two-way Translation Toggle)**:
  1. **[ 🇯🇵 ➔ 🇻🇳 Dịch Xuôi (Đọc Hiểu Dokkai) ]**: Đề bài tiếng Nhật phức ➔ Lắp ráp các cụm dịch tiếng Việt theo thứ tự văn phong tự nhiên.
  2. **[ 🇻🇳 ➔ 🇯🇵 Dịch Ngược (Diễn Đạt & Đặt Câu Sakubun) ]**: Đề bài tiếng Việt ➔ Lắp ráp các cụm Bunsetsu tiếng Nhật tương ứng.
- Tự động hiển thị **Thẻ Phân Tích Ngữ Pháp & Cụm Từ N2 (Breakdown Card)** sau khi giải đúng: giải thích cấu trúc ngữ pháp trọng tâm (ví dụ `~ためには`, `~にあたって`, `~をめぐって`) và cụm từ cố định Collocation.

### ✅ Công việc đã hoàn thành
- **[Tạo Bộ Dữ Liệu Dịch Câu Phức N2 1.160 Mục] ([`scripts/build_n2_translations.py`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/scripts/build_n2_translations.py>), [`data/mimikara_n2_translations.json`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/data/mimikara_n2_translations.json>))**:
  - Xây dựng cơ sở dữ liệu câu phức dài đúng chuẩn JLPT N2 cho toàn bộ 1.160 từ vựng Mimikara N2.
  - Phân đoạn chính xác từng vế câu thành mảng khối logic (`chunks_ja` và `chunks_vi`), ghi chú điểm ngữ pháp N2 trọng tâm và cụm từ kết hợp Collocation tự nhiên.
- **[Engine Lắp Ghép Khối Ngữ Nghĩa & Logic Bước 5] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Xây dựng các hàm lõi: `startStep5Translation()`, `initCurrentTranslationQuestion()`, `renderStep5Translation()`, `selectChunk()`, `unselectChunk()`, `resetTranslationChunks()`, `checkTranslationAnswer()`, `revealTranslationHint()`, `nextTranslationQuestion()`, `toggleTranslationMode()`.
  - Thuật toán xáo trộn Fisher-Yates các khối ngữ nghĩa kèm cơ chế đối chiếu vị trí chuẩn xác tuyệt đối (`correctIndex === pos`).
  - Hỗ trợ phím tắt bàn phím tiện lợi: các phím số `1-9` để chọn khối, `Backspace` xóa khối gần nhất, `Escape` làm lại từ đầu, `Enter` để kiểm tra hoặc qua câu tiếp theo.
- **[Thiết Kế UI/UX Cyberpunk Glassmorphism Hiện Đại] ([`css/mimikara-practice.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/mimikara-practice.css>))**:
  - Khung câu gốc kính mờ viền Cyan, làm nổi bật từ vựng bài học bằng thẻ màu vàng hổ phách `.trans-target-term`.
  - Khay thả câu `.trans-assembly-area` dạng viền đứt nét khi rỗng và chuyển viền đặc sáng bóng khi có khối; hiệu ứng rung lắc khi sai và viền ngọc lục bảo phát sáng khi đúng.
  - Các chip khối lắp ráp `.assembled-chunk-chip` có đánh số thứ tự `[1]`, `[2]`, ... và icon xóa nhanh khi hover.
  - Ngân hàng khối bấm `.btn-chunk-item` mượt mà, mờ đi khi đã được chọn.
  - Thẻ phân tích giải thích `.translation-breakdown-card` trượt xuống êm ái khi hoàn thành.
- **[Cập Nhật Stepper 5 Bước & Màn Hình Vinh Quang Chiến Thắng] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Nâng cấp Stepper Header từ 4 bước thành 5 bước hoàn chỉnh: `1. Flashcard` ➔ `2. Ghép Cặp` ➔ `3. Gõ Từ` ➔ `4. Nghe Điền` ➔ `5. Luyện Dịch`.
  - Tự động chuyển mượt từ Bước 4 sang Bước 5 sau khi hoàn thành câu nghe cuối cùng.
  - Màn hình Victory Modal chúc mừng khi hoàn thành trọn vẹn cả 5 bước của phiên học.
- **[Cập Nhật Cache Buster v3.3 & Kiểm Thử E2E Trình Duyệt] ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>), [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>))**:
  - Cập nhật chuỗi phiên bản query `?v=3.3` trên tất cả trang HTML.
  - Chạy subagent kiểm thử thực tế trên trình duyệt: xác nhận chức năng chọn khối, kiểm tra đáp án, hiển thị Breakdown Card và cần gạt đổi chế độ hoạt động trơn tru.

---

## [2026-09-11 13:30] - Triển Khai Sơ Đồ Radial Mindmap SVG & Cần Gạt 2 Chế Độ (Ghép Từ vs Chiết Tự Bộ Thủ) Cho Flashcard Mimikara N2

### 🎯 Mục tiêu
- Khắc phục triệt để lỗi tràn giao diện (overflow layout) trên mặt trước Flashcard Bước 1 khi các thành phần chữ Kanji kích thước lớn đè lên cụm nút điều hướng `< Từ trước` và `Từ tiếp theo ➔`.
- Trực quan hóa cấu trúc chữ Kanji thành **Sơ đồ mạng nơ-ron hướng tâm (Radial Mindmap Graph)** chuẩn vector SVG: Tâm là từ/chữ mục tiêu màu xanh Cyan, các node vệ tinh màu cam rực rỡ có mũi tên chỉ hướng tâm kèm 2 hạt phân đoạn màu trắng.
- Tích hợp **Cần gạt 2 chế độ (Mode Toggle Pill)** tương tự Bước 4:
  1. **[ 🧬 Ghép Từ ] (Compound Word)**: Tâm là từ vựng (ví dụ `人生`), các vệ tinh là các chữ Hán cấu thành (`人` và `生`).
  2. **[ 🔬 Chiết Tự Bộ Thủ ] (Radical Decomposition Mindmap)**: Cho phép đi sâu mổ xẻ từng chữ Kanji thành các nét/bộ thủ cấu thành (ví dụ `石` gồm `丿`, `一`, `口` hoặc `生` gồm `丿`, `一`, `土`).

### ✅ Công việc đã hoàn thành
- **[Tạo Bộ Dữ Liệu Chiết Tự 715 Chữ Hán N2] ([`scripts/build_kanji_radicals.py`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/scripts/build_kanji_radicals.py>), [`data/kanji_radicals_n2.json`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/data/kanji_radicals_n2.json>))**:
  - Viết script Python tự động tải và phân tích dữ liệu CJKVI IDS chuẩn quốc tế kết hợp bảng 214 bộ thủ Khang Hy chuẩn Hán-Việt.
  - Trích xuất toàn bộ 715 chữ Kanji trong 1.160 từ vựng Mimikara N2, phân rã thành các bộ thủ/nét trực quan (từ 2 đến 4 node vệ tinh) kèm âm Hán-Việt, tên bộ thủ và câu thần chú liên tưởng.
- **[Engine Vẽ Sơ Đồ Vector SVG Hướng Tâm (Radial SVG Generator)] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Xây dựng phương thức `generateRadialSvg()` thuần lượng giác vector: tự động tính tọa độ node vệ tinh tỏa tròn đều đặn theo số lượng ($N = 1, 2, 3, 4$).
  - Nối các node bằng đường thẳng có gắn mũi tên `<marker id="arrowIn">` hướng vào tâm, trên thân đường có 2 hạt tròn trắng phân đoạn tương tự thiết kế tham khảo.
  - Tích hợp bộ lọc phát sáng neon `feDropShadow` cho cả node trung tâm Cyan và node vệ tinh Orange.
- **[Cần Gạt 2 Chế Độ & Bộ Chọn Chữ Kanji Thông Minh] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Hỗ trợ chuyển đổi nhanh giữa `compound` và `radical` mà không gây lật thẻ (`event.stopPropagation()`).
  - Ở chế độ Chiết tự bộ thủ, nếu từ có nhiều chữ Kanji (ví dụ `人生`), tự động hiển thị thanh chọn chữ `[ 人 ]` `[ 生 ]` để người học dễ dàng chuyển đổi chiết tự từng chữ.
  - Tương tác di chuột / chạm (hover/click) vào node vệ tinh lập tức cập nhật caption chi tiết bên dưới (ví dụ: `土 [Bộ Thổ]: Đất đai màu mỡ, cội nguồn`).
- **[Tối Ưu Typography & Khắc Phục Triệt Để Lỗi Tràn Viền] ([`css/mimikara-practice.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/mimikara-practice.css>))**:
  - Tinh chỉnh cỡ chữ Kanji chính từ `6rem` xuống `4.5rem`, cách dòng cân đối hơn.
  - Khống chế chiều cao khối sơ đồ Mindmap SVG ở mức chuẩn 140px, padding thẻ được thu gọn hợp lý (`1.4rem 2.2rem`).
  - Đảm bảo khoảng cách an toàn tuyệt đối (safe area), các nút chuyển bài `< Từ trước` và `Từ tiếp theo ➔` hiển thị hoàn toàn rõ ràng, không bao giờ bị đè nữa.
- **[Cập Nhật Cache Buster v3.2 & Kiểm Thử Toàn Diện] ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>), [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>))**:
  - Cập nhật phiên bản link stylesheet và script lên `?v=3.2`.
  - Khởi chạy subagent trình duyệt Playwright kiểm thử thực tế trên `http://localhost:8080/index.html`: xác nhận cả 2 chế độ hoạt động trơn tru, node vệ tinh bắt sự kiện chính xác và layout không bị đè nút.

---

## [2026-09-11 07:55] - Tích Hợp Khối "Chiết Tự Bộ Thủ & Thần Chú Gợi Nhớ" Lên Mặt Trước Thẻ Flashcard Mimikara N2

### 🎯 Mục tiêu
- Xử lý vấn đề người học nhìn mặt trước chữ Kanji khó/nhiều nét bị choáng hoặc không có điểm tựa tư duy (Memory Hook) trước khi lật thẻ.
- Đưa khối bóc tách bộ thủ (`kanji_breakdown`) và câu thần chú gợi nhớ (Mnemonic Story) trực tiếp lên mặt trước của thẻ Flashcard Bước 1, tạo cầu nối tư duy (Thought Bridge) giúp người học chủ động suy luận nghĩa từ vựng trước khi lật thẻ.

### ✅ Công việc đã hoàn thành
- **[Engine Bóc Tách Bộ Thủ & Sinh Câu Thần Chú Tự Nhiên] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Xây dựng phương thức `renderFrontMnemonic(w)`: tự động parse trường `kanji_breakdown` thành các thành phần cấu thành (chữ Hán, âm Hán Việt, ý nghĩa bộ thủ).
  - Tự động xâu chuỗi các bộ thủ kết hợp với nghĩa trọng tâm của từ để sinh ra câu thần chú liên tưởng logic, dễ nhớ.
- **[Thiết Kế UI/UX Khối Thần Chú Kính Mờ Đẳng Cấp] ([`css/mimikara-practice.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/mimikara-practice.css>))**:
  - Thiết kế `.mimikara-front-mnemonic-box` với hiệu ứng kính mờ ánh tím Neon sang trọng.
  - Các viên thuốc bộ thủ `.mnemonic-kanji-pill` bo góc viền xanh Cyan nổi bật chữ Hán to rõ và giải nghĩa gọn gàng.
  - Dòng thần chú `.mnemonic-story-box` kèm icon gậy phép thuật phát sáng màu vàng hoàng yến, highlight rõ nét từ khóa liên tưởng.
- **[Cập Nhật Cache Buster v3.1] ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>))**:
  - Cập nhật phiên bản link stylesheet và script lên `?v=3.1` để trình duyệt người dùng luôn nạp giao diện mới nhất.

---

## [2026-09-11 07:30] - Triển Khai Bước 4: Luyện Nghe & Gõ Điền Khuyết Câu (Audio Cloze & Dictation Engine) Cho Mimikara N2

### 🎯 Mục tiêu
- Nâng cấp hệ thống luyện tập 14 Unit Mimikara N2 (1.160 từ) từ **Quy trình 3 bước** thành **Quy trình 4 bước toàn diện** theo đúng tinh thần "耳から覚える" (Ghi nhớ qua đôi tai).
- Bổ sung **Bước 4: Nghe Điền Câu (Audio Cloze & Dictation)**: Luyện phản xạ tai nghe bắt âm thanh trong ngữ cảnh câu ví dụ thực tế, ghi nhớ từ vựng kèm Collocation chuẩn xác.
- Triển khai cơ chế tách cụm tiếng Nhật thông minh (Intl.Segmenter + Bunsetsu Heuristic) và giao diện slot chấm `[ • • • • ]` biểu thị số âm tiết (Mora).
- Hỗ trợ 2 cấp độ linh hoạt: Cấp độ 1 (Điền từ mục tiêu) & Cấp độ 2 (Chép chính tả cả câu).

### ✅ Công việc đã hoàn thành
- **[Tách Cụm Tiếng Nhật Thông Minh & Gom Trợ Từ Bunsetsu] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Ứng dụng `Intl.Segmenter('ja', { granularity: 'word' })` kết hợp thuật toán gom trợ từ tự nhiên (`な, を, に, で, は, が, と, へ, から, まで, より, も...`) để phân rã câu thành các khối ngữ điệu Bunsetsu mượt mà.
- **[Giao Diện Slot Ký Tự [ • • • • ] & Phản Hồi Trực Tiếp Thời Gian Thực] ([`css/mimikara-practice.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/mimikara-practice.css>), [`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Giao diện slot chấm `[ • • • • ]` hiển thị chuẩn xác số lượng âm tiết/phách mora của từ và câu.
  - Khi người dùng gõ Romaji hoặc Hiragana, các chấm `•` tự động biến đổi và lấp đầy trực tiếp theo từng ký tự gõ vào theo hiệu ứng Karaoke Stream.
  - Tích hợp bộ chuyển đổi chuẩn xác `romajiToHiragana(romaji)` xử lý âm ngắt `っ`, trường âm, âm ghép.
- **[Bộ Chuyển Đổi 2 Cấp Độ Linh Hoạt]**:
  - **Cấp độ 1 (Điền từ mục tiêu)**: Giữ nguyên câu ví dụ, ẩn từ bài học thành slot `[ • • • • ]` (ví dụ `幸せな [ • • • • ] を送る。`).
  - **Cấp độ 2 (Chép chính tả toàn câu)**: Ẩn toàn bộ câu thành các cụm slot `[ • • • • • ] [ • • • • ] [ • • • ]`.
  - Bộ nút chuyển đổi dạng viên thuốc (Pill Switcher) lưu cấu hình trực tiếp vào `localStorage`.
- **[Hệ Thống Điều Khiển Âm Thanh & Phím Tắt Tiện Lợi]**:
  - Tự động phát âm thanh toàn câu ví dụ khi chuyển đến câu hỏi mới.
  - Nút loa to bản phát lại câu (Phím tắt `Space` hoặc `R`).
  - Nút chuyển tốc độ phát: `1.0x (Chuẩn)` ⇄ `0.8x (Chậm 🐢)` hỗ trợ nghe rõ từng âm.
  - Phím `Tab` mở nhanh đáp án/gợi ý ngay cả khi đang gõ trong ô input.
- **[Cập Nhật Stepper Header & Màn Hình Victory]**:
  - Cập nhật Stepper 4 bước: `Bước 1: Flashcard` ➔ `Bước 2: Ghép Cặp` ➔ `Bước 3: Gõ 2 Chiều` ➔ `Bước 4: Nghe Điền Câu`.
  - Màn hình chúc mừng ghi nhận hoàn thành trọn vẹn cả 4 bước.

---

## [2026-09-10 23:40] - Tối Ưu Hóa 60FPS Tuyệt Đối: Khắc Phục Triệt Để Giật Lag Trong Chế Độ Ôn Tập Mimikara & Trình Đọc Manga

### 🎯 Mục tiêu

- Khắc phục triệt để hiện tượng đơ giật, khựng khung hình (jank/stutter) và cảm giác "không smooth" khi mở và tương tác trong chế độ ôn tổng quan 14 Unit Mimikara N2.
- Giải phóng 100% tài nguyên GPU/RAM khi mở modal ôn tập, loại bỏ việc re-render toàn bộ DOM ở các micro-interactions (lật thẻ, chọn thẻ ghép cặp, gõ từ).
- Triệt tiêu lỗi Firestore Permission Denied và Autofocus warning trên Console.

### ✅ Công việc đã hoàn thành

- **[Đóng Băng & Ẩn Trình Đọc Manga Khi Mở Modal] ([`css/mimikara-practice.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/mimikara-practice.css>), [`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Gắn class `body.mimikara-active` khi mở modal: đặt `display: none !important;` cho toàn bộ `#readerViewport`, `.reader-header`, `.reader-bottom-bar`.
  - Thay thế `backdrop-filter: blur(12px)` bằng màu nền OLED đậm `#080c16` với `contain: strict;`, loại bỏ hoàn toàn việc GPU phải tính toán làm mờ Gaussian Blur trên nền 30 trang truyện tranh nặng.
- **[3D Hardware-Accelerated Flashcard Flip] ([`css/mimikara-practice.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/mimikara-practice.css>), [`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Chuyển thẻ Flashcard Bước 1 sang cấu trúc CSS 3D Flip Card chuẩn (`perspective: 1200px`, `transform-style: preserve-3d`, `backface-visibility: hidden`).
  - Khi lật thẻ, chỉ đảo class `flipped` qua CSS transform `rotateY(180deg)` ở 60fps mượt mà, **chấm dứt hoàn toàn việc phá hủy và build lại DOM (`innerHTML`) khi lật thẻ**.
- **[Thao Tác DOM Trực Tiếp Cho Matching Game Bước 2] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Khi người dùng click chọn ô thẻ ghép cặp: thay đổi class `.selected`, `.matched`, `.wrong` trực tiếp trên DOM node của thẻ đó thay vì gọi `renderStep2Matching()` xóa sạch DOM như trước. Phản hồi tức thì 0ms.
- **[Loại Bỏ Re-render Khi Gõ Sai Ở Bước 3] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Chỉ cập nhật feedback text và class input, không re-render làm mất chữ hoặc mất focus.
- **[Dập Tắt Cảnh Báo Firestore & Autofocus] ([`js/comment-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/comment-service.js>), [`js/flashcard-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/flashcard-service.js>))**:
  - Ngắt ngay listener Firestore khi gặp `permission-denied`, chặn retry polling ngầm.
  - Xóa bỏ thuộc tính `autofocus` tĩnh trong HTML template, chuyển sang focus programmatic bằng JS.
- **[Bump Version Cache Buster v3.0] ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>), [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>))**:
  - Nâng toàn bộ link CSS và script lên `?v=3.0` để trình duyệt tải ngay code mới tối ưu nhất.

---

## [2026-09-10 23:00] - Nâng Cấp Toàn Diện Typography & Bố Cục Hệ Thống Luyện Từ Vựng 14 Unit Mimikara N2 (3 Bước)

### 🎯 Mục tiêu

- Xử lý triệt để phản hồi về việc chữ và bố cục thẻ flashcard học từ vựng bị nhỏ, khó nhìn trên màn hình laptop/máy tính.
- Nâng cấp trải nghiệm người dùng đạt tiêu chuẩn cao cấp: thẻ to rộng, chữ Kanji nổi bật, nghĩa tiếng Việt rõ nét, bổ sung phát âm audio cho câu ví dụ và hỗ trợ hệ thống phím tắt bàn phím toàn diện.

### ✅ Công việc đã hoàn thành

- **[Nâng Cấp Typography & Bố Cục Thẻ Học] ([`css/mimikara-practice.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/mimikara-practice.css>))**:
  - Mở rộng khung cửa sổ Modal lên `max-width: 1120px; max-height: 94vh; padding: 1.5rem 2rem;`.
  - Mở rộng kích thước thẻ Flashcard Bước 1 lên `max-width: 940px; min-height: 520px; padding: 2.5rem 3.25rem;`.
  - Nâng kích thước Kanji `mimikara-kanji-huge` lên **`6rem`** với font chữ Nhật chuẩn nét (`Hiragino Kaku Gothic Pro`, `Meiryo`, `Noto Sans JP`) và hiệu ứng đổ bóng tím cao cấp.
  - Tăng kích thước cách đọc Furigana/Hiragana lên **`2.6rem`**, badge Pitch Accent lên `1.35rem`, Hán Việt lên `1.45rem`.
  - Nâng kích thước Nghĩa tiếng Việt lên **`2.85rem`**, câu ví dụ tiếng Nhật lên **`1.65rem`**, giải nghĩa ví dụ tiếng Việt lên **`1.3rem`**.
  - Tái cấu trúc khối Chiết tự Kanji (`1.25rem`) và khối Từ liên quan/Chú thích (`1.2rem`) với màu sắc tương phản cao, êm mắt và dễ đọc.
  - Tối ưu Bước 2 (Ghép cặp 5x5): thẻ cao `94px`, chữ Kanji `2.2rem`, nghĩa `1.4rem`.
  - Tối ưu Bước 3 (Gõ 2 chiều): câu hỏi `3.8rem`, ô input `1.5rem` kèm nút kiểm tra lớn.
- **[Bổ Sung Audio Câu Ví Dụ & Phím Tắt Toàn Diện] ([`js/mimikara-practice-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/mimikara-practice-service.js>))**:
  - Thêm nút loa phát âm TTS tiếng Nhật riêng biệt cho câu ví dụ ở mặt sau thẻ Flashcard.
  - Tích hợp bộ lắng nghe phím tắt (`initKeyboardEvents`): `Space`/`Enter` (lật mặt thẻ), `←`/`P` (từ trước), `→`/`N` (từ tiếp theo), `R` (nghe phát âm).
  - Bổ sung thanh hiển thị hướng dẫn phím tắt trực quan ngay dưới thẻ.
- **[Khắc Phục Cache Trình Duyệt] ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>), [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>))**:
  - Gắn query string `?v=2.1` vào link CSS và script JS để ép trình duyệt luôn nạp bản cập nhật mới nhất.

---

## [2026-09-08 22:45] - Bảo Toàn Tuyệt Đối Ảnh Bìa & Gán firstPageUrl Khi Thêm / Xuất Bản Chương Mới

### 🎯 Mục tiêu

- Khắc phục lỗi khi Quản trị viên xuất bản / thêm chương mới cho bộ truyện thì ảnh bìa của bộ truyện bị reset hoặc mất.
- Tự động gắn thuộc tính `firstPageUrl` vào metadata chương để phục vụ cơ chế tự động lấy trang đầu Chương 1 làm bìa một cách đồng bộ và tức thì.

### ✅ Công việc đã hoàn thành

- **[Bảo Toàn Metadata Bộ Truyện] ([`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>))**:
  - Tái cấu trúc hàm `handleAdminSaveChapter()` và `adminDeleteChapter()`: Khi lưu chương mới, hệ thống kế thừa và bảo toàn 100% trường `cover` hiện có của `currentSeries` và lưu trực tiếp qua `dbStorage.saveCustomSeries()`.
  - Loại bỏ hoàn toàn bước nạp đè từ `localStorage` lỗi thời gây mất ảnh bìa.
- **[Hỗ Trợ firstPageUrl Trong Cover Resolver] ([`js/db-storage.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/db-storage.js>))**:
  - `getSeriesCover()` & `getSeriesCoverAsync()`: Ưu tiên đọc `firstChap.firstPageUrl` giúp hiển thị ngay lập tức trang đầu của Chương 1 làm bìa mà không cần đọc toàn bộ danh sách trang tranh nặng.

---

## [2026-09-08 21:35] - Khắc Phục Triệt Để Lỗi Mất Ảnh Bìa Khi F5 / Reload Bằng Cơ Chế Lưu IndexedDB Catalog

### 🎯 Mục tiêu

- Đảm bảo ảnh bìa tùy chỉnh (đặc biệt là ảnh tải lên dạng Base64 dung lượng từ 1MB - 5MB) không bao giờ bị mất khi người dùng tải lại trang (F5/Reload).
- Vượt qua giới hạn 5MB ngặt nghèo của `localStorage` bằng cách lưu trữ toàn bộ dữ liệu danh mục tùy chỉnh trực tiếp vào kho `catalog` của IndexedDB.

### ✅ Công việc đã hoàn thành

- **[IndexedDB Catalog Persistence] ([`js/db-storage.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/db-storage.js>))**:
  - `saveCustomSeries(series)`: Lưu trực tiếp thông tin bộ truyện cùng ảnh bìa Base64 vào object store `'catalog'` của IndexedDB (dung lượng lưu trữ không giới hạn).
  - `getAllCustomSeries()`: Tự động trích xuất toàn bộ dữ liệu tùy chỉnh từ IndexedDB khi ứng dụng khởi động.
  - `getFullMangaCatalog()`: Hợp nhất mượt mà dữ liệu từ file gốc `data/manga.json` và IndexedDB, bảo đảm giữ nguyên 100% ảnh bìa tùy chỉnh qua các lần F5.
- **[Tích Hợp Form Quản Trị] ([`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>), [`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>))**:
  - Tự động gọi `dbStorage.saveCustomSeries()` khi tạo mới truyện, chỉnh sửa truyện hoặc cập nhật chương mới.

---

## [2026-09-08 21:26] - Xóa Bỏ Hoàn Toàn Bìa Hardcoded Cũ & Thay Bằng Bìa Chuẩn EduManga Mới

### 🎯 Mục tiêu

- Loại bỏ hoàn toàn sự cố bức ảnh lập trình viên ("STAYING AWAKE TO CORRECT ERRORS" - `n2_cover.jpg`) bị gán cứng làm ảnh đại diện mặc định cho toàn bộ hệ thống khi tạo mới hoặc xóa bìa.
- Tạo bộ ảnh bìa chuẩn nhận diện cho từng bộ truyện (`n2_cover.jpg` cho Tiếng Nhật N2, `pldc_cover.jpg` cho Pháp luật đại cương, `default_cover.jpg` cho ảnh fallback hệ thống).

### ✅ Công việc đã hoàn thành

- **[Tạo Bìa Mới Chuẩn Thẩm Mỹ] ([`assets/covers/`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/assets/covers>))**:
  - Tạo `default_cover.jpg`: Bìa EduManga Hub phong cách gradient Navy/Blue hiện đại làm ảnh mặc định khi truyện chưa có bìa và chưa có chương.
  - Tạo `n2_cover.jpg` mới: Bìa Tiếng Nhật JLPT N2 tông màu hoàng hôn đỏ/tím đậm chất Nhật Bản thay thế ảnh chàng trai lập trình viên cũ.
  - Tạo `pldc_cover.jpg`: Bìa Pháp luật đại cương chuẩn.
- **[Dọn Sạch Dữ Liệu Gốc] ([`data/manga.json`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/data/manga.json>))**:
  - Gán đúng bìa `pldc_cover.jpg` cho Pháp luật đại cương và `default_cover.jpg` cho vocab, chấm dứt việc tất cả các truyện bị dán nhầm ảnh cũ.
- **[Đồng Bộ Toàn Bộ Fallback] ([`js/db-storage.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/db-storage.js>), [`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>), [`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>))**:
  - Chuyển toàn bộ các hàm fallback và `onerror` từ `n2_cover.jpg` sang `default_cover.jpg`.

---

## [2026-09-08 20:42] - Cơ Chế Tự Động Lấy Trang Đầu Chương 1 Làm Ảnh Bìa Khi Bỏ Bìa (Smart Fallback Cover Engine)

### 🎯 Mục tiêu

- Khi Quản trị viên bấm nút "X" để gỡ bỏ ảnh bìa và bấm "Lưu Thay Đổi", hệ thống lưu chính xác trạng thái không có ảnh bìa (`cover: ''`), không bị gán đè ảnh mặc định.
- Tự động kích hoạt cơ chế lấy trang tranh đầu tiên của Chương 1 (`firstChapter.pages[0].imageUrl` hoặc `assets/chapters/[series]/[chap-01]/page_01.jpg`) làm ảnh bìa tạm thời cho đến khi Admin tải ảnh bìa mới.

### ✅ Công việc đã hoàn thành

- **[Dynamic Cover Resolver Engine] ([`js/db-storage.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/db-storage.js>))**:
  - Xây dựng `getSeriesCover(series)` & `getSeriesCoverAsync(series)`:
    1. Ưu tiên 1: Trả về `series.cover` nếu có thiết lập hợp lệ.
    2. Ưu tiên 2: Tự động trích xuất trang đầu tiên của Chương 1 từ bộ nhớ, IndexedDB hoặc đường dẫn quy ước.
    3. Ưu tiên 3: Fallback ảnh placeholder nếu truyện chưa có chương nào.
- **[Form & Lưu Thay Đổi] ([`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>), [`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>))**:
  - Loại bỏ fallback cứng `|| 'assets/covers/n2_cover.jpg'` trong hàm lưu: Khi Admin xóa bìa, trường `cover` sẽ được lưu là `''` vào `customCatalog` và `localStorage`.
  - Toàn bộ các vị trí hiển thị (Banner trang chủ, Card danh mục, Lịch sử đọc, Header trang chi tiết) đều sử dụng `getSeriesCover(m)` để luôn hiển thị trang đầu Chương 1 mượt mà.
- **[Placeholder Trực Quan] ([`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>), [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>))**:
  - Ô nhập link ảnh bìa hiển thị gợi ý rõ ràng: `assets/covers/... (Để trống để tự lấy ảnh đầu Chương 1)`.

---

## [2026-09-08 20:35] - Bổ Sung Nút X Gỡ Bỏ Ảnh Bìa & Xem Trước Live URL Trong Form Khởi Tạo / Chỉnh Sửa Truyện

### 🎯 Mục tiêu

- Cho phép Quản trị viên dễ dàng gỡ bỏ ảnh bìa đã chọn hoặc đã tải lên (nút "X") trong các modal Khởi tạo truyện mới và Chỉnh sửa thông tin bộ truyện.
- Hỗ trợ xem trước ảnh bìa ngay khi nhập/dán URL trực tiếp (Live Input Preview).

### ✅ Công việc đã hoàn thành

- **[CSS & UI Button] ([`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Thêm nút `.btn-admin-remove-cover` hình tròn viền kính mờ, nền đỏ nổi bật với icon `fa-xmark` gắn góc trên bên phải khung ảnh bìa.
  - Hiệu ứng hover phóng to mượt mà (`transform: scale(1.15)` & shadow glow).
- **[Modal Markup] ([`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>), [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>))**:
  - Tích hợp nút X vào `#adminCoverPreviewBox` và `#adminEditCoverPreviewBox`.
  - Thêm sự kiện `oninput="handleAdminCoverUrlInput(...)"` vào ô dán URL ảnh bìa.
- **[Logic & Event Handlers] ([`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>), [`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>))**:
  - `adminRemoveCover(type)`: Xóa sạch file input, ô URL, ảnh preview và tự động ẩn khung preview.
  - `handleAdminCoverUrlInput(type, val)`: Hiển thị/ẩn live preview ngay lập tức khi Admin nhập/xóa link ảnh.

---

## [2026-09-08 20:17] - Triển Khai Hệ Thống Tự Động Sao Lưu Theo Thư Mục & Cơ Chế Sao Lưu Bù Thông Minh (Smart Catch-Up Auto-Backup to Target Directory)

### 🎯 Mục tiêu

1. **Sao lưu trực tiếp vào đường dẫn đích**: Cho phép Admin cấu hình đường dẫn thư mục lưu trữ (mặc định: `G:\My Drive\hk261\Dự án manga\backup`).
2. **Quản lý phiên bản tự động theo ngày (Time-Machine Backup)**: Hệ thống tự động tạo thư mục con theo ngày (ví dụ `08-09-2026/`) và lưu toàn bộ file Master Backup, Catalog và thư mục các chương kịch bản tách lẻ (`chapters/`).
3. **Cơ chế Sao Lưu Bù Thông Minh (Smart Catch-Up Backup)**: Khi Admin tắt thiết bị lúc đến giờ hẹn, hệ thống tự động phát hiện và kích hoạt sao lưu bù ngay lập tức khi mở lại máy/vào web.

### ✅ Công việc đã hoàn thành

- **[Backend Auto-Backup API] ([`scripts/dev_server.py`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/scripts/dev_server.py>))**:
  - Xây dựng endpoint POST `/api/backup/save`: Tự động nhận diện đường dẫn, tạo thư mục ngày `DD-MM-YYYY`, ghi các file `edumanga_master_backup.json`, `manga_catalog.json` và phân tách từng chương vào thư mục con `chapters/`.
- **[Frontend Storage & Scheduler Engine] ([`js/db-storage.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/db-storage.js>))**:
  - `getBackupSettings()` / `saveBackupSettings()`: Quản lý cấu hình đường dẫn đích, tần suất (1, 2, 3, 7 ngày) và trạng thái.
  - `performAutoBackupToFolder(customTargetDir, isAuto)`: Đóng gói toàn bộ cơ sở dữ liệu IndexedDB và gửi tới server lưu trữ.
  - `checkAndRunSmartCatchUpBackup()`: Tự động so sánh mốc thời gian sao lưu gần nhất khi mở trang, tự kích hoạt sao lưu bù nếu đã quá chu kỳ.
- **[Giao Diện Cấu Hình & Thao Tác Thủ Công] ([`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>), [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>), [`js/auth-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/auth-service.js>), [`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Thêm mục *⚙️ Cài đặt Sao Lưu Tự Động* vào Menu Avatar Quản Trị.
  - Tạo Modal `#adminBackupConfigModal` cho phép đổi đường dẫn, bật/tắt tự động, chọn tần suất, xem trạng thái và nút **"🚀 Sao Lưu Ngay Bây Giờ"** (Manual 1-click trigger).

---

## [2026-09-08 20:00] - Fix Triệt Để Lỗi Xóa Bộ Truyện & Chương Bị Xuất Hiện Lại Khi F5 / Reload

### 🎯 Mục tiêu

- Khắc phục lỗi khi Quản trị viên xóa một bộ truyện hoặc một chương, sau khi tải lại trang (F5) thì dữ liệu bị xuất hiện lại do cơ chế nạp đè từ file tĩnh `data/manga.json`.

### 💡 Nguyên nhân gốc rễ (Root Cause)

- Khi `adminDeleteSeries` hoặc `adminDeleteChapter` được thực thi, hệ thống chỉ xóa khỏi `edumanga_custom_catalog` trong `localStorage`.
- Khi F5, hàm `getFullMangaCatalog()` vẫn fetch `data/manga.json` (danh mục gốc) và thực hiện gộp (merge) danh sách chương cũ của `baseCatalog`, khiến các bộ truyện / chương đã xóa bị khôi phục lại tự động.

### ✅ Công việc đã hoàn thành

- **[Cơ Chế Deletion Blacklist Bền Vững] ([`js/db-storage.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/db-storage.js>))**:
  - `edumanga_deleted_series_ids`: Lưu danh sách ID các bộ truyện đã bị xóa vĩnh viễn.
  - `edumanga_deleted_chapter_keys`: Lưu danh sách các key `${seriesId}_${chapId}` của các chương đã bị xóa vĩnh viễn.
  - Chuẩn hóa hàm `getFullMangaCatalog()` trong `dbStorage`: Tự động loại bỏ hoàn toàn các bộ truyện và chương nằm trong danh sách đen này trước khi trả về dữ liệu.
  - Tự động xóa sạch cả các trang tranh nặng trong IndexedDB (`deleteChapterPages`).
  - Khi Admin tạo mới, nạp lại hoặc khôi phục từ file backup, hệ thống tự động gỡ ID khỏi Blacklist để hiển thị lại bình thường.
- **[Đồng Bộ Toàn Diện Client] ([`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>), [`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>), [`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Toàn bộ trang chủ, chi tiết và trình đọc dùng chung 1 logic `window.getFullMangaCatalog()` từ `dbStorage`.

---

## [2026-09-08 19:55] - Triển Khai Hệ Thống Xuất JSON Từng Chapter, Sao Lưu Trọn Bộ Truyện & Khôi Phục Backup Thông Minh (Full Data Export & Smart Restore Engine)

### 🎯 Mục tiêu

1. **Xuất JSON từng Chapter (Single Chapter Export)**: Cho phép Quản trị viên (`minhquan12092005@gmail.com`) tải về file JSON kịch bản chuẩn của từng chương bất kỳ (kèm đầy đủ danh sách trang và bóng thoại) từ trang Chi tiết (`detail.html`) và Trình đọc (`reader.html`).
2. **Sao lưu trọn bộ bộ truyện (Series Backup JSON)**: Gom toàn bộ thông tin bộ truyện cùng nội dung kịch bản tất cả các chương thành 1 file backup duy nhất.
3. **Master System Backup & Khôi Phục Thông Minh (1-Click Restore)**: Cung cấp tính năng xuất toàn bộ cơ sở dữ liệu Manga hiện có và khả năng nạp/khôi phục tự động vào IndexedDB + LocalStorage khi đổi máy hoặc xóa cache.

### ✅ Công việc đã hoàn thành

- **[Storage & Export/Restore Engine] ([`js/db-storage.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/db-storage.js>))**:
  - `exportSingleChapter(seriesId, chapId, chapMeta)`: Tự động gom dữ liệu `pages` từ IndexedDB và xuất file `edumanga_[series]_[chap].json`.
  - `exportSeriesFullBackup(series)`: Đóng gói metadata bộ truyện + toàn bộ các chương có chứa trang ảnh thành file `edumanga_series_[id]_backup_[date].json`.
  - `exportMasterBackup(fullCatalog)`: Xuất toàn bộ thư viện thành Master Backup JSON.
  - `restoreBackupData(rawData)`: Thuật toán nhận diện thông minh 3 cấp độ (Master, Series, Chapter), tự động giải nén và lưu trữ an toàn vào IndexedDB & LocalStorage.
- **[Giao Diện Quản Trị Chi Tiết & Reader] ([`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>), [`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Thêm nút icon `📥 Tải JSON` (`.btn-admin-export-chap`) trên từng dòng chương ở trang chi tiết.
  - Thêm nút `💾 Sao Lưu Bộ Truyện (JSON)` trong Hero Actions của bộ truyện.
  - Thêm nút `Tải JSON Kịch Bản Chương Này` trong cài đặt Reader khi đăng nhập Admin.
- **[Header User Dropdown Menu] ([`js/auth-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/auth-service.js>), [`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Thêm mục quản trị trong Header Avatar Menu: *Sao lưu toàn bộ (Master JSON)*, *Nạp / Khôi phục file Backup*, và *Xuất danh mục (manga.json)*.
  - Tự động đồng bộ quyền Admin và cập nhật UI mượt mà.

---

## [2026-09-08 19:45] - Bổ Sung Nút Chỉnh Sửa Bộ Truyện Khi Hover (Admin Card Actions) & Modal Sửa Thông Tin

### 🎯 Mục tiêu

1. **Nâng cấp trải nghiệm Admin khi quản lý danh mục**: Khi tài khoản Quản trị viên (`minhquan12092005@gmail.com`) rê chuột (hover) vào thẻ bộ truyện (`manga-card`) trên trang chủ, hiển thị cụm nút thao tác mượt mà gồm cả nút **Chỉnh sửa** (Edit) và nút **Xóa** (Delete).
2. **Modal Chỉnh Sửa Bộ Truyện Toàn Diện**: Cung cấp form chỉnh sửa đầy đủ thông tin bộ truyện (Tên, Danh mục môn học, Huy hiệu, Tác giả, Trạng thái, Mô tả tóm tắt, Ảnh bìa mới với Preview) cả ở trang chủ (`index.html`) và trang chi tiết truyện (`detail.html`).

### ✅ Công việc đã hoàn thành

- **[Giao Diện Cụm Nút Hover Quản Trị] ([`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Thiết kế cụm nút `.admin-card-actions` nằm ở góc trên bên phải của bìa truyện, xuất hiện mượt mà khi hover với hiệu ứng chuyển động và bóng đổ neon.
  - Nút **Chỉnh sửa** (`.btn-admin-edit`): Màu xanh Cyan/Sky sang trọng (`#0284c7`), icon bút chì `<i class="fas fa-pen"></i>`, hiệu ứng glow sáng khi hover.
  - Nút **Xóa** (`.btn-admin-del`): Màu đỏ cảnh báo (`#ef4444`), icon `<i class="fas fa-trash-can"></i>`.
- **[Modal Chỉnh Sửa Thông Tin Bộ Truyện] ([`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>), [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>))**:
  - Tạo Modal `#adminEditSeriesModal` chuẩn phong cách kính mờ (Glassmorphism), tự động nạp toàn bộ thông tin hiện tại của bộ truyện vào form khi mở.
  - Cho phép tải ảnh bìa mới từ máy tính (FileReader Base64) hoặc dán link URL, có khung xem trước ảnh bìa (Live Cover Preview).
- **[Logic Quản Lý & Lưu Trữ Dữ Liệu] ([`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>), [`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>))**:
  - Xây dựng các hàm: `openAdminEditSeriesModal`, `closeAdminEditSeriesModal`, `handleAdminEditCoverUpload`, `handleAdminSaveEditedSeries`.
  - Tự động cập nhật `edumanga_custom_catalog` trong `localStorage`, bảo toàn danh sách chương (`chapters`) và danh sách nhân vật (`characters`), cập nhật ngay lập tức giao diện trang chủ và trang chi tiết mà không cần tải lại trang.

---

## [2026-09-08 17:46] - Tích Hợp Master Vocab DB N2, Pitch Accent UI/UX Trực Quan & Auto-Sync Pipeline Cho `add-manga`

### 🎯 Mục tiêu

1. **Khớp nối 1-1 không suy diễn với dữ liệu gốc**: Tích hợp toàn bộ 1160 từ vựng (`tuvungn2.csv`) và 175 ngữ pháp (`ngu_phap_n2_full.csv`) thành Master Database `data/vocab_n2_db.json`.
2. **Nâng cấp UI/UX Pitch Accent & Multi-tier Rich Card**:
   - **Hover trên truyện:** Tinh gọn, không che tranh: Chữ gốc + Pitch Accent `じ̅ん̲せ̲い̲ [①]` + Loa 🔊 + Hán-Việt + Nghĩa + Nút `+Thẻ`.
   - **Danh sách Show Tổng:** Bung trọn vẹn 13 trường dữ liệu (Pitch Accent, Chiết tự Kanji, Ví dụ SGK song ngữ, Từ đồng nghĩa/trái nghĩa, Sắc thái ngữ cảnh, Nút `[🔍 Xem tranh]`).
3. **Engine Tự Động Hóa `add-manga`**: Tự động nhận diện file JSON mới trong `add-manga/`, giải nén ảnh, tạo bìa, liên kết bóng thoại và cập nhật danh mục `data/manga.json`.

### ✅ Công việc đã hoàn thành

- **[Master Vocab DB Generator] ([`scripts/build_vocab_db.py`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/scripts/build_vocab_db.py>))**:
  - Trích xuất toàn bộ 1160 từ vựng và 175 ngữ pháp thành `data/vocab_n2_db.json` (3.3 MB).
  - Tự động phân tách Mora và tạo đường kẻ cao độ Pitch Accent HTML (`じ̅` cao / `ん̲せ̲い̲` thấp) + Badge `[①]`.
- **[Tự Động Hóa Quét & Đồng Bộ `add-manga`] ([`scripts/auto_scanner.py`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/scripts/auto_scanner.py>))**:
  - Quét thông minh cả thư mục `add-manga/`, tự động gộp chapter vào series tương ứng, giải mã Base64 thành ảnh tối ưu trong `assets/chapters/`.
- **[Nâng Cấp Hover Popover] ([`js/study-mode.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/study-mode.js>))**:
  - Tra cứu trực tiếp từ Master DB theo từ khóa, render popover tinh gọn với Pitch Accent và phát âm.
- **[Nâng Cấp Danh Sách Show Tổng & Jump-to-Page] ([`js/flashcard-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/flashcard-service.js>), [`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Render thẻ Rich Card đa tầng với đầy đủ 13 trường dữ liệu, bổ sung nút `[🔍 Trang X]` tự động cuộn đến đúng trang truyện chứa câu thoại.
- **[Kịch Bản Chương 6 - 10]**:
  - Hoàn thành đầy đủ 30 trang cho mỗi chương từ Chương 6 đến Chương 10 (`chuong_06.md` đến `chuong_10.md`).
- **[GitHub Sync]**:
  - Đã commit và đẩy thành công toàn bộ lên GitHub repository (`origin/main`).

---

## [2026-09-08 11:40] - Triển Khai Cơ Chế "Gõ Để Check" Cho Từ Vựng & Lật Thẻ 3D Cho Ngữ Pháp (Type-to-Check Active Recall for Vocab & 3D Flip for Grammar)

### 🎯 Mục tiêu

Theo yêu cầu của người dùng, phân tách cơ chế ôn tập thành 2 phương pháp học chuyên biệt:

1. **Thẻ Từ Vựng (Vocabulary)**: Áp dụng cơ chế **"Gõ Để Check" (Type-to-Check / Active Recall Typing)**. Người học nhìn chữ Kanji / từ vựng và tự gõ cách đọc Hiragana, Romaji hoặc nghĩa tiếng Việt rồi nhấn Enter để hệ thống tự động chấm điểm và giải mã đáp án.
2. **Thẻ Ngữ Pháp (Grammar)**: Áp dụng cơ chế **Lật Thẻ 3D (Interactive Flip Card)** để đọc và ghi nhớ toàn bộ công thức, ý nghĩa và câu thoại ví dụ dài trong manga.

### ✅ Công việc đã hoàn thành

- **[Động Cơ Đánh Giá & Chấm Điểm Gõ Thông Minh] ([`js/flashcard-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/flashcard-service.js>))**:
  - Hỗ trợ gõ linh hoạt cả Hiragana (`ひつぜん`), Romaji (`hitsuzen` / `hituzen`), Tiếng Việt có dấu (`tất yếu`, `tất nhiên`) hoặc không dấu (`tat yeu`, `tat nhien`).
  - Chuyển đổi Romaji sang Hiragana tự động và thuật toán so khớp từ khóa thông minh (Fuzzy token match).
  - Tự động nhận diện thẻ Ngữ Pháp (chứa ký tự `〜`, `~`, `cấu trúc`, `mẫu câu` hoặc gắn thẻ grammar) để chuyển sang chế độ lật thẻ 3D.
- **[Giao Diện Luyện Gõ Type-to-Check & Hiệu Ứng Phản Hồi] ([`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Ô nhập liệu to rõ (`.practice-typing-input`), tự động focus con trỏ chuột ngay khi vào thẻ.
  - Khi gõ đúng: Khung sáng viền xanh lá neon (`.state-correct`), hiển thị huy hiệu "🎉 CHÍNH XÁC TUYỆT ĐỐI!", tự động phát âm giọng chuẩn, mở khóa đầy đủ Furigana, Hán-Việt, Nghĩa và nút "Tiếp tục (Enter)".
  - Khi gõ sai: Khung sáng viền đỏ/cam (`.state-incorrect`), hiển thị đối chiếu "Bạn đã nhập" vs "Đáp án đúng", có nút "Gõ lại" và "Tiếp tục".
  - Phím tắt tiện lợi: Nhấn **`Tab`** để xem gợi ý / đáp án nếu không nhớ, nhấn **`Enter`** để kiểm tra và sang từ tiếp theo.
- **[Phím Tắt & Điều Hướng Bàn Phím] ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Cho phép người dùng gõ phím mượt mà không bị xung đột với phím tắt đọc manga.
  - Hỗ trợ phím **`Enter`** 1-chạm để kiểm tra và chuyển tiếp liên tục mà không cần dùng chuột.
- **[GitHub Sync]**:
  - Đã commit và đẩy toàn bộ mã nguồn lên GitHub repository (`origin/main`).

---

## [2026-09-08 11:35] - Nâng Cấp Kích Thước Popup Thẻ Từ Rộng Rãi HD & Khắc Phục Lỗi Nút Luyện Flashcard 3D (Flashcard Center Modal HD Expansion & Practice Mode Bugfix)

### 🎯 Mục tiêu

1. **Khắc phục lỗi nút "Luyện Flashcard (3D)" không phản hồi**: Do sự trùng lặp tên hàm `startFlashcardPractice()` trong phạm vi toàn cục với `notebook.js` cũ khiến sự kiện gọi nhầm vào bộ thẻ của panel ghi chép ẩn.
2. **Nâng cấp kích thước & độ tương phản giao diện (HD Expansion)**: Mở rộng khung popup từ `640px` lên `860px`, tăng kích thước phông chữ Kanji, Furigana, Hán-Việt và nghĩa tiếng Việt to rõ, dễ nhìn, các nút bấm to bản dễ thao tác trên cả máy tính và điện thoại.

### ✅ Công việc đã hoàn thành

- **[Sửa lỗi Function Namespace & Kích hoạt 3D Practice] ([`js/flashcard-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/flashcard-service.js>), [`js/notebook.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/notebook.js>))**:
  - Đóng gói toàn bộ phương thức vào đối tượng `flashcardService` (`flashcardService.startPractice()`, `flashcardService.switchToList()`, `flashcardService.toggleFlip()`, v.v.).
  - Đổi tên các hàm nội bộ trong `notebook.js` (`startNotebookDeckPractice`) để triệt tiêu hoàn toàn xung đột tên hàm trên `window`.
  - Đảm bảo khi bấm **"Luyện Flashcard (3D)"**, popup lập tức chuyển cảnh sang phiên lật thẻ 3D mượt mà 100%.
- **[Nâng cấp Bố cục HD Rộng Rãi & Typography To Rõ] ([`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Mở rộng chiều rộng modal lên `860px` (chiếm 95% màn hình).
  - Tăng cỡ chữ Kanji/Từ vựng trong danh sách lên `1.35rem` (đậm nét, sắc sảo).
  - Tăng cỡ thẻ Furigana (`0.88rem`), tag Hán-Việt (`0.82rem`), nghĩa tiếng Việt (`0.96rem`).
  - Nút loa phát âm 🔊 to bản với nền xanh cyan riêng biệt, dễ bấm.
  - Chế độ lật thẻ 3D: Cỡ chữ từ vựng mặt trước to `3.2rem`, mặt sau giải nghĩa `1.35rem`, các nút đánh giá `Chưa nhớ / Lật thẻ / Đã thuộc` to bản dễ chạm (`padding: 12px 14px; font-size: 0.95rem;`).
- **[GitHub Sync]**:
  - Đã commit và đẩy toàn bộ mã nguồn lên GitHub repository (`origin/main`).

---

## [2026-09-08 11:30] - Triển Khai Popup Thẻ Từ Vựng & Luyện Flashcard 3D Ở Giữa (Show Full List Overview First -> 3D Flip Card Practice Modal)

### 🎯 Mục tiêu

Triển khai tính năng Thẻ từ vựng chương truyện với trải nghiệm người dùng tối ưu 2 giai đoạn:

1. **Giai đoạn 1 (Mặc định khi mở popup)**: Hiển thị Danh Sách Đầy Đủ (Show Full List Overview) toàn bộ từ vựng, Kanji, Furigana, âm Hán-Việt và định nghĩa trong chương để tra cứu, nghe phát âm nhanh.
2. **Giai đoạn 2 (Khi bấm "Luyện Flashcard (3D)")**: Chuyển sang Chế độ Luyện Tập Lật Thẻ 3D (Interactive 3D Flip Card Scene) từng từ một với hiệu ứng lật 180°, phát âm giọng đọc, đánh giá độ nhớ "Chưa nhớ / Đã thuộc" và màn hình tổng kết phiên học.

### ✅ Công việc đã hoàn thành

- **[Dịch vụ Thẻ Từ & Trích Xuất Từ Vựng] ([`js/flashcard-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/flashcard-service.js>))**:
  - Tự động trích xuất toàn bộ từ vựng và thuật ngữ có chú thích từ bong bóng thoại của từng chương truyện.
  - Hợp nhất với các thẻ từ thủ công của người dùng, lưu trữ tiến độ đã thuộc/chưa thuộc (`localStorage` + Cloud Firestore).
  - Tích hợp giọng đọc Web Speech API tự động phát âm tiếng Nhật / tiếng Việt.
  - Hỗ trợ thêm thẻ từ mới thủ công (`promptAddCustomFlashcard`) và bộ lọc tìm kiếm tức thì.
- **[Giao diện Popup Kính Mờ Ở Giữa & Lật Thẻ 3D] ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Thiết kế `#flashcardModal` với hiệu ứng kính mờ Neon Cyan sang trọng.
  - Nút biểu tượng thẻ từ (`fas fa-layer-group`) trên cả Header và Floating Dock kèm huy hiệu đếm số lượng từ vựng trong chương (`#headerFlashcardBadge`, `#dockFlashcardBadge`).
  - Chế độ xem danh sách: Thanh Banner CTA với thanh tiến trình % đã thuộc, danh sách thẻ kèm nút nghe phát âm và nút bật/tắt đã thuộc.
  - Chế độ lật thẻ 3D: Cảnh 3D perspective 1200px, lật 180° mượt mà, các nút đánh giá `Chưa nhớ (←)` / `Lật thẻ (Space)` / `Đã nhớ (→)`.
  - Màn hình chúc mừng kết thúc phiên học kèm cúp vàng và biểu đồ phần trăm.
- **[Phím Tắt & Tương Tác Nhanh] ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Phím **`V`**: Mở / Đóng nhanh popup Thẻ từ vựng.
  - Phím **`Space`**: Lật mặt thẻ 3D khi đang trong phiên ôn luyện.
  - Phím **`1` / `←`**: Đánh giá "Chưa nhớ".
  - Phím **`2` / `→`**: Đánh giá "Đã nhớ".
  - Phím **`Esc`**: Thoát hoặc đóng popup.
- **[GitHub Sync]**:
  - Đã commit và đẩy toàn bộ mã nguồn lên GitHub repository (`origin/main`).

---

## [2026-09-08 11:20] - Chuyển Đổi Biểu Tượng Chat Thành Bình Luận Chương Thời Gian Thực & Gỡ Bỏ Trình Soi Kịch Bản Thoại (Real-Time Chapter Comments & Script Inspector Removal)

### 🎯 Mục tiêu

1. **Gỡ bỏ tính năng Xem kịch bản thoại (Script Inspector)**: Loại bỏ biểu tượng trang tài liệu và popup kịch bản thoại (`#scriptModal`) trên trình đọc manga.
2. **Kích hoạt tính năng Bình luận & Thảo luận thời gian thực (Real-Time Chapter Comments)**: Biến biểu tượng bong bóng chat (`fas fa-comments`) trên Header và Floating Dock thành trung tâm bình luận, thảo luận bài học của từng chương truyện qua Cloud Firestore.

### ✅ Công việc đã hoàn thành

- **[Gỡ bỏ Trình Kịch Bản Thoại] ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Gỡ bỏ nút `#btnOpenScript` (biểu tượng tài liệu) trên Header và Floating Dock.
  - Xóa bỏ modal `#scriptModal` cùng các hàm phụ thuộc liên quan đến script viewer.
- **[Xây dựng Dịch vụ Bình luận Thời gian thực] ([`js/comment-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/comment-service.js>))**:
  - Tích hợp Cloud Firestore `onSnapshot` để lắng nghe luồng bình luận mới nhất theo thời gian thực (Real-time live updates) theo từng chương (`chapterKey = seriesId_chapId`).
  - Hỗ trợ gửi bình luận (`postComment`), thả tim / like có hiệu ứng nhịp tim (`toggleLike`), xóa bình luận của chính mình (`deleteComment`).
  - Tích hợp thanh nhãn dán tương tác nhanh: `💡 Hay quá!`, `📝 Đã hiểu bài!`, `🔥 Rất bổ ích!`, `❓ Cho mình hỏi...`.
  - Tự động hiển thị thời gian tương đối mượt mà ("Vừa xong", "5 phút trước", "2 giờ trước",...).
  - Lưu trữ đệm dự phòng `localStorage` khi mất mạng hoặc chưa cấu hình Firebase.
- **[Giao diện Modal Bình luận Cyberpunk / Glassmorphism] ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Thiết kế modal `#commentModal` với giao diện kính mờ cao cấp, pill hiển thị Avatar và Tên học viên đang đăng nhập.
  - Huy hiệu đếm số lượng bình luận trực tiếp trên nút chat Header (`#headerCommentBadge`) và Dock (`#dockCommentBadge`).
  - Hỗ trợ phím tắt `C` để mở nhanh hộp thoại bình luận.
- **[Bảo mật Firestore] ([`firestore.rules`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/firestore.rules>))**:
  - Thiết lập phân quyền `/comments/{commentId}`: Cho phép đọc công khai (`read: if true`), yêu cầu người dùng đăng nhập mới được viết bình luận, thả tim hoặc xóa (`create, update, delete: if request.auth != null`).
- **[GitHub Sync]**:
  - Đã commit và đẩy toàn bộ mã nguồn lên GitHub repository (`origin/main`).

---

## [2026-09-08 11:15] - Xóa Bỏ Giới Hạn Chiều Ngang Cố Định & Khắc Phục Hiện Tượng Lăn/Lắc Ngang Khi Zoom (Fluid Responsive Layout Fix)

### 🎯 Mục tiêu

Khắc phục hiện tượng khung đọc manga bị gò bó trong chiều rộng cố định cũ (`max-width: 820px` kết hợp `width: 100vw`), gây ra hiện tượng cuộn/lăn rung lắc ngang khi phóng to bằng trình duyệt web.

### ✅ Công việc đã hoàn thành

- **[CSS Layout Normalization] ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Gỡ bỏ thuộc tính `overflow-x: hidden;` và `user-select: none;` trên `.reader-body` để trình duyệt tự do xử lý pan / cuộn mượt mà khi zoom to.
  - Gỡ bỏ `width: 100vw;` (vốn tính cả thanh cuộn dọc gây tràn ngang 17px tạo ra hiện tượng roll) và thay thế bằng `width: 100%;` chuẩn W3C.
  - Thiết lập `.reader-viewport` và `.reader-page-wrapper` co giãn linh hoạt theo tỷ lệ màn hình (`max-width: 920px` trên màn hình lớn, 100% trên thiết bị di động/máy tính bảng).
  - Tối ưu hóa hiển thị ảnh manga (`.reader-page-img` với `width: 100%; height: auto; object-fit: contain`) để ảnh luôn hiển thị sắc nét, co giãn tự nhiên theo tỷ lệ zoom trình duyệt.
- **[GitHub Sync]**:
  - Đã commit và đẩy các thay đổi lên branch `main`.

---

## [2026-09-08 11:10] - Gỡ Bỏ Bộ Phóng To Tùy Biến, Sử Dụng Cơ Chế Zoom Mặc Định Của Trình Duyệt Web (Native Browser Zoom Clean-up)

### 🎯 Mục tiêu

Loại bỏ hoàn toàn dock điều khiển phóng to tùy chỉnh (`- 30% + <->`) trên thanh Header, HUD phóng to và thanh trượt Zoom trong Cài Đặt. Trả lại toàn quyền điều khiển phóng to/thu nhỏ cho cơ chế mặc định mượt mà có sẵn của trình duyệt web (`Ctrl + cuộn chuột`, `Ctrl + / - / 0`, cử chỉ chụm ngón tay pinch-to-zoom trên touchpad / màn hình cảm ứng).

### ✅ Công việc đã hoàn thành

- **[UI Header & Modal Clean-up] Gỡ bỏ UI Zoom ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Gỡ bỏ thanh điều khiển zoom mini (`.header-zoom-controls`) trên Header.
  - Gỡ bỏ popup HUD thông báo tỷ lệ phóng to (`#mangaZoomHUD`).
  - Gỡ bỏ mục trượt thanh zoom trong Modal Cài Đặt (`#modalZoomSlider`).
  - Xóa bỏ các đoạn CSS liên quan đến `.header-zoom-controls`, `.btn-zoom-val`, `.manga-zoom-hud`.
- **[JavaScript Engine Clean-up] Giải phóng phím tắt & cuộn chuột ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Gỡ bỏ các hàm chặn sự kiện `e.preventDefault()` trên `Ctrl + Wheel`, `Ctrl +`, `Ctrl -`, `Ctrl 0`. Trình duyệt web tự do thực hiện zoom phóng to/thu nhỏ mặc định.
  - Dọn dẹp các hàm zoom scale nội bộ (`initZoomEngine`, `setMangaZoom`, `updateZoomUI`, `fitWidth`, v.v.).
  - Xóa biến `--manga-zoom-scale` và khóa lưu trữ zoom cũ trong `localStorage`.
- **[GitHub Sync]**:
  - Đã commit và đẩy các thay đổi lên branch `main`.

---

## [2026-09-08 11:05] - Tạm Thời Vô Hiệu Hóa Tính Năng Vở Ghi Chép (Temporarily Disable Notebook Split View for Future Polish)

### 🎯 Mục tiêu

Theo yêu cầu của người dùng, tạm thời vô hiệu hóa và ẩn tính năng Vở ghi chép (Study Notebook Split View / Drawing Canvas) trên toàn bộ ứng dụng để tập trung trải nghiệm đọc Manga Webtoon mượt mà và chuẩn bị cho đợt nâng cấp, tối ưu hóa toàn diện tính năng này sau.

### ✅ Công việc đã hoàn thành

- **[Reader UI Clean-up] Ẩn nút và panel Vở ghi chép ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Ẩn nút nổi `#btnNotebookToggle` trên Floating HUD dock.
  - Ẩn thẻ aside `#readerNotebookPanel` và thanh kéo kích thước `.notebook-resizer`.
  - Cập nhật modal cài đặt `#readerSettingsModal`: Loại bỏ các tùy chọn chia đôi bố cục (Split View Trái/Phải) và cập nhật bảng phím tắt gọn gàng.
  - Đảm bảo khung đọc manga `.reader-viewport` luôn tự động tràn 100% chiều ngang màn hình không bị chiếm chỗ.
- **[Engine & Keyboard Handler Safe Guards] ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>), [`js/notebook.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/notebook.js>))**:
  - Tắt các phím tắt liên quan đến vở ghi (`N`, `Alt+S`, `Alt+F`) trong `initKeyboardNav()`.
  - Khi khởi tạo trang, tự động gỡ bỏ các class `split-notebook-active`, `layout-focus-notebook` trên thẻ `body`.
  - Hàm `toggleNotebookSplitView()` hiển thị thông báo nhẹ nhàng nếu được gọi và giữ ứng dụng ở chế độ đọc manga 100%.
- **[Auth Gate UI Refresh] ([`js/auth-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/auth-service.js>))**:
  - Cập nhật banner giới thiệu tính năng trong Cổng Đăng Nhập sang: **Đồng bộ Cloud | Webtoon Mượt Mà | Thẻ từ & Kanji**.
- **[GitHub Sync]**:
  - Đã commit và đẩy các thay đổi lên branch `main`.

---

## [2026-09-08 08:15] - Thiết Lập Cổng Bảo Vệ Đăng Nhập Bắt Buộc (Mandatory Auth Gate Barrier & Screen-Lock Guard)

### 🎯 Mục tiêu

Đảm bảo khi người dùng mới vào trang web hoặc chưa đăng nhập thì toàn bộ giao diện và kho nội dung sẽ bị khóa lại phía sau một Cổng Đăng Nhập Bắt Buộc (Auth Gate full-screen barrier). Người dùng bắt buộc phải đăng nhập (bằng tài khoản Google 1-chạm hoặc Email/Password) mới được mở khóa để đọc manga và sử dụng các tính năng học tập.

### ✅ Công việc đã hoàn thành

- **[Mandatory Auth Gate Overlay] Cổng khóa truy cập toàn màn hình ([`js/auth-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/auth-service.js>), [`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Khi chưa đăng nhập (`user == null`), hệ thống kích hoạt chế độ `body.auth-locked` (khóa cuộn, vô hiệu hóa tương tác nền) và hiển thị thẻ `#authGateOverlay` với `z-index: 999999`.
  - Thẻ Auth Gate không có nút đóng (không thể tắt bằng dấu X hay nhấp ra ngoài) để đảm bảo tính bắt buộc.
  - Tích hợp nút **"Tiếp tục với Google"** (1-Click Google OAuth) và 2 tab chuyển đổi **"Đăng Nhập"** / **"Tạo Tài Khoản Mới"** với Email & Password.
  - Hiển thị bảng tóm tắt 3 tính năng học tập nổi bật: ⚡ Đồng bộ Cloud 24/7 | 📝 Vở & Bảng vẽ độc lập | 🎴 Thẻ từ & Kanji Engine.
- **[Smooth Unlock Transition] Hiệu ứng mở khóa mượt mà**:
  - Khi người dùng đăng nhập thành công hoặc đã có phiên đăng nhập trước đó, Auth Gate tự động kích hoạt hiệu ứng mở khóa với hiệu ứng scale nhẹ và mờ dần (`.unlocked`), đồng thời gỡ bỏ `auth-locked` để người dùng vào trải nghiệm ứng dụng ngay lập tức.
  - Khi bấm **"Đăng xuất"**, màn hình lập tức khóa lại và đưa người dùng về cổng Auth Gate.
- **[Git Repository Sync]**:
  - Đã commit và đẩy phiên bản mới lên GitHub repository (`origin/main`).

---

## [2026-09-08 07:40] - Triển Khai Google Firebase Auth, Độc Lập Dữ Liệu Từng Tài Khoản & Cloud Sync Engine (Multi-Tenant Cloud Sync & Deploy Setup)

### 🎯 Mục tiêu

Tích hợp nền tảng Google Firebase (Authentication + Cloud Firestore 24/7 không bao giờ ngủ/pause) để phân vùng độc lập dữ liệu học tập cá nhân cho từng người dùng, hỗ trợ đăng nhập 1-chạm bằng Google & Email, đồng bộ đám mây đa thiết bị và chuẩn bị triển khai Deploy lên Vercel / Cloudflare Pages.

### ✅ Công việc đã hoàn thành

- **[Firebase Core Configuration] Cấu hình SDK Firebase v10 ([`js/firebase-config.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/firebase-config.js>))**:
  - Khởi tạo Firebase App, Firebase Auth và Cloud Firestore với tính năng Offline IndexedDB Persistence (Local-first cache).
  - Hỗ trợ chế độ hoạt động kép: Khi chưa cấu hình API Key thì chạy ở chế độ Khách (Guest Mode) 0ms độ trễ; khi nhập API Key thì tự động kích hoạt Cloud Sync toàn phần.
- **[Authentication Service] Dịch vụ xác thực đa phương thức ([`js/auth-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/auth-service.js>))**:
  - **Google Sign-In 1-chạm**: Đăng nhập nhanh chóng, không cần nhớ mật khẩu.
  - **Đăng ký / Đăng nhập bằng Email & Password**: Có kiểm tra độ dài mật khẩu, nút bật/tắt hiển thị mật khẩu.
  - **Quản lý phiên đăng nhập (`onAuthStateChanged`)**: Tự động cập nhật nút Avatar người dùng trên Header của toàn bộ các trang (`index.html`, `reader.html`, `detail.html`).
- **[Cloud Sync & Data Isolation Engine] Động cơ đồng bộ độc lập dữ liệu ([`js/sync-engine.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/sync-engine.js>))**:
  - Phân vùng khoang dữ liệu riêng biệt theo `users/{uid}/...`:
    - `users/{uid}/reading_progress`: Lưu vị trí đọc và trang cuối của từng bộ manga.
    - `users/{uid}/notebooks`: Lưu văn bản ghi chép và nét vẽ vector Canvas từng chương.
    - `users/{uid}/study_data/flashcards_deck`: Lưu bộ thẻ từ vựng Flashcard 3D và trạng thái thuộc/ôn tập SRS.
    - `users/{uid}/kanji_mastery`: Lưu số lần và điểm chấm nét luyện viết chữ Hán.
  - **Tự động lưu ngầm với Debounce**: Tránh spam request, phản hồi tức thì 0ms trên máy.
  - **Auto-Merge thông minh**: Tự động hợp nhất dữ liệu từ máy cục bộ lên đám mây khi khách vãng lai đăng nhập lần đầu.
- **[Security Rules & Deploy Documentation] Bảo mật CSDL & Hướng dẫn Deploy ([`firestore.rules`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/firestore.rules>), [`docs/HUONG_DAN_FIREBASE_DEPLOY.md`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/docs/HUONG_DAN_FIREBASE_DEPLOY.md>))**:
  - File `firestore.rules` khóa cứng quyền truy cập: `request.auth.uid == userId`.
  - Tài liệu hướng dẫn từng bước lấy Firebase API Keys trong 1 phút và Deploy lên Vercel / Cloudflare Pages.
- **[UI Glassmorphism Components] Modal Đăng nhập & Avatar Header ([`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>))**:
  - Thêm thẻ Modal Auth (`#authModal`) thiết kế Cyberpunk & Glassmorphism hiện đại.
  - Thêm Badge trạng thái đám mây: `☁️ Đã đồng bộ`, `⏳ Đang lưu...`, `🔌 Ngoại tuyến`.

---

## [2026-09-08 07:27] - Khắc Phục Triệt Để Mô Phỏng Thứ Tự Nét Viết & Căn Chuẩn Tâm Khung Luyện Viết Kanji (HanziWriter Vector Engine & Direct-Canvas Optical Alignment)

### 🎯 Mục tiêu

1. Sửa lỗi mô phỏng thứ tự nét viết chưa hoạt động: Thay thế hiệu ứng nhấp nháy chữ thông thường bằng Engine mô phỏng từng nét viết tuần tự thời gian thực chuẩn bút thuận (stroke-by-stroke sequential vector animation) kèm dải thẻ xem chi tiết từng nét và bộ điều khiển tốc độ/lặp nét.
2. Sửa lỗi chữ Hán trong khung luyện viết bị lệch (như chữ `道` bị đội lên sát mép trên do font-metrics của flexbox text overlay): Căn tâm quang học và toán học 100% giữa ô kẻ `米` (Mễ tự cách) trên Canvas, bổ sung bảng chọn màu cọ viết đa dạng.

### 🔍 Nguyên nhân gốc rễ

- **Mô phỏng nét viết**: Phiên bản trước chỉ áp dụng hiệu ứng CSS glow lên toàn bộ glyph chữ tĩnh mà chưa bóc tách và vẽ từng vector path nét bút tuần tự (Stroke 1 ➔ Stroke 2 ➔ Stroke N).
- **Lệch khung luyện viết**: Chữ mờ watermark được render bằng thẻ `div` HTML với `font-size: 9.5rem` trong flexbox `align-items: center`. Font chữ Hán (CJK) có baseline và ascender/descender padding không đối xứng giữa các hệ điều hành/trình duyệt, khiến các chữ có cấu trúc đầu cao như `道` bị đẩy lệch lên trên và cắt cụt ở viền trên.

### ✅ Công việc đã hoàn thành

- **[Vector Stroke Order Animator Engine] Động cơ mô phỏng nét viết chuẩn bút thuận ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`js/kanji-engine.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/kanji-engine.js>), [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Tích hợp thư viện HanziWriter và bộ dữ liệu nét chữ Hán chuẩn Nhật Bản (`hanzi-writer-data-jp`) kết hợp cơ chế fallback SVG/Canvas thông minh.
  - Tự động vẽ mượt mà từng nét theo đúng bút thuận với đầu cọ neon `#38bdf8` trên nền ô Mễ `米`.
  - Bộ nút điều khiển: **`[ ▶ Phát nét ]`**, **`[ 🔁 Lặp ]`** (tự động lặp lại liên tục), **`[ 👁️ ]`** (bật/tắt nét mờ tham chiếu) và bộ chọn tốc độ **`0.6x`**, **`1.0x`**, **`1.6x`**.
- **[Interactive Stroke Breakdown Strip] Dải thẻ xem chi tiết từng bước nét**:
  - Thanh cuộn ngang hiển thị các thẻ mini từng nét (`Nét 1`, `Nét 2`, ... `Nét N`).
  - Mỗi thẻ vẽ lại các nét trước đó (màu trắng mờ) và làm sáng bừng nét hiện tại (màu xanh cyan neon).
  - Nhấp vào bất kỳ thẻ nét nào để phóng to và phát đúng nét đó trên sân khấu chính.
- **[Direct-Canvas Optical Centering] Khắc phục 100% hiện tượng lệch khung chữ**:
  - Loại bỏ hoàn toàn lớp HTML text div dễ bị lệch baseline.
  - Chuyển việc vẽ chữ mờ Watermark trực tiếp vào Canvas trong `drawPracticeBackground()` với công thức căn tâm quang học:
    $$
    Y_{\text{center}} = \frac{H}{2} + \frac{\text{ascent} - \text{descent}}{2}
    $$

    (sử dụng `ctx.measureText` và `actualBoundingBoxAscent/Descent`).
  - Đảm bảo bất kể chữ nào (`道`, `必`, `然`, `命`, `運`, `識`, `想`, `理`, `論`...) đều nằm chính xác tuyệt đối tại tâm giao của chữ thập và hai đường chéo `米`, không bao giờ bị tràn hay lệch mép.
- **[Multi-Color Ink Brush Palette] Bảng màu cọ vẽ đa dạng**:
  - Bổ sung 5 chấm chọn màu mực cọ (`Xanh lục Neon #22c55e`, `Xanh dương #38bdf8`, `Hồng thắm #ec4899`, `Vàng hoàng yến #facc15`, `Trắng ngọc #f8fafc`).
  - Hỗ trợ nút Hoàn tác (`Lùi`), `Xóa` và `Chấm điểm nét` đánh giá tỷ lệ chuẩn xác.

---

## [2026-09-08 07:21] - Tích Hợp Xưởng Luyện Kanji & Giải Mã Bộ Thủ (Kanji Studio, AI Handwriting OCR, Radical Mnemonics & Stroke Practice Pad)

### 🎯 Mục tiêu

Xây dựng một phân hệ học tập chữ Hán/Kanji toàn diện (Tab thứ 4 trong Vở Ghi Chép) kết hợp giữa nhận diện nét viết tay tự do, bóc tách cấu tạo bộ thủ, câu thần chú gợi nhớ hình tượng vui nhộn, mô phỏng thứ tự nét viết và khung tập viết chấm điểm thông minh.

### ✅ Công việc đã hoàn thành

- **[Kanji Studio Workspace] Không gian xưởng luyện chữ Hán ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`js/kanji-engine.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/kanji-engine.js>), [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Bổ sung Tab thứ 4 trên Header quyển vở: `[ 🈯 Luyện Kanji ]` (`#tabNotebookKanji`).
  - Container `#notebookKanjiContainer` tích hợp trọn vẹn luồng học 4 bước chuẩn sư phạm ngôn ngữ.
- **[AI Handwriting Recognition & Chapter Quick-Pick] Nhận diện nét viết tay & Chọn nhanh**:
  - Khung vẽ nhận diện chữ viết tay `kanjiRecogCanvas` (gọi Google Input Tools IME Handwriting API + heuristic fallback) cho phép vẽ tự do ➔ tự động nhận diện và đưa ra danh sách ứng viên (Candidates) chính xác thời gian thực.
  - Danh sách chữ Kanji tiêu biểu của chương truyện hiện tại (`#chapterQuickKanjiList`) hỗ trợ 1-chạm nạp chữ học ngay.
- **[Radical Breakdown & Fun Mnemonics] Giải mã bộ thủ & Câu thần chú vui**:
  - Bóc tách cấu tạo chữ Kanji thành các bộ thủ thành phần (`.radical-chip` gồm Hán tự bộ, tên bộ và ý nghĩa gốc).
  - Khung **💡 Câu thần chú ghi nhớ** (`.mnemonic-box`) liên kết hình tượng các bộ thủ thành câu chuyện ngắn dí dỏm, dễ nhớ sâu.
  - Đầy đủ âm Hán-Việt, Nghĩa tiếng Việt, JLPT (N5 - N1), On/Kun readings, nút phát âm Text-to-Speech 🔊 và nút `+ Thẻ` Flashcard.
- **[Stroke Order Animator] Mô phỏng thứ tự nét viết**:
  - Hiển thị thứ tự nét viết chuẩn bút thuận (1 ➔ 2 ➔ 3...) kèm nút `[ ▶ Phát lại ]` hiệu ứng phát sáng neon nổi bật.
- **[Guided Practice Pad & Accuracy Scoring] Khung ô luyện viết & Chấm điểm nét**:
  - Khung ô kẻ `米` (Mễ tự cách) chuẩn nét.
  - 2 chế độ: **`Tập tô (Guided)`** (nét mờ watermark) và **`Tự viết (Free)`**.
  - Nút **`[ 🎯 Chấm điểm nét ]`** đánh giá độ chuẩn xác nét vẽ (%) kèm hiệu ứng pháo hoa neon sinh động khi hoàn thành.
- **[Manga 1-Click Integration] Nút mở Kanji từ Manga ([`js/study-mode.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/study-mode.js>))**:
  - Bổ sung nút **`[ 🈯 Kanji ]`** trên popup tra từ manga (`.vocab-popover`) giúp độc giả bấm 1 cú nhấp là mở ngay chữ Kanji đó trong xưởng luyện viết.

---

## [2026-09-08 07:12] - Tích Hợp Chức Năng Đảo Chiều Thuận Tay Trái & Bộ 4 Chế Độ Bố Cục Không Gian Học Tập (Left-Handed Mode & 4 Layout Workspace Modes)

### 🎯 Mục tiêu

Cung cấp khả năng đảo vị trí giữa Manga và Vở ghi chép (Vở Trái - Manga Phải) dành cho người dùng thuận tay trái khi viết bằng bút cảm ứng/stylus trên tablet/iPad, đồng thời bổ sung các chế độ tập trung (Chỉ Manga 100% hoặc Chỉ Vở ghi chép 100vw).

### ✅ Công việc đã hoàn thành

- **[Left-Handed Swap Mode] Chế độ Đảo bên công thái học ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>), [`js/notebook.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/notebook.js>))**:
  - Nút **`⇄` (Đảo bên)** (`#btnSwapNotebookSide`) trực tiếp trên Header quyển vở và phím tắt `Alt + S`.
  - Khi bật: Vở ghi chép chuyển sang **TRÁI**, Manga chuyển sang **PHẢI** (`body.notebook-side-left`).
  - Thanh Resizer tự động di chuyển sang mép phải của panel, tính toán hướng kéo chuột thích ứng linh hoạt và giữ nguyên cơ chế **Anchor-Locked Resizing** (ghim vị trí trang đứng yên 100%).
- **[4 Layout Workspace Selector] Bộ chuyển đổi 4 chế độ bố cục thông minh**:
  - `[ 📖 | 📝 ]` **Thuận tay phải (Chuẩn)**: Manga Trái • Vở Phải.
  - `[ 📝 | 📖 ]` **Thuận tay trái**: Vở Trái • Manga Phải (Cổ tay trái viết thoải mái không che manga).
  - `[ 📖 ]` **Chỉ Manga (Focus Manga)**: Đọc truyện toàn màn hình thư giãn 100vw.
  - `[ 📝 ]` **Chỉ Vở (Focus Workspace)**: Toàn màn hình Vở 100vw phục vụ vẽ Mindmap khổ lớn, luyện viết Kanji hoặc ôn tập Thẻ từ Flashcards 3D không bị phân tâm.
  - Nút **Toàn màn hình Vở** (`#btnFocusNotebook`) trên Header vở & phím tắt `Alt + F`.
- **[Settings Modal Layout Grid] Lưới chọn bố cục trực quan**:
  - Thêm thẻ Card xem trước (Preview Boxes) mô phỏng 4 chế độ trực tiếp trong Cài đặt đọc truyện.
  - Tự động lưu cấu hình `edumanga_notebook_side` và `edumanga_layout_mode` vào `localStorage`.

---

## [2026-09-07 21:20] - Tối Ưu Hitbox Cầu Nối Vô Hình & Cơ Chế Ghim Popup Tra Từ (Safe-Hitbox Hover Bridge & Click-to-Pin)

### 🎯 Mục tiêu

Sửa lỗi hitbox khi người dùng rê chuột từ từ vựng sang popup tra từ để bấm nút `+ Thẻ` thì popup bị tắt mất giữa chừng do rơi vào khoảng hở (gap), không thể bấm thêm thẻ được.

### 🔍 Nguyên nhân gốc rễ

- Khoảng hở 9px giữa chữ vựng và bảng popup (`bottom: calc(100% + 9px)` hoặc `top: calc(100% + 9px)`). Khi con trỏ chuột di chuyển qua khoảng hở này, trạng thái `:hover` bị ngắt lập tức (0ms delay), khiến popup đóng lại trước khi chuột chạm tới nút `+ Thẻ`.
- Sự kiện click toàn cục chưa loại trừ trường hợp click bên trong popup khiến popup bị toggle đóng khi thao tác.

### ✅ Công việc đã hoàn thành

- **[Invisible Hover Bridge] Cầu nối Hitbox vô hình ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Tạo pseudo-element `.vocab-popover::before` phủ trọn khoảng hở 9px và mở rộng vùng đệm an toàn xung quanh thêm 20px (áp dụng cho cả popup mở lên trên và mở lật xuống `data-flip="down"`).
  - Con trỏ chuột khi di chuyển sang popup luôn nằm trong hitbox an toàn 100%, không bao giờ bị rơi vào vùng ngắt hover.
- **[Safe Grace Period Delay] Thời gian ân hạn khi rời chuột**:
  - Thêm `transition-delay: 0.18s` khi rời chuột, giúp popup không bị tắt đột ngột nếu chuột vô tình lệch ra ngoài mép.
- **[Enlarged + Card Button] Mở rộng kích thước nút `+ Thẻ`**:
  - Tăng padding `4px 10px`, màu sắc gradient nổi bật và hiệu ứng hover phóng to `scale(1.08)` dễ bấm trên cả chuột và màn hình cảm ứng tablet.
- **[Click-to-Pin & Click-Inside Protection] Ghim popup khi nhấp chuột ([`js/study-mode.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/study-mode.js>))**:
  - Nhấp vào từ vựng sẽ ghim mở popup cố định (`.active`).
  - Click vào bất kỳ nội dung nào bên trong popup (nút `+ Thẻ`, bôi đen text) được bảo vệ không bị tắt popup.

---

## [2026-09-07 21:17] - Khắc Phục Lỗi Dồn Đống Bong Bóng Thoại Khi Tải Lại Trang (Zero-CLS & Page Skeleton Shimmer Loader)

### 🎯 Mục tiêu

Xử lý triệt để hiện tượng khi vừa tải lại trang hoặc bấm `Ctrl + Shift + R`, toàn bộ bong bóng tương tác (`CHẠM ĐỂ GIẢI MÃ`) và nhãn phân trang của tất cả 25 trang bị dồn đống, xếp chồng chéo lên nhau như ma trận ở đầu màn hình.

### 🔍 Nguyên nhân gốc rễ

- Khi tải lại trang không dùng bộ nhớ đệm (`Ctrl + Shift + R`), các thẻ `<img>` trang manga cần thời gian để tải từ máy chủ (`naturalHeight` ban đầu = `0px`).
- Do các thẻ `.reader-page-wrapper` chưa có `aspect-ratio` hoặc `min-height` cố định khi ảnh chưa tải xong, chiều cao của toàn bộ 25 trang bị xẹp về `0px`.
- Các bong bóng thoại (`.bubble-overlay`) được định vị phần trăm `top: Y%` bên trong wrapper. Khi chiều cao wrapper = 0px, toàn bộ hàng chục bong bóng của cả 25 trang bị dồn lại cùng một tọa độ Y=0 đè lên nhau.

### ✅ Công việc đã hoàn thành

- **[Aspect-Ratio & Zero-CLS Sizing] Tỷ lệ khung hình chuẩn chống giật trang ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Thiết lập `aspect-ratio: 2 / 3` và `min-height: clamp(550px, 140vw, 1150px)` cố định ban đầu cho `.reader-page-wrapper`.
  - Ngay từ micro-giây đầu tiên khi vừa tạo DOM, mỗi trang manga đã chiếm đúng diện tích khung hình chuẩn Webtoon mà không bị xẹp.
  - Khi ảnh tải xong (`.is-loaded`), tự động chuyển về `aspect-ratio: auto` để ảnh hiển thị đúng chiều cao tự nhiên.
- **[Interactive Overlay Fade-In] Ẩn bong bóng thoại trước khi ảnh sẵn sàng**:
  - Thêm quy tắc CSS ẩn các bong bóng thoại `.bubble-overlay` và `.page-number-pill` khi trang chưa tải xong (`:not(.is-loaded)`).
  - Khi ảnh load xong trang nào, tranh ảnh và bong bóng của trang đó sẽ hiện lên (`fade-in`) êm ái, thanh lịch.
- **[Cyberpunk Skeleton Shimmer Loader] Khung chờ trang công nghệ cao ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Tích hợp `createPageSkeletonElement` và `setupPageImageSkeleton` với hiệu ứng ánh sáng quét qua (`shimmer`), spinner xoay gradient và nhãn `Đang tải Trang X...`.
  - Loại bỏ hoàn toàn 100% hiện tượng bong bóng dồn đống, tạo cảm giác tải trang mượt mà chuẩn ứng dụng cao cấp.

---

## [2026-09-07 21:14] - Hoàn Thiện Thuật Toán Ghim Điểm Neo Thị Giác Khi Co Giãn Cột Manga (Anchor-Locked Resizing Engine)

### 🎯 Mục tiêu

Khắc phục hiện tượng trôi vị trí đọc (bị cuộn/roll trang manga lên xuống loạn xạ) khi người dùng kéo thanh chia đôi giữa manga và vở ghi chép để thay đổi độ rộng (width/max-width).

### 🔍 Nguyên nhân gốc rễ

- Do ảnh truyện manga trong chế độ Webtoon có tỷ lệ khung hình (`aspect-ratio`) cố định, khi chiều rộng cột manga (`width`) co lại hoặc dãn ra khi kéo thanh splitter, **chiều cao (`height`) của từng trang ảnh phía trên cũng bị co lại hoặc dãn ra tương ứng theo tỷ lệ**.
- Vì `window.scrollY` là giá trị pixel tuyệt đối từ đỉnh trang web, tổng chiều cao các trang phía trên thay đổi khiến điểm nhìn của người đọc bị trôi dạt sang trang khác (nhảy từ trang 5 xuống trang 8 hoặc lùi về trang 2).

### ✅ Công việc đã hoàn thành

- **[Visual Anchor-Locked Engine] Bộ neo tọa độ thị giác tức thì ([`js/notebook.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/notebook.js>))**:
  - `captureReadingAnchor()`: Tự động bắt vị trí phần tử trang (`.reader-page-wrapper`) đang nằm đúng tâm điểm nhìn của mắt người đọc (`window.innerHeight / 2`) cùng tỷ lệ phần trăm dọc chính xác của trang đó ngay khi bắt đầu nhấn chuột vào thanh kéo (`pointerdown`).
  - `syncReadingAnchor(anchor)`: Trong mỗi frame kéo (`pointermove`), ngay sau khi CSS Variable `--notebook-width` làm trang truyện to/nhỏ chiều ngang, hàm sẽ tính toán độ co giãn chiều cao và bù trừ tức thì qua `window.scrollBy({ top: diffY, behavior: 'instant' })`.
  - **Kết quả**: Vị trí tranh ảnh / dòng thoại / từ vựng ngay trước mắt độc giả được **ghim đứng yên 100% tại chỗ**, trang truyện chỉ phóng to thu nhỏ chiều ngang mượt mà tuyệt đối mà không có bất kỳ hiện tượng nhảy hay cuộn trang nào.
- **[Transition Anchor Animation] Đồng bộ khi mở / đóng Vở ghi chép**:
  - Áp dụng `requestAnimationFrame` đồng bộ neo thị giác trong suốt 300ms hiệu ứng chuyển cảnh của CSS transition khi bấm nút bật/tắt Vở (phím N).
  - Áp dụng neo thị giác khi nhấp đúp (Double-click) vào thanh phân cách để đưa về độ rộng mặc định 480px.

---

## [2026-09-07 21:03] - Tích Hợp Bộ Thẻ Từ Ghi Nhớ & Thu Thập 1-Chạm (Interactive Flashcards Deck & 1-Click Collection)

### 🎯 Mục tiêu

Xây dựng tính năng thu thập từ vựng 1-chạm ngay trên bong bóng tra từ manga và tab **"Thẻ từ" (Flashcards Deck)** trong Vở ghi chép, cho phép độc giả tự động tích lũy từ mới theo chương, luyện tập lật thẻ 3D, nghe phát âm và xuất file Anki/CSV để ôn tập dài hạn.

### ✅ Công việc đã hoàn thành

- **[1-Click Flashcard Add Button] Nút thêm thẻ tức thì ([`js/study-mode.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/study-mode.js>), [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Bổ sung nút bấm `.btn-popover-add-card` (`+ Thẻ`) trực tiếp trên thanh tiêu đề của popup tra từ (`.vocab-popover`).
  - Khi bấm, từ vựng (chữ Hán, Furigana/Pinyin, âm Hán-Việt, nghĩa tiếng Việt) tự động được trích xuất và thêm vào bộ thẻ của chương.
  - Hiệu ứng phản hồi xúc giác: nút đổi thành icon check xanh `Đã thêm` + thông báo Toast sống động.
- **[Flashcards Tab & Deck Management] Tab Thẻ từ trong Vở ghi chép ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`js/notebook.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/notebook.js>))**:
  - Bổ sung Tab thứ 3 trên thanh header quyển vở: `[ 🗂️ Thẻ từ ]` kèm huy hiệu đếm số lượng (`tab-badge-counter`) tự động cập nhật thời gian thực.
  - Hiển thị danh sách thẻ từ đã lưu với đầy đủ thẻ tag màu sắc (Hán-Việt, Nghĩa), nút loa phát âm 🔊 (Text-to-Speech `window.speechSynthesis`), nút toggle đánh dấu `Đã thuộc ✅` / `Cần ôn ⏳` và nút xóa thẻ.
  - Nút **Tạo thẻ thủ công** (`promptAddManualCard`) cho phép người dùng tự gõ thêm bất kỳ thuật ngữ nào.
- **[3D Interactive Practice Session] Chế độ ôn tập lật thẻ 3D**:
  - Bấm nút **"▶ Ôn tập"** để mở không gian lật thẻ 3D toàn màn hình bên trong bảng Notebook.
  - Hiệu ứng lật thẻ 3D mượt mà (`rotateY(180deg)`): Mặt trước (Từ vựng + Phiên âm + Nút nghe phát âm) ➔ Chạm để lật sang Mặt sau (Hán-Việt + Ý nghĩa chi tiết).
  - 2 nút đánh giá nhanh: `[ ↩ Chưa thuộc ]` và `[ ✅ Đã nhớ ]` hỗ trợ phương pháp lặp lại ngắt quãng (Spaced Repetition).
- **[Anki / CSV Export & Persistence] Tự động lưu & Xuất file Anki**:
  - Tự động lưu danh sách thẻ từ theo từng chương truyện vào `localStorage` (`edumanga_flashcards_${series}_${chap}`).
  - Nút **Xuất Anki** (`exportFlashcardsAnki`) tự động tạo file TSV/Text tương thích 100% để import trực tiếp vào Anki hoặc Quizlet.

---

## [2026-09-07 20:52] - Tích Hợp Thanh Kéo Phân Chia Độ Rộng Linh Hoạt (Draggable Resizer Splitter Workspace)

### 🎯 Mục tiêu

Cho phép người dùng tự do kéo thả thanh phân cách giữa trang manga và quyển vở để tùy biến diện tích hiển thị (trái rộng - phải hẹp hoặc trái hẹp - phải rộng), phục vụ đa dạng nhu cầu: đọc lướt, ghi chú nhanh hoặc vẽ sơ đồ tư duy / luyện viết chữ Hán cỡ lớn.

### ✅ Công việc đã hoàn thành

- **[Resizer Gutter Component] Thanh kéo phân cách trực quan ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Đặt phần tử `#notebookResizer` với con trỏ `col-resize` và nút gân cầm nắm (`.resizer-grip`) 3 chấm nổi bật ở đường biên chia đôi.
  - Hiệu ứng phát sáng dạ quang neon khi rê chuột hoặc đang thao tác kéo (`body.is-resizing-notebook`).
  - Hỗ trợ biến CSS toàn cục `--notebook-width` điều khiển đồng bộ toàn bộ kích thước của Viewport Manga, Bottom Bar, Floating Dock và Notebook Panel.
- **[Draggable Pointer Engine] Bộ xử lý kéo thả mượt mà 60fps ([`js/notebook.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/notebook.js>))**:
  - Sử dụng sự kiện `PointerEvent` (`setPointerCapture`) hỗ trợ rê chuột, trackpad và thao tác vuốt cảm ứng trên iPad / Tablet / Bảng vẽ.
  - Tắt hiệu ứng transition khi đang kéo (`transition: none !important`) giúp phản hồi tức thì 60fps không có độ trễ.
  - Thiết lập vùng an toàn: Vở tối thiểu `320px` (tránh vỡ nút công cụ) và tối đa `window.innerWidth - 280px` (tránh làm mất manga).
  - Tự động lưu độ rộng ưa thích vào `localStorage` (`edumanga_notebook_width`) và áp dụng cho các lần đọc tiếp theo.
  - **Nhấp đúp (Double-click)**: Đặt lại độ rộng chuẩn mặc định 480px.
- **[Live Re-scaling & Canvas Preserve] Tự động căn chỉnh manga & bảo toàn nét vẽ ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Hook `onNotebookResized(newWidth)` tự động tính toán lại tỷ lệ Fit Width tối ưu cho cột manga bên trái trong thời gian thực.
  - Canvas vẽ tay tự động điều chỉnh độ phân giải mà không làm mất hay méo bất kỳ nét vẽ nào đang có.

---

## [2026-09-07 20:44] - Tinh Chỉnh Bố Cục Vở Ghi Chép & Khóa Zoom Màn Hình Ở Chế Độ Split View

### 🎯 Mục tiêu

- Khắc phục lỗi bố cục: Header quyển vở bị tràn hàng, nút tab "Viết tay / Vẽ" bị co thắt thành hình tròn gãy dòng, dải công cụ vẽ bị rớt dòng lộn xộn.
- Khóa tính năng phóng to/thu nhỏ (Zoom Lock) khi đang ở chế độ Vở ghi chép song song (Split View) để giữ ổn định trang manga, tránh việc vô tình cuộn/zoom làm lệch vị trí đọc khi đang thao tác viết hoặc vẽ.

### ✅ Công việc đã hoàn thành

- **[Layout Refactor] Đại tu bố cục Header & Toolbar Vở Ghi Chép ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>), [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - **Notebook Header**: Phân bố thành 3 khu vực rõ ràng (Trái: Tiêu đề + Huy hiệu chương cắt ngắn thông minh; Giữa: Tab chuyển chế độ dạng viên thuốc `notebook-tab-pill` với `white-space: nowrap; flex-shrink: 0;`; Phải: Nút Tải về & Đóng vở).
  - **Drawing Toolbar**: Chia thành 2 hàng tinh tế (`notebook-toolbar-row`), gom nhóm gọn gàng:
    - *Hàng 1*: Bộ 3 công cụ (Bút / Dạ quang / Tẩy) + Bảng 6 màu sắc + 3 Cỡ nét.
    - *Hàng 2*: Bộ 3 mẫu giấy (Ô vuông Kanji, Kẻ ngang, Nền tối) + Nhóm Undo / Redo / Xóa nét vẽ.
  - **Text Toolbar**: Tích hợp thanh công cụ chuyên biệt khi ở tab Ghi chú với các nút chèn mẫu từ vựng (`insertVocabTemplate`), mẫu ngữ pháp (`insertGrammarTemplate`) và nút xuất Markdown `.md`.
  - **Floating Dock Position**: Cột nút nổi bên phải tự động lùi sang trái `right: 495px` khi mở vở để không che khuất bảng vẽ.
- **[Split-View Zoom Lock & Auto-Fit] Tự động căn chỉnh & Khóa Zoom ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>), [`js/notebook.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/notebook.js>))**:
  - Khi mở Vở ghi chép (`split-notebook-active`):
    - Tự động tính toán bề rộng khung manga còn lại bên trái (`window.innerWidth - 480px`) và căn chỉnh tỷ lệ hiển thị tối ưu (Fit width vừa vặn).
    - Khóa toàn bộ các thao tác zoom: `Ctrl + Lăn chuột`, `Pinch Trackpad`, các phím tắt zoom (`+`, `-`, `=`, `0`) và thanh trượt zoom trong Cài đặt.
    - Dock điều khiển zoom trên Header chuyển sang trạng thái khóa (`.is-locked`) hiển thị biểu tượng ổ khóa màu vàng cam 🔒.
  - Khi đóng Vở ghi chép:
    - Tự động khôi phục lại tỷ lệ zoom ban đầu của độc giả (`preSplitZoomScale`) và mở khóa toàn bộ các nút điều khiển.

---

## [2026-09-07 20:35] - Tích Hợp Quyển Vở Ghi Chép Chia Đôi Màn Hình (EduNotebook Split-Screen Study Workspace)

### 🎯 Mục tiêu

Xây dựng không gian học tập và ghi chép song song (Split-Screen Workspace) ngay trong trình đọc manga (`reader.html`). Bên trái là tranh truyện manga với đầy đủ tính năng tương tác học tập, bên phải là quyển vở ghi chép hỗ trợ vẽ tay/bút cảm ứng (Stylus tablet/Mouse) và soạn thảo Markdown cho từng chương truyện.

### ✅ Công việc đã hoàn thành

- **[Canvas Drawing Engine] Bộ vẽ tay cảm ứng & chuột độ phân giải cao ([`js/notebook.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/notebook.js>))**:
  - Hỗ trợ HTML5 Canvas xử lý chuẩn `devicePixelRatio` (chống vỡ nét vẽ trên màn hình Retina / 2K / 4K).
  - Sử dụng sự kiện `PointerEvent` (`pointerdown`, `pointermove`, `pointerup`) kèm `setPointerCapture` nhận diện lực nhấn bút (`pressure`) cho bút cảm ứng (Wacom, Apple Pencil, Samsung S-Pen) và chuột mượt mà.
  - Bộ công cụ hoàn chỉnh: Bút viết (Pen), Bút dạ quang (Highlighter), Tẩy nét vẽ (Eraser `destination-out`).
  - Bảng màu học tập 6 màu (Trắng, Vàng, Đỏ pastel, Xanh dương, Tím, Xanh lá) cùng 3 cỡ nét (Nhỏ 3px, Vừa 6px, Đậm 12px).
  - 3 chế độ nền giấy học tập: Giấy kẻ ô vuông Kanji/Genkouyoushi (`pattern-grid`), Giấy kẻ ngang (`pattern-lines`), Nền tối OLED (`pattern-blank`).
  - Hỗ trợ ngăn xếp Hoàn tác / Làm lại (Undo / Redo 25 bước) và nút Xóa nhanh trang vẽ.
- **[Rich Text Notes & Template] Soạn thảo ghi chú Markdown**:
  - Tích hợp khung soạn thảo ghi chú văn bản với nút chèn mẫu cấu trúc từ vựng / ngữ pháp nhanh (`insertVocabTemplate`).
  - Chuyển đổi linh hoạt giữa 2 tab: `Viết tay / Vẽ` và `Ghi chú Text`.
- **[Per-Chapter Auto-Persistence & Export] Tự động lưu trữ & Xuất file**:
  - Tự động lưu tranh vẽ tay (`DataURL`) và nội dung ghi chú text vào `localStorage` theo từng chương truyện (`edumanga_notebook_${seriesId}_${chapId}`).
  - Hỗ trợ xuất và tải về máy: Tải ảnh ghi chép vẽ tay dưới dạng file `.png` và tải ghi chú văn bản dưới dạng file `.md` (Markdown).
- **[Split-View Layout & Responsive] Bố cục chia đôi màn hình tinh tế ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Thiết kế lớp `.split-notebook-active` dịch chuyển mượt mà viewport manga sang trái 460px với hiệu ứng `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Panel bên phải cố định 460px với hiệu ứng viền kính mờ (`Glassmorphism`), thanh công cụ trượt ngang thông minh và trạng thái lưu realtime.
  - Hỗ trợ phím tắt `N` hoặc nút bấm quyển vở trên thanh công cụ nổi (Floating Dock) để bật/tắt nhanh.

---

## [2026-09-07 20:32] - Khắc Phục Lỗi Tràn Bố Cục Hộp Thoại Cài Đặt (Responsive Modal Card & Scroll Overflow)

### 🎯 Mục tiêu

Sửa lỗi hộp thoại Cài đặt bị cắt cụt phần đáy trên các màn hình có chiều cao giới hạn (laptop/tablet), làm mất một phần mục `Hiển thị số thứ tự thoại`.

### ✅ Công việc đã hoàn thành

- **[Modal Card Max Height & Scroll] Tối ưu giới hạn chiều cao ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Bổ sung `max-height: calc(100vh - 2rem)` và `overflow-y: auto` kèm thanh cuộn siêu mỏng 5px tinh tế cho thẻ `.reader-modal-card`.
  - Tối ưu khoảng cách đệm: `margin-bottom: 0.95rem;`, `padding: 0.6rem 0.85rem;` cho các khối công tắc gạt.
  - Toàn bộ 4 công tắc học tập và các tùy chọn cài đặt hiển thị vừa vặn, trọn vẹn 100% trên mọi kích cỡ màn hình mà không bao giờ bị cắt viền.

---

## [2026-09-07 20:30] - Tinh Gọn Hộp Thoại Cài Đặt (Streamline Zoom Settings Modal)

### 🎯 Mục tiêu

Gỡ bỏ hàng nút preset zoom (`30%`, `60%`, `Chuẩn 820px`, `Tràn màn hình`) trong hộp thoại Cài đặt để giao diện gọn gàng, tinh tế, giữ lại thanh trượt điều chỉnh liên tục kết hợp cùng Header Dock và phím tắt.

### ✅ Công việc đã hoàn thành

- **[UI Cleanup] Tinh gọn giao diện ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>))**:
  - Gỡ bỏ hàng nút bấm preset phụ trong mục `Manga Zoom`.
  - Giữ lại thanh trượt mượt mà (dải 30% -> Max Width) với nhãn hiển thị tỷ lệ phần trăm sống động.

---

## [2026-09-07 20:27] - Cố Định Kích Thước Huy Hiệu Số Trang & Dải Phân Cách (Fixed UI Control Sizing)

### 🎯 Mục tiêu

Đảm bảo 2 phần tử hiển thị số trang: **Huy hiệu góc trang (`page-number-pill`)** và **Dải phân cách chương (`webtoon-page-divider .divider-badge`)** luôn giữ kích thước cố định như các nút chức năng giao diện (`Header/Footer UI`), không bị phóng to hay thu nhỏ theo tranh truyện khi zoom.

### ✅ Công việc đã hoàn thành

- **[Fixed Corner Badge] Cố định huy hiệu góc tranh ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Gán kích thước cố định `font-size: 11px`, `height: 24px`, `padding: 3px 10px`, `bottom: 10px; right: 10px;`.
  - Giữ nguyên độ sắc nét và kích thước chuẩn của nút điều khiển giao diện dù tranh truyện có zoom ở 30% hay Tràn màn hình.
- **[Fixed Webtoon Divider] Cố định dải phân trang giữa các trang**:
  - Huy hiệu giữa dòng `divider-badge` luôn giữ kích thước cố định `font-size: 11px`, `height: 26px`, `padding: 4px 14px`.
  - Dải phân cách `webtoon-page-divider` tự động lấp đầy 100% bề rộng tranh truyện (`width: 100%`), đường kẻ 2 bên kéo dài tự nhiên mà không làm méo hay vỡ khung huy hiệu chữ.

---

## [2026-09-07 20:25] - Mở Rộng Dải Thu Nhỏ Xuống Tối Thiểu 30% (Wide-Range Zoom Engine: 30% -> Max Width)

### 🎯 Mục tiêu

Cho phép độc giả thu nhỏ toàn diện cột manga xuống tối thiểu 30% (tương đương ~246px) để bao quát toàn bộ trang truyện và nhiều trang liên tiếp, phục vụ đọc lướt hoặc kiểm tra tổng thể.

### ✅ Công việc đã hoàn thành

- **[30% Minimum Zoom Scale] Cập nhật phạm vi thu nhỏ ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Khai báo hằng số `MIN_MANGA_ZOOM = 0.3` (30%).
  - Dải phóng to/thu nhỏ mở rộng thành `[30% ➔ Tràn 100% màn hình]`.
  - Công thức khóa điểm neo pixel-perfect tiếp tục duy trì 0 pixel lệch khi thu nhỏ về 30%.
- **[UI Settings & Range Slider] Cập nhật giao diện Cài đặt ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>))**:
  - Thanh trượt điều chỉnh từ `min="30"` đến `max="Tràn màn hình"` với bước nhảy `step="5"`.
  - Bổ sung 2 nút preset thu nhỏ nhanh `30%` và `60%` bên cạnh `Chuẩn (820px)` và `Tràn viền`.
- **[Responsive Speech Bubbles] Tinh chỉnh cỡ chữ bóng thoại ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Hạ cận dưới font clamp xuống `5.5px` để khi thu nhỏ về 30%, toàn bộ bong bóng thoại vẫn vừa vặn, không tràn mép tranh.

---

## [2026-09-07 20:22] - Giới Hạn Chuẩn Max Ngang (Fit-Width Ceiling) Triệt Tiêu Roll

### 🎯 Mục tiêu

Khắc phục lỗi khi phóng to vượt quá bề ngang màn hình (`max ngang`) khiến trang bị trôi/cuộn (do kích thước DOM thực tế bị chặn ở 100vw nhưng biến số zoom JS vẫn tiếp tục tăng).

### ✅ Công việc đã hoàn thành

- **[Fit-Width Ceiling Clamp] Giới hạn chuẩn xác ở 100% bề ngang màn hình ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Tính toán ngưỡng phóng to tối đa `getMaxZoomScale() = window.innerWidth / 820`.
  - Cắt chính xác phạm vi phóng to trong khoảng `[1.0 (820px) ➔ maxScale (Tràn màn hình)]`.
  - Khi đã chạm mức Tràn màn hình (`max ngang`), nếu tiếp tục cuộn `Ctrl + Cuộn chuột`, hàm lập tức dừng lại và không nhân tỷ lệ `scrollY` nữa, triệt tiêu 100% hiện tượng trôi trang.
  - Tự động giới hạn thanh trượt trong Cài đặt (`modalZoomSlider.max = maxScale * 100`) và cập nhật linh hoạt khi thay đổi kích thước cửa sổ (`window.resize`).

---

## [2026-09-07 20:10] - Tối Ưu Hóa GPU Hardware-Accelerated Canvas Layer & 2D Pan Drag (Zero-Jitter Zoom Engine)

### 🎯 Mục tiêu

Loại bỏ triệt để hiện tượng giật cục (layout reflow jitter) và trôi lệch tiêu điểm khi phóng to bằng cách chuyển toàn bộ cơ chế phóng to sang tầng GPU Hardware-Accelerated Matrix Transform (`translate3d + scale`), kết hợp tính năng kéo thả 2D (Pan & Drag) mượt mà 60 FPS.

### ✅ Công việc đã hoàn thành

- **[GPU Canvas Layer] Tách lớp phần cứng `manga-canvas-layer` ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Đóng gói toàn bộ các trang manga và bong bóng thoại vào lớp `#mangaCanvasLayer` với thuộc tính `will-change: transform;` và `transform: translate3d(tx, ty, 0) scale(s)`.
  - Loại bỏ hoàn toàn quá trình tính toán lại layout (Reflow) của trình duyệt khi cuộn hoặc zoom, đảm bảo tốc độ khung hình đạt 60-120 FPS không độ trễ.
- **[Precision Focal Locking] Khóa tiêu điểm con trỏ chuột chính xác đến từng pixel ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Áp dụng công thức chuyển đổi tọa độ không gian Canvas (`unscaled = (local - tx) / oldScale; newTx = local - unscaled * newScale`).
  - Điểm ảnh ngay dưới con trỏ chuột (hoặc 2 đầu ngón tay cảm ứng) được giữ cố định tuyệt đối trong suốt quá trình phóng to/thu nhỏ.
- **[2D Pan & Drag] Kéo rê tranh mượt mà**:
  - Khi zoom > 100%, con trỏ tự động chuyển sang biểu tượng bàn tay (`grab` / `grabbing`), cho phép độc giả nhấn giữ chuột hoặc vuốt ngón tay để di chuyển tự do khắp mọi ngóc ngách của bức tranh.
- **[Smart Wheel & Pinch Navigation]**:
  - `Ctrl + Cuộn chuột` / Trackpad Pinch: Phóng to/thu nhỏ chuẩn xác 100% tại vị trí trỏ chuột.
  - Khi đang zoom > 100%: Cuộn chuột thông thường sẽ tự động chuyển thành cuộn/pan trang 2D mượt mà.
  - Nhấp đúp chuột (Double Click) / Double Tap: Phóng to 180% thẳng vào vị trí vừa nhấp và thu nhỏ về 100% khi nhấp lần nữa.

---

## [2026-09-07 19:58] - Loại Bỏ Chế Độ Trang Đôi & Tinh Gọn Trình Đọc (Streamline Reader Modes)

### 🎯 Mục tiêu

Loại bỏ hoàn toàn Chế độ Trang đôi (`mode-double`) theo yêu cầu người dùng, giữ lại 2 chế độ đọc cốt lõi tối ưu nhất là **Webtoon cuộn dọc** và **Trang đơn (Single Page)**.

### ✅ Công việc đã hoàn thành

- **[UI] Cập nhật Menu Cài đặt ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>) & [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Gỡ bỏ nút chọn "Trang đôi" trong hộp thoại Cài đặt đọc.
  - Chuyển bố cục nút chọn chế độ sang lưới 2 cột (`grid-template-columns: repeat(2, 1fr)`) cân đối, đẹp mắt.
  - Xóa bỏ toàn bộ các lớp CSS thừa của `mode-double`.
- **[Engine Logic] Tinh gọn điều hướng ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))**:
  - Xóa bỏ logic render 2 trang song song trong `renderPages()`.
  - Tự động chuyển đổi người dùng có cấu hình cũ `localStorage = 'double'` về chế độ `single`.
  - Đơn giản hóa hàm lật trang `nextPage()` và `prevPage()` với bước nhảy 1 trang chuẩn xác.
- **[Docs] Đồng bộ tài liệu**:
  - Cập nhật [`README.md`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/README.md>) và [`docs/HUONG_DAN_SU_DUNG.md`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/docs/HUONG_DAN_SU_DUNG.md>).

---

## [2026-09-07 19:35] - Hoàn Thiện Chế Độ Trang Đơn Chuẩn Tỷ Lệ Webtoon 1:1 & Tối Ưu Khung Thoại Đố Vui

### 🎯 Mục tiêu

Đồng bộ hóa 100% bố cục, kích thước container và tỷ lệ co giãn của Chế độ Trang đơn (`mode-single`) khớp hoàn hảo với Chế độ Webtoon (`mode-webtoon`), đồng thời tinh chỉnh tỷ lệ chữ (`1.45cqi`) và thu gọn huy hiệu Đố vui Flashcard để không che khuất nét vẽ manga.

### ✅ Công việc đã hoàn thành

- **[Layout Engine] Đồng bộ 1:1 giữa Trang đơn và Webtoon ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - `mode-single` và `mode-webtoon` dùng chung khung `max-width: 820px; width: 100%; margin: 0 auto;`.
  - Khung tranh `reader-page-img` hiển thị kích thước tự nhiên nguyên bản (`width: 100%; height: auto; display: block;`), không thêm viền đổ bóng giả lập làm lệch cảm giác mắt đọc.
  - Chế độ Trang đôi (`mode-double`) co giãn đối xứng 50%-50% tự động, nếu trang cuối là trang lẻ thì tự động căn giữa tự nhiên.
- **[Typography & Scaling] Chuẩn hóa cỡ chữ bóng thoại**:
  - Điều chỉnh font clamp sang `clamp(8px, calc(var(--font-scale, 1) * 1.45cqi), 14.5px)` kết hợp `text-wrap: balance` giúp khung thoại luôn thanh thoát, vừa vặn trên mọi độ phân giải và khi phóng to trình duyệt (`Ctrl +`).
- **[Flashcard Quiz Mode] Thu gọn huy hiệu đố vui siêu tinh tế**:
  - Khi chưa giải mã: Khung thoại không mở rộng theo chiều cao văn bản ẩn mà thu gọn thành nút dạ quang nhỏ gọn `🪄 CHẠM ĐỂ GIẢI MÃ` đặt ngay tâm khung.
  - Khi click/chạm: Bung mở toàn bộ lời thoại và nền trắng Manga sắc nét tức thì.
- **[Navigation] Điều hướng mượt mà**:
  - Tự động cuộn mượt về đỉnh trang mỗi khi chuyển trang (`window.scrollTo({ top: 0 })`).

---

## [2026-09-07 19:18] - Tối Ưu Độ Trong Suốt 100% Cho Chế Độ Đố Vui (Crystal Clear Flashcard Mode)

### 🎯 Mục tiêu

Gỡ bỏ hoàn toàn hiệu ứng mờ kính (`backdrop-filter`) gây đục nền tranh, chuyển sang cơ chế viền nét đứt siêu trong suốt giúp độc giả nhìn thấy 100% nét vẽ và bối cảnh phía sau sắc nét hoàn hảo.

### ✅ Công việc đã hoàn thành

- **[UI/UX] Giao diện Siêu Trong Suốt 100% Sắc Nét ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Gỡ bỏ hoàn toàn `backdrop-filter: blur`, giữ nguyên độ sắc nét tuyệt đối của tranh vẽ bên dưới.
  - Ẩn hoàn toàn chữ lời thoại (`opacity: 0`), không tạo bóng mờ xám lem nhem lên tranh.
  - Định hình khung thoại bằng viền nét đứt Neon dạ quang thanh mảnh (`2px dashed rgba(99, 102, 241, 0.85)`).
  - Đặt huy hiệu nổi nhỏ nhắn `🪄 CHẠM ĐỂ GIẢI MÃ` ở chính giữa khung.
- **[Interaction] Chạm Mở Lời Thoại Mượt Mà**:
  - Khi chạm vào khung: Nền trắng bong bóng thoại Manga và toàn bộ câu chữ hiện ra sắc nét tức thì.

---

## [2026-09-07 19:10] - Khắc Phục Lỗi Đồng Bộ Cài Đặt Khi Tải Lại Trang (Settings Lifecycle & DOM Sync Bugfix)

### 🎯 Mục tiêu

Sửa lỗi khi người dùng đã lưu cài đặt (như ẩn bóng thoại, ẩn số trang, chế độ đố vui), khi thoát ra vào lại hoặc reload trang, công tắc trong menu cài đặt vẫn hiển thị đúng trạng thái nhưng giao diện ngoài tranh lại không tự động áp dụng (phải bấm tắt/bật lại mới ăn).

### ✅ Công việc đã hoàn thành

- **[Bugfix] Nạp cấu hình `localStorage` trước khi dựng DOM ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>) & [`js/study-mode.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/study-mode.js>))**:
  - Đưa toàn bộ việc đọc `localStorage` lên đầu chu trình khởi chạy `DOMContentLoaded`, trước khi gọi `loadChapterData()` và `renderPages()`.
  - Bổ sung 2 hàm đồng bộ cưỡng bức `applyStudyModeToDom()` và `applyPageNumberStyles()` đảm bảo 100% phần tử tranh truyện, bóng thoại và số trang luôn phản ánh chính xác cấu hình đã lưu ngay từ khung hình đầu tiên.
  - Tự động gắn class `.active` chuẩn xác cho các nút chọn Chế độ đọc (Webtoon / Trang đơn / Trang đôi) trong hộp thoại Cài đặt.

---

## [2026-09-07 19:05] - Triển Khai Tính Năng Tự Động Đánh Số Trang & Dải Phân Cách Webtoon (Auto Page Numbering & Dividers)

### 🎯 Mục tiêu

Tự động gắn số trang rõ ràng, đẹp mắt trên từng khung tranh manga mà không cần tác giả phải ghi chú thủ công trong dữ liệu kịch bản, nâng cao trải nghiệm theo dõi tiến độ đọc của độc giả.

### ✅ Công việc đã hoàn thành

- **[Feature] Huy hiệu số trang góc tranh Glassmorphism ([`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>) & [`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Tự động tạo thẻ `.page-number-pill` tại góc dưới-phải của mỗi khung tranh (`Trang X / Y`).
  - Hiệu ứng kính mờ Dark Glassmorphism tinh tế, không che tranh và tự động phát sáng nhẹ khi hover.
  - Tương thích 100% trên cả 3 chế độ đọc: Webtoon cuộn dọc, Trang đơn, Trang đôi.
- **[Feature] Dải phân cách giữa các trang Webtoon (`.webtoon-page-divider`)**:
  - Trong chế độ Webtoon, tự động chèn dải phân cách thanh lịch giữa các trang kèm tên chương và số trang (`Trang X / Y • Tiêu đề chương`).
- **[Feature] Tích hợp Tùy chọn Bật/Tắt trong Cài Đặt ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>))**:
  - Thêm công tắc `Tự động đánh số trang` trong hộp thoại Cài đặt đọc, tự động lưu trạng thái vào `localStorage`.

---

## [2026-09-07 13:30] - Tối Ưu Hiển Thị Thoại & Ra Mắt Popover Tra Cứu Từ Vựng Tương Tác (Interactive Kanji Tooltip)

### 🎯 Mục tiêu

Giải quyết tình trạng bong bóng thoại bị tràn khung, rối mắt do chứa chuỗi chú thích dài ngoặc đơn như `必然 (ひつぜん - Tất Nhiên - tất yếu)`. Chuyển sang hiển thị mặc định từ vựng/Kanji gốc thuần túy, chỉ bật popup giải nghĩa chi tiết khi người đọc di chuột (Hover) hoặc chạm (Click/Tap).

### ✅ Công việc đã hoàn thành

- **[Feature] Bộ Parser Từ Vựng Tương Tác ([`js/study-mode.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/study-mode.js>))**:
  - Viết hàm `formatInteractiveDialogue(text)` tự động phân tích và bóc tách các chú thích từ vựng trong ngoặc (`(...)`, `（...）`).
  - Tự động nhận diện và phân loại: Từ Kanji gốc, Cách đọc Furigana/Hiragana, Âm Hán-Việt, và Nghĩa tiếng Việt.
  - Tự động bỏ qua các ngoặc số thông thường (như năm `(1991)` hay `(Narrator)`).
- **[UI/UX] Giao diện Popover Tra Cứu Cao Cấp ([`css/reader.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/reader.css>))**:
  - Thiết kế thẻ `.vocab-interactive` với gạch chân màu chàm (Indigo), chấm tương tác tinh tế và hiệu ứng highlight khi hover.
  - Thiết kế thẻ nổi `.vocab-popover` chuẩn Glassmorphism:
    - **Header**: Tên Kanji nổi bật màu Cyan + Badge phiên âm Hiragana hồng phấn.
    - **Body**: Thẻ Badge Hán-Việt (Xanh ngọc) và Nghĩa tiếng Việt (Xanh lá) rõ ràng, dễ nhìn.
  - **Cơ chế Flip-Down thông minh**: Tự động đảo chiều popup xuống dưới nếu bóng thoại nằm sát mép trên khung tranh (`posY < 26%`).
  - **Hỗ trợ Đa Nền Tảng**: Hoạt động mượt mà trên Desktop (Hover hoặc Click) và Mobile/Tablet (Tap để mở/đóng).
- **[Integration] Tương thích Flashcard & Quiz Mode**:
  - Không làm xung đột với sự kiện click giải mã bóng thoại trong chế độ đố vui.

---

## [2026-09-07 08:05] - Biên Soạn Bộ Tài Liệu Hướng Dẫn Sử Dụng Chi Tiết (User Manual & Help Modal)

### 🎯 Mục tiêu

Cung cấp tài liệu hướng dẫn sử dụng toàn diện cho cả 2 đối tượng: Người sáng tác (Zero-code Content Creator) và Độc giả / Người học (Reader & Student), đồng thời tích hợp modal hướng dẫn tương tác trực tiếp trên giao diện web.

### ✅ Công việc đã hoàn thành

- **[Docs] Tài liệu hướng dẫn sử dụng chi tiết ([`docs/HUONG_DAN_SU_DUNG.md`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/docs/HUONG_DAN_SU_DUNG.md>))**:
  - Hướng dẫn quy ước đặt tên thư mục & file JSON kịch bản.
  - Hướng dẫn thêm môn học mới, thêm chương truyện mới mà không cần chạm vào code.
  - Hướng dẫn trải nghiệm các chế độ đọc Webtoon / Trang đơn / Trang đôi, chế độ Đố vui Flashcard và Kịch bản thoại.
  - Bảng phím tắt bàn phím Cheat Sheet đầy đủ và các câu hỏi thường gặp (Troubleshooting).
- **[Feature] Modal Hướng Dẫn Nhanh trên Web UI ([`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>) & [`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>))**:
  - Thêm nút Trợ giúp `<i class="fas fa-question-circle"></i>` trên thanh Header để người dùng có thể xem nhanh phím tắt và hướng dẫn mọi lúc.

---

## [2026-09-07 08:00] - Hoàn Tất Xây Dựng Hệ Thống Tự Động Xuất Bản Không Cần Code (Zero-Code Auto-Sync Pipeline)

### 🎯 Mục tiêu

Xây dựng giải pháp tự động hóa toàn diện giúp người dùng chỉ cần kéo-thả file `.json` và `.pdf` vào các thư mục môn học là website tự động cập nhật truyện mới, chương mới, nhân vật và bóng thoại ngay lập tức mà không cần chỉnh sửa bất kỳ dòng code nào.

### ✅ Công việc đã hoàn thành

- **[Feature] Bộ quét động toàn diện ([`scripts/auto_scanner.py`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/scripts/auto_scanner.py>))**:
  - Tự động nhận diện 100% các thư mục môn học (kể cả khi tạo thêm môn thứ 5, 6, 7...).
  - Tự động bóc tách nhân vật, trang ảnh truyện, bong bóng thoại (`overlays`) và kịch bản (`dialogue`).
  - **Cơ chế Incremental Cache (`.cache_registry.json`)**: Tốc độ quét chỉ mất **~0.49 giây**, chỉ xuất các file mới thêm vào, không làm chậm hay tốn tài nguyên máy.
- **[Feature] Server tích hợp Auto-Watcher ([`scripts/dev_server.py`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/scripts/dev_server.py>))**:
  - Chạy ngầm tiến trình giám sát thư mục (Auto File Watcher) chu kỳ 2.5 giây.
  - Cung cấp API endpoint `/api/sync` cho phép trigger đồng bộ tức thì qua HTTP.
- **[Feature] Nút Đồng Bộ Nhanh & Phím Tắt trên Web UI ([`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>) & [`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>))**:
  - Nút biểu tượng xoay `<i class="fas fa-sync-alt"></i>` trên thanh Header.
  - Phím tắt toàn cục **`Ctrl + Shift + S`** giúp làm mới dữ liệu từ thư mục chỉ với 1 thao tác.

---

## [2026-09-07 00:10] - Khắc Phục & Kích Hoạt 100% Bong Bóng Thoại Nhân Vật (Manga Speech Bubbles)

### 🎯 Mục tiêu

Sửa lỗi thoại nhân vật không xuất hiện trên khung tranh và kích hoạt hiển thị mặc định toàn bộ bong bóng thoại cho tất cả các chương truyện.

### ✅ Công việc đã hoàn thành

- **[Bugfix] Bóc tách đúng trường `overlays` trong file JSON gốc**: Sửa `scripts/extract_data.py` để trích xuất đầy đủ 142 bong bóng thoại của Tư Tưởng Hồ Chí Minh, 112 bong bóng thoại của Tiếng Nhật N2, cùng toàn bộ kịch bản lời thoại (`dialogue`).
- **[Feature] Mặc định luôn hiện bong bóng thoại**: Cập nhật `js/study-mode.js` và `css/reader.css` để hiển thị các bong bóng thoại nhân vật sắc nét, chuẩn phong cách Manga với nền trắng, viền mực đen, font chữ đậm rõ nét trên mọi thiết bị.
- **[Feature] Bổ sung Kịch Bản Lời Thoại Chi Tiết (Script Inspector)**: Thêm nút bấm và modal xem toàn bộ đoạn hội thoại từng khung (`PANEL 1`, `PANEL 2`,...) của trang đang đọc, hỗ trợ sao chép nhanh từ vựng và lời thoại.
- **[Feature] Nâng cấp Tùy chọn Cài đặt**: Cho phép người dùng linh hoạt Bật/Tắt bóng thoại, Bật chế độ Đố Vui Flashcard (làm mờ thoại để tự đoán) và Đánh số thứ tự thoại.

---

## [2026-09-06 22:35] - Triển Khai Hoàn Thiện Website Đọc Manga Học Tập Đa Nền Tảng (EduManga Hub)

### 🎯 Mục tiêu

Xây dựng trọn vẹn nền tảng website đọc manga học tập chuyên đề hiện đại, responsive mượt mà trên Mobile & Desktop, tích hợp dữ liệu thực tế từ 4 bộ môn trong workspace (`Nhập môn AI`, `Tư tưởng Hồ Chí Minh`, `Tiếng Nhật N2`, `Pháp luật đại cương`).

### ✅ Công việc đã hoàn thành

#### 1. [Feature] Pipeline Trích xuất & Chuẩn hóa Dữ liệu ([`scripts/extract_data.py`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/scripts/extract_data.py>))

- Tự động bóc tách các file JSON nặng (15MB - 30MB) từ thư mục gốc thành ảnh JPG/WebP nén tối ưu.
- Xuất toàn bộ 31 trang của **N2 Chương 1**, 31 trang của **N2 Chương 2**, 25 trang của **TTHCM Phần 1**, 25 trang của **TTHCM Phần 2**, và bản gộp 50 trang.
- Trích xuất ảnh đại diện nhân vật (`Minh`, `Khoa`, `Toàn`, `Tuấn`, `Lan`, `Narrator`, `Giáo sư Thành`, `Hồ Chí Minh`, `Kỹ sư Hoàng`,...).
- Tạo file cấu hình trung tâm [`data/manga.json`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/data/manga.json>).

#### 2. [Feature] Giao diện Trang Chủ & Tủ Sách Cá Nhân ([`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>) & [`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>))

- **Hero Banner**: Nổi bật bộ truyện hot kèm nút xem chi tiết và đọc nhanh chương 1.
- **Thanh đọc tiếp (Resume Banner)**: Tự động phát hiện chương và số trang người dùng đang đọc dở qua `localStorage`.
- **Bộ lọc Category Pills**: Lọc tức thì theo 4 môn học.
- **Tìm kiếm thời gian thực (Live Search)**: Dropdown tìm kiếm nhanh theo tiêu đề và môn học.
- **Tủ sách cá nhân (Bookmarks Drawer)**: Modal quản lý truyện yêu thích trực tiếp trên trình duyệt.
- **Thanh điều hướng Mobile (Bottom Nav)**: Trải nghiệm native app trên màn hình cảm ứng.

#### 3. [Feature] Trang Chi Tiết Bộ Truyện & Nhân Vật ([`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>) & [`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>))

- Thẻ Hero hiển thị thông tin tác giả, lượt xem, rating, thể loại, tóm tắt.
- **Dàn nhân vật tương tác**: Bấm vào thẻ nhân vật để mở popup chi tiết về tính cách, trang phục và vai trò.
- **Danh sách chương**: Hỗ trợ nút đọc trực tuyến và nút tải trực tiếp file PDF chất lượng cao.

#### 4. [Feature] Manga Reader Engine Đa Chế Độ ([`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>) & [`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>))

- **3 Chế độ đọc**: *Webtoon cuộn dọc* (cho Mobile), *Trang đơn*, và *Trang đôi* (cho Tablet/PC).
- **Chế độ Học tập Tương tác (Interactive Study Mode)** ([`js/study-mode.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/study-mode.js>)):
  - Hiển thị bong bóng thoại kiến thức nổi trên khung tranh.
  - **Chế độ Đố Vui (Flashcard Quiz)**: Làm mờ nội dung thoại, click vào để giải mã đáp án.
- **Tùy chỉnh giao diện**: Chọn nền OLED, Dark, hoặc Sepia.
- **Điều hướng thông minh**: Phím tắt bàn phím, thanh trượt trang mượt mà, chuyển chương tự động.

### 💡 Quyết định Kỹ thuật & Kiến trúc

- **Vanilla CSS & JS Native**: Đảm bảo tốc độ khởi động nhanh tức thì, không phát sinh bundle size lớn, tương thích 100% trên mọi trình duyệt điện thoại và máy tính.
- **Tách Asset ra khỏi JSON**: Không nạp trực tiếp file JSON base64 30MB vào RAM trình duyệt di động để tránh crash bộ nhớ; thay vào đó sử dụng kiến trúc WebP/JPG tĩnh kèm file metadata `manga.json`.

### 📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)

- [X] Xuất bản toàn bộ dữ liệu truyện N2 và Tư tưởng Hồ Chí Minh.
- [X] Xây dựng hoàn chỉnh Trang chủ, Chi tiết truyện, Bộ đọc Manga và Chế độ Học tập.
- [ ] Bổ sung thêm nội dung chi tiết cho môn `Nhập Môn AI` và `Pháp Luật Đại Cương` khi có file kịch bản mới.
- [ ] Tích hợp PWA (Service Worker) để hỗ trợ đọc truyện ngoại tuyến (Offline Reading) không cần internet.

---

## 📅 Phiên Làm Việc: Cải Tiến Cơ Chế Học Từ Vựng 2 Chiều (2-Way Active Recall Flashcard)

### 🎯 Mục Tiêu & Yêu Cầu Đã Thực Hiện

1. **Cơ chế học 2 chiều (2-Way Recall / Spaced Repetition)**:

   - Một từ vựng trong phiên luyện tập được chia làm 2 lượt kiểm tra:
     - **Chiều 1 (🈸 Kanji ➔ Đọc / Nghĩa)**: Mặt trước hiển thị chữ Kanji/Từ gốc tiếng Nhật, người dùng gõ cách đọc (Hiragana / Romaji) hoặc nghĩa tiếng Việt.
     - **Chiều 2 (🇻🇳 Nghĩa ➔ Từ Tiếng Nhật)**: Mặt trước hiển thị nghĩa tiếng Việt (kèm âm Hán-Việt), người dùng gõ từ tiếng Nhật (Kanji / Hiragana / Romaji).
   - Tích hợp bộ chọn chế độ luyện tập: `🔄 Học 2 Chiều (2x)`, `🈸 Chỉ Kanji`, `🇻🇳 Chỉ Nghĩa`.
   - Thuật toán xáo trộn câu hỏi thông minh (Interleaving): Đảm bảo 2 chiều của cùng một từ không xuất hiện liên tiếp để tối ưu hóa hiệu quả ghi nhớ.
   - Cơ chế đánh giá thuộc từ: Một từ chỉ được tính là `mastered = true` khi trả lời đúng cả 2 chiều trong phiên học.
2. **Bộ Nhận Diện Đáp Án Thông Minh & Romaji ➔ Hiragana Converter**:

   - Tích hợp bộ chuyển đổi Romaji ➔ Hiragana hoàn chỉnh và chính xác (xử lý âm ngắt `っ`, trường âm, âm ghép `きゃ/しょ/ちょ/じゃ`, `nn`).
   - Tự động chuẩn hóa dấu tiếng Việt (so khớp không dấu, loại bỏ khoảng trắng thừa, tìm kiếm token nghĩa linh hoạt).
   - Hỗ trợ nhập Katakana, Hiragana, Romaji, Kanji hoặc nghĩa tiếng Việt đều được hệ thống nhận diện chính xác.
3. **Giao Diện UI/UX Hiện Đại, Glowing & Tương Tác Mượt Mà**:

   - Khớp 100% bản thiết kế tham chiếu của người dùng:
     - Chữ Kanji / Nghĩa to rõ, nổi bật giữa màn hình với font tiếng Nhật sắc nét.
     - Nút loa tròn phát âm chuẩn giọng Nhật Bản bản xứ.
     - Ô input viền cyan phát sáng nhẹ với placeholder gợi ý rõ ràng theo từng chiều câu hỏi.
     - Nút `Kiểm tra (Enter)` gradient xanh biển - tím với hiệu ứng hover và phím tắt `Enter`.
     - Nút gợi ý `💡 Xem gợi ý / Đáp án (Tab)` tinh tế.
     - Màn hình tổng kết phiên học trực quan với % độ chính xác, số từ thuộc hoàn toàn và nút "Ôn lại các từ chưa nhớ".

### 📁 Tệp Tin Đã Nâng Cấp

- [`js/flashcard-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/flashcard-service.js>): Refactor toàn bộ logic tạo câu hỏi 2 chiều, engine chấm điểm thông minh, sửa triệt để encoding UTF-8.
- [`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>): Bổ sung styles cho Mode Selector Pill, Direction Badges, Meaning Prompt Box, Action Buttons và Score Screen.
- [`reader.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/reader.html>): Chuẩn hóa các chuỗi hiển thị tiếng Việt UTF-8 trên modal Flashcard.

---

## 📅 Phiên Làm Việc: Xây Dựng Giao Diện & Quyền Admin Cho `minhquan12092005@gmail.com`

### 🎯 Mục Tiêu & Yêu Cầu Đã Thực Hiện

1. **Phân Quyền Đặc Quyền Admin (Role Guard)**:

   - Nhận diện độc quyền email `minhquan12092005@gmail.com` qua `authService.isAdmin()`.
   - Tài khoản Admin được cấp huy hiệu hoàng gia `👑 Admin` ở Header và Menu người dùng, mở khóa toàn bộ công cụ quản trị.
   - Tài khoản trường / Học sinh / Khách: Giữ nguyên 100% giao diện đọc và học tập cũ, ẩn hoàn toàn các công cụ tạo/xóa truyện.
2. **Quản Trị Tạo Bộ Truyện Mới (Trang Chủ `index.html` & `js/app.js`)**:

   - Thẻ Card nét đứt phát sáng `[+ Thêm Bộ Truyện Mới]` hiển thị độc quyền cho Admin trên lưới truyện.
   - Modal Thêm Bộ Truyện (`#adminAddSeriesModal`):
     - Đặt tên bộ truyện, tự động sinh slug ID chuẩn hóa.
     - Chọn danh mục môn học (Công nghệ & AI, Lý luận chính trị, Tiếng Nhật N2, Pháp luật đại cương...).
     - Đặt huy hiệu (MỚI, HOT, LUYỆN THI...), tác giả, mô tả tóm tắt.
     - Tải ảnh bìa (Cover Image) trực tiếp từ máy tính hoặc dán URL.
     - Nút **"Xuất file manga.json"** để tải file JSON danh mục cập nhật về máy bất cứ lúc nào.
3. **Quản Trị Thêm Chương & Nạp Kịch Bản JSON (Trang Chi Tiết `detail.html` & `js/detail.js`)**:

   - Nút `[+ Thêm Chương Mới (Nạp JSON)]` hiển thị ở danh sách Chapter cho Admin.
   - Modal Thêm Chương (`#adminAddChapterModal`):
     - Nhập số thứ tự chương và tiêu đề chương.
     - Vùng Kéo thả / Chọn File JSON kịch bản (`pages`, `bubbles`, `dialogues`).
     - Tự động parse, kiểm tra tính hợp lệ và hiển thị Live Preview thống kê số lượng trang tranh & bóng thoại.
     - Nút Xóa chương / Xóa bộ truyện dành riêng cho Admin.
4. **Trình Đọc Truyện Hợp Nhất (`reader.html` & `js/reader.js`)**:

   - Hỗ trợ nạp và đọc ngay lập tức các bộ truyện và chương mới thêm từ Catalog hợp nhất.

### 📁 Tệp Tin Đã Nâng Cấp

- [`js/auth-service.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/auth-service.js>): Thêm phân quyền `isAdmin()` và huy hiệu Admin.
- [`index.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/index.html>) & [`js/app.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/app.js>): Thêm card tạo truyện, Modal tạo truyện và quản lý catalog.
- [`detail.html`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/detail.html>) & [`js/detail.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/detail.js>): Thêm nút thêm chương, Modal upload và parse JSON.
- [`js/reader.js`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/js/reader.js>): Hỗ trợ nạp truyện/chương mới từ catalog hợp nhất.
- [`css/components.css`](<file:///g:/My%20Drive/hk261/D%E1%BB%B1%20%C3%A1n%20manga/css/components.css>): Bổ sung toàn bộ style Admin UI Dark Mode Glassmorphism.
