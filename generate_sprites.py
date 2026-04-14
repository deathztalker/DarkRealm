import os
import random
import glob
from PIL import Image, ImageDraw, ImageFilter

os.makedirs("assets", exist_ok=True)

# ══════════════════════════════════════════════════════════
#  ENVIRONMENT TILES — Textured procedural tiles (32x32)
# ══════════════════════════════════════════════════════════

def generate_textured_tile(name, base_color, detail_color=None, pattern='noise', size=32):
    """Generate a textured environment tile with subtle noise/detail."""
    r, g, b = int(base_color[1:3], 16), int(base_color[3:5], 16), int(base_color[5:7], 16)
    img = Image.new('RGBA', (size, size), (r, g, b, 255))
    d = ImageDraw.Draw(img)
    
    if pattern == 'noise':
        # Subtle pixel noise for floor/path textures
        for y in range(size):
            for x in range(size):
                if random.random() < 0.3:
                    offset = random.randint(-15, 15)
                    nr = max(0, min(255, r + offset))
                    ng = max(0, min(255, g + offset))
                    nb = max(0, min(255, b + offset))
                    d.point((x, y), fill=(nr, ng, nb, 255))
    
    elif pattern == 'brick':
        # Brick/wall pattern
        brick_color = detail_color or '#111118'
        br, bg_, bb = int(brick_color[1:3], 16), int(brick_color[3:5], 16), int(brick_color[5:7], 16)
        for y in range(0, size, 8):
            d.line([(0, y), (size, y)], fill=(br, bg_, bb, 180), width=1)
            offset = 0 if (y // 8) % 2 == 0 else 16
            for x in range(offset, size, 16):
                d.line([(x, y), (x, y + 8)], fill=(br, bg_, bb, 180), width=1)
        # Noise on top
        for y in range(size):
            for x in range(size):
                if random.random() < 0.15:
                    offset = random.randint(-10, 10)
                    nr = max(0, min(255, r + offset))
                    ng = max(0, min(255, g + offset))
                    nb = max(0, min(255, b + offset))
                    d.point((x, y), fill=(nr, ng, nb, 255))
    
    elif pattern == 'grass':
        # Grass with random green tufts
        for y in range(size):
            for x in range(size):
                if random.random() < 0.4:
                    offset = random.randint(-20, 20)
                    nr = max(0, min(255, r + offset))
                    ng = max(0, min(255, g + random.randint(-10, 25)))
                    nb = max(0, min(255, b + offset))
                    d.point((x, y), fill=(nr, ng, nb, 255))
        # Grass blades
        for i in range(8):
            gx = random.randint(2, size - 3)
            gy = random.randint(2, size - 3)
            d.line([(gx, gy), (gx + random.choice([-1, 0, 1]), gy - 3)], 
                   fill=(0, min(255, g + 40), 0, 200), width=1)
    
    elif pattern == 'water':
        # Water with wave lines
        for y in range(size):
            for x in range(size):
                wave = int(8 * (0.5 + 0.5 * (((x + y * 0.3) % 12) / 12.0)))
                nr = max(0, min(255, r + wave - 4))
                ng = max(0, min(255, g + wave - 4))
                nb = max(0, min(255, b + wave))
                d.point((x, y), fill=(nr, ng, nb, 255))
        # Highlight waves
        for y in range(0, size, 6):
            for x in range(size):
                if (x + y) % 8 < 3:
                    d.point((x, y), fill=(min(255, r + 30), min(255, g + 30), min(255, b + 50), 120))
    
    elif pattern == 'tree':
        # Dark ground + tree canopy circle
        for y in range(size):
            for x in range(size):
                if random.random() < 0.3:
                    d.point((x, y), fill=(max(0, r - 10), max(0, g + random.randint(-5, 5)), max(0, b - 10), 255))
        # Trunk
        d.rectangle([14, 20, 17, 31], fill=(60, 35, 15, 255))
        # Canopy (dark green circle with texture)
        d.ellipse([6, 4, 25, 22], fill=(25, int(g * 0.9), 18, 255))
        d.ellipse([8, 6, 23, 20], fill=(30, min(255, g + 15), 22, 255))
        # Leaf highlights
        for i in range(6):
            lx = random.randint(8, 22)
            ly = random.randint(6, 18)
            d.point((lx, ly), fill=(40, min(255, g + 40), 30, 255))
    
    elif pattern == 'door':
        # Wooden door
        d.rectangle([8, 2, 23, 29], fill=(90, 55, 25, 255))
        d.rectangle([10, 4, 21, 27], fill=(75, 45, 20, 255))
        # Planks
        d.line([(15, 2), (15, 29)], fill=(60, 35, 15, 200), width=1)
        # Handle
        d.ellipse([18, 14, 20, 16], fill=(180, 160, 50, 255))
    
    elif pattern == 'stairs':
        # Descending steps
        for step in range(5):
            sy = 4 + step * 5
            shade = max(0, r - step * 8)
            d.rectangle([6, sy, 25, sy + 4], fill=(shade, shade, max(0, b - step * 5), 255))
            d.line([(6, sy), (25, sy)], fill=(min(255, shade + 20), min(255, shade + 20), min(255, b + 10), 180))
    
    elif pattern == 'bridge':
        # Wooden bridge planks
        for i in range(0, size, 6):
            shade = random.randint(-10, 10)
            d.rectangle([2, i, 29, i + 4], fill=(max(0, r + shade), max(0, g + shade), max(0, b + shade), 255))
            d.line([(2, i), (29, i)], fill=(max(0, r - 20), max(0, g - 20), max(0, b - 20), 200))
        # Rails
        d.rectangle([0, 0, 2, 31], fill=(60, 35, 15, 255))
        d.rectangle([29, 0, 31, 31], fill=(60, 35, 15, 255))
    
    img.save(f"assets/{name}.png")

# Generate all environment tiles
generate_textured_tile('env_floor', '#2c2838', pattern='noise')
generate_textured_tile('env_wall', '#161320', pattern='brick')
generate_textured_tile('env_door', '#5a3a20', pattern='door')
generate_textured_tile('env_stairs_down', '#252035', pattern='stairs')
generate_textured_tile('env_stairs_up', '#201530', pattern='stairs')
generate_textured_tile('env_grass', '#1a3a18', pattern='grass')
generate_textured_tile('env_path', '#3a2e22', pattern='noise')
generate_textured_tile('env_water', '#0e2850', pattern='water')
generate_textured_tile('env_tree', '#0a1d0a', pattern='tree')
generate_textured_tile('env_bridge', '#3a2515', pattern='bridge')

# ══════════════════════════════════════════════════════════
#  ENEMIES — Distinct silhouettes per type
# ══════════════════════════════════════════════════════════

def generate_enemy(name, body_color, size=32):
    """Generate a distinct enemy sprite with recognizable silhouette."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r, g, b = int(body_color[1:3], 16), int(body_color[3:5], 16), int(body_color[5:7], 16)
    
    etype = name.replace('enemy_', '')
    
    if etype == 'skeleton':
        # Skull
        d.ellipse([12, 3, 20, 11], fill=(220, 220, 210))
        d.point((14, 6), fill=(0, 0, 0)); d.point((18, 6), fill=(0, 0, 0))  # Eyes
        d.line([(14, 9), (18, 9)], fill=(0, 0, 0))  # Mouth
        # Ribcage
        d.rectangle([13, 12, 19, 20], fill=(200, 200, 190))
        for rib_y in [13, 15, 17, 19]:
            d.line([(11, rib_y), (21, rib_y)], fill=(180, 180, 170))
        # Legs
        d.rectangle([13, 21, 15, 28], fill=(200, 200, 190))
        d.rectangle([17, 21, 19, 28], fill=(200, 200, 190))
    
    elif etype == 'zombie':
        # Head (greenish)
        d.ellipse([12, 4, 20, 12], fill=(100, 150, 80))
        d.point((14, 7), fill=(180, 0, 0)); d.point((18, 7), fill=(180, 0, 0))  # Red eyes
        # Body (tattered)
        d.rectangle([10, 13, 22, 22], fill=(80, 120, 60))
        # Arms (hanging)
        d.rectangle([7, 14, 10, 24], fill=(100, 150, 80))
        d.rectangle([22, 14, 25, 24], fill=(100, 150, 80))
        # Legs
        d.rectangle([11, 23, 14, 30], fill=(50, 80, 40))
        d.rectangle([18, 23, 21, 30], fill=(50, 80, 40))
    
    elif etype == 'ghost':
        # Transparent ethereal body
        d.ellipse([10, 4, 22, 14], fill=(150, 150, 220, 180))
        d.point((13, 8), fill=(200, 200, 255)); d.point((19, 8), fill=(200, 200, 255))
        # Flowing body
        d.polygon([(10, 14), (22, 14), (24, 26), (20, 30), (16, 26), (12, 30), (8, 26)],
                  fill=(130, 130, 200, 140))
    
    elif etype == 'demon':
        # Horns
        d.polygon([(10, 8), (12, 2), (14, 8)], fill=(180, 30, 30))
        d.polygon([(18, 8), (20, 2), (22, 8)], fill=(180, 30, 30))
        # Head
        d.ellipse([11, 6, 21, 14], fill=(200, 50, 50))
        d.point((14, 9), fill=(255, 255, 0)); d.point((18, 9), fill=(255, 255, 0))  # Yellow eyes
        # Body
        d.rectangle([10, 15, 22, 24], fill=(160, 30, 30))
        # Wings (small)
        d.polygon([(8, 14), (4, 10), (10, 18)], fill=(120, 20, 20, 180))
        d.polygon([(24, 14), (28, 10), (22, 18)], fill=(120, 20, 20, 180))
        # Legs
        d.rectangle([12, 25, 15, 31], fill=(140, 25, 25))
        d.rectangle([17, 25, 20, 31], fill=(140, 25, 25))
    
    elif etype == 'spider':
        # Body (two segments)
        d.ellipse([13, 8, 19, 16], fill=(40, 30, 30))  # Cephalothorax
        d.ellipse([11, 16, 21, 26], fill=(30, 25, 25))  # Abdomen
        # Eyes
        for ex in [14, 15, 17, 18]:
            d.point((ex, 10), fill=(200, 0, 0))
        # Legs (4 pairs)
        for side in [-1, 1]:
            cx = 16
            for leg_y in [10, 13, 16, 19]:
                ex = cx + side * 10
                d.line([(cx + side * 3, leg_y), (ex, leg_y - 2)], fill=(40, 30, 30), width=1)
    
    elif etype == 'golem':
        # Big blocky body
        d.rectangle([9, 5, 23, 13], fill=(140, 140, 140))  # Head
        d.point((13, 8), fill=(100, 200, 255)); d.point((19, 8), fill=(100, 200, 255))  # Blue eyes
        d.rectangle([7, 14, 25, 26], fill=(120, 120, 120))  # Torso
        # Arms (thick)
        d.rectangle([3, 14, 7, 26], fill=(130, 130, 130))
        d.rectangle([25, 14, 29, 26], fill=(130, 130, 130))
        # Legs
        d.rectangle([9, 27, 14, 31], fill=(110, 110, 110))
        d.rectangle([18, 27, 23, 31], fill=(110, 110, 110))
    
    elif etype == 'cultist':
        # Hooded figure
        d.polygon([(12, 4), (16, 1), (20, 4)], fill=(100, 20, 100))  # Hood peak
        d.ellipse([11, 4, 21, 12], fill=(100, 20, 100))  # Hood
        d.point((14, 8), fill=(180, 180, 0)); d.point((18, 8), fill=(180, 180, 0))  # Glowing eyes
        # Robe
        d.polygon([(10, 12), (22, 12), (24, 30), (8, 30)], fill=(80, 15, 80))
        # Staff
        d.rectangle([24, 4, 25, 28], fill=(120, 80, 40))
        d.ellipse([22, 2, 27, 6], fill=(200, 50, 200))  # Orb on staff
    
    elif etype == 'bat':
        # Small body
        d.ellipse([13, 12, 19, 20], fill=(50, 20, 50))
        d.point((14, 14), fill=(200, 0, 0)); d.point((18, 14), fill=(200, 0, 0))
        # Wings (spread)
        d.polygon([(13, 14), (2, 8), (6, 18), (13, 16)], fill=(60, 25, 60, 200))
        d.polygon([(19, 14), (30, 8), (26, 18), (19, 16)], fill=(60, 25, 60, 200))
        # Ears
        d.polygon([(13, 12), (12, 8), (15, 12)], fill=(50, 20, 50))
        d.polygon([(19, 12), (20, 8), (17, 12)], fill=(50, 20, 50))
    
    else:
        # Fallback generic enemy
        d.ellipse([12, 4, 20, 12], fill=(r, g, b))
        d.rectangle([10, 13, 22, 24], fill=(r, g, b))
        d.rectangle([11, 25, 14, 30], fill=(max(0, r - 30), max(0, g - 30), max(0, b - 30)))
        d.rectangle([18, 25, 21, 30], fill=(max(0, r - 30), max(0, g - 30), max(0, b - 30)))
    
    img.save(f"assets/{name}.png")

# Generate all enemies
enemies = {
    'skeleton': '#dddddd', 'zombie': '#44aa44', 'ghost': '#aaaaff', 'demon': '#ff4444',
    'spider': '#222222', 'golem': '#888888', 'cultist': '#aa22aa', 'bat': '#331133'
}
for name, color in enemies.items():
    generate_enemy(f'enemy_{name}', color)

# ══════════════════════════════════════════════════════════
#  NPCs — Full humanoid sprites with distinct appearances
# ══════════════════════════════════════════════════════════

def generate_npc(name, robe_color, hair_color='#ffffff', accessory=None, size=32):
    """Generate an NPC with distinct outfit and features."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rc, gc, bc = int(robe_color[1:3], 16), int(robe_color[3:5], 16), int(robe_color[5:7], 16)
    
    # Head
    d.ellipse([12, 3, 20, 11], fill=(230, 190, 160))  # Skin
    d.rectangle([12, 3, 20, 6], fill=hair_color)  # Hair
    d.point((14, 7), fill=(40, 40, 40)); d.point((18, 7), fill=(40, 40, 40))  # Eyes
    
    # Body (robe/armor)
    d.rectangle([10, 12, 22, 22], fill=(rc, gc, bc))
    # Belt
    d.rectangle([10, 20, 22, 22], fill=(max(0, rc - 40), max(0, gc - 40), max(0, bc - 40)))
    
    # Arms
    d.rectangle([7, 13, 10, 20], fill=(rc, gc, bc))
    d.rectangle([22, 13, 25, 20], fill=(rc, gc, bc))
    # Hands
    d.rectangle([7, 20, 9, 22], fill=(230, 190, 160))
    d.rectangle([23, 20, 25, 22], fill=(230, 190, 160))
    
    # Legs
    d.rectangle([11, 23, 14, 29], fill=(max(0, rc - 60), max(0, gc - 60), max(0, bc - 60)))
    d.rectangle([18, 23, 21, 29], fill=(max(0, rc - 60), max(0, gc - 60), max(0, bc - 60)))
    # Boots
    d.rectangle([10, 29, 14, 31], fill=(50, 30, 20))
    d.rectangle([18, 29, 22, 31], fill=(50, 30, 20))
    
    # Accessory
    if accessory == 'staff':
        d.rectangle([25, 2, 26, 28], fill=(120, 80, 40))
        d.ellipse([23, 0, 28, 4], fill=(200, 200, 100))  # Crystal top
    elif accessory == 'bag':
        d.rectangle([5, 16, 8, 22], fill=(139, 90, 43))  # Bag
        d.line([(5, 16), (8, 16)], fill=(100, 60, 30))
    elif accessory == 'bow':
        d.arc([24, 8, 30, 24], 90, 270, fill=(120, 70, 30), width=2)
    
    img.save(f"assets/{name}.png")

generate_npc('npc_elder', '#e0e0e8', '#c0c0c0', accessory='staff')
generate_npc('npc_merchant', '#c8a020', '#604020', accessory='bag')
generate_npc('npc_villager', '#607060', '#503020')

# ══════════════════════════════════════════════════════════
#  OBJECTS (Chests, etc.)
# ══════════════════════════════════════════════════════════

def generate_object(name, size=32):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    if 'chest_open' in name:
        # Open chest
        d.rectangle([8, 16, 24, 26], fill=(120, 70, 30))
        d.rectangle([10, 18, 22, 24], fill=(90, 50, 20))
        # Lid (open, tilted back)
        d.polygon([(8, 16), (24, 16), (22, 8), (10, 8)], fill=(140, 80, 35))
        d.rectangle([10, 10, 22, 14], fill=(120, 70, 30))
        # Gold inside
        for i in range(5):
            gx = random.randint(12, 20)
            gy = random.randint(18, 22)
            d.ellipse([gx, gy, gx + 2, gy + 2], fill=(255, 215, 0))
        # Metal trim
        d.rectangle([14, 14, 18, 16], fill=(180, 160, 50))
    elif 'chest' in name:
        # Closed chest
        d.rectangle([8, 14, 24, 26], fill=(120, 70, 30))
        d.rectangle([10, 16, 22, 24], fill=(100, 55, 25))
        # Lid
        d.polygon([(7, 14), (25, 14), (24, 8), (8, 8)], fill=(140, 80, 35))
        d.rectangle([10, 9, 22, 13], fill=(130, 75, 32))
        # Lock
        d.rectangle([14, 12, 18, 16], fill=(180, 160, 50))
        d.point((16, 14), fill=(200, 180, 60))
    
    img.save(f"assets/{name}.png")

if not os.path.exists("assets/obj_chest.png"): generate_object('obj_chest')
if not os.path.exists("assets/obj_chest_open.png"): generate_object('obj_chest_open')

# ══════════════════════════════════════════════════════════
#  CLASS HUMANOIDS — Full body with class-specific colors
# ══════════════════════════════════════════════════════════

def generate_humanoid(name, color_theme, size=32):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r, g, b = int(color_theme[1:3], 16), int(color_theme[3:5], 16), int(color_theme[5:7], 16)
    
    # Head
    d.ellipse([12, 3, 20, 11], fill=(230, 190, 160))  # Skin
    d.rectangle([12, 3, 20, 6], fill=(r, g, b))  # Helm/hair color
    d.point((14, 7), fill=(30, 30, 30)); d.point((18, 7), fill=(30, 30, 30))
    
    # Torso (armor color)
    d.rectangle([10, 12, 22, 21], fill=(r, g, b))
    # Shoulder pads
    d.rectangle([8, 12, 10, 15], fill=(min(255, r + 30), min(255, g + 30), min(255, b + 30)))
    d.rectangle([22, 12, 24, 15], fill=(min(255, r + 30), min(255, g + 30), min(255, b + 30)))
    # Belt
    d.rectangle([10, 21, 22, 23], fill=(80, 50, 25))
    
    # Arms
    d.rectangle([7, 15, 10, 20], fill=(r, g, b))
    d.rectangle([22, 15, 25, 20], fill=(r, g, b))
    # Hands
    d.rectangle([7, 20, 9, 22], fill=(230, 190, 160))
    d.rectangle([23, 20, 25, 22], fill=(230, 190, 160))
    
    # Legs
    d.rectangle([11, 24, 14, 29], fill=(50, 45, 40))
    d.rectangle([18, 24, 21, 29], fill=(50, 45, 40))
    
    # Boots
    d.rectangle([10, 29, 15, 31], fill=(40, 30, 20))
    d.rectangle([17, 29, 22, 31], fill=(40, 30, 20))
    
    img.save(f"assets/{name}.png")

classes = {
    'warrior': '#a01010', 'sorceress': '#1010a0', 'shaman': '#10a010',
    'necromancer': '#202020', 'rogue': '#a0a010', 'warlock': '#6010a0',
    'paladin': '#eaeaeb', 'druid': '#806020', 'ranger': '#208020'
}
for name, color in classes.items():
    generate_humanoid(f'class_{name}', color)

# ══════════════════════════════════════════════════════════
#  ITEMS — Equipment overlays (unchanged per user request)
# ══════════════════════════════════════════════════════════

def generate_equipment(name, color_theme, size=32):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    if 'helm' in name or 'cap' in name or 'circlet' in name:
        d.rectangle([11, 3, 20, 8], fill=color_theme)
    elif 'armor' in name or 'mail' in name or 'robe' in name or 'chest' in name:
        d.rectangle([9, 11, 22, 21], fill=color_theme)
    elif 'glove' in name or 'gauntlet' in name:
        d.rectangle([6, 18, 10, 22], fill=color_theme)
        d.rectangle([21, 18, 25, 22], fill=color_theme)
    elif 'boot' in name:
        d.rectangle([9, 29, 15, 32], fill=color_theme)
        d.rectangle([16, 29, 22, 32], fill=color_theme)
    elif 'sword' in name or 'blade' in name or 'dagger' in name:
        d.rectangle([22, 12, 24, 28], fill=color_theme)
    elif 'axe' in name or 'mace' in name or 'hammer' in name:
        d.rectangle([22, 12, 24, 25], fill='#964B00')
        d.rectangle([20, 12, 26, 16], fill=color_theme)
    elif 'staff' in name or 'wand' in name:
        d.rectangle([22, 4, 24, 28], fill=color_theme)
    elif 'bow' in name:
        d.arc([16, 12, 28, 28], 90, 270, fill=color_theme, width=2)
    elif 'shield' in name or 'buckler' in name:
        d.rectangle([5, 12, 9, 22], fill=color_theme)
    elif 'orb' in name or 'source' in name:
        d.ellipse([5, 17, 9, 21], fill=color_theme)
    elif 'totem' in name:
        d.rectangle([5, 15, 9, 28], fill=color_theme)
    
    img.save(f"assets/{name}.png")

items = {
    'short_sword': '#cccccc', 'long_sword': '#dddddd', 'zweihander': '#eeeeee',
    'hand_axe': '#aa9999', 'war_axe': '#bb9999',
    'mace': '#888888', 'war_hammer': '#777777',
    'short_staff': '#d2b48c', 'war_staff': '#c2b48c', 'orb': '#aa33ff',
    'short_bow': '#8b4513', 'long_bow': '#7b4513',
    'dagger': '#cccccc', 'rune_blade': '#88ccff',
    'totem': '#00ff7f', 'grand_totem': '#00ee7f',
    'wand': '#ffdead', 'bone_wand': '#eeeeee',
    'leather_cap': '#8b4513', 'great_helm': '#c0c0c0', 'circlet': '#ffd700',
    'leather_armor': '#8b4513', 'chain_mail': '#a0a0a0', 'plate_mail': '#c0c0c0', 'robe': '#4444ff',
    'leather_gloves': '#8b4513', 'gauntlets': '#a0a0a0',
    'leather_boots': '#8b4513', 'war_boots': '#a0a0a0',
    'buckler': '#8b4513', 'tower_shield': '#a0a0a0', 'source': '#ff33aa',
    'ring': '#ffd700', 'amulet': '#1e90ff',
    'potion_hp': '#ff0000', 'potion_mp': '#0000ff'
}
for name, color in items.items():
    generate_equipment(f'item_{name}', color)

# ══════════════════════════════════════════════════════════
#  RUNES — Distinct colored runestones
# ══════════════════════════════════════════════════════════

def generate_rune(name, color, size=32):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
    
    # Stone background
    d.rounded_rectangle([8, 6, 24, 26], radius=3, fill=(60, 55, 50))
    d.rounded_rectangle([9, 7, 23, 25], radius=2, fill=(80, 75, 70))
    # Glowing rune symbol
    d.line([(13, 10), (16, 22)], fill=(r, g, b), width=2)
    d.line([(16, 22), (19, 10)], fill=(r, g, b), width=2)
    d.line([(12, 16), (20, 16)], fill=(r, g, b), width=1)
    
    img.save(f"assets/{name}.png")

runes = {
    'el': '#ffaaaa', 'eld': '#ffbbbb', 'tir': '#ffcccc', 'nef': '#ffdddd',
    'eth': '#aaaaff', 'ith': '#bbbbff', 'tal': '#ccccff', 'ral': '#ddddff', 'ort': '#eeeeff', 'thul': '#ffffff',
    'amn': '#aaffaa', 'sol': '#bbffbb', 'shael': '#ccffcc', 'dol': '#ddffdd',
    'lum': '#ffaaff', 'ko': '#ffbbff', 'fal': '#ffccff', 'lem': '#ffffaa', 'pul': '#ffffbb', 'um': '#ffffcc', 'mal': '#ffffdd',
    'ist': '#00ffff', 'gul': '#00dddd', 'vex': '#00bbbb', 'zod': '#009999'
}
for name, color in runes.items():
    generate_rune(f'rune_{name}', color)

# ══════════════════════════════════════════════════════════
#  ASSETS LIST EXPORT
# ══════════════════════════════════════════════════════════

all_assets = [os.path.basename(f).replace('.png', '') for f in glob.glob('assets/*.png')]
with open('src/data/assets_list.js', 'w', encoding='utf-8') as f:
    f.write(f"export const ASSET_NAMES = {all_assets};")

print(f"Sprites generated successfully! ({len(all_assets)} assets in /assets folder)")
print("Assets list exported to src/data/assets_list.js")
