from PIL import Image, ImageDraw, ImageFilter
import random
import os

assets_dir = r"c:\Users\Death\.gemini\antigravity\scratch\dark-realm\assets"

def create_noise_texture(size, color1, color2, noise_level=30):
    img = Image.new('RGB', (size, size), color1)
    pixels = img.load()
    for y in range(size):
        for x in range(size):
            r = color1[0] + random.randint(-noise_level, noise_level)
            g = color1[1] + random.randint(-noise_level, noise_level)
            b = color1[2] + random.randint(-noise_level, noise_level)
            pixels[x, y] = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))
    return img

def save_texture(name, img):
    path = os.path.join(assets_dir, f"{name}.png")
    img.save(path)
    print(f"Generated {name} at {path}")

# 1. Floor (Stone Tiles)
floor = create_noise_texture(128, (40, 38, 45), (50, 48, 55), 10)
draw = ImageDraw.Draw(floor)
for i in range(0, 128, 32):
    draw.line([(i, 0), (i, 128)], fill=(20, 18, 25), width=1)
    draw.line([(0, i), (128, i)], fill=(20, 18, 25), width=1)
save_texture("env_floor", floor)

# 2. Wall (Dark Brick)
wall = create_noise_texture(128, (20, 18, 25), (30, 28, 35), 5)
draw = ImageDraw.Draw(wall)
for y in range(0, 128, 16):
    draw.line([(0, y), (128, y)], fill=(10, 8, 15), width=2)
    offset = 16 if (y // 16) % 2 == 0 else 0
    for x in range(offset, 128 + offset, 32):
        draw.line([(x % 128, y), (x % 128, y + 16)], fill=(10, 8, 15), width=2)
save_texture("env_wall", wall)

# 3. Grass
grass = create_noise_texture(128, (20, 40, 20), (30, 50, 30), 15)
grass = grass.filter(ImageFilter.GaussianBlur(1))
save_texture("env_grass", grass)

# 4. Path (Dirt)
path = create_noise_texture(128, (45, 35, 25), (55, 45, 35), 12)
save_texture("env_path", path)

# 5. Water
water = create_noise_texture(128, (10, 30, 60), (20, 40, 80), 10)
draw = ImageDraw.Draw(water)
for _ in range(10):
    y = random.randint(0, 128)
    draw.line([(0, y), (128, y + random.randint(-10, 10))], fill=(30, 50, 100), width=1)
save_texture("env_water", water)

# 6. Tree / Wood
wood = create_noise_texture(128, (30, 20, 10), (40, 30, 20), 5)
draw = ImageDraw.Draw(wood)
for i in range(0, 128, 4):
    draw.line([(i, 0), (i, 128)], fill=(20, 15, 5), width=1)
save_texture("env_tree", wood)
