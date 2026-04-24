import urllib.request
import os
import sys

# Definimos las clases y la URL de la API de avatares HD
classes = [
    'warrior', 'sorceress', 'shaman', 'necromancer', 'rogue', 
    'warlock', 'paladin', 'druid', 'ranger'
]

# Creamos la carpeta si no existe
os.makedirs("assets", exist_ok=True)

print(f"[*] Comenzando descarga de sprites desde la web...")

for c in classes:
    # Usamos la colección Dungeons & Dragons style "Adventurer" de DiceBear
    seed = c.capitalize()
    
    # Afinamos la semilla para que los personajes encajen con las clases
    if c == 'warrior': seed = 'Alexander' 
    elif c == 'sorceress': seed = 'Sophia'
    elif c == 'shaman': seed = 'Garrosh'
    elif c == 'necromancer': seed = 'Lilith'
    elif c == 'rogue': seed = 'Shadow'
    elif c == 'warlock': seed = 'Azazeel'
    elif c == 'paladin': seed = 'Arthur'
    elif c == 'druid': seed = 'Malfurion'
    elif c == 'ranger': seed = 'Sylvanas'
    
    url = f"https://api.dicebear.com/7.x/adventurer/png?seed={seed}&size=64&backgroundColor=transparent"
    target = f"assets/class_{c}.png"
    
    try:
        urllib.request.urlretrieve(url, target)
        print(f" [+] Descargado sprite para clase: {c} -> {target}")
    except Exception as e:
        print(f" [!] Error descargando clase {c}: {e}")

print("[*] ¡Proceso completo! Sprites de clases HD descargados desde la web.")
