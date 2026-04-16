import os
from PIL import Image

def fix_shaman():
    print("Corrigiendo Spritesheet del Shaman...")
    path = 'assets/class_shaman_spritesheet.png'
    if not os.path.exists(path):
        print("No se encontró assets/class_shaman_spritesheet.png")
        return
    
    img = Image.open(path).convert("RGBA")
    # El archivo mide 394x526. Gamelab suele hacer grids. 
    # Vamos a asumir un grid de frames y redimensionar el resultado final.
    # El motor espera un spritesheet de 48x48 por frame, 7 cols, 16 filas.
    
    target_sw, target_sh = 48, 48
    cols, rows = 7, 16
    final_out = Image.new("RGBA", (target_sw * cols, target_sh * rows), (0,0,0,0))
    
    # Redimensionamos la imagen original a algo que podamos manejar 
    # (por ahora, usaremos la imagen base para rellenar el spritesheet de forma compatible)
    # Como el spritesheet de Gamelab es una sola dirección/animación, lo usaremos para la fila de 'walk'
    
    base_frame = img.resize((48, 48), Image.Resampling.LANCZOS)
    
    # Llenamos todas las direcciones (0-3) y estados (Idle, Walk, Attack)
    # para que el personaje sea visible y no un cuadro negro.
    for dir_idx in range(4): # North, West, South, East
        # Idle/Cast (Filas 0-3)
        for c in range(7): final_out.paste(base_frame, (c * 48, (0 + dir_idx) * 48))
        # Walk (Filas 8-11)
        for c in range(6): final_out.paste(base_frame, (c * 48, (8 + dir_idx) * 48))
        # Attack (Filas 12-15)
        for c in range(6): final_out.paste(base_frame, (c * 48, (12 + dir_idx) * 48))
        
    final_out.save('assets/class_shaman.png')
    print("✅ assets/class_shaman.png generado (48x48 compatible).")

def fix_npc_mercenary(filename, out_name):
    print(f"Procesando {filename} -> {out_name}...")
    path = f'assets/{filename}.png'
    if not os.path.exists(path):
        print(f"No se encontró {path}")
        return
    
    img = Image.open(path).convert("RGBA")
    # Redimensionar la imagen de 1024x1024 a 48x48
    base_frame = img.resize((48, 48), Image.Resampling.LANCZOS)
    
    # Crear spritesheet estándar de NPC (usaremos el formato de 48x48)
    # Los NPCs en este motor suelen usar una sola imagen o un pequeño grid.
    # Para máxima compatibilidad, crearemos un mini spritesheet.
    final_out = Image.new("RGBA", (48, 48), (0,0,0,0))
    final_out.paste(base_frame, (0, 0))
    
    final_out.save(f'assets/{out_name}.png')
    print(f"✅ assets/{out_name}.png generado (48x48).")

if __name__ == "__main__":
    fix_shaman()
    
    assets_to_fix = [
        ('npc_blacksmith', 'npc_blacksmith'),
        ('npc_elder', 'npc_elder'),
        ('npc_guard', 'npc_guard'),
        ('npc_merchant', 'npc_merchant'),
        ('mercenary_warrior', 'mercenary_warrior'),
        ('mercenary_archer', 'mercenary_archer')
    ]
    
    for inp, out in assets_to_fix:
        fix_npc_mercenary(inp, out)
