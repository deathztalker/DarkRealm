import os
import urllib.request
import zipfile
import glob
from PIL import Image

characters = {
    'shaman': '5a15763a-bb53-47b9-9215-ad1678fa7803',
    'druid': '58a98129-7c13-4b94-907b-bfcbd5ef4eea',
    'rogue': '52d5fd19-500e-4fda-b50c-e43ac2b3f100',
    'warrior': '43b75dfa-0e7c-4fa1-a8bb-5ee4d116b2e2',
    'warlock': 'f91f2bd6-025a-42e8-83c4-3914b88f37be',
    'sorceress': '983089b2-82fa-4cf1-ac06-dd8789654980',
    'necromancer': '969fe6fd-24fb-4f03-ae10-39ae0570182e',
    'ranger': 'fa4eb4b3-3634-4b58-b3d8-735f7e008570',
    'paladin': '903756f6-65b8-43bb-955e-53820e01a050'
}

sw, sh = 48, 48
cols = 7
rows = 16
out_w, out_h = sw * cols, sh * rows

# En renderer.js: Up=0, Left=1, Down=2, Right=3 (basado en rowBase + dirOffset)
# PixelLab maneja: north, west, south, east
dirs = {'north': 0, 'west': 1, 'south': 2, 'east': 3}

for name, char_id in characters.items():
    print(f"Procesando {name}...")
    url = f"https://api.pixellab.ai/mcp/characters/{char_id}/download"
    zip_path = f"{name}.zip"
    tmp_dir = f"tmp_{name}"
    
    try:
        # Descarga
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
            out_file.write(response.read())
            
        # Extracción
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmp_dir)
            
        # Lienzo del Spritesheet
        img_out = Image.new("RGBA", (out_w, out_h), (0,0,0,0))
        
        # Cargar imágenes estáticas (para Idle, Cast, Attack sin animación real)
        static_imgs = {}
        for d in dirs:
            path = os.path.join(tmp_dir, "rotations", f"{d}.png")
            if os.path.exists(path):
                static_imgs[d] = Image.open(path).convert("RGBA")
                
        # Buscar el ID dinámico de la animación walk (ej. walking-xxx)
        walk_dir = None
        anim_base = os.path.join(tmp_dir, "animations")
        if os.path.exists(anim_base):
            for d in os.listdir(anim_base):
                if 'walk' in d:
                    walk_dir = os.path.join(anim_base, d)
                    break
                    
        # Rellenar Spritesheet
        for d, offset in dirs.items():
            static_img = static_imgs.get(d)
            if not static_img: continue
            
            # Cast (Row 0..3)
            for i in range(7): img_out.paste(static_img, (i*sw, (0+offset)*sh))
            # Attack (Row 12..15)
            for i in range(6): img_out.paste(static_img, (i*sw, (12+offset)*sh))
            
            has_walk = False
            if walk_dir:
                d_dir = os.path.join(walk_dir, d)
                if os.path.exists(d_dir):
                    frames = sorted(glob.glob(os.path.join(d_dir, "*.png")))
                    if len(frames) > 0:
                        has_walk = True
                        for i, f in enumerate(frames):
                            if i < 6:  # Walk de PixelLab usa 6 frames
                                f_img = Image.open(f).convert("RGBA")
                                img_out.paste(f_img, (i*sw, (8+offset)*sh))
            
            # Shaman u otros que no completaron la animación usarán su estática como fallback
            if not has_walk:
                for i in range(6): img_out.paste(static_img, (i*sw, (8+offset)*sh))
                
        out_path = f"assets/class_{name}.png"
        img_out.save(out_path)
        print(f"✅ Guardado en {out_path}")
        
    except Exception as e:
        print(f"❌ Error con {name} (puede que aún se esté procesando): {e}")

print("Proceso de Stitching (Ensamblado) completado.")
