from PIL import Image
import os

files = [
    'assets/map_objects/town_portal.png',
    'assets/map_objects/warp_point.png',
    'assets/map_objects/treasure_chest.png',
    'assets/npc_akara.png',
    'assets/class_rogue.png'
]

for f in files:
    if os.path.exists(f):
        img = Image.open(f)
        print(f"{f}: {img.size}")
    else:
        print(f"{f}: NOT FOUND")
