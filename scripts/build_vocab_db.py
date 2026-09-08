import csv
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOCAB_DIR = os.path.join(BASE_DIR, "vocab", "N2")
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# 1. Build Pitch Accent helper
# [1] -> Atamadaka (1st mora high, rest low): e.g. じ̅ん̲せ̲い̲
# [0] -> Heiban (1st mora low, rest high): e.g. に̲ん̅げ̅ん̅
# [2] -> Nakadaka (1st low, 2nd high, rest low): e.g. お̲と̅お̲さ̲ん̲
def format_pitch_accent_html(reading, pitch_str):
    if not pitch_str or pitch_str == '-':
        return reading, "", "⓪"
    
    pitch_num = -1
    try:
        clean = pitch_str.replace('[', '').replace(']', '').strip()
        if clean.isdigit():
            pitch_num = int(clean)
    except Exception:
        pitch_num = -1
        
    if pitch_num == -1:
        return reading, pitch_str, "⓪"

    # Separate moras (handling small ya, yu, yo, tsu)
    moras = []
    i = 0
    while i < len(reading):
        char = reading[i]
        if i + 1 < len(reading) and reading[i+1] in 'ゃゅょャュョぁぃぅぇぉァィゥェォ':
            moras.append(char + reading[i+1])
            i += 2
        else:
            moras.append(char)
            i += 1

    formatted_moras = []
    for idx, mora in enumerate(moras):
        mora_idx = idx + 1 # 1-based
        is_high = False
        if pitch_num == 0: # Heiban: 1 low, rest high
            is_high = (mora_idx > 1)
        elif pitch_num == 1: # Atamadaka: 1 high, rest low
            is_high = (mora_idx == 1)
        else: # Nakadaka/Odaka: 1 low, up to pitch_num high, rest low
            is_high = (1 < mora_idx <= pitch_num)
            
        if is_high:
            formatted_moras.append(f"<span class='pitch-high'>{mora}</span>")
        else:
            formatted_moras.append(f"<span class='pitch-low'>{mora}</span>")

    badge_map = {0: "⓪ Heiban (Bằng)", 1: "① Atamadaka (Đầu cao)", 2: "② Nakadaka (Giữa cao)", 3: "③ Nakadaka (Giữa cao)", 4: "④ Odaka (Đuôi cao)"}
    badge_label = badge_map.get(pitch_num, f"[{pitch_num}]")
    badge_short = f"[{pitch_num}]"

    return "".join(formatted_moras), badge_label, badge_short


