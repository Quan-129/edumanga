import os
import csv

source_path = 'vocab/N2/mimiraka/tuvungn2.csv'
out_dir = 'vocab/N2/mimiraka'

# Định nghĩa 14 Unit
units_config = [
    {
        "unit": 1,
        "filename": "unit_01_danh_tu_1.csv",
        "title": "Unit 1: Danh từ 1 (Quan hệ con người, đời sống, gia đình)",
        "start": 1,
        "end": 80
    },
    {
        "unit": 2,
        "filename": "unit_02_danh_tu_2.csv",
        "title": "Unit 2: Danh từ 2 (Cơ thể, sức khỏe, bệnh tật & sinh hoạt)",
        "start": 81,
        "end": 170
    },
    {
        "unit": 3,
        "filename": "unit_03_danh_tu_3.csv",
        "title": "Unit 3: Danh từ 3 (Xã hội, giao thông, nhà cửa & mua sắm)",
        "start": 171,
        "end": 260
    },
    {
        "unit": 4,
        "filename": "unit_04_danh_tu_4.csv",
        "title": "Unit 4: Danh từ 4 (Công việc, kinh tế, tiền bạc & kinh doanh)",
        "start": 261,
        "end": 350
    },
    {
        "unit": 5,
        "filename": "unit_05_danh_tu_5.csv",
        "title": "Unit 5: Danh từ 5 (Học tập, thi cử, khoa học & truyền thông)",
        "start": 351,
        "end": 440
    },
    {
        "unit": 6,
        "filename": "unit_06_danh_tu_6.csv",
        "title": "Unit 6: Danh từ 6 (Tự nhiên, môi trường, chính trị & trừu tượng)",
        "start": 441,
        "end": 520
    },
    {
        "unit": 7,
        "filename": "unit_07_dong_tu_1.csv",
        "title": "Unit 7: Động từ 1 (Động từ hành động cơ bản & tương tác)",
        "start": 521,
        "end": 635
    },
    {
        "unit": 8,
        "filename": "unit_08_dong_tu_2.csv",
        "title": "Unit 8: Động từ 2 (Động từ ghép & động từ nâng cao N2)",
        "start": 636,
        "end": 750
    },
    {
        "unit": 9,
        "filename": "unit_09_tinh_tu.csv",
        "title": "Unit 9: Tính từ (Tính từ đuôi い & Tính từ đuôi な)",
        "start": 751,
        "end": 890
    },
    {
        "unit": 10,
        "filename": "unit_10_pho_tu_1.csv",
        "title": "Unit 10: Phó từ 1 (Phó từ chỉ mức độ, thời gian & trạng thái)",
        "start": 891,
        "end": 960
    },
    {
        "unit": 11,
        "filename": "unit_11_pho_tu_2.csv",
        "title": "Unit 11: Phó từ 2 (Từ tượng hình, tượng thanh Gitaigo/Giongo)",
        "start": 961,
        "end": 1020
    },
    {
        "unit": 12,
        "filename": "unit_12_lien_tu.csv",
        "title": "Unit 12: Liên từ (Từ nối câu, liên kết đoạn & chuyển ý)",
        "start": 1021,
        "end": 1060
    },
    {
        "unit": 13,
        "filename": "unit_13_cum_tu_co_dinh.csv",
        "title": "Unit 13: Cụm từ cố định (Thành ngữ & cụm từ vựng hay ra thi)",
        "start": 1061,
        "end": 1110
    },
    {
        "unit": 14,
        "filename": "unit_14_quan_dung_ngu_katakana.csv",
        "title": "Unit 14: Quán dụng ngữ & Từ ngoại lai Katakana N2",
        "start": 1111,
        "end": 1160
    }
]

# Đọc toàn bộ dữ liệu gốc
with open(source_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

print(f"Tổng số từ đọc được từ {source_path}: {len(rows)}")

# Tạo 14 file CSV
total_exported = 0
summary_list = []

for u in units_config:
    start_stt = u['start']
    end_stt = u['end']
    unit_rows = [r for r in rows if start_stt <= int(r['stt']) <= end_stt]
    
    file_path = os.path.join(out_dir, u['filename'])
    with open(file_path, mode='w', encoding='utf-8', newline='') as out_f:
        writer = csv.DictWriter(out_f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(unit_rows)
        
    count = len(unit_rows)
    total_exported += count
    summary_list.append((u['unit'], u['filename'], u['title'], f"STT {start_stt} - {end_stt}", count))
    print(f"✓ Đã tạo: {u['filename']:<35} ({count:3d} từ | STT {start_stt:4d} - {end_stt:4d})")

print(f"\n=> Đã xuất thành công 14 file CSV với tổng cộng: {total_exported} / 1160 từ.")

# Tạo thêm file tra cứu tổng quan danh mục 14 Unit
summary_csv = os.path.join(out_dir, 'danh_muc_14_unit_mimikara.csv')
with open(summary_csv, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Unit', 'Ten_File', 'Ten_Chuong', 'Pham_Vi_STT', 'So_Luong_Tu'])
    for item in summary_list:
        writer.writerow(item)

print(f"✓ Đã tạo file danh mục tổng hợp: {summary_csv}")
