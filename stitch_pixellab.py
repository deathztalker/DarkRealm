import os
import glob
from PIL import Image
import time

COLS, ROWS = 7, 16
DIRS_MAP = {'north': 0, 'west': 1, 'south': 2, 'east': 3}

characters = {
    'class_shaman': 'ae37eab8-b1f5-4c5b-b207-65a6148f0b4f',
    'class_druid': '3a7a04c0-dec4-4b08-b40d-73cc5e31af23',
    'class_rogue': '9662bc55-3b12-4ad1-a916-c34ad4bf9194',
    'class_warrior': '939ecb81-5b1d-4a1f-94bc-5eb780613093',
    'class_warlock': '155d0a79-8c7d-4136-8ec2-944559a9997a',
    'class_sorceress': 'b157912c-df80-464a-aa53-3442cde1cf39',
    'class_necromancer': 'da856a08-f21b-47d5-8a73-0ff5640d2184',
    'class_ranger': 'd27723e9-23e1-4b8f-a5ca-3b6a266e2dda',
    'class_paladin': 'd075b40e-6c41-432e-bebe-a86b7bfdc3a3',
    'boss_diablo': '504e1076-bb7b-41eb-82ea-5d07bfbfd31a',
    'boss_andariel': 'f73581cc-b48d-448d-89cc-9196a9f85072',
    'boss_duriel': '96746c8f-3d89-4515-898e-2206bf085ee5',
    'boss_mephisto': 'c90b6e21-3e56-4905-89b7-0c01b039a221',
    'boss_baal': '3080de8c-2ad5-414c-ac79-9fb2490e3413',
    'boss_cow_king': 'd33759f6-cf40-45bc-850d-297270013d01',
    'boss_demon_wirt': 'd25e6e35-6e41-4a98-a2d2-e86659215835',
    'boss_angry_jano': 'cc623854-af52-4a8e-a6d8-6f5e83971234',
    'boss_leoric': 'e1976334-f91e-4c7c-90ce-e20ce68b910f',
    'boss_the_butcher': '7bccc472-12fe-4a99-b64b-5628642fcb56',
    'boss_radament': 'd8b9e2b5-079a-4744-9aaf-91c76680fa05',
    'boss_izual': '27375161-6d87-4f88-9f02-c10b6651d489',
    'boss_shenk': '42987da7-5548-4516-9cca-da91cdcb333f',
    'boss_hephaisto': 'f2fa318b-1d1f-4c3b-80a6-461d113fa7f8',
    'boss_beetleburst': '5a673fdd-8de1-4a96-a515-fdae34348e1a',
    'npc_deckard_cain': 'ebcbaee7-b5a7-496b-814f-7b11416a1553',
    'npc_tyrael': '97c3ea47-c57f-44c3-b8ef-657fb1e627e9',
    'npc_akara': 'a5bd1da6-719b-414b-833c-60f701126dfd',
    'npc_ormus': '3de70304-27fd-433d-9510-560edea4b1c3',
    'npc_larzuk': '6403ccb8-07c6-4e71-8431-d67608da3a09',
    'enemy_cultist': '297a5aeb-0b6b-4201-8dd2-6f479530eb90',
    'enemy_spider': '2559b8d0-16e8-4b18-9558-81ee3c056342',
    'enemy_zombie': 'd248621b-f7f1-4071-b44f-189f13e984e7',
    'enemy_wraith': '3ccc656a-afb6-4702-b5fe-4cf668af9dd5',
    'enemy_energy_elemental': '990a9ad3-49de-4a63-9ca2-f1dc3ec92e7a',
    'enemy_bat': '79ed604a-5a85-4105-94ec-1ddcca138559',
    'enemy_demon': 'd833cbdb-4ffe-43a5-9e09-3fa65d97f49b',
    'enemy_ghost': 'e3253d3b-d2d4-427e-8d8d-95a632527281',
    'enemy_goblin': '8e6c49b1-f547-4312-8536-75edfba72ed8',
    'enemy_golem': '33616bae-c7cc-4eeb-8487-0f1d89082537',
    'enemy_skeleton': '4da1c918-2af3-4539-b2de-be3cc2335de8',
    'enemy_goatman': '02815d2d-4fad-4d90-8188-b253f5003854'
}

def find_anim_folders(base_path, anim_keywords):
    search_path = os.path.join(base_path, "animations")
    if not os.path.exists(search_path): return []
    matched = []
    for folder in os.listdir(search_path):
        for kw in anim_keywords:
            if kw.lower() in folder.lower():
                matched.append(os.path.join(search_path, folder))
                break
    return matched

