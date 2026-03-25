"""
Generate RPG-style enemy sprites using Pillow procedural drawing.
Creates dark, silhouette-style monsters that look good at small game scale.
"""
from PIL import Image, ImageDraw, ImageFilter
import random, math, os

OUT = os.path.join(os.path.dirname(__file__), 'assets')
SIZE = 128

def glow_circle(draw, cx, cy, r, color, steps=6):
    """Draw a soft glowing circle."""
    for i in range(steps, 0, -1):
        alpha = int(255 * (i / steps) * 0.4)
        c = color[:3] + (alpha,)
        draw.ellipse([cx - r * i / steps, cy - r * i / steps,
                       cx + r * i / steps, cy + r * i / steps], fill=c)

def make_skeleton():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Body - bone white
    bone = (220, 210, 190, 255)
    dark = (80, 70, 60, 255)
    # Skull
    d.ellipse([44, 10, 84, 50], fill=bone, outline=dark, width=2)
    # Eye sockets
    d.ellipse([52, 22, 62, 34], fill=(20, 0, 0, 255))
    d.ellipse([68, 22, 78, 34], fill=(20, 0, 0, 255))
    # Red eye glow
    glow_circle(d, 57, 28, 4, (255, 50, 50, 200))
    glow_circle(d, 73, 28, 4, (255, 50, 50, 200))
    # Spine
    for y in range(50, 90, 6):
        d.rectangle([60, y, 68, y + 4], fill=bone, outline=dark)
    # Ribs
    for y in [54, 62, 70]:
        d.line([42, y, 60, y + 2], fill=bone, width=3)
        d.line([68, y + 2, 86, y], fill=bone, width=3)
    # Arms
    d.line([42, 55, 30, 80], fill=bone, width=3)
    d.line([86, 55, 98, 80], fill=bone, width=3)
    # Sword in right hand
    d.line([98, 80, 105, 40], fill=(150, 150, 170, 255), width=3)
    d.line([98, 80, 105, 40], fill=(180, 180, 200, 200), width=1)
    # Legs
    d.line([58, 90, 48, 120], fill=bone, width=3)
    d.line([70, 90, 80, 120], fill=bone, width=3)
    img.save(os.path.join(OUT, 'enemy_skeleton.png'))

def make_zombie():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    skin = (80, 120, 70, 255)
    dark_skin = (50, 80, 45, 255)
    # Body
    d.rounded_rectangle([40, 40, 88, 100], radius=8, fill=skin, outline=dark_skin, width=2)
    # Head
    d.ellipse([46, 5, 82, 45], fill=skin, outline=dark_skin, width=2)
    # Eyes - glowing yellow
    d.ellipse([54, 18, 62, 28], fill=(200, 200, 50, 255))
    d.ellipse([66, 18, 74, 28], fill=(200, 200, 50, 255))
    glow_circle(d, 58, 23, 3, (200, 200, 50, 200))
    glow_circle(d, 70, 23, 3, (200, 200, 50, 200))
    # Mouth
    d.arc([54, 28, 74, 40], 0, 180, fill=(40, 20, 20, 255), width=2)
    # Blood stains
    for _ in range(5):
        bx = random.randint(42, 86)
        by = random.randint(50, 95)
        d.ellipse([bx, by, bx + 8, by + 6], fill=(120, 30, 30, 180))
    # Arms (outstretched)
    d.line([40, 55, 20, 75], fill=skin, width=6)
    d.line([88, 55, 108, 75], fill=skin, width=6)
    # Legs
    d.rectangle([48, 100, 58, 125], fill=dark_skin)
    d.rectangle([70, 100, 80, 125], fill=dark_skin)
    img.save(os.path.join(OUT, 'enemy_zombie.png'))

def make_demon():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    body = (140, 30, 30, 255)
    dark = (80, 15, 15, 255)
    # Body - muscular
    d.rounded_rectangle([35, 35, 93, 95], radius=10, fill=body, outline=dark, width=2)
    # Head
    d.ellipse([42, 5, 86, 42], fill=body, outline=dark, width=2)
    # Horns
    d.polygon([(48, 12), (38, -5), (52, 8)], fill=(60, 10, 10, 255))
    d.polygon([(80, 12), (90, -5), (76, 8)], fill=(60, 10, 10, 255))
    # Eyes - fire
    d.ellipse([52, 18, 62, 28], fill=(255, 200, 50, 255))
    d.ellipse([66, 18, 76, 28], fill=(255, 200, 50, 255))
    glow_circle(d, 57, 23, 5, (255, 150, 0, 200))
    glow_circle(d, 71, 23, 5, (255, 150, 0, 200))
    # Mouth with fangs
    d.arc([52, 28, 76, 40], 0, 180, fill=(200, 50, 50, 255), width=2)
    # Wings hint
    d.polygon([(35, 45), (10, 25), (15, 60)], fill=(100, 20, 20, 180))
    d.polygon([(93, 45), (118, 25), (113, 60)], fill=(100, 20, 20, 180))
    # Arms
    d.line([35, 50, 18, 70], fill=body, width=7)
    d.line([93, 50, 110, 70], fill=body, width=7)
    # Legs
    d.rectangle([45, 95, 58, 125], fill=dark)
    d.rectangle([70, 95, 83, 125], fill=dark)
    # Fire glow at feet
    glow_circle(d, 64, 115, 20, (255, 100, 0, 120))
    img.save(os.path.join(OUT, 'enemy_demon.png'))

