import os
import urllib.request
import zipfile
import glob
from PIL import Image

# IDs Pro de PixelLab
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
    'mercenary_warrior': '6b069940-48d2-4807-a972-54e4b37172fc',
    'mercenary_archer': 'c0889882-47fa-4b39-9f0f-e880ef0987d6',
    'enemy_skeleton': '18522dce-0d11-497c-b7c3-283ae050bb69',
    'enemy_zombie': 'd248621b-f7f1-4071-b44f-189f13e984e7'
}

sw, sh = 48, 48
cols, rows = 7, 16
dirs = {'north': 0, 'west': 1, 'south': 2, 'east': 3}

def find_anim_folder(base_path, anim_name):
    # Busca carpetas que contengan el nombre de la animación (ej: walking-xxxxx)
    search_path = os.path.join(base_path, "animations")
    if not os.path.exists(search_path): return None
    for folder in os.listdir(search_path):
        if anim_name in folder:
            return os.path.join(search_path, folder)
    return None

for name, char_id in characters.items():
    print(f"🛠️ Procesando animación para: {name}...")
    tmp_dir = f"tmp_{name}"
    
    # 1. Asegurar que tenemos los archivos (ya bajados en el paso anterior)
    if not os.path.exists(tmp_dir):
        print(f"⚠️ Saltando {name}, no se encontró carpeta temporal.")
        continue

    is_boss = name.startswith('boss_')
    c_sw, c_sh = (128, 128) if is_boss else (48, 48)
    img_out = Image.new('RGBA', (c_sw * cols, c_sh * rows), (0,0,0,0))
    
    # Buscar carpeta de caminata real
    walk_path = find_anim_folder(tmp_dir, "walking") or find_anim_folder(tmp_dir, "walk")
    
    for d_name, d_idx in dirs.items():
        # Obtener frames de la carpeta encontrada
        frames = []
        if walk_path:
            frames = sorted(glob.glob(os.path.join(walk_path, d_name, "*.png")))
        
        # Fallback a rotación estática si no hay frames
        base_frame_path = os.path.join(tmp_dir, "rotations", f"{d_name}.png")
        
        # Llenar la fila de caminata (8 a 11 en el spritesheet del motor)
        for i in range(cols):
            f_path = frames[i % len(frames)] if frames else base_frame_path
            if os.path.exists(f_path):
                f = Image.open(f_path).convert('RGBA').resize((c_sw, c_sh), Image.Resampling.NEAREST)
                # Pegar en Idle (0-3) y Walk (8-11)
                img_out.paste(f, (i * c_sw, (0 + d_idx) * c_sh))
                img_out.paste(f, (i * c_sw, (8 + d_idx) * c_sh))
    
    img_out.save(f"assets/{name}.png")
    print(f"✅ Spritesheet ANIMADO generado: assets/{name}.png")

print("🚀 ¡Sincronización de animaciones completada!")
