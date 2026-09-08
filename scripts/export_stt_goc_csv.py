import csv

# 1. Load original files
vocab_file = 'vocab/N2/mimiraka/tu_vung_mimikara_n2.csv'
grammar_file = 'vocab/N2/sou/ngu_phap_n2_full.csv'

with open(vocab_file, mode='r', encoding='utf-8') as f:
    vocab_list = list(csv.DictReader(f))

with open(grammar_file, mode='r', encoding='utf-8') as f:
    grammar_list = list(csv.DictReader(f))

chapter_themes = [
    "Chương 1: Quan hệ con người & Gia đình (人間関係と家族)",
    "Chương 2: Cơ thể, Sức khỏe & Y tế (身体・健康と医療)",
    "Chương 3: Sinh hoạt hàng ngày & Thói quen (日常生活と習慣)",
    "Chương 4: Ăn uống, Ẩm thực & Nấu nướng (飲食・料理と食事)",
    "Chương 5: Nhà cửa, Nơi ở & Tiện ích (住まい・住宅と設備)",
    "Chương 6: Giao thông & Đi lại (交通・移動と乗り物)",
    "Chương 7: Mua sắm & Tiêu dùng (買い物・消費とサービス)",
    "Chương 8: Cảm xúc & Tâm trạng con người (感情・気分と心理)",
    "Chương 9: Tính cách & Thái độ ứng xử (性格・態度と人柄)",
    "Chương 10: Giao tiếp & Mối quan hệ xã hội (コミュニケーションと社交)",
    "Chương 11: Học tập, Thi cử & Trường học (学習・試験と学校教育)",
    "Chương 12: Tìm việc & Phỏng vấn tuyển dụng (就職活動・面接と採用)",
    "Chương 13: Môi trường công sở & Đồng nghiệp (職場環境・同僚と業務)",
    "Chương 14: Kế hoạch, Họp hành & Đàm phán (計画・会議と交渉)",
    "Chương 15: Kinh doanh, Thương mại & Thị trường (ビジネス・商業と市場)",
    "Chương 16: Kinh tế, Tài chính & Đầu tư (経済・金融と投資)",
    "Chương 17: Khoa học, Công nghệ & Kỹ thuật (科学・技術とIT)",
    "Chương 18: Tự nhiên, Môi trường & Khí hậu (自然・環境と気候)",
    "Chương 19: Thời tiết, Thiên tai & Phòng chống (天気・災害と防災)",
    "Chương 20: Xã hội, Pháp luật & Trật tự (社会・法律と秩序)",
    "Chương 21: Tin tức, Truyền thông & Báo chí (ニュース・メディアと報道)",
    "Chương 22: Văn hóa, Nghệ thuật & Truyền thống (文化・芸術と伝統)",
    "Chương 23: Du lịch, Thể thao & Giải trí (旅行・スポーツと娯楽)",
    "Chương 24: Thời gian, Thay đổi & Quá trình (時間・変化とプロセス)",
    "Chương 25: Đánh giá, Phán đoán & So sánh (評価・判断と比較)",
    "Chương 26: Tranh luận, Lý lẽ & Quan điểm (議論・主張と見解)",
    "Chương 27: Rắc rối, Thất bại & Khắc phục (トラブル・失敗と克服)",
    "Chương 28: Khen ngợi, Động viên & Trách móc (称賛・励ましと批判)",
    "Chương 29: Mong ước, Hy vọng & Tương lai (希望・将来と夢)",
    "Chương 30: Trưởng thành, Thành công & Đúc kết (成長・成功と総括)"
]

vocab_counts = [39 if i < 20 else 38 for i in range(30)]
grammar_counts = [6 if i < 25 else 5 for i in range(30)]

# 2. Tạo file từ vựng gắn trực tiếp số Chương & STT gốc
vocab_detailed = []
v_idx = 0
for ch_idx in range(30):
    count = vocab_counts[ch_idx]
    chunk = vocab_list[v_idx : v_idx + count]
    for item in chunk:
        vocab_detailed.append({
            'STT_Goc': item['STT'],
            'Chuong': ch_idx + 1,
            'Ten_Chuong': chapter_themes[ch_idx],
            'Tu_Vung': item['Từ vựng'],
            'Nghia': item['Nghĩa']
        })
    v_idx += count

with open('vocab/N2/tu_vung_n2_theo_30_chuong.csv', mode='w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['STT_Goc', 'Chuong', 'Ten_Chuong', 'Tu_Vung', 'Nghia'])
    writer.writeheader()
    writer.writerows(vocab_detailed)

# 3. Tạo file ngữ pháp gắn trực tiếp số Chương & STT gốc
grammar_detailed = []
g_idx = 0
for ch_idx in range(30):
    count = grammar_counts[ch_idx]
    chunk = grammar_list[g_idx : g_idx + count]
    for item in chunk:
        grammar_detailed.append({
            'STT_Goc': item['stt'],
            'Chuong': ch_idx + 1,
            'Ten_Chuong': chapter_themes[ch_idx],
            'Pattern': item['pattern'],
            'Reading': item['reading'],
            'Meaning': item['meaning'],
            'Connection': item.get('connection', ''),
            'Level': item.get('level', 'N2')
        })
    g_idx += count

with open('vocab/N2/ngu_phap_n2_theo_30_chuong.csv', mode='w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['STT_Goc', 'Chuong', 'Ten_Chuong', 'Pattern', 'Reading', 'Meaning', 'Connection', 'Level'])
    writer.writeheader()
    writer.writerows(grammar_detailed)

# 4. Tạo file tra cứu tổng quan 30 chương ánh xạ STT gốc rõ ràng
summary_rows = []
v_idx = 0
g_idx = 0
for ch_idx in range(30):
    v_count = vocab_counts[ch_idx]
    g_count = grammar_counts[ch_idx]
    v_chunk = vocab_list[v_idx : v_idx + v_count]
    g_chunk = grammar_list[g_idx : g_idx + g_count]
    
    summary_rows.append({
        'Chuong': ch_idx + 1,
        'Ten_Chuong': chapter_themes[ch_idx],
        'STT_Goc_Tu_Vung': f"STT {v_chunk[0]['STT']} ➔ STT {v_chunk[-1]['STT']}",
        'So_Luong_Tu_Vung': v_count,
        'STT_Goc_Ngu_Phap': f"STT {g_chunk[0]['stt']} ➔ STT {g_chunk[-1]['stt']}",
        'So_Luong_Ngu_Phap': g_count
    })
    v_idx += v_count
    g_idx += g_count

with open('vocab/N2/bang_tra_cuu_stt_goc_30_chuong.csv', mode='w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['Chuong', 'Ten_Chuong', 'STT_Goc_Tu_Vung', 'So_Luong_Tu_Vung', 'STT_Goc_Ngu_Phap', 'So_Luong_Ngu_Phap'])
    writer.writeheader()
    writer.writerows(summary_rows)

print("Export completed successfully.")