def make_ghost():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Ethereal body
    ghost_color = (150, 180, 220, 140)
    # Wavey bottom body
    points = [(35, 30)]
    for x in range(35, 94, 4):
        y = 100 + int(math.sin(x * 0.15) * 12)
        points.append((x, y))
    points.append((93, 30))
    d.polygon(points, fill=ghost_color)
    # Head
    d.ellipse([38, 8, 90, 55], fill=(170, 200, 240, 160))
    # Eyes - hollow
    d.ellipse([48, 22, 60, 38], fill=(20, 20, 60, 255))
    d.ellipse([68, 22, 80, 38], fill=(20, 20, 60, 255))
    # Mouth
    d.ellipse([54, 40, 74, 52], fill=(20, 20, 60, 200))
    # Glow
    glow_circle(d, 64, 50, 40, (100, 150, 255, 80))
    img = img.filter(ImageFilter.GaussianBlur(1))
    img.save(os.path.join(OUT, 'enemy_ghost.png'))

def make_spider():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    body_c = (40, 30, 50, 255)
    # Abdomen
    d.ellipse([40, 50, 88, 95], fill=body_c, outline=(60, 50, 70, 255), width=2)
    # Red markings
    d.ellipse([56, 60, 72, 80], fill=(160, 30, 30, 200))
    # Head
    d.ellipse([50, 35, 78, 58], fill=body_c, outline=(60, 50, 70, 255), width=2)
    # Eyes (8 of them, simplified to 4 pairs)
    for ex, ey in [(56, 40), (62, 38), (66, 38), (72, 40)]:
        d.ellipse([ex, ey, ex + 4, ey + 4], fill=(255, 50, 50, 255))
    # Legs
    legs = [
        ((50, 50), (20, 30)), ((50, 55), (15, 55)), ((50, 60), (15, 80)), ((50, 65), (25, 100)),
        ((78, 50), (108, 30)), ((78, 55), (113, 55)), ((78, 60), (113, 80)), ((78, 65), (103, 100)),
    ]
    for start, end in legs:
        mid_x = (start[0] + end[0]) // 2
        mid_y = min(start[1], end[1]) - 8
        d.line([start, (mid_x, mid_y), end], fill=body_c, width=2)
    # Poison drip
    glow_circle(d, 64, 95, 8, (50, 200, 50, 120))
    img.save(os.path.join(OUT, 'enemy_spider.png'))

def make_golem():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    stone = (100, 95, 90, 255)
    dark = (60, 55, 50, 255)
    # Massive body
    d.rounded_rectangle([28, 30, 100, 100], radius=12, fill=stone, outline=dark, width=3)
    # Head
    d.rounded_rectangle([42, 5, 86, 35], radius=8, fill=stone, outline=dark, width=2)
    # Eyes - glowing
    d.ellipse([50, 14, 60, 24], fill=(100, 200, 255, 255))
    d.ellipse([68, 14, 78, 24], fill=(100, 200, 255, 255))
    glow_circle(d, 55, 19, 5, (100, 200, 255, 200))
    glow_circle(d, 73, 19, 5, (100, 200, 255, 200))
    # Cracks
    d.line([50, 45, 55, 70], fill=dark, width=2)
    d.line([55, 70, 48, 85], fill=dark, width=2)
    d.line([78, 50, 82, 75], fill=dark, width=2)
    # Arms - massive
    d.rounded_rectangle([8, 40, 28, 90], radius=6, fill=stone, outline=dark, width=2)
    d.rounded_rectangle([100, 40, 120, 90], radius=6, fill=stone, outline=dark, width=2)
    # Fists
    d.ellipse([10, 85, 30, 100], fill=stone, outline=dark, width=2)
    d.ellipse([98, 85, 118, 100], fill=stone, outline=dark, width=2)
    # Legs
    d.rectangle([38, 100, 55, 125], fill=stone, outline=dark, width=2)
    d.rectangle([73, 100, 90, 125], fill=stone, outline=dark, width=2)
    img.save(os.path.join(OUT, 'enemy_golem.png'))

