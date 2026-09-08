import os
import sys
import json
import base64
import re

# Fix UTF-8 encoding for Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Base workspace path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
DATA_DIR = os.path.join(BASE_DIR, "data")
CHAPTERS_DIR = os.path.join(ASSETS_DIR, "chapters")
COVERS_DIR = os.path.join(ASSETS_DIR, "covers")
CHARACTERS_DIR = os.path.join(ASSETS_DIR, "characters")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CHAPTERS_DIR, exist_ok=True)
os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(CHARACTERS_DIR, exist_ok=True)

def sanitize_filename(name):
    return re.sub(r'[^a-zA-Z0-9_\-]', '_', name)

def save_base64_image(base64_str, output_path):
    try:
        if not base64_str:
            return False
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        img_data = base64.b64decode(base64_str)
        with open(output_path, "wb") as f:
            f.write(img_data)
        return True
    except Exception as e:
        print(f"Error saving image {output_path}: {e}")
        return False

def find_pages_array(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for k in ["pages", "frames", "storyboard", "items", "data"]:
            if k in data and isinstance(data[k], list):
                return data[k]
        # Fallback search for any list containing dict with base64
        for k, v in data.items():
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
                if "base64" in v[0] or "image" in v[0] or "overlays" in v[0] or "bubbles" in v[0]:
                    return v
    return []

def extract_bubbles_from_item(item):
    raw_list = item.get("overlays") or item.get("bubbles") or []
    bubbles = []
    for b in raw_list:
        if not b or not isinstance(b, dict):
            continue
        text = b.get("text", "").strip()
        if not text:
            continue
        bubbles.append({
            "id": b.get("id", f"b_{len(bubbles)+1}"),
            "text": text,
            "x": float(b.get("x", 50)),
            "y": float(b.get("y", 50)),
            "fontSize": int(b.get("fontSize", 14)),
            "width": float(b.get("width", 30)),
            "fontWeight": b.get("fontWeight", "bold"),
            "fontStyle": b.get("fontStyle", "normal"),
            "textAlign": b.get("textAlign", "center"),
            "bubbleType": b.get("bubbleType", "normal")
        })
    return bubbles

# Master catalog definition
manga_catalog = [
    {
        "id": "nhap-mon-ai",
        "title": "Nhập Môn Trí Tuệ Nhân Tạo (AI)",
        "folder": "1. Nhập môn trí tuệ nhân tạo",
        "category": "Công nghệ & AI",
        "categoryKey": "ai",
        "badge": "Hot",
        "status": "Đang phát hành",
        "author": "Khoa CNTT - TBMQ",
        "rating": 4.9,
        "views": "15.4K",
        "likes": "1.2K",
        "description": "Hành trình khám phá thế giới Trí Tuệ Nhân Tạo (Artificial Intelligence) qua góc nhìn hài hước, sinh động của các sinh viên công nghệ. Từ thuật toán tìm kiếm A*, Minimax đến Machine Learning, Mạng nơ-ron và Deep Learning đều được chuyển thể thành những trận chiến đấu trí mãn nhãn.",
        "cover": "assets/covers/ai_cover.jpg",
        "characters": [
            {
                "id": "char-ai-1",
                "name": "Bách Khoa",
                "role": "Nam chính - Chuyên gia thuật toán, đam mê Machine Learning",
                "appearance": "20 tuổi, đeo kính, áo hoodie xám công nghệ",
                "clothing": "Áo hoodie và ba lô laptop",
                "avatar": "assets/characters/ai_bachkhoa.jpg"
            },
            {
                "id": "char-ai-2",
                "name": "Ada",
                "role": "Trợ lý AI ảo - Hướng dẫn viên thế giới số",
                "appearance": "Hình thái holographic với mái tóc xanh neon",
                "clothing": "Trang phục ánh sáng kỹ thuật số",
                "avatar": "assets/characters/ai_ada.jpg"
            }
        ],
        "chapters": []
    },
    {
        "id": "tu-tuong-hcm",
        "title": "Tư Tưởng Hồ Chí Minh",
        "folder": "2. Tư tưởng Hồ Chí Minh",
        "category": "Lý luận chính trị",
        "categoryKey": "tthcm",
        "badge": "Chính thống",
        "status": "Đang phát hành",
        "author": "TBMQ",
        "rating": 5.0,
        "views": "28.9K",
        "likes": "3.5K",
        "description": "Bộ manga tái hiện sinh động quá trình hình thành và phát triển của Tư tưởng Hồ Chí Minh, từ bối cảnh lịch sử dân tộc và thời đại, hành trình ra đi tìm đường cứu nước đến những luận điểm cốt lõi về độc lập dân tộc gắn liền với chủ nghĩa xã hội.",
        "cover": "assets/covers/tthcm_cover.jpg",
        "characters": [],
        "chapters": []
    },
    {
        "id": "tieng-nhat-n2",
        "title": "Chinh Phục Tiếng Nhật N2",
        "folder": "3. N2",
        "category": "Ngoại ngữ & JLPT",
        "categoryKey": "n2",
        "badge": "Luyện thi",
        "status": "Đang phát hành",
        "author": "TBMQ",
        "rating": 4.9,
        "views": "22.3K",
        "likes": "2.8K",
        "description": "Bộ manga cốt truyện drama tình huống đời thực giữa các sinh viên, du học sinh và kỹ sư tại Nhật Bản, lồng ghép tự nhiên ngữ pháp, từ vựng và mẫu câu giao tiếp đỉnh cao cấp độ JLPT N2 kèm bài tập suy luận tương tác.",
        "cover": "assets/covers/n2_cover.jpg",
        "characters": [],
        "chapters": []
    },
    {
        "id": "phap-luat-dai-cuong",
        "title": "Pháp Luật Đại Cương",
        "folder": "4. Pháp luật đại cương",
        "category": "Pháp luật & Xã hội",
        "categoryKey": "pldc",
        "badge": "Mới",
        "status": "Đang phát hành",
        "author": "TBMQ",
        "rating": 4.8,
        "views": "12.1K",
        "likes": "980",
        "description": "Các vụ án giả định, tình huống tranh chấp hợp đồng, quan hệ dân sự và trách nhiệm pháp lý được giải quyết kịch tính theo phong cách truyện tranh trinh thám pháp đình. Giúp người học ghi nhớ mọi quy phạm pháp luật một cách dễ dàng.",
        "cover": "assets/covers/pldc_cover.jpg",
        "characters": [
            {
                "id": "char-pldc-1",
                "name": "Luật sư Hoàng",
                "role": "Luật sư trẻ tuổi với óc suy luận sắc bén",
                "appearance": "24 tuổi, vest chỉnh tề, luôn mang theo cuốn Hiến pháp",
                "clothing": "Vest đen công sở lịch lãm",
                "avatar": "assets/characters/pldc_hoang.jpg"
            }
        ],
        "chapters": []
    }
]

def process_n2():
    n2_meta = next(item for item in manga_catalog if item["id"] == "tieng-nhat-n2")
    n2_dir = os.path.join(BASE_DIR, "3. N2", "1. Manga")
    
    # Process Chuong 1
    c1_path = os.path.join(n2_dir, "Chương 1", "Chương 1 N2.json")
    if os.path.exists(c1_path):
        print(f"Reading N2 Chap 1...")
        with open(c1_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        if "characters" in data and len(n2_meta["characters"]) == 0:
            for idx, ch in enumerate(data["characters"]):
                char_id = f"char-n2-{idx+1}"
                name_clean = sanitize_filename(ch.get('name', f'char_{idx}'))
                avatar_rel = f"assets/characters/n2_{name_clean}.jpg"
                avatar_abs = os.path.join(BASE_DIR, avatar_rel)
                
                if "referenceBase64" in ch and ch["referenceBase64"]:
                    save_base64_image(ch["referenceBase64"], avatar_abs)
                    
                n2_meta["characters"].append({
                    "id": char_id,
                    "name": ch.get("name", "Nhân vật"),
                    "appearance": ch.get("appearance", ""),
                    "clothing": ch.get("clothing", ""),
                    "role": ch.get("role", ""),
                    "tags": ch.get("tags", []),
                    "avatar": avatar_rel
                })
        
        chap_dir_rel = "assets/chapters/n2/chap-01"
        chap_dir_abs = os.path.join(BASE_DIR, chap_dir_rel)
        os.makedirs(chap_dir_abs, exist_ok=True)
        
        pages_list = []
        raw_pages = find_pages_array(data)
        print(f"Found {len(raw_pages)} raw pages for N2 Chap 1")
        
        page_num = 1
        for item in raw_pages:
            b64 = item.get("base64") or item.get("image")
            if b64:
                page_filename = f"page_{page_num:02d}.jpg"
                page_rel_path = f"{chap_dir_rel}/{page_filename}"
                page_abs_path = os.path.join(BASE_DIR, page_rel_path)
                save_base64_image(b64, page_abs_path)
                
                bubbles = extract_bubbles_from_item(item)
                dialogue = item.get("dialogue", "")
                    
                pages_list.append({
                    "pageNumber": page_num,
                    "imageUrl": page_rel_path,
                    "bubbles": bubbles,
                    "dialogue": dialogue
                })
                page_num += 1
                
        n2_meta["chapters"].append({
            "id": "chap-01",
            "title": "Chương 1: Áp Lực Đồ Án & Cuộc Gặp Gỡ Bất Ngờ",
            "subtitle": "Ngữ pháp N2: ～かねない, ～に相違ない, ～ざるを得ない",
            "releaseDate": "2026-08-30",
            "pagesCount": len(pages_list),
            "pages": pages_list,
            "pdfUrl": "3. N2/1. Manga/Chương 1/Chương_1_N2_MANGA.pdf"
        })

    # Process Chuong 2
    c2_path = os.path.join(n2_dir, "Chương 2", "Chương 2 N2.json")
    if os.path.exists(c2_path):
        print(f"Reading N2 Chap 2...")
        with open(c2_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        chap_dir_rel = "assets/chapters/n2/chap-02"
        chap_dir_abs = os.path.join(BASE_DIR, chap_dir_rel)
        os.makedirs(chap_dir_abs, exist_ok=True)
        
        pages_list = []
        raw_pages = find_pages_array(data)
        print(f"Found {len(raw_pages)} raw pages for N2 Chap 2")
        
        page_num = 1
        for item in raw_pages:
            b64 = item.get("base64") or item.get("image")
            if b64:
                page_filename = f"page_{page_num:02d}.jpg"
                page_rel_path = f"{chap_dir_rel}/{page_filename}"
                page_abs_path = os.path.join(BASE_DIR, page_rel_path)
                save_base64_image(b64, page_abs_path)
                
                bubbles = extract_bubbles_from_item(item)
                dialogue = item.get("dialogue", "")
                    
                pages_list.append({
                    "pageNumber": page_num,
                    "imageUrl": page_rel_path,
                    "bubbles": bubbles,
                    "dialogue": dialogue
                })
                page_num += 1
                
        n2_meta["chapters"].append({
            "id": "chap-02",
            "title": "Chương 2: Thử Thách Phỏng Vấn & Bài Học Kanji Khó Nhằn",
            "subtitle": "Ngữ pháp N2: ～を契機に, ～にほかならない, ～つつある",
            "releaseDate": "2026-09-02",
            "pagesCount": len(pages_list),
            "pages": pages_list,
            "pdfUrl": "3. N2/1. Manga/Chương 2/Chương_2_N2_MANGA.pdf"
        })

def process_tthcm():
    tthcm_meta = next(item for item in manga_catalog if item["id"] == "tu-tuong-hcm")
    tthcm_dir = os.path.join(BASE_DIR, "2. Tư tưởng Hồ Chí Minh", "1. Manga", "Chương 1")
    
    # Process Chuong 1 Phan 1
    p1_path = os.path.join(tthcm_dir, "Chương 1 Phần 1 TTHCM.json")
    if os.path.exists(p1_path):
        print(f"Reading TTHCM Chap 1 Part 1...")
        with open(p1_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        if "characters" in data and len(tthcm_meta["characters"]) == 0:
            for idx, ch in enumerate(data["characters"]):
                char_id = f"char-tthcm-{idx+1}"
                name_clean = sanitize_filename(ch.get('name', f'char_{idx}'))
                avatar_rel = f"assets/characters/tthcm_{name_clean}.jpg"
                avatar_abs = os.path.join(BASE_DIR, avatar_rel)
                
                if "referenceBase64" in ch and ch["referenceBase64"]:
                    save_base64_image(ch["referenceBase64"], avatar_abs)
                    
                tthcm_meta["characters"].append({
                    "id": char_id,
                    "name": ch.get("name", "Nhân vật"),
                    "appearance": ch.get("appearance", ""),
                    "clothing": ch.get("clothing", ""),
                    "role": ch.get("role", ""),
                    "tags": ch.get("tags", []),
                    "avatar": avatar_rel
                })
                
        chap_dir_rel = "assets/chapters/tthcm/chap-01-p1"
        chap_dir_abs = os.path.join(BASE_DIR, chap_dir_rel)
        os.makedirs(chap_dir_abs, exist_ok=True)
        
        pages_list = []
        raw_pages = find_pages_array(data)
        print(f"Found {len(raw_pages)} raw pages for TTHCM Chap 1 P1")
        
        page_num = 1
        for item in raw_pages:
            b64 = item.get("base64") or item.get("image")
            if b64:
                page_filename = f"page_{page_num:02d}.jpg"
                page_rel_path = f"{chap_dir_rel}/{page_filename}"
                page_abs_path = os.path.join(BASE_DIR, page_rel_path)
                save_base64_image(b64, page_abs_path)
                
                bubbles = extract_bubbles_from_item(item)
                dialogue = item.get("dialogue", "")
                    
                pages_list.append({
                    "pageNumber": page_num,
                    "imageUrl": page_rel_path,
                    "bubbles": bubbles,
                    "dialogue": dialogue
                })
                page_num += 1
                
        tthcm_meta["chapters"].append({
            "id": "chap-01-p1",
            "title": "Chương 1 - Phần 1: Cơ Sở Hình Thành & Bối Cảnh Lịch Sử",
            "subtitle": "Bối cảnh Việt Nam cuối thế kỷ XIX - đầu thế kỷ XX",
            "releaseDate": "2026-08-25",
            "pagesCount": len(pages_list),
            "pages": pages_list,
            "pdfUrl": "2. Tư tưởng Hồ Chí Minh/1. Manga/Chương 1/Chương_1_Phần_1_TTHCM_MANGA.pdf"
        })

    # Process Chuong 1 Phan 2
    p2_path = os.path.join(tthcm_dir, "Chương 1 Phần 2 TTHCM.json")
    if os.path.exists(p2_path):
        print(f"Reading TTHCM Chap 1 Part 2...")
        with open(p2_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        chap_dir_rel = "assets/chapters/tthcm/chap-01-p2"
        chap_dir_abs = os.path.join(BASE_DIR, chap_dir_rel)
        os.makedirs(chap_dir_abs, exist_ok=True)
        
        pages_list = []
        raw_pages = find_pages_array(data)
        print(f"Found {len(raw_pages)} raw pages for TTHCM Chap 1 P2")
        
        page_num = 1
        for item in raw_pages:
            b64 = item.get("base64") or item.get("image")
            if b64:
                page_filename = f"page_{page_num:02d}.jpg"
                page_rel_path = f"{chap_dir_rel}/{page_filename}"
                page_abs_path = os.path.join(BASE_DIR, page_rel_path)
                save_base64_image(b64, page_abs_path)
                
                bubbles = extract_bubbles_from_item(item)
                dialogue = item.get("dialogue", "")
                    
                pages_list.append({
                    "pageNumber": page_num,
                    "imageUrl": page_rel_path,
                    "bubbles": bubbles,
                    "dialogue": dialogue
                })
                page_num += 1
                
        tthcm_meta["chapters"].append({
            "id": "chap-01-p2",
            "title": "Chương 1 - Phần 2: Quá Trình Phát Triển & Giá Trị Thời Đại",
            "subtitle": "Các thời kỳ phát triển tư tưởng cứu nước và giải phóng dân tộc",
            "releaseDate": "2026-08-28",
            "pagesCount": len(pages_list),
            "pages": pages_list,
            "pdfUrl": "2. Tư tưởng Hồ Chí Minh/1. Manga/Chương 1/Chương_1_Phần_2_TTHCM_MANGA.pdf"
        })

    # Also add Full Chuong 1
    if len(tthcm_meta["chapters"]) >= 2:
        full_pdf = "2. Tư tưởng Hồ Chí Minh/1. Manga/Chương 1/Chương_1_TTHCM_MANGA.pdf"
        p1_pages = tthcm_meta["chapters"][0]["pages"]
        p2_pages = tthcm_meta["chapters"][1]["pages"]
        
        # Re-number pages for full chapter
        full_pages = []
        for idx, p in enumerate(p1_pages + p2_pages):
            p_copy = dict(p)
            p_copy["pageNumber"] = idx + 1
            full_pages.append(p_copy)
            
        tthcm_meta["chapters"].append({
            "id": "chap-01-full",
            "title": "Chương 1 (Bản Gộp Đầy Đủ - Full Volume)",
            "subtitle": "Trọn bộ cơ sở hình thành và quá trình phát triển TTHCM",
            "releaseDate": "2026-08-28",
            "pagesCount": len(full_pages),
            "pages": full_pages,
            "pdfUrl": full_pdf
        })

def process_sample_chapters():
    # Nhập môn AI Chapter 1 sample
    ai_meta = next(item for item in manga_catalog if item["id"] == "nhap-mon-ai")
    ai_pages = []
    for i in range(1, 9):
        img_rel = f"assets/chapters/ai/chap-01/page_{i:02d}.jpg"
        ai_pages.append({
            "pageNumber": i,
            "imageUrl": img_rel,
            "bubbles": [
                {
                    "id": f"b-ai-{i}-1",
                    "text": f"Bách Khoa: Thuật toán tìm kiếm không gian trạng thái bước {i}!",
                    "x": 30,
                    "y": 20,
                    "fontSize": 14,
                    "width": 35,
                    "fontWeight": "bold",
                    "fontStyle": "normal",
                    "textAlign": "center",
                    "bubbleType": "normal"
                },
                {
                    "id": f"b-ai-{i}-2",
                    "text": f"Ada (AI): Phân tích hàm Heuristic h(n) và chi phí g(n) đạt tối ưu.",
                    "x": 65,
                    "y": 68,
                    "fontSize": 14,
                    "width": 35,
                    "fontWeight": "bold",
                    "fontStyle": "normal",
                    "textAlign": "center",
                    "bubbleType": "normal"
                }
            ],
            "dialogue": f"PANEL 1: Bách Khoa phân tích trạng thái {i}.\nPANEL 2: Ada tính toán chi phí A*."
        })
    ai_meta["chapters"] = [{
        "id": "chap-01",
        "title": "Chương 1: Khởi Nguyên Thuật Toán & Đại Chiến Tìm Kiếm A*",
        "subtitle": "Phần 1: Search Agents & Heuristics trong không gian trạng thái",
        "releaseDate": "2026-09-01",
        "pagesCount": 8,
        "pages": ai_pages,
        "pdfUrl": ""
    }]

    # Pháp luật đại cương Chapter 1 sample
    pldc_meta = next(item for item in manga_catalog if item["id"] == "phap-luat-dai-cuong")
    pldc_pages = []
    for i in range(1, 7):
        img_rel = f"assets/chapters/pldc/chap-01/page_{i:02d}.jpg"
        pldc_pages.append({
            "pageNumber": i,
            "imageUrl": img_rel,
            "bubbles": [
                {
                    "id": f"b-pldc-{i}-1",
                    "text": f"Luật sư Hoàng: Đây là tình huống tranh chấp quy phạm pháp luật số {i}.",
                    "x": 32,
                    "y": 22,
                    "fontSize": 14,
                    "width": 35,
                    "fontWeight": "bold",
                    "fontStyle": "normal",
                    "textAlign": "center",
                    "bubbleType": "normal"
                },
                {
                    "id": f"b-pldc-{i}-2",
                    "text": f"Cần xác định rõ giả định, quy định và chế tài áp dụng trong điều luật.",
                    "x": 68,
                    "y": 70,
                    "fontSize": 14,
                    "width": 35,
                    "fontWeight": "bold",
                    "fontStyle": "normal",
                    "textAlign": "center",
                    "bubbleType": "normal"
                }
            ],
            "dialogue": f"PANEL 1: Phân tích vụ việc {i}.\nPANEL 2: Đối chiếu quy phạm pháp luật."
        })
    pldc_meta["chapters"] = [{
        "id": "chap-01",
        "title": "Chương 1: Nguồn Gốc Nhà Nước & Bản Chất Pháp Luật",
        "subtitle": "Phần 1: Quy phạm và Quan hệ pháp luật xã hội chủ nghĩa",
        "releaseDate": "2026-09-05",
        "pagesCount": 6,
        "pages": pldc_pages,
        "pdfUrl": ""
    }]

if __name__ == "__main__":
    print("Starting Manga Data Extraction with complete overlays & dialogues...")
    process_n2()
    process_tthcm()
    process_sample_chapters()
    
    # Save master data
    out_file = os.path.join(DATA_DIR, "manga.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(manga_catalog, f, ensure_ascii=False, indent=2)
    print(f"Extraction complete! Saved {len(manga_catalog)} series to {out_file}")
