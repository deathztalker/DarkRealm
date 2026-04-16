import os
from PIL import Image

def fix_asset(input_path, output_path, is_shaman=False):
    print(f"Reparando con precisión: {input_path}...")
    if not os.path.exists(input_path):
        return

    img = Image.open(input_path).convert("RGBA")
    
    # 1. Eliminar fondo blanco o casi blanco (común en fallos de generación)
    data = img.getdata()
    new_data = []
    for item in data:
        # Si el pixel es muy blanco (r,g,b > 240), lo hacemos transparente
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)

    # 2. Auto-recorte del personaje (para eliminar todo el aire/transparencia)
    bbox = img.getbbox()
    if not bbox:
        print(f"Error: {input_path} está vacío.")
        return
    img = img.crop(bbox)

    # 3. Escalado pixel-perfect
    # Ajustamos a 32px de altura para que se vea bien en el mundo de 48px
    target_h = 32
    aspect = img.width / img.height
    new_w = int(target_h * aspect)
    # NEAREST es vital para no "pixelar" borrosamente, sino mantener el pixel art
    img = img.resize((new_w, target_h), Image.Resampling.NEAREST)

    # 4. Crear lienzo de 48x48 y centrar
    canvas = Image.new("RGBA", (48, 48), (0,0,0,0))
    paste_x = (48 - new_w) // 2
    paste_y = (48 - target_h) // 2
    canvas.paste(img, (paste_x, paste_y), img)

    # 5. Generar archivo final
    if is_shaman:
        # El motor de clases NECESITA la hoja de 7x16
        final_sheet = Image.new("RGBA", (48 * 7, 48 * 16), (0,0,0,0))
        for r in range(16):
            for c in range(7):
                final_sheet.paste(canvas, (c * 48, r * 48))
        final_sheet.save(output_path)
    else:
        canvas.save(output_path)
    
    print(f"✅ {output_path} reparado (Fondo limpio, centrado, 48x48).")

if __name__ == "__main__":
    # Shaman
    fix_asset('assets/class_shaman_spritesheet.png', 'assets/class_shaman.png', is_shaman=True)
    
    # NPCs y Mercenarios
    assets = [
        'npc_blacksmith', 'npc_elder', 'npc_guard', 'npc_merchant', 
        'mercenary_warrior', 'mercenary_archer'
    ]
    for name in assets:
        fix_asset(f'assets/{name}.png', f'assets/{name}.png')
