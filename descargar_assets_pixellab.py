import os
import urllib.request
import urllib.error
import zipfile
import time

CHARACTERS = {
    # Héroes
    "939ecb81-5b1d-4a1f-94bc-5eb780613093": "tmp_class_warrior",
    "b157912c-df80-464a-aa53-3442cde1cf39": "tmp_class_sorceress",
    "da856a08-f21b-47d5-8a73-0ff5640d2184": "tmp_class_necromancer",
    "d075b40e-6c41-432e-bebe-a86b7bfdc3a3": "tmp_class_paladin",
    "d27723e9-23e1-4b8f-a5ca-3b6a266e2dda": "tmp_class_ranger",
    "3a7a04c0-dec4-4b08-b40d-73cc5e31af23": "tmp_class_druid",
    "9662bc55-3b12-4ad1-a916-c34ad4bf9194": "tmp_class_rogue",
    "155d0a79-8c7d-4136-8ec2-944559a9997a": "tmp_class_warlock",
    "ae37eab8-b1f5-4c5b-b207-65a6148f0b4f": "tmp_class_shaman",

    # Jefes Mayores
    "d33759f6-cf40-45bc-850d-297270013d01": "tmp_boss_cow_king",
    "3080de8c-2ad5-414c-ac79-9fb2490e3413": "tmp_boss_baal",
    "c90b6e21-3e56-4905-89b7-0c01b039a221": "tmp_boss_mephisto",
    "f73581cc-b48d-448d-89cc-9196a9f85072": "tmp_boss_andariel",
    "96746c8f-3d89-4515-898e-2206bf085ee5": "tmp_boss_duriel",
    "504e1076-bb7b-41eb-82ea-5d07bfbfd31a": "tmp_boss_diablo",
    
    # NPCs Ciudad
    "6403ccb8-07c6-4e71-8431-d67608da3a09": "tmp_npc_larzuk",
    "a5bd1da6-719b-414b-833c-60f701126dfd": "tmp_npc_akara",
    "3de70304-27fd-433d-9510-560edea4b1c3": "tmp_npc_ormus",
    "ebcbaee7-b5a7-496b-814f-7b11416a1553": "tmp_npc_deckard_cain",
    "97c3ea47-c57f-44c3-b8ef-657fb1e627e9": "tmp_npc_tyrael",
    
    # Enemigos
    "297a5aeb-0b6b-4201-8dd2-6f479530eb90": "tmp_enemy_cultist",
    "2559b8d0-16e8-4b18-9558-81ee3c056342": "tmp_enemy_spider",
    "d248621b-f7f1-4071-b44f-189f13e984e7": "tmp_enemy_zombie",
    "3ccc656a-afb6-4702-b5fe-4cf668af9dd5": "tmp_enemy_wraith",
    "990a9ad3-49de-4a63-9ca2-f1dc3ec92e7a": "tmp_enemy_energy_elemental"
}

BASE_URL = "https://api.pixellab.ai/mcp/characters/{}/download"
ZIP_DIR = "tmp_zips"

os.makedirs(ZIP_DIR, exist_ok=True)

def download_and_extract(char_id, folder_name):
    url = BASE_URL.format(char_id)
    zip_path = os.path.join(ZIP_DIR, f"{folder_name}.zip")
    
    retries = 5
    for attempt in range(retries):
        try:
            print(f"[*] Descargando {folder_name}...")
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
                out_file.write(response.read())
            
            # Extraer ZIP
            print(f"    -> Extrayendo en {folder_name}...")
            os.makedirs(folder_name, exist_ok=True)
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(folder_name)
            
            print(f"✅ Completado: {folder_name}")
            return True
            
        except urllib.error.HTTPError as e:
            if e.code == 423:
                print(f"⏳ {folder_name} aún está procesando animaciones (HTTP 423). Reintentando en 30s...")
                time.sleep(30)
            else:
                print(f"❌ Error HTTP {e.code} al descargar {folder_name}")
                break
        except Exception as e:
            print(f"❌ Error inesperado con {folder_name}: {e}")
            break
            
    print(f"⚠️ No se pudo descargar {folder_name} tras {retries} intentos.")
    return False

print("🚀 Iniciando descarga masiva y actualización de assets de PixelLab...")
for char_id, folder in CHARACTERS.items():
    download_and_extract(char_id, folder)

print("\n🎉 ¡Actualización finalizada! Todos los sprites y animaciones están en sus carpetas.")