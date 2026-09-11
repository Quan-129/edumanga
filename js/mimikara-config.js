/**
 * ==========================================================================
 * EDUMANGA HUB - BẢNG CẤU HÌNH CÁC CHẾ ĐỘ HỌC MIMIKARA N2
 * ==========================================================================
 * 
 * Hướng dẫn sử dụng:
 * - Để BẬT một chế độ: đặt giá trị thành true
 * - Để TẮT một chế độ: đặt giá trị thành false
 * 
 * ĐẶC BIỆT: Hệ thống hỗ trợ Dynamic Stepper Funnel:
 * Khi bạn tắt bất kỳ chế độ nào (ví dụ tắt Chế độ 3: typing = false),
 * giao diện (UI/UX) và luồng học sẽ tự động ĐÔN LÊN VÀ ĐÁNH SỐ LẠI LIỀN MẠCH
 * thành 1, 2, 3, 4 (không bao giờ bị khuyết hổng hay ngắt quãng)!
 */

window.MIMIKARA_CONFIG = {
  // ------------------------------------------------------------------------
  // 1. CẤU HÌNH BẬT / TẮT (ON / OFF) CÁC CHẾ ĐỘ HỌC
  // ------------------------------------------------------------------------
  modes: {
    // Chế độ 1: Flashcard 3D lướt từ & Sơ đồ hướng tâm Radial Mindmap (Ghép từ / Chiết tự)
    flashcard: true,

    // Chế độ 2: Game ghép cặp 5 từ vựng - 5 ý nghĩa (Matching Game 5x5)
    matching: true,

    // Chế độ 3: Gõ từ phản xạ 2 chiều Nhật ➔ Việt & Việt ➔ Nhật (10 câu)
    typing: true,

    // Chế độ 4: Nghe điền câu Audio Cloze & Dictation 2 cấp độ
    dictation: true,

    // Chế độ 5: Luyện dịch câu phức chuẩn N2 (Scrambled Chunk Translation Puzzle)
    translation: true
  },

  // ------------------------------------------------------------------------
  // 2. DANH MỤC THÔNG TIN VÀ ICON CỦA CÁC CHẾ ĐỘ
  // ------------------------------------------------------------------------
  definitions: [
    {
      id: 'flashcard',
      originalStep: 1,
      name: 'Flashcard',
      shortName: 'Flashcard',
      icon: 'fa-clone',
      desc: 'Lướt từ & Chiết tự Mindmap'
    },
    {
      id: 'matching',
      originalStep: 2,
      name: 'Ghép Cặp',
      shortName: 'Ghép Cặp',
      icon: 'fa-th-large',
      desc: 'Ghép cặp 5x5'
    },
    {
      id: 'typing',
      originalStep: 3,
      name: 'Gõ Từ',
      shortName: 'Gõ Từ',
      icon: 'fa-keyboard',
      desc: 'Gõ từ 2 chiều'
    },
    {
      id: 'dictation',
      originalStep: 4,
      name: 'Nghe Điền',
      shortName: 'Nghe Điền',
      icon: 'fa-headphones',
      desc: 'Nghe điền câu Audio'
    },
    {
      id: 'translation',
      originalStep: 5,
      name: 'Luyện Dịch',
      shortName: 'Luyện Dịch',
      icon: 'fa-language',
      desc: 'Dịch câu phức N2'
    }
  ]
};
