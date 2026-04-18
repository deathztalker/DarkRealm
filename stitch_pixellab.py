import os
import glob
from PIL import Image

# Configuración del motor (7 cols x 16 rows)
COLS, ROWS = 7, 16
# Mapeo de direcciones del motor: North=0, West=1, South=2, East=3
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
    'npc_deckard_cain': 'ebcbaee7-b5a7-496b-814f-7b11416a1553',
    'npc_tyrael': '97c3ea47-c57f-44c3-b8ef-657fb1e627e9',
    'npc_akara': 'a5bd1da6-719b-414b-833c-60f701126dfd',
    'npc_ormus': '3de70304-27fd-433d-9510-560edea4b1c3',
    'npc_larzuk': '6403ccb8-07c6-4e71-8431-d67608da3a09',
    'enemy_cultist': '297a5aeb-0b6b-4201-8dd2-6f479530eb90',
    'enemy_spider': '2559b8d0-16e8-4b18-9558-81ee3c056342',
    'enemy_zombie': 'd248621b-f7f1-4071-b44f-189f13e984e7',
    'enemy_wraith': '3ccc656a-afb6-4702-b5fe-4cf668af9dd5',
    'enemy_energy_elemental': '990a9ad3-49de-4a63-9ca2-f1dc3ec92e7a'
}

def find_anim_folder(base_path, anim_keywords):
    search_path = os.path.join(base_path, "animations")
    if not os.path.exists(search_path): return None
    for folder in os.listdir(search_path):
        for kw in anim_keywords:
            if kw.lower() in folder.lower():
                return os.path.join(search_path, folder)
    return None

def get_frames(folder_path, dir_name):
    if not folder_path: return []
    path = os.path.join(folder_path, dir_name)
    if os.path.exists(path):
        return sorted(glob.glob(os.path.join(path, "*.png")))
    # Fallback al sur si no existe la direccion
    fallback = os.path.join(folder_path, "south")
    if os.path.exists(fallback):
        return sorted(glob.glob(os.path.join(fallback, "*.png")))
    return []

print("🚀 Corrigiendo Spritesheets para el motor 7x16...")

for name in characters:
    tmp_dir = f"tmp_{name}"
    if not os.path.exists(tmp_dir): continue

    # Detectar tamaño base
    c_sw, c_sh = 48, 48
    first_frame = os.path.join(tmp_dir, "rotations", "south.png")
    if os.path.exists(first_frame):
        with Image.open(first_frame) as img:
            c_sw, c_sh = img.size

    img_out = Image.new('RGBA', (c_sw * COLS, c_sh * ROWS), (0,0,0,0))
    
    # Carpetas de animaciones
    idle_p = find_anim_folder(tmp_dir, ["breathing", "idle"])
    walk_p = find_anim_folder(tmp_dir, ["walking", "walk", "run"])
    attack_p = find_anim_folder(tmp_dir, ["fireball", "punch", "attack", "cross-punch"])

    for d_name, d_idx in DIRS_MAP.items():
        base_rot = os.path.join(tmp_dir, "rotations", f"{d_name}.png")
        if not os.path.exists(base_rot): base_rot = first_frame

        idles = get_frames(idle_p, d_name)
        walks = get_frames(walk_p, d_name)
        attacks = get_frames(attack_p, d_name)

        for i in range(COLS):
            # IDLE (Filas 0-3)
            f = idles[i % len(idles)] if idles else base_rot
            img_out.paste(Image.open(f).convert('RGBA'), (i * c_sw, (0 + d_idx) * c_sh))

            # WALK (Filas 8-11)
            f = walks[i % len(walks)] if walks else base_rot
            img_out.paste(Image.open(f).convert('RGBA'), (i * c_sw, (8 + d_idx) * c_sh))

            # ATTACK (Filas 12-15)
            f = attacks[i % len(attacks)] if attacks else base_rot
            img_out.paste(Image.open(f).convert('RGBA'), (i * c_sw, (12 + d_idx) * c_sh))

    img_out.save(f"assets/{name}.png")
    print(f"✅ Corregido: assets/{name}.png")

print("✨ ¡Todo arreglado! Las animaciones ahora deben ejecutarse correctamente.")