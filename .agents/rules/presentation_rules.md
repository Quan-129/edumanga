# QUY TẮC TRÌNH BÀY MÃ NGUỒN & TIÊU CHUẨN CODE (SOURCE CODE PRESENTATION & CODING CONVENTIONS) 💻🎨

Toàn bộ AI Agent và Lập trình viên khi làm việc trên repository này **BẮT BUỘC** phải tuân thủ nghiêm ngặt các quy tắc trình bày mã nguồn (Source Code Styling & Conventions) sau:

---

## 🏛 1. CẤU TRÚC & PHÂN ĐOẠN FILE MÃ NGUỒN (FILE STRUCTURE & SECTIONING)

Mọi file mã nguồn JavaScript trong `src/` phải được tổ chức theo bố cục chuẩn mực và phân tách rõ ràng bằng **Banner Comments**:

```javascript
/**
 * @file [Tên File / Module]
 * @description [Mô tả ngắn gọn trách nhiệm và chức năng của module]
 * @module [Đường dẫn module, ví dụ: 1.Frontend/components/modals/EditSubjectModal]
 */

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { state } from '../../3.Database/state.js';
import { escapeHtml } from '../../4.Security/sanitizer.js';

// ============================================================================
// 2. CONSTANTS & CONFIGURATIONS
// ============================================================================
const MODAL_ID = 'edit-subject-modal';

// ============================================================================
// 3. COMPONENT TEMPLATE / DOM GENERATION
// ============================================================================
export function renderTemplate(data) {
  // ...
}

// ============================================================================
// 4. EVENT HANDLERS & DOM BINDING
// ============================================================================
export function bindEvents() {
  // ...
}

// ============================================================================
// 5. PUBLIC CONTROLLER / EXPORTS
// ============================================================================
export const EditSubjectModal = {
  open,
  close
};
```

---

## 📐 2. QUY CHUẨN ĐỊNH DẠNG CODE (FORMATTING & CLEAN CODE)

1. **Thụt lề (Indentation)**:
   - Bắt buộc dùng **2 spaces** cho toàn bộ file JS, CSS, HTML và JSON. Tuyệt đối không dùng tabs hoặc thụt lề 4 spaces.
2. **Dấu chấm phẩy (Semicolons)**:
   - **Bắt buộc có dấu chấm phẩy `;`** ở cuối mỗi câu lệnh (Semicolon-mandatory style).
3. **Dấu ngoặc nhọn (Braces & 1TBS Style)**:
   - Áp dụng chuẩn **One True Brace Style (1TBS)**: Mở ngoặc `{` trên cùng dòng với khai báo `function`, `class`, `if`, `for`, `try/catch`.
   ```javascript
   // ✅ CHUẨN 1TBS:
   if (isValid) {
     doSomething();
   } else {
     handleError();
   }
   ```
4. **Khoảng trắng & Dòng trống (Spacing & Blank Lines)**:
   - Cách 1 khoảng trắng quanh toán tử: `a = b + c;`, `i < length;`.
   - Cách 1 khoảng trắng sau từ khóa điều kiện: `if (condition)`, `for (item of items)`.
   - Giữ đúng **1 dòng trống** giữa các hàm hoặc các khối logic riêng biệt để code thoáng mắt và dễ đọc.
5. **Giới hạn độ dài dòng (Max Line Length)**:
   - Khuyến nghị tối đa **100–120 ký tự/dòng**. Ngắt dòng hợp lý khi gọi chuỗi phương thức (method chaining) hoặc danh sách tham số dài.

---

## 🏷️ 3. QUY TẮC ĐẶT TÊN (NAMING CONVENTIONS)

| Đối tượng | Quy chuẩn | Ví dụ thực tế |
| :--- | :--- | :--- |
| **Component Files** | `PascalCase.js` | `EditSubjectModal.js`, `CircularNode.js`, `GitGuide.js` |
| **Service / Logic Files** | `PascalCase.js` / `camelCase.js` | `GradeSolverService.js`, `sanitizer.js`, `urlValidator.js` |
| **CSS Module Files** | Số thứ tự + `kebab-case.css` | `1.variables.css`, `2.navbar.css`, `6.modals.css` |
| **Class Name** | `PascalCase` | `GradeSolverService`, `LocalStorageEngine` |
| **Function / Method Name** | `camelCase` (Động từ mô tả hành động) | `renderTemplate()`, `openModal()`, `calculateTargetGrade()` |
| **Variable / Property** | `camelCase` | `currentWeek`, `selectedSubjectId`, `isEditing` |
| **Constants / Configs** | `UPPER_SNAKE_CASE` | `DEFAULT_WEIGHTS`, `STORAGE_KEY`, `MAX_ATTEMPTS` |
| **CSS Classes** | `kebab-case` hoặc `BEM` | `notes-card`, `guide-accordion`, `modal-header__title` |
| **DOM Element IDs** | `kebab-case` duy nhất | `notes-body`, `btn-add-subject`, `modal-root` |

