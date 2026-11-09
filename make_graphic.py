#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Motion graphic generator: "Water Crisis" (بحران کم‌آبی)
Vertical 9:16, ~28s, 6 scenes, Persian typography, RTL, Persian numerals.
Render: Pillow frames -> ffmpeg (via imageio-ffmpeg binary) -> MP4.
"""
import os, sys, math, random, subprocess, time
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

import arabic_reshaper
from bidi.algorithm import get_display

# ---------------- paths ----------------
ROOT = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(ROOT, "assets", "fonts", "vazirmatn-33.003", "fonts", "ttf")
FBOLD = os.path.join(FONT_DIR, "Vazirmatn-Bold.ttf")
FREG  = os.path.join(FONT_DIR, "Vazirmatn-Regular.ttf")
FEB   = os.path.join(FONT_DIR, "Vazirmatn-ExtraBold.ttf")
OUT_DIR = os.path.join(ROOT, "render")
FRAME_DIR = os.path.join(OUT_DIR, "frames")
os.makedirs(FRAME_DIR, exist_ok=True)

FFMPEG = "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2"

# ---------------- spec ----------------
W, H = 1080, 1920
FPS = 30
DURATION = 28.0
TOTAL_FRAMES = int(round(DURATION * FPS))  # 840
XC, YC = W / 2.0, H / 2.0
RM = 90  # right margin for RTL text

# durations per scene (sum = 28)
DURS = [6.0, 4.0, 5.0, 4.0, 5.0, 4.0]
XFADE = 0.35  # crossfade between scenes (seconds)

# ---------------- colors ----------------
CREAM     = (247, 238, 218)
CREAM_D   = (232, 220, 190)
GRAY_L    = (229, 230, 234)
GRAY_M    = (192, 193, 198)
GRAY_D    = (150, 151, 156)
BLUE      = (74, 158, 196)      # water blue
BLUE_D    = (52, 126, 160)
BLUE_L    = (156, 204, 226)
ORANGE    = (210, 150, 80)      # dusty orange
ORANGE_D  = (176, 118, 56)
WHITE     = (248, 248, 246)
OFFWHITE  = (235, 233, 228)
BLACK     = (20, 22, 24)

PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
def to_persian_digits(n):
    s = str(int(n))
    return "".join(PERSIAN_DIGITS[int(c)] for c in s)

# ---------------- persian text ----------------
_font_cache = {}
def font(path, size):
    key = (path, int(round(size)))
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, int(round(size)))
    return _font_cache[key]

_txt_cache = {}
def persian(text):
    """reshape + bidi -> visual RTL string for Pillow"""
    if text not in _txt_cache:
        _txt_cache[text] = get_display(arabic_reshaper.reshape(text))
    return _txt_cache[text]

def measure(text, fnt):
    bbox = fnt.getbbox(persian(text))
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

def fit_size(text, path, max_w, start=200, min_size=20):
    lo, hi, best = min_size, start, min_size
    while lo <= hi:
        mid = (lo + hi) // 2
        w, _ = measure(text, font(path, mid))
        if w <= max_w:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return best

# ---------------- drawing helpers ----------------
def draw_text(img, xy, text, fnt, fill, anchor="la", shadow=True,
              shadow_off=(5, 5), shadow_alpha=100, shadow_color=(0, 0, 0)):
    d = ImageDraw.Draw(img, "RGBA")
    x, y = xy
    if shadow:
        d.text((x + shadow_off[0], y + shadow_off[1]), persian(text),
               font=fnt, fill=(shadow_color[0], shadow_color[1], shadow_color[2], shadow_alpha),
               anchor=anchor)
    d.text((x, y), persian(text), font=fnt, fill=fill, anchor=anchor)

def draw_glow_circle(img, cx, cy, r, color, alpha=60, blur=46, spread=1.05):
    """soft radial glow behind a circle"""
    pad = int(r * spread + blur * 2)
    gl = Image.new("RGBA", (pad * 2, pad * 2), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gl, "RGBA")
    # concentric rings for soft radial falloff
    steps = 28
    for i in range(steps, 0, -1):
        rr = r * (i / steps)
        aa = int(alpha * (i / steps) ** 2.2 * 0.55)
        gd.ellipse([pad - rr, pad - rr, pad + rr, pad + rr],
                   fill=(color[0], color[1], color[2], aa))
    gl = gl.filter(ImageFilter.GaussianBlur(blur))
    img.paste(gl, (int(cx - pad), int(cy - pad)), gl)

def draw_circle(img, cx, cy, r, fill, outline=None, ow=0, shadow=True):
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh, "RGBA")
        sd.ellipse([cx - r + 6, cy - r + 10, cx + r + 6, cy + r + 10],
                   fill=(0, 0, 0, 70))
        sh = sh.filter(ImageFilter.GaussianBlur(14))
        img.paste(sh, (0, 0), sh)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill,
              outline=outline, width=ow)

def draw_drop(img, cx, cy, r, color=BLUE, glow=True, highlight=True, tilt=0.0):
    """a bright floating water drop"""
    # shadow
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh, "RGBA")
    sd.ellipse([cx - r + 5, cy - r + 14, cx + r + 5, cy + r + 14], fill=(0, 0, 0, 60))
    sh = sh.filter(ImageFilter.GaussianBlur(10))
    img.paste(sh, (0, 0), sh)
    d = ImageDraw.Draw(img, "RGBA")
    # drop body (teardrop-ish via ellipse + top pull)
    d.ellipse([cx - r, cy - r * 0.92, cx + r, cy + r * 0.92], fill=color + (235,),
              outline=(255, 255, 255, 90), width=3)
    # highlight
    hl = Image.new("RGBA", img.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(hl, "RGBA")
    hd.ellipse([cx - r * 0.5, cy - r * 0.75, cx - r * 0.12, cy - r * 0.25],
               fill=(255, 255, 255, 150))
    hl = hl.filter(ImageFilter.GaussianBlur(6))
    img.paste(hl, (0, 0), hl)
    # second small shine
    d.ellipse([cx + r * 0.25, cy - r * 0.55, cx + r * 0.62, cy - r * 0.22],
              fill=(255, 255, 255, 80))

# ---------------- backgrounds ----------------
def bg_cream():
    img = Image.new("RGB", (W, H), CREAM)
    # subtle vignette
    vig = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vig)
    vd.ellipse([-W * 0.2, -H * 0.2, W * 1.2, H * 1.2], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(260))
    vig = ImageOps.invert(vig)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer, "RGBA")
    ld.ellipse([-W * 0.2, -H * 0.2, W * 1.2, H * 1.2], fill=(0, 0, 0, 40))
    layer = layer.filter(ImageFilter.GaussianBlur(200))
    out = Image.merge("RGBA", (*img.split(), Image.new("L", (W, H), 255)))
    out = Image.alpha_composite(out, layer)
    return out.convert("RGBA")

def bg_gray_grad():
    img = Image.new("RGB", (W, H), GRAY_L)
    d = ImageDraw.Draw(img, "RGBA")
    # radial darker vignette
    for i in range(60, 0, -1):
        rr = max(W, H) * (i / 60)
        aa = int(26 * (i / 60) ** 1.6)
        d.ellipse([XC - rr, YC - rr, XC + rr, YC + rr], fill=(0, 0, 0, aa))
    out = Image.merge("RGBA", (*img.split(), Image.new("L", (W, H), 255)))
    return out

def bg_cracked_earth():
    """dry cracked earth orange-brown base (cracks drawn per frame)"""
    img = Image.new("RGB", (W, H), (198, 132, 70))
    d = ImageDraw.Draw(img, "RGBA")
    # lighter top / darker bottom for studio feel
    for y in range(H):
        t = y / H
        c = int(18 + 34 * t)
        d.line([(0, y), (W, y)], fill=(c, c // 2, 0, 255))
    # subtle noise / stains
    rnd = random.Random(7)
    for _ in range(220):
        x = rnd.randint(0, W - 1); y = rnd.randint(0, H - 1)
        rr = rnd.randint(6, 26)
        d.ellipse([x - rr, y - rr, x + rr, y + rr],
                  fill=(150, 95, 40, rnd.randint(6, 14)))
    out = Image.merge("RGBA", (*img.split(), Image.new("L", (W, H), 255)))
    return out

def bg_light_blue():
    img = Image.new("RGB", (W, H), (174, 217, 236))
    d = ImageDraw.Draw(img, "RGBA")
    for i in range(70, 0, -1):
        rr = max(W, H) * (i / 70)
        aa = int(22 * (i / 70) ** 1.8)
        d.ellipse([XC - rr, YC - rr, XC + rr, YC + rr], fill=(0, 0, 0, aa))
    out = Image.merge("RGBA", (*img.split(), Image.new("L", (W, H), 255)))
    return out

# ---------------- scene backgrounds (cached) ----------------
BG = {}
def get_bg(i):
    if i not in BG:
        if i == 0:   BG[i] = bg_cream()
        elif i == 1: BG[i] = bg_gray_grad()
        elif i == 2: BG[i] = bg_cracked_earth()
        elif i == 3: BG[i] = bg_light_blue()
        elif i == 4: BG[i] = bg_cream()
        elif i == 5: BG[i] = bg_gray_grad()
    return BG[i]

# ---------------- easing ----------------
def ease_out_cubic(t): return 1 - (1 - t) ** 3
def ease_in_out_cubic(t):
    return 4 * t * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2
def ease_out_back(t):
    c1 = 1.70158; c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
def smoothstep(t): return t * t * (3 - 2 * t)

def clamp(v, a, b): return max(a, min(b, v))

# ---------------- scene renderers ----------------
# each returns RGBA frame for scene i at local time t in [0, dur]

def scene0(t, dur):  # S1 cream, big blue circle, counter 0->70
    img = get_bg(0).copy()
    d = ImageDraw.Draw(img, "RGBA")
    # circle: large early, shrinks after ~4.2s
    t_norm = clamp(t / dur, 0, 1)
    if t_norm < 0.72:
        r = 470 - 60 * ease_out_cubic(clamp(t_norm / 0.72, 0, 1))
        draw_glow_circle(img, XC, YC * 0.5, r + 60, BLUE, alpha=30, blur=60)
        draw_circle(img, XC, YC * 0.5, r, BLUE, shadow=True)
    else:
        # shrinking phase
        s = clamp((t_norm - 0.72) / 0.28, 0, 1)
        r = 400 * (1 - ease_out_back(s)) + 90
        draw_glow_circle(img, XC, YC * 0.5, r + 50, BLUE, alpha=25, blur=50)
        draw_circle(img, XC, YC * 0.5, r, BLUE, shadow=True)
    # counter line (top): number animates 0 -> 70 over first ~4s
    if t_norm < 0.82:
        n = int(round(clamp(t_norm / 0.78, 0, 1) * 70))
        pn = to_persian_digits(n)
        fnum = font(FEB, 130)
        ftext = font(FBOLD, 56)
        draw_text(img, (W - RM, YC * 0.16 - 10), "زمین", ftext, (60, 70, 85), anchor="ra")
        draw_text(img, (W - RM, YC * 0.16 - 10), "  " + pn + "٪ را آب پوشانده است", ftext,
                  (15, 90, 130), anchor="ra")
    # second line after shrink
    if t_norm > 0.62:
        a = clamp((t_norm - 0.62) / 0.18, 0, 1)
        a = ease_out_cubic(a)
        f1 = font(FEB, 100)
        f2 = font(FREG, 52)
        draw_text(img, (W - RM, YC * 1.52), "اما فقط", f2, (70, 75, 80), anchor="ra",
                  shadow_alpha=int(140 * a))
        draw_text(img, (W - RM, YC * 1.52), "  ۲٫۵٪", f1, BLUE_D, anchor="ra",
                  shadow_alpha=int(160 * a))
        draw_text(img, (W - RM, YC * 1.52), " آن شیرین و آشامیدنی است", f2,
                  (70, 75, 80), anchor="ra", shadow_alpha=int(140 * a))
    return img

def scene1(t, dur):  # S2 gray grad, big blue circle, floating drop, "<1%"
    img = get_bg(1).copy()
    draw_glow_circle(img, XC, YC * 0.5, 340, BLUE, alpha=30, blur=70)
    draw_circle(img, XC, YC * 0.5, 300, BLUE, shadow=True)
    # floating drop with gentle bob
    bob = math.sin(t * 2.6) * 22
    dcx, dcy = XC, YC * 0.5 - 130 + bob
    draw_drop(img, dcx, dcy, 78, BLUE, glow=True)
    # bold "کمتر از ۱٪" behind drop (drop covers part)
    f = font(FEB, 135)
    draw_text(img, (W - RM, YC * 0.52), "کمتر از ۱٪", f, (20, 30, 45), anchor="ra")
    # small text below
    fs = font(FREG, 46)
    draw_text(img, (W - RM, YC * 0.86), "در دسترس ماست", fs, (60, 68, 80), anchor="ra")
    return img

def scene2(t, dur):  # S3 cracked earth, cracks progressive, white bold text
    img = get_bg(2).copy()
    d = ImageDraw.Draw(img, "RGBA")
    rnd = random.Random(11)
    # reveal cracks one by one over duration
    n_cracks = 14
    reveal = clamp(t / dur, 0, 1)
    n_show = int(reveal * n_cracks)
    crack_x = [rnd.uniform(0.06, 0.94) * W for _ in range(n_cracks)]
    for i in range(n_show):
        cx = crack_x[i]
        x = cx
        # progress of this individual crack
        iprog = clamp((reveal * n_cracks - i) / 0.75, 0, 1)
        yy = 0
        x = cx
        while yy < H:
            x += rnd.uniform(-24, 24) * (0.5 + 0.5 * iprog)
            seg = 40 + rnd.uniform(-10, 10)
            col = (80, 45, 20, int(210 * iprog))
            d.line([(x, yy), (x + rnd.uniform(-16, 16), min(H, yy + seg))],
                   fill=col, width=int(6 * iprog))
            yy += seg + rnd.uniform(4, 14)
    # main bold white text
    fbig = font(FEB, 108)
    fsmall = font(FREG, 50)
    draw_text(img, (W - RM, YC * 0.42), "بیش از ۲ میلیارد نفر", fbig, WHITE, anchor="ra")
    draw_text(img, (W - RM, YC * 0.60), "هنوز به آب آشامیدنی سالم دسترسی ندارند",
              fsmall, OFFWHITE, anchor="ra")
    return img

def scene3(t, dur):  # S4 light blue, old faucet drip, ripple
    img = get_bg(3).copy()
    d = ImageDraw.Draw(img, "RGBA")
    # water surface band at bottom
    surf_y = H * 0.86
    d.rectangle([0, surf_y, W, H], fill=(110, 180, 210, 255))
    d.line([(0, surf_y), (W, surf_y)], fill=(70, 140, 175, 255), width=4)
    # stylized old faucet (left-center)
    fx, fy = XC * 0.55, H * 0.30
    # pipe
    d.rectangle([fx - 34, fy - 150, fx + 34, fy + 20], fill=(150, 140, 120, 255))
    d.rectangle([fx - 46, fy + 12, fx + 46, fy + 44], fill=(130, 122, 102, 255))  # flange
    # spout
    d.rectangle([fx - 20, fy + 20, fx + 70, fy + 56], fill=(150, 140, 120, 255))
    d.line([(fx + 70, fy + 38), (fx + 70, fy + 38)], fill=(0, 0, 0, 0))
    # handle
    d.ellipse([fx - 30, fy - 115, fx + 30, fy - 75], fill=(140, 132, 112, 255),
              outline=(90, 84, 70, 255), width=5)
    # drip falling from spout tip
    tip_x, tip_y = fx + 70, fy + 38
    drip_cycle = (t % 1.05) / 1.05  # 0..1
    drip_y = tip_y + ease_out_cubic(clamp(drip_cycle / 0.6, 0, 1)) * (surf_y - tip_y - 40)
    draw_drop(img, tip_x, drip_y, 16, BLUE_L, glow=False)
    # ripple when drop hits surface
    if drip_cycle > 0.62:
        rip = clamp((drip_cycle - 0.62) / 0.38, 0, 1)
        rr = 8 + 210 * ease_out_cubic(rip)
        aa = int(110 * (1 - rip))
        d.ellipse([tip_x - rr, surf_y - rr, tip_x + rr, surf_y + rr],
                  outline=(255, 255, 255, aa), width=5)
        d.ellipse([tip_x - rr * 0.55, surf_y - rr * 0.55, tip_x + rr * 0.55, surf_y + rr * 0.55],
                  outline=(220, 240, 250, int(aa * 0.6)), width=3)
    # text
    f = font(FEB, 62)
    draw_text(img, (W - RM, YC * 0.20), "یک شیر چکه‌کن", f, (15, 45, 70), anchor="ra")
    draw_text(img, (W - RM, YC * 0.20), " سالی هزاران لیتر آب هدر می‌دهد", font(FREG, 50),
              (25, 55, 80), anchor="ra")
    return img

def scene4(t, dur):  # S5 cream, title + 3 cards entering one by one
    img = get_bg(4).copy()
    ftitle = font(FEB, 82)
    draw_text(img, (W - RM, YC * 0.22), "کارهای کوچک، اثر بزرگ", ftitle, (70, 75, 85), anchor="ra")
    cards = ["دوش کوتاه‌تر", "بستن شیر هنگام مسواک", "آبیاری شبانه و هوشمند"]
    fcard = font(FEB, 64)
    cw, chh = 760, 150
    cx = XC
    for i, card in enumerate(cards):
        # enter: slide up + fade, staggered
        enter_t = clamp((t - i * 1.35) / 1.1, 0, 1)
        a = ease_out_back(enter_t)
        yy = YC * 0.86 + (i * 210) - (1 - a) * 260
        aa = int(255 * a)
        # card bg
        card_img = Image.new("RGBA", (cw, chh), (255, 255, 255, 0))
        cd = ImageDraw.Draw(card_img, "RGBA")
        cd.rounded_rectangle([0, 0, cw, chh], radius=30,
                             fill=(255, 255, 255, int(230 * a)),
                             outline=(200, 190, 170, int(120 * a)), width=4)
        # card shadow
        csh = Image.new("RGBA", (cw, chh), (0, 0, 0, 0))
        csd = ImageDraw.Draw(csh, "RGBA")
        csd.rounded_rectangle([8, 8, cw - 8, chh - 8], radius=30, fill=(0, 0, 0, int(45 * a)))
        csh = csh.filter(ImageFilter.GaussianBlur(12))
        card_img = Image.alpha_composite(csh, card_img)
        # text centered in card
        cd.text((cw / 2, chh / 2 + 4), persian(card), font=fcard,
                fill=(30, 35, 45, 255), anchor="ma")
        img.paste(card_img, (int(cx - cw / 2), int(yy - chh / 2)), card_img)
    return img

def scene5(t, dur):  # S6 gray grad, big blue circle, drop, "تصمیم", hashtag
    img = get_bg(5).copy()
    draw_glow_circle(img, XC, YC * 0.5, 340, BLUE, alpha=30, blur=70)
    draw_circle(img, XC, YC * 0.5, 300, BLUE, shadow=True)
    bob = math.sin(t * 2.0 + 1) * 18
    draw_drop(img, XC, YC * 0.5 - 120 + bob, 80, BLUE, glow=True)
    # top: "صرفه‌جویی در مصرف آب" written (fade in)
    if t < dur * 0.85:
        a = ease_out_cubic(clamp(t / 1.2, 0, 1))
        f = font(FREG, 52)
        draw_text(img, (W - RM, YC * 0.16), "صرفه‌جویی در مصرف آب", f, (30, 40, 55),
                  anchor="ra", shadow_alpha=int(130 * a))
    # bold "تصمیم" behind drop
    fbig = font(FEB, 150)
    draw_text(img, (W - RM, YC * 0.55), "تصمیم", fbig, (15, 30, 45), anchor="ra")
    # bottom line
    fs = font(FREG, 54)
    draw_text(img, (W - RM, YC * 0.90), "یک تصمیم است؛ از همین امروز", fs,
              (35, 42, 58), anchor="ra")
    # hashtag bottom
    fh = font(FREG, 40)
    draw_text(img, (W - RM, H - 110), "#کم_آبی", fh, BLUE_D, anchor="ra")
    return img

SCENES = [scene0, scene1, scene2, scene3, scene4, scene5]

# ---------------- timeline -> scene weights ----------------
CUM = [0.0]
for d in DURS:
    CUM.append(CUM[-1] + d)

def scene_weights(t):
    """return list of (scene_index, weight) blending for time t"""
    t = clamp(t, 0, CUM[-1])
    res = []
    # find active scene
    idx = 0
    for i in range(len(DURS)):
        if t <= CUM[i + 1] + 1e-9:
            idx = i
            break
    # crossfade window before boundary CUM[idx+1]
    if idx < len(DURS) - 1 and t > CUM[idx + 1] - XFADE:
        # blending scene idx (fading out) and idx+1 (fading in)
        w = clamp((t - (CUM[idx + 1] - XFADE)) / XFADE, 0, 1)  # 0->1 across window
        res.append((idx, 1 - w))
        res.append((idx + 1, w))
        # normalize local times: scene idx at its end, scene idx+1 at start
        return res, [(idx, DURS[idx]), (idx + 1, 0.0)]
    res.append((idx, 1.0))
    return res, [(idx, clamp(t - CUM[idx], 0, DURS[idx]))]

def render_frame(t):
    weights, locals_ = scene_weights(t)
    if len(weights) == 1:
        img = SCENES[weights[0][0]](locals_[0][1], DURS[weights[0][0]])
    else:
        imgA = SCENES[weights[0][0]](locals_[0][1], DURS[weights[0][0]])
        imgB = SCENES[weights[1][0]](locals_[1][1], DURS[weights[1][0]])
        img = Image.blend(imgA.convert("RGBA"), imgB.convert("RGBA"), weights[1][1])
    # global fade in / out at ends
    g = 1.0
    if t < 0.30:
        g *= smoothstep(clamp(t / 0.30, 0, 1))
    if t > CUM[-1] - 0.30:
        g *= smoothstep(clamp((CUM[-1] - t) / 0.30, 0, 1))
    if g < 1.0:
        img = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), img, g)
    return img.convert("RGB")

# ---------------- main ----------------
def main():
    quick = "--quick" in sys.argv
    if quick:
        # render one representative frame per scene + a few transitions
        times = [0.5, 3.0, 5.9, 6.4, 8.0, 12.5, 15.9, 16.4, 18.0, 22.0, 24.4, 27.5]
        for i, t in enumerate(times):
            img = render_frame(t)
            img.save(os.path.join(FRAME_DIR, f"quick_{i:02d}_t{t:.2f}.png"), quality=92)
        print("quick frames saved to", FRAME_DIR)
        return

    # full render via ffmpeg pipe
    cmd = [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "pipe:",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
           "-preset", "medium", "-movflags", "+faststart",
           os.path.join(OUT_DIR, "water_crisis_motion_graphic.mp4")]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    t0 = time.time()
    try:
        for f in range(TOTAL_FRAMES):
            t = f / FPS
            img = render_frame(t)
            proc.stdin.write(img.tobytes())
            if (f + 1) % 100 == 0:
                print(f"frame {f+1}/{TOTAL_FRAMES} t={t:.2f}s  ({time.time()-t0:.1f}s)", flush=True)
    finally:
        proc.stdin.close()
        err = proc.stderr.read().decode("utf-8", "replace")
        rc = proc.wait()
    print("ffmpeg rc:", rc)
    if err:
        print(err[-2000:])
    out = os.path.join(OUT_DIR, "water_crisis_motion_graphic.mp4")
    print("OUTPUT:", out, os.path.getsize(out) if os.path.exists(out) else "MISSING")

if __name__ == "__main__":
    main()
