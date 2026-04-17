import os
import urllib.request
import zipfile
import glob
from PIL import Image

# Nuevos IDs en alta calidad (Modo Pro y PixelLab)
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
    'enemy_goblin': '8e6c49b1-f547-4312-8536-75edfba72ed8',
    'enemy_ghost': 'e3253d3b-d2d4-427e-8d8d-95a632527281',
    'enemy_golem': '33616bae-c7cc-4eeb-8487-0f1d89082537',
    'enemy_bat': '79ed604a-5a85-4105-94ec-1ddcca138559',
    'enemy_goatman': '8a029453-f6b2-4323-a1cc-cd75d784656d',
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
    'npc_blacksmith': 'bbb9fce5-39ef-4137-84e9-e5f736d83b3b',
    'npc_merchant': '6df53205-1049-4653-8707-690462701ef4',
    'npc_elder': 'cd664987-a540-4bab-8c54-5e074ef9c26a',
    'npc_guard': 'dc4b6c63-ec01-4432-98bd-091c5299c526',
    'npc_female': '983089b2-82fa-4cf1-ac06-dd8789654980',
    'mercenary_warrior': '6b069940-48d2-4807-a972-54e4b37172fc',
    'mercenary_archer': 'c0889882-47fa-4b39-9f0f-e880ef0987d6'
}

sw, sh = 48, 48
cols = 7
rows = 16
out_w, out_h = sw * cols, sh * rows

dirs = {'north': 0, 'west': 1, 'south': 2, 'east': 3}

for name, char_id in characters.items():
    print(f"Procesando {name}...")
    url = f"https://api.pixellab.ai/mcp/characters/{char_id}/download"
    zip_path = f"tmp_zips/{name}.zip"
    tmp_dir = f"tmp_{name}"
    
    try:
        # Descarga
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
            out_file.write(response.read())
            
        print(f"✅ {name} descargado. Ensamblando...")
        
        # Extracción
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmp_dir)
            
        # Si es un boss como Diablo, su tamaño puede ser diferente, lo forzamos al canvas del juego (o más grande si el juego lo soporta)
        is_boss = name.startswith('boss_')
        current_sw, current_sh = (128, 128) if is_boss else (48, 48)
        current_out_w, current_out_h = current_sw * cols, current_sh * rows
        
        img_out = Image.new('RGBA', (current_out_w, current_out_h), (0,0,0,0))
        
        for d_name, d_idx in dirs.items():
            # Buscar frames de animaciones específicas
            walk_frames = sorted(glob.glob(f"{tmp_dir}/animations/walk/{d_name}/*.png"))
            idle_frames = sorted(glob.glob(f"{tmp_dir}/animations/breathing-idle/{d_name}/*.png"))
            attack_frames = sorted(glob.glob(f"{tmp_dir}/animations/fireball/{d_name}/*.png"))
            
            # Si no hay animación, usamos la rotación base como fallback para todos los frames
            base_frame_path = f"{tmp_dir}/rotations/{d_name}.png"
            if not os.path.exists(base_frame_path) and walk_frames:
                 base_frame_path = walk_frames[0]
                 
            # Llenar Idle (0-3)
            for i in range(cols):
                frame_path = idle_frames[i % len(idle_frames)] if idle_frames else base_frame_path
                if os.path.exists(frame_path):
                    f = Image.open(frame_path).convert('RGBA').resize((current_sw, current_sh), Image.Resampling.NEAREST)
                    img_out.paste(f, (i * current_sw, d_idx * current_sh))
                    
            # Llenar Walk (8-11)
            for i in range(min(cols, len(walk_frames)) if walk_frames else cols):
                frame_path = walk_frames[i] if walk_frames else base_frame_path
                if os.path.exists(frame_path):
                    f = Image.open(frame_path).convert('RGBA').resize((current_sw, current_sh), Image.Resampling.NEAREST)
                    img_out.paste(f, (i * current_sw, (8 + d_idx) * current_sh))
                    
            # Llenar Attack (12-15)
            for i in range(min(cols, len(attack_frames)) if attack_frames else cols):
                frame_path = attack_frames[i] if attack_frames else base_frame_path
                if os.path.exists(frame_path):
                    f = Image.open(frame_path).convert('RGBA').resize((current_sw, current_sh), Image.Resampling.NEAREST)
                    img_out.paste(f, (i * current_sw, (12 + d_idx) * current_sh))
                    
        out_path = f"assets/{name}.png"
        img_out.save(out_path)
        print(f"🎉 Guardado en {out_path}")
        
    except Exception as e:
        print(f"⚠️ Nota: {name} saltado (Aún generando o error: {e})")

print("Proceso de descarga y stitching de Pro Heroes completado.")
