import os
import sys
import json
from PIL import Image, ImageDraw, ImageFont

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COVERS_DIR = os.path.join(BASE_DIR, "assets", "covers")
CHARACTERS_DIR = os.path.join(BASE_DIR, "assets", "characters")
CHAPTERS_DIR = os.path.join(BASE_DIR, "assets", "chapters")

def create_manga_cover(title, subtitle, tag, color_start, color_end, output_path):
    width, height = 600, 850
    img = Image.new("RGB", (width, height), color_start)
    draw = ImageDraw.Draw(img)
    
    # Create smooth gradient
    for y in range(height):
        r = int(color_start[0] + (color_end[0] - color_start[0]) * (y / height))
        g = int(color_start[1] + (color_end[1] - color_start[1]) * (y / height))
        b = int(color_start[2] + (color_end[2] - color_start[2]) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b))
        
    # Decorative geometry
    draw.polygon([(0, 0), (width, 0), (0, 300)], fill=(255, 255, 255, 15))
    draw.ellipse([width - 250, 100, width + 150, 500], outline=(255, 255, 255, 30), width=4)
    draw.rectangle([40, 40, width - 40, height - 40], outline=(255, 255, 255, 80), width=2)
    
    # Badge
    draw.rectangle([60, 60, 200, 100], fill=(255, 60, 110))
    draw.text((80, 72), tag, fill=(255, 255, 255))
    
    # Manga Title Box
    draw.rectangle([50, height - 280, width - 50, height - 60], fill=(15, 20, 35))
    draw.rectangle([50, height - 280, width - 50, height - 275], fill=(255, 180, 0))
    
    # Texts
    draw.text((70, height - 240), title, fill=(255, 255, 255))
    draw.text((70, height - 180), subtitle, fill=(180, 200, 230))
    draw.text((70, height - 120), "MANGA HỌC TẬP • EDUMANGA STUDIO", fill=(255, 180, 0))
    
    img.save(output_path, "JPEG", quality=90)
    print(f"Generated cover: {output_path}")

def create_character_avatar(name, role, color, output_path):
    width, height = 300, 300
    img = Image.new("RGB", (width, height), color)
    draw = ImageDraw.Draw(img)
    
    # Draw stylized avatar circle & initial
    draw.ellipse([30, 30, 270, 270], outline=(255, 255, 255), width=4)
    draw.ellipse([80, 70, 220, 210], fill=(255, 255, 255, 50))
    
    # Initials
    initial = name[0].upper() if name else "C"
    draw.text((125, 90), initial, fill=(255, 255, 255))
    
    # Bottom banner
    draw.rectangle([0, 230, 300, 300], fill=(15, 23, 42))
    draw.text((20, 245), name[:20], fill=(255, 255, 255))
    draw.text((20, 270), role[:25], fill=(148, 163, 184))
    
    img.save(output_path, "JPEG", quality=85)
    print(f"Generated avatar: {output_path}")

