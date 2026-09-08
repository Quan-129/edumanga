import os
import sys
import json
import base64
import re
import hashlib
import time

# Ensure UTF-8 output for Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
DATA_DIR = os.path.join(BASE_DIR, "data")
CHAPTERS_DIR = os.path.join(ASSETS_DIR, "chapters")
COVERS_DIR = os.path.join(ASSETS_DIR, "covers")
CHARACTERS_DIR = os.path.join(ASSETS_DIR, "characters")
CACHE_FILE = os.path.join(DATA_DIR, ".cache_registry.json")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CHAPTERS_DIR, exist_ok=True)
os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(CHARACTERS_DIR, exist_ok=True)

# Helper: slugify Vietnamese text
def slugify(text):
    text = text.lower()
    replacements = {
        'à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ': 'a',
        'è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ': 'e',
        'ì|í|ị|ỉ|ĩ': 'i',
        'ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ': 'o',
        'ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ': 'u',
        'ỳ|ý|ỵ|ỷ|ỹ': 'y',
        'đ': 'd'
    }
    for pattern, repl in replacements.items():
        text = re.sub(pattern, repl, text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def sanitize_filename(name):
    return re.sub(r'[^a-zA-Z0-9_\-]', '_', name)

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def compute_file_hash(filepath):
    hasher = hashlib.md5()
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return ""

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cache(cache_data):
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving cache: {e}")

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

# Discover all subject directories in workspace
def discover_subject_directories():
    subjects = []
    for entry in os.scandir(BASE_DIR):
        if entry.is_dir():
            # Match folders like '1. Nhập môn trí tuệ nhân tạo' or '2. Tư tưởng...' or custom named folders
            # Exclude system folders
            if entry.name in [".git", ".agents", "assets", "css", "data", "js", "scripts", "docs", "brain"]:
                continue
            
            # Check if directory contains .json / .pdf files or a '1. Manga' subfolder
            match = re.match(r'^(\d+)\.\s*(.+)$', entry.name)
            if match:
                order_num = int(match.group(1))
                clean_title = match.group(2).strip()
            else:
                order_num = 99
                clean_title = entry.name.strip()
                
            slug = slugify(clean_title)
            subjects.append({
                "folder_name": entry.name,
                "folder_path": entry.path,
                "order": order_num,
                "title": clean_title,
                "slug": slug
            })
            
    subjects.sort(key=lambda x: (x["order"], x["title"]))
    return subjects

# Process a single JSON manga chapter file
def process_manga_json_file(json_path, series_slug, chap_slug, cache_registry):
    mtime = os.path.getmtime(json_path)
    file_size = os.path.getsize(json_path)
    file_key = os.path.relpath(json_path, BASE_DIR).replace('\\', '/')
    
    # Check cache
    cached = cache_registry.get(file_key)
    if cached and cached.get("mtime") == mtime and cached.get("size") == file_size:
        # Verify output files exist
        all_exist = True
        for p in cached.get("pages", []):
            abs_img = os.path.join(BASE_DIR, p["imageUrl"])
            if not os.path.exists(abs_img):
                all_exist = False
                break
        if all_exist:
            # Use cached result
            return cached.get("data")

    print(f"  ⚡ Parsing & Extracting: {file_key} ({file_size / (1024*1024):.1f} MB)...")
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except Exception as e:
        print(f"  ❌ Error reading JSON {json_path}: {e}")
        return None

    # Determine chapter target directory
    chap_dir_rel = f"assets/chapters/{series_slug}/{chap_slug}"
    chap_dir_abs = os.path.join(BASE_DIR, chap_dir_rel)
    os.makedirs(chap_dir_abs, exist_ok=True)

    pages_output = []
    characters_output = []

    # Extract characters if present
    if "characters" in raw_data and isinstance(raw_data["characters"], list):
        for idx, ch in enumerate(raw_data["characters"]):
            char_name = ch.get("name", f"Nhân vật {idx+1}")
            clean_char_name = sanitize_filename(char_name)
            avatar_rel = f"assets/characters/{series_slug}_{clean_char_name}.jpg"
            avatar_abs = os.path.join(BASE_DIR, avatar_rel)

            if "referenceBase64" in ch and ch["referenceBase64"]:
                save_base64_image(ch["referenceBase64"], avatar_abs)

            characters_output.append({
                "id": f"char-{series_slug}-{idx+1}",
                "name": char_name,
                "appearance": ch.get("appearance", ""),
                "clothing": ch.get("clothing", ""),
                "role": ch.get("role", ""),
                "tags": ch.get("tags", ["Nhân vật"]),
                "avatar": avatar_rel if os.path.exists(avatar_abs) else "assets/characters/ai_bachkhoa.jpg"
            })

    # Extract pages
    raw_pages = []
    if "pages" in raw_data and isinstance(raw_data["pages"], list):
        raw_pages = raw_data["pages"]
    elif isinstance(raw_data, list):
        raw_pages = raw_data
    elif isinstance(raw_data, dict):
        for k in ["frames", "storyboard", "items", "data"]:
            if k in raw_data and isinstance(raw_data[k], list):
                raw_pages = raw_data[k]
                break

    page_idx = 1
    for item in raw_pages:
        b64 = item.get("base64") or item.get("image")
        if b64:
            page_filename = f"page_{page_idx:02d}.jpg"
            page_rel = f"{chap_dir_rel}/{page_filename}"
            page_abs = os.path.join(BASE_DIR, page_rel)
            
            # Save extracted image
            save_base64_image(b64, page_abs)

            bubbles = extract_bubbles_from_item(item)
            dialogue = item.get("dialogue", "")

            pages_output.append({
                "pageNumber": page_idx,
                "imageUrl": page_rel,
                "bubbles": bubbles,
                "dialogue": dialogue
            })
            page_idx += 1

    extracted_result = {
        "title": raw_data.get("name") or chap_slug.replace('-', ' ').title(),
        "author": raw_data.get("author", "TBMQ"),
        "characters": characters_output,
        "pages": pages_output,
        "coverBase64": raw_data.get("cover", {}).get("frontBase64") if isinstance(raw_data.get("cover"), dict) else None
    }

    # Save to cache registry
    cache_registry[file_key] = {
        "mtime": mtime,
        "size": file_size,
        "pages": pages_output,
        "data": extracted_result
    }

    return extracted_result

# Main auto scan and compilation function
def run_auto_sync():
    print("=" * 60)
    print("🚀 EDUMANGA HUB - ZERO-CODE AUTO SCANNER & SYNC ENGINE")
    print("=" * 60)

    start_time = time.time()
    cache_registry = load_cache()
    subjects = discover_subject_directories()
    print(f"📂 Discovered {len(subjects)} Subject Directories:")
    for s in subjects:
        print(f"  • [{s['order']}] {s['title']} -> slug: {s['slug']}")

    manga_catalog = []

    # Category mappings
    category_defaults = {
        "nhap-mon-tri-tue-nhan-tao": {"category": "Công nghệ & AI", "categoryKey": "ai", "badge": "Hot"},
        "tu-tuong-ho-chi-minh": {"category": "Lý luận chính trị", "categoryKey": "tthcm", "badge": "Chính thống"},
        "n2": {"category": "Ngoại ngữ & JLPT", "categoryKey": "n2", "badge": "Luyện thi"},
        "phap-luat-dai-cuong": {"category": "Pháp luật & Xã hội", "categoryKey": "pldc", "badge": "Mới"}
    }

    for subj in subjects:
        series_slug = subj["slug"]
        series_folder = subj["folder_path"]
        print(f"\n🔍 Scanning: {subj['folder_name']}...")

        # Find all JSON and PDF files recursively
        all_json_files = []
        all_pdf_files = []

        for root, dirs, files in os.walk(series_folder):
            for file in files:
                ext = file.lower()
                full_path = os.path.join(root, file)
                if ext.endswith('.json'):
                    all_json_files.append(full_path)
                elif ext.endswith('.pdf'):
                    all_pdf_files.append(full_path)

        all_json_files.sort(key=lambda p: natural_sort_key(os.path.basename(p)))
        all_pdf_files.sort(key=lambda p: natural_sort_key(os.path.basename(p)))

        # Metadata defaults
        cat_info = category_defaults.get(series_slug, {
            "category": "Kiến thức chuyên đề",
            "categoryKey": series_slug,
            "badge": "Mới"
        })

        series_characters = []
        series_chapters = []
        series_cover_rel = f"assets/covers/{series_slug}_cover.jpg"
        series_author = "TBMQ"

        # Group and process chapters
        for idx, json_path in enumerate(all_json_files):
            file_name = os.path.basename(json_path)
            # Chapter slug
            chap_slug = slugify(os.path.splitext(file_name)[0])
            
            # Extract
            extracted = process_manga_json_file(json_path, series_slug, chap_slug, cache_registry)
            if not extracted:
                continue

            if extracted.get("author"):
                series_author = extracted["author"]

            # Merge characters
            for ch in extracted.get("characters", []):
                if not any(existing["name"] == ch["name"] for existing in series_characters):
                    series_characters.append(ch)

            # Match associated PDF
            matched_pdf = ""
            json_base_clean = slugify(os.path.splitext(file_name)[0])
            for pdf_p in all_pdf_files:
                pdf_base_clean = slugify(os.path.splitext(os.path.basename(pdf_p))[0])
                if json_base_clean in pdf_base_clean or pdf_base_clean in json_base_clean or len(all_json_files) == 1:
                    matched_pdf = os.path.relpath(pdf_p, BASE_DIR).replace('\\', '/')
                    break

            series_chapters.append({
                "id": chap_slug,
                "title": extracted["title"],
                "subtitle": f"Tự động đồng bộ từ {file_name}",
                "releaseDate": time.strftime("%Y-%m-%d", time.localtime(os.path.getmtime(json_path))),
                "pagesCount": len(extracted["pages"]),
                "pages": extracted["pages"],
                "pdfUrl": matched_pdf
            })

            # Check if cover image can be extracted
            if extracted.get("coverBase64") and not os.path.exists(os.path.join(BASE_DIR, series_cover_rel)):
                save_base64_image(extracted["coverBase64"], os.path.join(BASE_DIR, series_cover_rel))

        # If no cover yet, use page 1 of first chapter
        series_cover_abs = os.path.join(BASE_DIR, series_cover_rel)
        if not os.path.exists(series_cover_abs):
            if series_chapters and series_chapters[0]["pages"]:
                first_page_rel = series_chapters[0]["pages"][0]["imageUrl"]
                first_page_abs = os.path.join(BASE_DIR, first_page_rel)
                if os.path.exists(first_page_abs):
                    with open(first_page_abs, 'rb') as f_src, open(series_cover_abs, 'wb') as f_dst:
                        f_dst.write(f_src.read())

        # If still empty (e.g. empty folder without JSON yet), check if sample covers exist
        if not os.path.exists(series_cover_abs):
            fallback_cover = os.path.join(COVERS_DIR, f"{series_slug}_cover.jpg")
            if os.path.exists(fallback_cover):
                series_cover_rel = f"assets/covers/{series_slug}_cover.jpg"
            else:
                series_cover_rel = "assets/covers/n2_cover.jpg"

        # Add to catalog
        manga_catalog.append({
            "id": series_slug,
            "title": subj["title"],
            "folder": subj["folder_name"],
            "category": cat_info["category"],
            "categoryKey": cat_info["categoryKey"],
            "badge": cat_info["badge"],
            "status": "Đang phát hành",
            "author": series_author,
            "rating": 5.0 if "hồ chí minh" in subj["title"].lower() else 4.9,
            "views": f"{10 + subj['order'] * 5}.2K",
            "likes": f"{1 + subj['order'] * 0.8:.1f}K",
            "description": f"Bộ truyện tranh học tập & chuyên đề kiến thức {subj['title']}. Toàn bộ hình ảnh, dàn nhân vật và bong bóng thoại được tự động cập nhật từ hệ thống kịch bản.",
            "cover": series_cover_rel,
            "characters": series_characters,
            "chapters": series_chapters
        })

    # Save cache registry
    save_cache(cache_registry)

    # Save output master json
    out_file = os.path.join(DATA_DIR, "manga.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(manga_catalog, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start_time
    total_chaps = sum(len(m["chapters"]) for m in manga_catalog)
    total_pages = sum(sum(len(c["pages"]) for c in m["chapters"]) for m in manga_catalog)
    total_bubbles = sum(sum(sum(len(p.get("bubbles", [])) for p in c["pages"]) for c in m["chapters"]) for m in manga_catalog)

    print("\n" + "=" * 60)
    print(f"✅ AUTO-SYNC COMPLETED in {elapsed:.2f}s!")
    print(f"📊 Summary: {len(manga_catalog)} Series | {total_chaps} Chapters | {total_pages} Pages | {total_bubbles} Speech Bubbles")
    print(f"💾 Manifest saved to: {out_file}")
    print("=" * 60)

    return {
        "success": True,
        "elapsed": round(elapsed, 2),
        "seriesCount": len(manga_catalog),
        "chaptersCount": total_chaps,
        "pagesCount": total_pages,
        "bubblesCount": total_bubbles
    }

if __name__ == "__main__":
    run_auto_sync()
