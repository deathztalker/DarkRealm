import os
import urllib.request
import zipfile
import glob
from PIL import Image

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
    'boss_leoric': 'e1976334-f91e-4c7c-90ce-e20ce68b910f',
    'boss_the_butcher': '7bccc472-12fe-4a99-b64b-5628642fcb56',
    'boss_angry_jano': 'cc623854-af52-4a8e-a6d8-6f5e83971234',
    'boss_demon_wirt': 'd25e6e35-6e41-4a98-a2d2-e86659215835',
    'boss_cow_king': 'd33759f6-cf40-45bc-850d-297270013d01',
    'npc_deckard_cain': 'ebcbaee7-b5a7-496b-814f-7b11416a1553',
    'npc_tyrael': '97c3ea47-c57f-44c3-b8ef-657fb1e627e9',
    'npc_akara': 'a5bd1da6-719b-414b-833c-60f701126dfd',
    'npc_ormus': '3de70304-27fd-433d-9510-560edea4b1c3',
    'npc_larzuk': '6403ccb8-07c6-4e71-8431-d67608da3a09',
    'npc_drognan': '34c6901c-e5c7-402c-9e3e-1f824736cda1',
    'npc_jamella': 'bd550b5c-e928-4272-8080-82e5dabe6e9e',
    'npc_nihlathak': '22cb1bd3-0825-4395-a682-aa979c14d6a7',
    'npc_malah': '298d10c6-b215-41da-8bc1-5872f16520ad',
    'npc_blacksmith': 'e0ea56b6-1a5f-4f70-96de-20afe65fb336',
    'npc_female': '983089b2-82fa-4cf1-ac06-dd8789654980',
    'npc_merchant': '6df53205-1049-4653-8707-690462701ef4',
    'npc_elder': 'cd664987-a540-4bab-8c54-5e074ef9c26a',
    'npc_guard': 'dc4b6c63-ec01-4432-98bd-091c5299c526',
    'enemy_skeleton': '18522dce-0d11-497c-b7c3-283ae050bb69',
    'enemy_zombie': 'd248621b-f7f1-4071-b44f-189f13e984e7',
    'enemy_goatman': '02815d2d-4fad-4d90-8188-b253f5003854',
    'enemy_goblin': '8e6c49b1-f547-4312-8536-75edfba72ed8',
    'enemy_ghost': 'e3253d3b-d2d4-427e-8d8d-95a632527281',
    'enemy_golem': '33616bae-c7cc-4eeb-8487-0f1d89082537',
    'enemy_bat': '79ed604a-5a85-4105-94ec-1ddcca138559',
    'enemy_demon': 'c5f00c86-afbc-4327-ba56-d32615291780',
    'enemy_spider': '2559b8d0-16e8-4b18-9558-81ee3c056342',
    'enemy_cultist': '297a5aeb-0b6b-4201-8dd2-6f479530eb90',
    'enemy_wraith': '3ccc656a-afb6-4702-b5fe-4cf668af9dd5',
    'summon_skeleton': '8b6f40fe-7838-4ad6-9151-46a39cc46b2e',
    'summon_blood_golem': '883719ec-6bbd-4e55-ad2e-d445cb04aaf8',
    'summon_clay_golem': '830b6603-faba-4ee2-960a-7745550cdc0e',
    'summon_fire_golem': '10dd6c0d-e277-4215-bc02-fd1690c4e0e8',
    'summon_iron_golem': '5bc2abf8-ea38-4557-abcc-c1a14bf8123b',
    'summon_spirit_wolf': '238af4cd-19e4-48cc-9d6d-21eccdb135de',
    'summon_dire_wolf': '5c831890-d2f0-4bc0-a284-6860fc39ec30',
    'summon_grizzly': '2be04ae7-d183-4464-8b57-5e4f1948142b',
    'summon_skeleton_mage': '87109bbf-d6bc-495d-bb39-69d69cbfe1de',
    'summon_valkyrie': 'd00b1f9a-db42-4871-8531-bc65e6e258d5',
    'summon_voidwalker': 'be834c9d-1502-4e80-9050-e3d02eaf1e95',
    'mercenary_warrior': '6b069940-48d2-4807-a972-54e4b37172fc',
    'mercenary_archer': 'c0889882-47fa-4b39-9f0f-e880ef0987d6'
}