---

## 🧩 4. QUY CHUẨN TEMPLATE HTML TRONG JAVASCRIPT (STRING LITERAL TEMPLATES)

Khi tạo HTML động trong các JS Components bằng Template Literals (`` ` ``):

1. **Thụt lề HTML phân cấp chuẩn xác**:
   - Thụt lề các thẻ HTML lồng nhau bên trong dấu backtick đúng theo thứ tự phân cấp DOM (2 spaces) để đảm bảo file JS luôn ngăn nắp:
   ```javascript
   // ✅ ĐÚNG: Cấu trúc thụt lề chuẩn, dễ đọc
   return `
     <section class="notes-section">
       <div class="notes-card">
         <div class="notes-header">
           <h3 class="notes-title">${escapeHtml(title)}</h3>
         </div>
         <div class="notes-body" id="notes-body">
           <p>${escapeHtml(content)}</p>
         </div>
       </div>
     </section>
   `;
   ```
2. **Bảo mật XSS Tuyệt Đối (Zero XSS)**:
   - Mọi chuỗi do người dùng nhập hoặc dữ liệu biến động đều **BẮT BUỘC** phải bọc qua `${escapeHtml(value)}` từ `src/4.Security/sanitizer.js`.
3. **Không lạm dụng Inline Styles**:
   - Toàn bộ định dạng giao diện tĩnh phải nằm trong CSS Module tương ứng (`src/1.Frontend/styles/`).
   - Chỉ dùng `style="..."` nội tuyến khi gán các biến CSS động (ví dụ: `style="--progress: ${percent}%"` hoặc `style="--accent-color: ${color}"`).
4. **HTML5 Ngữ nghĩa (Semantic HTML5)**:
   - Ưu tiên sử dụng đúng thẻ: `<section>`, `<header>`, `<nav>`, `<article>`, `<details>`, `<summary>`, `<dialog>`, `<footer>`. Tránh lạm dụng `<div>` vô tội vạ.

---

## 📝 5. QUY CHUẨN CHÚ THÍCH & JSDOC (COMMENTS & DOCUMENTATION)

1. **Ngôn ngữ Chú thích**: Luôn viết comment và JSDoc bằng **Tiếng Việt**.
2. **Comment giải thích lý do (Explain 'Why', not 'What')**:
   - Không comment mô tả lại cú pháp hiển nhiên (ví dụ: `// gán x bằng 5`).
   - Comment giải thích nguyên nhân kỹ thuật, edge-cases hoặc giải thuật phức tạp.
3. **JSDoc chuẩn mực cho Functions & Classes**:
   ```javascript
   /**
    * Tính toán điểm thi cuối kỳ tối thiểu cần đạt dựa trên mục tiêu điểm chữ
    * @param {Object} subject - Đối tượng môn học chứa hệ số điểm và điểm thành phần
    * @param {string} targetGrade - Điểm mục tiêu mong muốn ('A+', 'A', 'B+', ...)
    * @returns {number|null} Điểm thi cần đạt (thang 10), hoặc null nếu bất khả thi
    */
   export function calculateRequiredFinalGrade(subject, targetGrade) {
     // ...
   }
   ```

---

## 🎨 6. QUY CHUẨN TRÌNH BÀY GIAO DIỆN & THẨM MỸ (UI/UX AESTHETICS)

1. **Dark Mode & Glassmorphism**: Sử dụng `backdrop-filter: blur(12px)`, viền mờ `1px solid rgba(255,255,255,0.1)` và shadow biến thiên.
2. **Bảng màu CSS Tokens**: Sử dụng biến màu trong `1.variables.css` (Emerald, Indigo, Sky Blue, Amber), tuyệt đối không dùng mã màu thuần cơ bản.
3. **Typography**: Dùng `Inter`/`Outfit` cho UI, `JetBrains Mono` cho code blocks.
4. **Responsive 3 Tầng**: Đồng bộ media queries vào `src/1.Frontend/styles/8.responsive.css`.

---

## 💬 7. QUY CHUẨN TRÌNH BÀY PHẢN HỒI CỦA AI (COMMUNICATION STANDARDS)

1. **100% Tiếng Việt**: Phản hồi trực diện, ngắn gọn, đi thẳng vào kết quả công việc.
2. **Clickable File Links**: Mọi file hoặc ký hiệu code nhắc đến đều phải có liên kết `[TênFile.js](file:///c:/Users/Acer/Documents/Dự án ma/tools_3/path/to/file.js#L1-L10)`.
3. **Không lặp lại mã nguồn**: Chỉ dùng diff hoặc liên kết, không in lại cả file code dài.
