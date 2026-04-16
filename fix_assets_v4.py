import os
from PIL import Image

def ultra_fix(input_path, output_path, is_shaman=False):
    print(f"Reparación ultra-limpia: {input_path}...")
    if not os.path.exists(input_path):
        return

    img = Image.open(input_path).convert("RGBA")
    
    # 1. Limpieza radical del fondo blanco (escanea píxel por píxel)
    data = img.getdata()
    new_data = []
    for item in data:
        # Si r, g, b son todos muy altos (blanco), lo hacemos 100% transparente
        if item[0] > 235 and item[1] > 235 and item[2] > 235:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)

    # 2. Recorte inteligente (solo lo que NO es transparente)
    bbox = img.getbbox()
    if not bbox:
        return
    img = img.crop(bbox)

    # 3. Escalado nítido (NEAREST) para pixel art
    # Si la imagen ya es pequeña (como el Shaman 48x48), no escalamos mucho
    if img.height > 64:
        target_h = 32
        aspect = img.width / img.height
        new_w = int(target_h * aspect)
        img = img.resize((new_w, target_h), Image.Resampling.NEAREST)
    else:
        # Si ya es pixel art real de 48x48, solo nos aseguramos de que quepa bien
        if img.height > 40:
             aspect = img.width / img.height
             img = img.resize((int(32 * aspect), 32), Image.Resampling.NEAREST)

    # 4. Centrado en 48x48
    canvas = Image.new("RGBA", (48, 48), (0,0,0,0))
    paste_x = (48 - img.width) // 2
    paste_y = (48 - img.height) // 2
    canvas.paste(img, (paste_x, paste_y), img)

    # 5. Generar formato final
    if is_shaman:
        # Generar Spritesheet completo para que el motor no de errores
        sheet = Image.new("RGBA", (48 * 7, 48 * 16), (0,0,0,0))
        for r in range(16):
            for c in range(7):
                sheet.paste(canvas, (c * 48, r * 48))
        sheet.save(output_path)
    else:
        canvas.save(output_path)
    
    print(f"✅ {output_path} listo.")

if __name__ == "__main__":
    # Shaman (usando la imagen base 2912 que acabamos de bajar)
    ultra_fix('assets/class_shaman_v2.png', 'assets/class_shaman.png', is_shaman=True)
    
    # NPCs y Mercenarios
    names = ['npc_blacksmith', 'npc_elder', 'npc_guard', 'npc_merchant', 'mercenary_warrior', 'mercenary_archer']
    for n in names:
        ultra_fix(f'assets/{n}.png', f'assets/{n}.png')