def get_frames(folder_paths, dir_name):
    if not folder_paths: return []
    synonyms = {
        'north': ['north', 'up', 'back'],
        'south': ['south', 'down', 'front'],
        'west': ['west', 'left'],
        'east': ['east', 'right']
    }

    for folder_path in folder_paths:
        for syn in synonyms.get(dir_name, [dir_name]):
            path = os.path.join(folder_path, syn)
            if os.path.exists(path):
                frames = sorted(glob.glob(os.path.join(path, "*.png")))
                if frames: return frames

    # Fallbacks in all matched folders
    for folder_path in folder_paths:
        # Aggressive fallbacks for quadrupeds / 4-directional outputs
        for fb in ['front', 'south', 'down', 'east', 'west', 'north']:
            fallback = os.path.join(folder_path, fb)
            if os.path.exists(fallback):
                frames = sorted(glob.glob(os.path.join(fallback, "*.png")))
                if frames: return frames

    return []

def get_base_rot(tmp_dir, dir_name):
    synonyms = {
        'north': ['north', 'up', 'back'],
        'south': ['south', 'down', 'front'],
        'west': ['west', 'left'],
        'east': ['east', 'right']
    }
    for syn in synonyms.get(dir_name, [dir_name]):
        path = os.path.join(tmp_dir, "rotations", f"{syn}.png")
        if os.path.exists(path): return path

    for fb in ['front', 'south', 'down', 'east', 'west', 'north']:
        path = os.path.join(tmp_dir, "rotations", f"{fb}.png")
        if os.path.exists(path): return path

    return None

print("🚀 Corrigiendo Spritesheets con Fallbacks Inteligentes...")

for name in characters:
    tmp_dir = f"tmp_{name}"
    if not os.path.exists(tmp_dir): continue

    c_sw, c_sh = 48, 48
    first_frame = get_base_rot(tmp_dir, 'south')
    
    if not first_frame:
        # Fallback to any png if rotations fails
        any_png = glob.glob(os.path.join(tmp_dir, "**/*.png"), recursive=True)
        if any_png: first_frame = any_png[0]

    if first_frame and os.path.exists(first_frame):
        with Image.open(first_frame) as img:
            c_sw, c_sh = img.size

    img_out = Image.new('RGBA', (c_sw * COLS, c_sh * ROWS), (0,0,0,0))

    # Carpetas de animaciones (Listas con palabras clave extendidas)
    idle_folders = find_anim_folders(tmp_dir, ["breathing", "idle", "animating"])
    walk_folders = find_anim_folders(tmp_dir, ["walking", "walk", "run", "crawl"])
    attack_folders = find_anim_folders(tmp_dir, ["fireball", "punch", "attack", "cross-punch", "strike", "bite"])

    # Fallback chain for quadrupeds/monsters missing animations
    # If no attack, try walk. If no walk, try attack. If no idle, try walk.
    if not attack_folders: attack_folders = walk_folders
    if not idle_folders: idle_folders = walk_folders
    if not walk_folders: walk_folders = idle_folders

    for d_name, d_idx in DIRS_MAP.items():
        base_rot = get_base_rot(tmp_dir, d_name)
        if not base_rot: base_rot = first_frame

        idles = get_frames(idle_folders, d_name)
        walks = get_frames(walk_folders, d_name)
        attacks = get_frames(attack_folders, d_name)

        for i in range(COLS):
            # IDLE (Filas 0-3)
            f = idles[i % len(idles)] if idles else base_rot
            if f: img_out.paste(Image.open(f).convert('RGBA'), (i * c_sw, (0 + d_idx) * c_sh))

            # WALK (Filas 8-11)
            f = walks[i % len(walks)] if walks else base_rot
            if f: img_out.paste(Image.open(f).convert('RGBA'), (i * c_sw, (8 + d_idx) * c_sh))

            # ATTACK (Filas 12-15)
            f = attacks[i % len(attacks)] if attacks else base_rot
            if f: img_out.paste(Image.open(f).convert('RGBA'), (i * c_sw, (12 + d_idx) * c_sh))

    timestamp_pixel = int(time.time()) % 256
    img_out.putpixel((0, 0), (0, 0, 0, 1)) 

    img_out.save(f"assets/{name}.png")
    print(f"✅ Corregido: assets/{name}.png")
print("✨ ¡Todo arreglado! Las animaciones ahora usan lógicas de fallback y todos se mueven.")