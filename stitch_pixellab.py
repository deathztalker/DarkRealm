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
    'npc_blacksmith': 'bbb9fce5-39ef-4137-84e9-e5f736d83b3b',
    'npc_merchant': '6df53205-1049-4653-8707-690462701ef4',
    'npc_elder': 'cd664987-a540-4bab-8c54-5e074ef9c26a',
    'npc_guard': 'dc4b6c63-ec01-4432-98bd-091c5299c526',
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