def make_cultist():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    robe = (50, 20, 60, 255)
    # Hooded robe
    d.polygon([(40, 15), (64, 5), (88, 15), (95, 110), (33, 110)], fill=robe)
    # Hood shadow
    d.ellipse([44, 10, 84, 45], fill=(30, 10, 35, 255))
    # Eyes - purple glow
    d.ellipse([52, 22, 60, 30], fill=(180, 50, 220, 255))
    d.ellipse([68, 22, 76, 30], fill=(180, 50, 220, 255))
    glow_circle(d, 56, 26, 4, (180, 50, 220, 200))
    glow_circle(d, 72, 26, 4, (180, 50, 220, 200))
    # Staff
    d.line([90, 30, 95, 115], fill=(100, 80, 50, 255), width=3)
    # Orb on top
    glow_circle(d, 90, 28, 8, (200, 50, 255, 200))
    d.ellipse([84, 22, 96, 34], fill=(180, 80, 255, 220), outline=(220, 150, 255, 255), width=1)
    # Feet
    d.rectangle([45, 108, 58, 120], fill=(30, 10, 35, 255))
    d.rectangle([70, 108, 83, 120], fill=(30, 10, 35, 255))
    img.save(os.path.join(OUT, 'enemy_cultist.png'))

def make_bat():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    body = (50, 30, 60, 255)
    # Body - small
    d.ellipse([50, 40, 78, 70], fill=body)
    # Head
    d.ellipse([54, 30, 74, 50], fill=body)
    # Ears
    d.polygon([(56, 32), (50, 18), (60, 30)], fill=body)
    d.polygon([(72, 32), (78, 18), (68, 30)], fill=body)
    # Eyes - red
    d.ellipse([58, 36, 63, 42], fill=(255, 50, 50, 255))
    d.ellipse([65, 36, 70, 42], fill=(255, 50, 50, 255))
    # Wings
    wing_left = [(50, 45), (15, 25), (8, 50), (20, 65), (48, 55)]
    wing_right = [(78, 45), (113, 25), (120, 50), (108, 65), (80, 55)]
    d.polygon(wing_left, fill=(40, 20, 50, 200))
    d.polygon(wing_right, fill=(40, 20, 50, 200))
    # Wing membrane lines
    for wx in [20, 30, 40]:
        d.line([(50, 48), (wx, 35)], fill=(60, 40, 70, 150), width=1)
    for wx in [88, 98, 108]:
        d.line([(78, 48), (wx, 35)], fill=(60, 40, 70, 150), width=1)
    # Fangs
    d.line([(60, 46), (58, 52)], fill=(255, 255, 255, 200), width=1)
    d.line([(68, 46), (70, 52)], fill=(255, 255, 255, 200), width=1)
    img.save(os.path.join(OUT, 'enemy_bat.png'))

def make_goblin():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    skin = (90, 140, 60, 255)
    dark = (60, 100, 40, 255)
    # Small body
    d.rounded_rectangle([45, 50, 83, 95], radius=6, fill=skin, outline=dark, width=2)
    # Large head
    d.ellipse([40, 10, 88, 55], fill=skin, outline=dark, width=2)
    # Big ears
    d.polygon([(42, 25), (25, 15), (38, 35)], fill=skin, outline=dark)
    d.polygon([(86, 25), (103, 15), (90, 35)], fill=skin, outline=dark)
    # Eyes - beady yellow
    d.ellipse([50, 24, 60, 36], fill=(255, 255, 100, 255))
    d.ellipse([50, 24, 60, 36], outline=(0, 0, 0, 255), width=1)
    d.ellipse([68, 24, 78, 36], fill=(255, 255, 100, 255))
    d.ellipse([68, 24, 78, 36], outline=(0, 0, 0, 255), width=1)
    # Pupils
    d.ellipse([54, 28, 58, 34], fill=(0, 0, 0, 255))
    d.ellipse([72, 28, 76, 34], fill=(0, 0, 0, 255))
    # Grin
    d.arc([52, 36, 76, 48], 0, 180, fill=(40, 20, 20, 255), width=2)
    # Dagger
    d.line([83, 65, 110, 55], fill=(180, 180, 200, 255), width=2)
    d.line([83, 65, 88, 67], fill=(100, 70, 40, 255), width=3)
    # Legs
    d.rectangle([50, 95, 60, 118], fill=dark)
    d.rectangle([68, 95, 78, 118], fill=dark)
    # Arms
    d.line([45, 60, 32, 78], fill=skin, width=4)
    d.line([83, 60, 95, 68], fill=skin, width=4)
    img.save(os.path.join(OUT, 'enemy_goblin.png'))

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    make_skeleton()
    make_zombie()
    make_demon()
    make_ghost()
    make_spider()
    make_golem()
    make_cultist()
    make_bat()
    make_goblin()
    print("Generated 9 RPG enemy sprites in", OUT)
