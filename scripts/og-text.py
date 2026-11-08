# -*- coding: utf-8 -*-
"""تولید لایه‌ی متنی تصویر OG با وزیرمتن + arabic-reshaper + python-bidi"""
import os
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FONT_DIR = os.path.join(ROOT, 'node_modules', 'vazirmatn', 'fonts', 'ttf')
W, H = 1200, 630

def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

def fa(text):
    # ابتدا reshaping (اتصال حروف) سپس Bidi (چینش راست‌به‌چپ)
    return get_display(arabic_reshaper.reshape(text))

img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

def center(text, y, fnt, fill):
    bbox = d.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) / 2 - bbox[0], y), text, font=fnt, fill=fill)

title = fa('یادچه')
center(title, 278, font('Vazirmatn-Bold.ttf', 132), (255, 255, 255, 255))

slogan = fa('هر چیزی که باید بماند، اینجاست.')
center(slogan, 448, font('Vazirmatn-SemiBold.ttf', 42), (255, 255, 255, 230))

sub = fa('یادداشت، چک‌لیست، کد، صدا و خاطره — آفلاین و همگام')
center(sub, 522, font('Vazirmatn-Regular.ttf', 30), (255, 255, 255, 165))

out = os.path.join(os.path.dirname(__file__), 'og-text.png')
img.save(out)
print('✓ og-text.png')