def create_sample_pages(series_slug, chap_slug, title_text, count=5):
    chap_dir = os.path.join(CHAPTERS_DIR, series_slug, chap_slug)
    os.makedirs(chap_dir, exist_ok=True)
    pages = []
    
    for i in range(1, count + 1):
        img_path = os.path.join(chap_dir, f"page_{i:02d}.jpg")
        w, h = 800, 1200
        img = Image.new("RGB", (w, h), (245, 246, 250))
        draw = ImageDraw.Draw(img)
        
        # Manga page panel layout
        draw.rectangle([40, 40, w - 40, 350], fill=(255, 255, 255), outline=(30, 30, 30), width=3)
        draw.rectangle([40, 370, w//2 - 10, 750], fill=(255, 255, 255), outline=(30, 30, 30), width=3)
        draw.rectangle([w//2 + 10, 370, w - 40, 750], fill=(255, 255, 255), outline=(30, 30, 30), width=3)
        draw.rectangle([40, 770, w - 40, h - 50], fill=(255, 255, 255), outline=(30, 30, 30), width=3)
        
        # Dialogue bubbles
        draw.ellipse([80, 70, 360, 200], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
        draw.text((100, 110), f"{title_text}\nTrang {i} - Khung thoại 1", fill=(0, 0, 0))
        
        draw.ellipse([w - 380, 800, w - 100, 930], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
        draw.text((w - 350, 840), "Kiến thức trọng tâm bài học\n(Interactive Mode)", fill=(0, 0, 0))
        
        # Page footer
        draw.text((w//2 - 30, h - 35), f"- {i} -", fill=(100, 100, 100))
        
        img.save(img_path, "JPEG", quality=85)
        
        rel_img_path = f"assets/chapters/{series_slug}/{chap_slug}/page_{i:02d}.jpg"
        pages.append({
            "pageNumber": i,
            "imageUrl": rel_img_path,
            "bubbles": [
                {
                    "id": f"b-{i}-1",
                    "text": f"Chào mừng bạn đến với {title_text} - Bài học số {i}!",
                    "x": 25,
                    "y": 12,
                    "fontSize": 14,
                    "width": 30,
                    "fontWeight": "bold",
                    "textAlign": "center"
                },
                {
                    "id": f"b-{i}-2",
                    "text": "Hãy suy nghĩ câu trả lời trước khi bật xem lời thoại nhé!",
                    "x": 65,
                    "y": 72,
                    "fontSize": 14,
                    "width": 32,
                    "fontWeight": "bold",
                    "textAlign": "center"
                }
            ]
        })
    return pages

if __name__ == "__main__":
    # Generate covers
    create_manga_cover("NHẬP MÔN AI", "Thuật toán & Học máy", "CÔNG NGHỆ", (15, 23, 42), (37, 99, 235), os.path.join(COVERS_DIR, "ai_cover.jpg"))
    create_manga_cover("PHÁP LUẬT ĐẠI CƯƠNG", "Quy phạm & Tranh chấp", "LUẬT HỌC", (30, 20, 50), (147, 51, 234), os.path.join(COVERS_DIR, "pldc_cover.jpg"))
    
    # Generate avatars
    create_character_avatar("Bách Khoa", "Nam chính - AI Dev", (30, 58, 138), os.path.join(CHARACTERS_DIR, "ai_bachkhoa.jpg"))
    create_character_avatar("Ada", "AI Hologram Assistant", (6, 182, 212), os.path.join(CHARACTERS_DIR, "ai_ada.jpg"))
    create_character_avatar("Luật sư Hoàng", "Tranh tụng hình sự", (126, 34, 206), os.path.join(CHARACTERS_DIR, "pldc_hoang.jpg"))
    
    # Generate pages for AI and PLDC
    ai_pages = create_sample_pages("ai", "chap-01", "Nhập Môn AI", 8)
    pldc_pages = create_sample_pages("pldc", "chap-01", "Pháp Luật Đại Cương", 8)
    
    # Update manga.json
    json_path = os.path.join(BASE_DIR, "data", "manga.json")
    with open(json_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)
        
    for item in catalog:
        if item["id"] == "nhap-mon-ai":
            item["cover"] = "assets/covers/ai_cover.jpg"
            item["chapters"][0]["pages"] = ai_pages
            item["chapters"][0]["pagesCount"] = len(ai_pages)
        elif item["id"] == "phap-luat-dai-cuong":
            item["cover"] = "assets/covers/pldc_cover.jpg"
            item["chapters"][0]["pages"] = pldc_pages
            item["chapters"][0]["pagesCount"] = len(pldc_pages)
        elif item["id"] == "tieng-nhat-n2":
            item["cover"] = "assets/covers/n2_cover.jpg"
        elif item["id"] == "tu-tuong-hcm":
            item["cover"] = "assets/covers/tthcm_cover.jpg"
            
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        
    print("Catalog updated successfully with all 4 series!")
