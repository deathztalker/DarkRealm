import os
import urllib.request
import urllib.error
import zipfile
import time

CHARACTERS = {
    "939ecb81-5b1d-4a1f-94bc-5eb780613093": "tmp_class_warrior",
    "b157912c-df80-464a-aa53-3442cde1cf39": "tmp_class_sorceress",
    "da856a08-f21b-47d5-8a73-0ff5640d2184": "tmp_class_necromancer",
    "d075b40e-6c41-432e-bebe-a86b7bfdc3a3": "tmp_class_paladin",
    "d27723e9-23e1-4b8f-a5ca-3b6a266e2dda": "tmp_class_ranger",
    "3a7a04c0-dec4-4b08-b40d-73cc5e31af23": "tmp_class_druid",
    "9662bc55-3b12-4ad1-a916-c34ad4bf9194": "tmp_class_rogue",
    "155d0a79-8c7d-4136-8ec2-944559a9997a": "tmp_class_warlock",
    "ae37eab8-b1f5-4c5b-b207-65a6148f0b4f": "tmp_class_shaman",
    "504e1076-bb7b-41eb-82ea-5d07bfbfd31a": "tmp_boss_diablo",
    "f73581cc-b48d-448d-89cc-9196a9f85072": "tmp_boss_andariel",
    "96746c8f-3d89-4515-898e-2206bf085ee5": "tmp_boss_duriel",
    "c90b6e21-3e56-4905-89b7-0c01b039a221": "tmp_boss_mephisto",
    "3080de8c-2ad5-414c-ac79-9fb2490e3413": "tmp_boss_baal",
    "d33759f6-cf40-45bc-850d-297270013d01": "tmp_boss_cow_king",
    "d25e6e35-6e41-4a98-a2d2-e86659215835": "tmp_boss_demon_wirt",
    "cc623854-af52-4a8e-a6d8-6f5e83971234": "tmp_boss_angry_jano",
    "e1976334-f91e-4c7c-90ce-e20ce68b910f": "tmp_boss_leoric",
    "7bccc472-12fe-4a99-b64b-5628642fcb56": "tmp_boss_the_butcher",
    "d8b9e2b5-079a-4744-9aaf-91c76680fa05": "tmp_boss_radament",
    "27375161-6d87-4f88-9f02-c10b6651d489": "tmp_boss_izual",
    "42987da7-5548-4516-9cca-da91cdcb333f": "tmp_boss_shenk",
    "f2fa318b-1d1f-4c3b-80a6-461d113fa7f8": "tmp_boss_hephaisto",
    "5a673fdd-8de1-4a96-a515-fdae34348e1a": "tmp_boss_beetleburst",
    "ebcbaee7-b5a7-496b-814f-7b11416a1553": "tmp_npc_deckard_cain",
    "97c3ea47-c57f-44c3-b8ef-657fb1e627e9": "tmp_npc_tyrael",
    "a5bd1da6-719b-414b-833c-60f701126dfd": "tmp_npc_akara",
    "3de70304-27fd-433d-9510-560edea4b1c3": "tmp_npc_ormus",
    "6403ccb8-07c6-4e71-8431-d67608da3a09": "tmp_npc_larzuk",
    "297a5aeb-0b6b-4201-8dd2-6f479530eb90": "tmp_enemy_cultist",
    "2559b8d0-16e8-4b18-9558-81ee3c056342": "tmp_enemy_spider",
    "d248621b-f7f1-4071-b44f-189f13e984e7": "tmp_enemy_zombie",
    "3ccc656a-afb6-4702-b5fe-4cf668af9dd5": "tmp_enemy_wraith",
    "990a9ad3-49de-4a63-9ca2-f1dc3ec92e7a": "tmp_enemy_energy_elemental",
    "79ed604a-5a85-4105-94ec-1ddcca138559": "tmp_enemy_bat",
    "d833cbdb-4ffe-43a5-9e09-3fa65d97f49b": "tmp_enemy_demon",
    "e3253d3b-d2d4-427e-8d8d-95a632527281": "tmp_enemy_ghost",
    "8e6c49b1-f547-4312-8536-75edfba72ed8": "tmp_enemy_goblin",
    "33616bae-c7cc-4eeb-8487-0f1d89082537": "tmp_enemy_golem",
    "4da1c918-2af3-4539-b2de-be3cc2335de8": "tmp_enemy_skeleton",
    "02815d2d-4fad-4d90-8188-b253f5003854": "tmp_enemy_goatman"
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