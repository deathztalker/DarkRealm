import urllib.request
import os

assets_dir = r"c:\Users\Death\.gemini\antigravity\scratch\dark-realm\assets"

# Dicebear icons for props
props = {
    'obj_chest': 'treasure-chest',
    'obj_chest_open': 'open-chest',
    'env_stairs_down': 'stairs-down',
    'env_stairs_up': 'stairs-up'
}

for filename, seed in props.items():
    # Using 'icons' style for props
    url = f"https://api.dicebear.com/7.x/icons/png?seed={seed}&backgroundColor=transparent&size=256&color=d4af37"
    path = os.path.join(assets_dir, f"{filename}.png")
    print(f"Downloading {filename} from {url}")
    try:
        urllib.request.urlretrieve(url, path)
    except Exception as ex:
        print("Failed:", ex)

# Re-download some enemies if they were SVG
enemies = ['bat', 'demon', 'ghost', 'spider', 'zombie', 'cultist', 'golem']
for e in enemies:
    url = f"https://robohash.org/{e}.png?set=set2&size=256x256"
    path = os.path.join(assets_dir, f"enemy_{e}.png")
    if not os.path.exists(path) or os.path.getsize(path) < 1000:
        print(f"Downloading enemy_{e} from {url}")
        try:
            urllib.request.urlretrieve(url, path)
        except Exception as ex:
            print("Failed:", ex)