def build_vocab_database():
    print("🚀 Building Master Vocab & Grammar Database for Edumanga Hub...")
    
    # 1. Parse Vocab CSV
    vocab_csv_path = os.path.join(VOCAB_DIR, "mimiraka", "tuvungn2.csv")
    vocab_by_chapter_csv = os.path.join(VOCAB_DIR, "tu_vung_n2_theo_30_chuong.csv")
    
    vocab_items = []
    term_to_chapter_map = {}
    
    # Read 30-chapter mapping if available
    if os.path.exists(vocab_by_chapter_csv):
        with open(vocab_by_chapter_csv, 'r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f):
                stt_goc = row.get('STT_Goc', '').strip()
                ch_num = int(row.get('Chuong', 1))
                if stt_goc:
                    term_to_chapter_map[stt_goc] = ch_num
    
    if os.path.exists(vocab_csv_path):
        with open(vocab_csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                stt = row.get('stt', '').strip()
                term = row.get('term', '').strip()
                reading = row.get('reading', '').strip()
                pitch_raw = row.get('pitch_accent', '').strip()
                
                pitch_html, pitch_label, pitch_short = format_pitch_accent_html(reading, pitch_raw)
                chapter = term_to_chapter_map.get(stt, ((int(stt)-1) // 39) + 1 if stt.isdigit() else 1)
                
                vocab_items.append({
                    "id": f"v_{stt}",
                    "stt": int(stt) if stt.isdigit() else stt,
                    "chapter": chapter,
                    "term": term,
                    "reading": reading,
                    "romaji": row.get('romaji', '').strip(),
                    "han_viet": row.get('han_viet', '').strip(),
                    "meaning": row.get('meaning', '').strip(),
                    "type": row.get('type', 'Danh từ').strip(),
                    "exam_ja": row.get('exam_ja', '').strip(),
                    "exam_vi": row.get('exam_vi', '').strip(),
                    "kanji_breakdown": row.get('kanji_breakdown', '').strip(),
                    "pitch_raw": pitch_raw,
                    "pitch_html": pitch_html,
                    "pitch_label": pitch_label,
                    "pitch_short": pitch_short,
                    "synonyms_antonyms": row.get('synonyms_antonyms', '').strip(),
                    "card_type": "vocab"
                })
        print(f"  ✓ Loaded {len(vocab_items)} Vocabulary items with full 13 attributes & Pitch Accent.")

    # 2. Parse Grammar CSV
    grammar_csv_path = os.path.join(VOCAB_DIR, "sou", "ngu_phap_n2_full.csv")
    grammar_by_chapter_csv = os.path.join(VOCAB_DIR, "ngu_phap_n2_theo_30_chuong.csv")
    
    grammar_items = []
    grammar_to_chapter_map = {}
    
    if os.path.exists(grammar_by_chapter_csv):
        with open(grammar_by_chapter_csv, 'r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f):
                stt_goc = row.get('STT_Goc', '').strip()
                ch_num = int(row.get('Chuong', 1))
                if stt_goc:
                    grammar_to_chapter_map[stt_goc] = ch_num

    if os.path.exists(grammar_csv_path):
        with open(grammar_csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                stt = row.get('stt', '').strip()
                pattern = row.get('pattern', '').strip()
                chapter = grammar_to_chapter_map.get(stt, ((int(stt)-1) // 6) + 1 if stt.isdigit() else 1)
                
                grammar_items.append({
                    "id": f"g_{stt}",
                    "stt": int(stt) if stt.isdigit() else stt,
                    "chapter": chapter,
                    "pattern": pattern,
                    "reading": row.get('reading', pattern).strip(),
                    "meaning": row.get('meaning', '').strip(),
                    "connection": row.get('connection', '').strip(),
                    "usage_notes": row.get('usage_notes', '').strip(),
                    "level": row.get('level', 'N2').strip(),
                    "exam_ja_1": row.get('exam_ja_1', '').strip(),
                    "exam_vi_1": row.get('exam_vi_1', '').strip(),
                    "exam_ja_2": row.get('exam_ja_2', '').strip(),
                    "exam_vi_2": row.get('exam_vi_2', '').strip(),
                    "similar_patterns": row.get('similar_patterns', '').strip(),
                    "card_type": "grammar"
                })
        print(f"  ✓ Loaded {len(grammar_items)} Grammar patterns with full 13 attributes & connections.")

    # 3. Build Lookup Dictionary Map for O(1) instantaneous lookup on Web
    lookup_map = {}
    for v in vocab_items:
        key = v["term"].strip()
        lookup_map[key] = v
        # Also map without kanji if different
        if v["reading"] and v["reading"] != key:
            lookup_map[v["reading"].strip()] = v

    for g in grammar_items:
        clean_pat = g["pattern"].replace('〜', '').replace('~', '').strip()
        lookup_map[g["pattern"]] = g
        lookup_map[clean_pat] = g

    master_db = {
        "metadata": {
            "total_vocab": len(vocab_items),
            "total_grammar": len(grammar_items),
            "chapters_count": 30,
            "level": "N2"
        },
        "vocab_list": vocab_items,
        "grammar_list": grammar_items,
        "lookup_map": lookup_map
    }

    output_path = os.path.join(DATA_DIR, "vocab_n2_db.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(master_db, f, ensure_ascii=False, indent=2)

    print(f"✅ Generated Master Database: {output_path} ({os.path.getsize(output_path)/1024:.1f} KB)")

if __name__ == "__main__":
    build_vocab_database()
