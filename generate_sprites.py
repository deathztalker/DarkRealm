import os
import random
from PIL import Image, ImageDraw

def generate_sprite(name, color_theme, size=32):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Generate random symmetric pixel pattern
    pixels = []
    for y in range(8):
        row = []
        for x in range(4): # half width
            row.append(random.choice([True, False, False]))
        pixels.append(row)
        
    pixel_size = size // 8
    
    # Draw pattern
    for y in range(8):
        for x in range(4):
            if pixels[y][x]:
                # Draw left side
                x1 = x * pixel_size
                y1 = y * pixel_size
                d.rectangle([x1, y1, x1+pixel_size-1, y1+pixel_size-1], fill=color_theme)
                
                # Draw right side
                x2 = (7-x) * pixel_size
                d.rectangle([x2, y1, x2+pixel_size-1, y1+pixel_size-1], fill=color_theme)

    # Outline
    for y in range(8):
        for x in range(8):
            pass # skipping outline for simplicity now
            
    img.save(f"assets/{name}.png")

os.makedirs("assets", exist_ok=True)

# Generate Enemies
enemies = {
    'skeleton': '#dddddd',
    'zombie': '#44aa44',
    'ghost': '#aaaaff',
    'demon': '#ff4444',
    'spider': '#222222',
    'golem': '#888888',
    'cultist': '#aa22aa',
    'bat': '#331133'
}
for name, color in enemies.items():
    generate_sprite(f'enemy_{name}', color)

# Generate Item types (Specific to all bases)
items = {
    # Weapons
    'short_sword': '#cccccc', 'long_sword': '#dddddd', 'zweihander': '#eeeeee',
    'hand_axe': '#aa9999', 'war_axe': '#bb9999',
    'mace': '#888888', 'war_hammer': '#777777',
    'short_staff': '#d2b48c', 'war_staff': '#c2b48c', 'orb': '#aa33ff',
    'short_bow': '#8b4513', 'long_bow': '#7b4513',
    'dagger': '#cccccc', 'rune_blade': '#88ccff',
    'totem': '#00ff7f', 'grand_totem': '#00ee7f',
    'wand': '#ffdead', 'bone_wand': '#eeeeee',
    # Armor
    'leather_cap': '#8b4513', 'great_helm': '#c0c0c0', 'circlet': '#ffd700',
    'leather_armor': '#8b4513', 'chain_mail': '#a0a0a0', 'plate_mail': '#c0c0c0', 'robe': '#4444ff',
    'leather_gloves': '#8b4513', 'gauntlets': '#a0a0a0',
    'leather_boots': '#8b4513', 'war_boots': '#a0a0a0',
    'buckler': '#8b4513', 'tower_shield': '#a0a0a0', 'source': '#ff33aa',
    # Accessories & Potions
    'ring': '#ffd700', 'amulet': '#1e90ff',
    'potion_hp': '#ff0000', 'potion_mp': '#0000ff'
}

for name, color in items.items():
    generate_sprite(f'item_{name}', color)

# Generate Class Icons
classes = {
    'warrior': '#ff5555', 'sorceress': '#5555ff', 'shaman': '#55ff55',
    'necromancer': '#bb55bb', 'rogue': '#aaaaaa', 'warlock': '#8800ff',
    'paladin': '#ffff55', 'druid': '#ffaa00', 'ranger': '#55cc22'
}
for name, color in classes.items():
    generate_sprite(f'class_{name}', color)

# Generate Runes (Distinct colors)
runes = {
    'el': '#ffaaaa', 'eld': '#ffbbbb', 'tir': '#ffcccc', 'nef': '#ffdddd',
    'eth': '#aaaaff', 'ith': '#bbbbff', 'tal': '#ccccff', 'ral': '#ddddff', 'ort': '#eeeeff', 'thul': '#ffffff',
    'amn': '#aaffaa', 'sol': '#bbffbb', 'shael': '#ccffcc', 'dol': '#ddffdd',
    'lum': '#ffaaff', 'ko': '#ffbbff', 'fal': '#ffccff', 'lem': '#ffffaa', 'pul': '#ffffbb', 'um': '#ffffcc', 'mal': '#ffffdd',
    'ist': '#00ffff', 'gul': '#00dddd', 'vex': '#00bbbb', 'zod': '#009999'
}
for name, color in runes.items():
    generate_sprite(f'rune_{name}', color)

# Generate Environment Tiles
environment = {
    'floor': '#3a3a4a',
    'wall': '#1a1a25',
    'door': '#6b4c2a',
    'stairs_down': '#4a3b5c',
    'stairs_up': '#3b2a4c',
    'grass': '#2d5a27',
    'path': '#5c4a3d',
    'water': '#1e4b85',
    'tree': '#1b4018',
    'bridge': '#503525'
}
for name, color in environment.items():
    generate_sprite(f'env_{name}', color)

# Generate NPCs
npcs = {
    'merchant': '#ffd700',
    'elder': '#ffffff',
    'villager': '#a0a0a0'
}
for name, color in npcs.items():
    generate_sprite(f'npc_{name}', color)

# Generate Objects
objects = {
    'chest': '#8b4513',
    'chest_open': '#a52a2a'
}
for name, color in objects.items():
    generate_sprite(f'obj_{name}', color)

# Generate Skills & Trees automatically
import glob
import re
import hashlib

def get_hash_color(s):
    return '#' + hashlib.md5(s.encode('utf-8')).hexdigest()[:6]

for filepath in glob.glob('src/data/class_*.js'):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = f.read()
        for match in re.finditer(r"id:\s*['\"]([^'\"]+)['\"]", data):
            sid = match.group(1)
            # Prefixing all with skill_ for simplicity, we will use it for trees and nodes
            generate_sprite(f'skill_{sid}', get_hash_color(sid))
            # Also generate a tree_ one just in case we distinguish them
            generate_sprite(f'tree_{sid}', get_hash_color(sid + "_tree"))

# Auto-generate assets list for main.js preloader
all_assets = [os.path.basename(f).replace('.png', '') for f in glob.glob('assets/*.png')]
with open('src/data/assets_list.js', 'w', encoding='utf-8') as f:
    f.write(f"export const ASSET_NAMES = {all_assets};")

print("Sprites generated successfully in /assets folder.")
print("Assets list exported to src/data/assets_list.js")
