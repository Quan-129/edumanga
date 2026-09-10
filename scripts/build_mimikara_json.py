import os
import json
import csv

mimiraka_dir = 'vocab/N2/mimiraka'
out_json = 'data/mimikara_n2_units.json'

units_def = [
    {"id": 1, "filename": "unit_01_danh_tu_1.csv", "title": "Unit 1: Danh từ 1", "subtitle": "Quan hệ con người, đời sống, gia đình"},
    {"id": 2, "filename": "unit_02_danh_tu_2.csv", "title": "Unit 2: Danh từ 2", "subtitle": "Cơ thể, sức khỏe, bệnh tật & sinh hoạt"},
    {"id": 3, "filename": "unit_03_danh_tu_3.csv", "title": "Unit 3: Danh từ 3", "subtitle": "Xã hội, giao thông, nhà cửa & mua sắm"},
    {"id": 4, "filename": "unit_04_danh_tu_4.csv", "title": "Unit 4: Danh từ 4", "subtitle": "Công việc, kinh tế, tiền bạc & kinh doanh"},
    {"id": 5, "filename": "unit_05_danh_tu_5.csv", "title": "Unit 5: Danh từ 5", "subtitle": "Học tập, thi cử, khoa học & truyền thông"},
    {"id": 6, "filename": "unit_06_danh_tu_6.csv", "title": "Unit 6: Danh từ 6", "subtitle": "Tự nhiên, môi trường, chính trị & trừu tượng"},
    {"id": 7, "filename": "unit_07_dong_tu_1.csv", "title": "Unit 7: Động từ 1", "subtitle": "Động từ hành động cơ bản & tương tác"},
    {"id": 8, "filename": "unit_08_dong_tu_2.csv", "title": "Unit 8: Động từ 2", "subtitle": "Động từ ghép & động từ nâng cao N2"},
    {"id": 9, "filename": "unit_09_tinh_tu.csv", "title": "Unit 9: Tính từ", "subtitle": "Tính từ đuôi い & Tính từ đuôi な"},
    {"id": 10, "filename": "unit_10_pho_tu_1.csv", "title": "Unit 10: Phó từ 1", "subtitle": "Phó từ chỉ mức độ, thời gian & trạng thái"},
    {"id": 11, "filename": "unit_11_pho_tu_2.csv", "title": "Unit 11: Phó từ 2", "subtitle": "Từ tượng hình, tượng thanh Gitaigo/Giongo"},
    {"id": 12, "filename": "unit_12_lien_tu.csv", "title": "Unit 12: Liên từ", "subtitle": "Từ nối câu, liên kết đoạn & chuyển ý"},
    {"id": 13, "filename": "unit_13_cum_tu_co_dinh.csv", "title": "Unit 13: Cụm từ cố định", "subtitle": "Thành ngữ & cụm từ vựng hay ra thi"},
    {"id": 14, "filename": "unit_14_quan_dung_ngu_katakana.csv", "title": "Unit 14: Quán dụng ngữ & Katakana", "subtitle": "Quán dụng ngữ & Từ ngoại lai Katakana N2"}
]

units_data = []
total_count = 0

for u in units_def:
    file_path = os.path.join(mimiraka_dir, u['filename'])
    if not os.path.exists(file_path):
        print(f"Warning: {file_path} does not exist!")
        continue
    with open(file_path, mode='r', encoding='utf-8') as f:
        reader = list(csv.DictReader(f))
    
    start_stt = reader[0]['stt'] if reader else '0'
    end_stt = reader[-1]['stt'] if reader else '0'
    count = len(reader)
    total_count += count
    
    units_data.append({
        "id": u['id'],
        "title": u['title'],
        "subtitle": u['subtitle'],
        "range": f"STT {start_stt} - {end_stt}",
        "wordsCount": count,
        "words": reader
    })
    print(f"Loaded {u['filename']}: {count} words (STT {start_stt} - {end_stt})")

dataset = {
    "totalWords": total_count,
    "unitsCount": len(units_data),
    "updatedAt": "2026-09-10",
    "units": units_data
}

os.makedirs('data', exist_ok=True)
with open(out_json, mode='w', encoding='utf-8') as f:
    json.dump(dataset, f, ensure_ascii=False, indent=2)

print(f"\n✓ Đã xuất {out_json}: {total_count} từ vựng từ {len(units_data)} Unit!")
