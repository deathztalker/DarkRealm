import os
from PIL import Image

def smart_process(input_path, output_path, is_shaman=False):
    print(f"Procesando {input_path}...")
    if not os.path.exists(input_path):
        print(f"No existe: {input_path}")
        return

    img = Image.open(input_path).convert("RGBA")
    
    # 1. Auto-crop: Quitar todo el espacio transparente alrededor del personaje
    bbox = img.getbbox()
    if not bbox:
        print(f"Imagen vacía: {input_path}")
        return
    img = img.crop(bbox)

    # 2. Redimensionar el personaje para que quepa bien en 48x48
    # En este motor, los personajes miden unos 28-32px de alto
    target_h = 32
    aspect = img.width / img.height
    new_h = target_h
    new_w = int(new_h * aspect)
    
    # NEAREST para mantener los píxeles definidos y evitar borrosidad
    img_resized = img.resize((new_w, new_h), Image.Resampling.NEAREST)

    # 3. Crear el lienzo de 48x48 y centrar el personaje
    canvas = Image.new("RGBA", (48, 48), (0,0,0,0))
    paste_x = (48 - new_w) // 2
    paste_y = (48 - new_h) // 2
    canvas.paste(img_resized, (paste_x, paste_y), img_resized)

    # 4. Caso Especial Shaman: El motor espera un Spritesheet de 7x16 frames
    if is_shaman:
        # Creamos una hoja de 7 columnas por 16 filas (cada celda 48x48)
        final_shaman = Image.new("RGBA", (48 * 7, 48 * 16), (0,0,0,0))
        for r in range(16):
            for c in range(7):
                final_shaman.paste(canvas, (c * 48, r * 48))
        final_shaman.save(output_path)
    else:
        # Los NPCs y Mercenarios se guardan como una sola imagen de 48x48
        # El motor (drawSprite) ya se encarga de darles movimiento de 'respiración'
        canvas.save(output_path)
        
    print(f"✅ Generado: {output_path} (48x48 centrado y definido)")

if __name__ == "__main__":
    # Shaman (con formato de spritesheet para que el motor de clases lo reconozca)
    smart_process('assets/class_shaman_spritesheet.png', 'assets/class_shaman.png', is_shaman=True)
    
    # NPCs y Mercenarios (imágenes individuales de 48x48)
    assets = [
        ('assets/npc_blacksmith.png', 'assets/npc_blacksmith.png'),
        ('assets/npc_elder.png', 'assets/npc_elder.png'),
        ('assets/npc_guard.png', 'assets/npc_guard.png'),
        ('assets/npc_merchant.png', 'assets/npc_merchant.png'),
        ('assets/mercenary_warrior.png', 'assets/mercenary_warrior.png'),
        ('assets/mercenary_archer.png', 'assets/mercenary_archer.png'),
    ]
    
    for inp, out in assets:
        smart_process(inp, out)
