#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TikTok Overlay Image Generator Script
Tự động chèn chữ (Text Overlay), card bo góc, viền màu sắc thẩm mỹ lên bộ ảnh và xuất ra các thư mục biến thể TikTok.
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Thiết lập encoding UTF-8 cho stdout trên Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def get_default_fonts(bold_path=None, reg_path=None):
    if bold_path and os.path.exists(bold_path):
        f_bold = bold_path
    elif os.path.exists("C:/Windows/Fonts/arialbd.ttf"):
        f_bold = "C:/Windows/Fonts/arialbd.ttf"
    elif os.path.exists("C:/Windows/Fonts/segoeuib.ttf"):
        f_bold = "C:/Windows/Fonts/segoeuib.ttf"
    else:
        f_bold = None

    if reg_path and os.path.exists(reg_path):
        f_reg = reg_path
    elif os.path.exists("C:/Windows/Fonts/arial.ttf"):
        f_reg = "C:/Windows/Fonts/arial.ttf"
    elif os.path.exists("C:/Windows/Fonts/segoeui.ttf"):
        f_reg = "C:/Windows/Fonts/segoeui.ttf"
    else:
        f_reg = None

    return f_bold, f_reg

def wrap_text(text, font, max_width, draw):
    words = text.split(' ')
    lines = []
    current_line = []
    
    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
    if current_line:
        lines.append(' '.join(current_line))
    return lines

def create_overlay_card(img, top_text, bottom_text, border_color, font_bold_path, font_reg_path):
    img = img.convert("RGBA")
    W, H = img.size
    
    # Kích thước font chữ linh hoạt theo độ phân giải ảnh
    font_size_top = max(24, int(W * 0.038))
    font_size_bottom = max(18, int(W * 0.027))
    
    try:
        font_top = ImageFont.truetype(font_bold_path, font_size_top) if font_bold_path else ImageFont.load_default()
        font_bottom = ImageFont.truetype(font_reg_path, font_size_bottom) if font_reg_path else ImageFont.load_default()
    except Exception:
        font_top = ImageFont.load_default()
        font_bottom = ImageFont.load_default()

    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    margin_x = int(W * 0.04)
    card_w = W - 2 * margin_x
    max_text_w = card_w - int(W * 0.08)
    
    top_lines = wrap_text(top_text, font_top, max_text_w, draw)
    bottom_lines = wrap_text(bottom_text, font_bottom, max_text_w, draw)
    
    line_h_top = int(font_size_top * 1.35)
    line_h_bottom = int(font_size_bottom * 1.4)
    
    pad_y = int(H * 0.02)
    badge_pad = int(font_size_top * 0.4)
    
    # Tính toán chiều cao các khối
    badge_h = len(top_lines) * line_h_top + badge_pad * 2
    bottom_h = len(bottom_lines) * line_h_bottom
    
    card_h = badge_h + bottom_h + pad_y * 3
    card_y = int(H * 0.03)
    card_x = margin_x
    
    # 1. Vẽ khung nền Container (Dark Glassmorphism)
    card_box = [card_x, card_y, card_x + card_w, card_y + card_h]
    draw.rounded_rectangle(card_box, radius=18, fill=(15, 23, 42, 238), outline=border_color, width=3)
    
    # 2. Vẽ Header Badge bo góc
    badge_margin = int(W * 0.03)
    badge_box = [card_x + badge_margin, card_y + pad_y, card_x + card_w - badge_margin, card_y + pad_y + badge_h]
    badge_bg = (border_color[0], border_color[1], border_color[2], 45)
    draw.rounded_rectangle(badge_box, radius=10, fill=badge_bg, outline=border_color, width=2)
    
    # 3. Vẽ Text Header (Top Lines)
    cur_y = card_y + pad_y + badge_pad
    for line in top_lines:
        bbox = draw.textbbox((0, 0), line, font=font_top)
        tw = bbox[2] - bbox[0]
        tx = card_x + (card_w - tw) // 2
        draw.text((tx, cur_y), line, font=font_top, fill=(255, 255, 255, 255))
        cur_y += line_h_top
        
    # 4. Vẽ Text Subtext (Bottom Lines)
    cur_y = card_y + pad_y + badge_h + int(pad_y * 0.8)
    for line in bottom_lines:
        bbox = draw.textbbox((0, 0), line, font=font_bottom)
        tw = bbox[2] - bbox[0]
        tx = card_x + (card_w - tw) // 2
        draw.text((tx, cur_y), line, font=font_bottom, fill=(241, 245, 249, 255))
        cur_y += line_h_bottom

    # Ghép overlay vào ảnh gốc
    result = Image.alpha_composite(img, overlay)
    return result.convert("RGB")

def main():
    parser = argparse.ArgumentParser(description="Generate TikTok Image Overlays")
    parser.add_argument("--src", type=str, default="kịch bản 1", help="Source folder containing original screenshots")
    parser.add_argument("--workspace", type=str, default=".", help="Workspace root directory")
    args = parser.parse_args()

    workspace = Path(args.workspace).resolve()
    src_dir = workspace / args.src

    if not src_dir.exists():
        print(f"Error: Source directory {src_dir} does not exist.")
        sys.exit(1)

    font_bold, font_reg = get_default_fonts()

    print(f"Source Directory: {src_dir}")
    print(f"Font Bold: {font_bold}")
    print(f"Font Regular: {font_reg}")

if __name__ == "__main__":
    main()