cols, rows = 7, 16
dirs = {'north': 0, 'west': 1, 'south': 2, 'east': 3}

def find_anim_folder(base_path, anim_name):
    search_path = os.path.join(base_path, "animations")
    if not os.path.exists(search_path): return None
    for folder in os.listdir(search_path):
        if anim_name in folder:
            return os.path.join(search_path, folder)
    return None

if not os.path.exists("tmp_zips"):
    os.makedirs("tmp_zips")

for name, char_id in characters.items():
    print(f"🛠️ Procesando: {name}...")
    tmp_dir = f"tmp_{name}"
    zip_path = f"tmp_zips/{name}.zip"
    
    if not os.path.exists(zip_path):
        try:
            url = f"https://api.pixellab.ai/mcp/characters/{char_id}/download"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
                out_file.write(response.read())
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(tmp_dir)
        except Exception as e:
            print(f"⚠️ Error bajando {name}: {e}")
            continue

    if not os.path.exists(tmp_dir):
        print(f"⚠️ Saltando {name}, no se encontró carpeta temporal.")
        continue

    # Averiguar dimensiones exactas del primer frame (Para no distorsionar)
    c_sw, c_sh = 48, 48
    base_frame = None
    first_frame_path = os.path.join(tmp_dir, "rotations", "south.png")
    if os.path.exists(first_frame_path):
        base_frame = Image.open(first_frame_path)
        c_sw, c_sh = base_frame.size

    img_out = Image.new('RGBA', (c_sw * cols, c_sh * rows), (0,0,0,0))
    
    walk_path = find_anim_folder(tmp_dir, "walking") or find_anim_folder(tmp_dir, "walk")
    attack_path = find_anim_folder(tmp_dir, "fireball") or find_anim_folder(tmp_dir, "attack") or find_anim_folder(tmp_dir, "slash")
    idle_path = find_anim_folder(tmp_dir, "breathing") or find_anim_folder(tmp_dir, "idle")
    
    for d_name, d_idx in dirs.items():
        base_d_path = os.path.join(tmp_dir, "rotations", f"{d_name}.png")
        if not os.path.exists(base_d_path) and base_frame:
            base_d_path = first_frame_path
            
        def get_frames(p):
            if p and os.path.exists(os.path.join(p, d_name)):
                frames = sorted(glob.glob(os.path.join(p, d_name, "*.png")))
                if frames: return frames
            return []
            
        walk_frames = get_frames(walk_path)
        attack_frames = get_frames(attack_path)
        idle_frames = get_frames(idle_path)
        
        # Idle
        for i in range(cols):
            f_path = idle_frames[i % len(idle_frames)] if idle_frames else base_d_path
            if os.path.exists(f_path):
                f = Image.open(f_path).convert('RGBA')
                img_out.paste(f, (i * c_sw, (0 + d_idx) * c_sh))
                
        # Walk
        for i in range(cols):
            f_path = walk_frames[i % len(walk_frames)] if walk_frames else base_d_path
            if os.path.exists(f_path):
                f = Image.open(f_path).convert('RGBA')
                img_out.paste(f, (i * c_sw, (8 + d_idx) * c_sh))
                
        # Attack
        for i in range(cols):
            f_path = attack_frames[i % len(attack_frames)] if attack_frames else base_d_path
            if os.path.exists(f_path):
                f = Image.open(f_path).convert('RGBA')
                img_out.paste(f, (i * c_sw, (12 + d_idx) * c_sh))
    
    img_out.save(f"assets/{name}.png")
    print(f"✅ Spritesheet OK: assets/{name}.png ({c_sw}x{c_sh} px por frame)")

print("🚀 ¡Sincronización masiva de resoluciones nativas completada!")
