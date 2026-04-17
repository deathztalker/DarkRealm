import urllib.request
import os

assets = {
    # Tilesets
    "tileset_act1_wilderness": "6f9cfbae-99c0-4e93-b7fa-9de002a9eb34",
    "tileset_act1_town": "a113ae52-02ea-4240-9e93-c74f5943771d",
    "tileset_act2_desert": "c1505c65-0ba5-43bd-8e08-2ce691a0f9a3",
    "tileset_act2_town": "282732ea-b4e2-4900-bbe5-19899fed74a9",
    "tileset_act3_jungle": "74742b47-b6ea-45c7-b103-aa9de858aae2",
    "tileset_act3_town": "90be00e9-eb3e-4c71-a716-fba03781847c",
    "tileset_act4_hell": "effe3db0-0388-4365-bfc7-8a88247b28d1",
    "tileset_act4_town": "d5c79b3e-4716-4cc9-8d0e-9ca02b6334d9",
    "tileset_act5_snow": "c1ae7777-b949-4976-b6ff-4f9f380b9139",
    "tileset_act5_town": "7a1690ca-ad75-4fde-8cc1-5a0f09264cc9",
    
    # Map Objects
    "obj_bonfire": "0df5df50-83b1-4544-a76d-385063719602",
    "obj_fountain": "cad5913f-aa83-4f7a-8c35-92fafd493589",
    "obj_bridge_rope": "b4ac187f-a0ee-4cb0-a655-7bdd990a9d67",
    "obj_statue_angel": "3ee42373-91b2-41cb-9950-51f3c57e2299",
    "obj_anvil_hot": "5070293d-a70f-4d99-a967-a4bcd92e9a64",
    "obj_tent_leather": "3b8a5863-bac4-4a57-80c0-2b17a09f8d2a",
    "obj_house_sandstone": "b683c545-307c-4dbc-a225-6796028c17cd",
    "obj_hut_stilt": "a59e9f3b-588d-4392-aed0-c800208c4e37",
    "obj_longhouse_stone": "674b5e6f-aff2-4a8d-a835-ce2077c888bc",
    "obj_pillar_holy": "7ee6eb2e-7c13-4a46-882d-415c1f391cf9",
    "obj_tree_palm": "325f372f-b255-4ae8-b52b-38924bb52440",
    "obj_wagon_merchant": "053a872d-f5ef-4e65-9f94-3f4d99ffd230",
    "obj_stall_bazaar": "0b5474c1-c598-42f4-9ff0-e72e2123336f",
    "obj_tree_jungle": "679d0fb2-961a-4f03-bd00-7b3bc9717bfc",
    "obj_tree_snowy_pine": "9980ff8f-e57c-4134-a779-3cbf977a4bba"
}

if not os.path.exists("assets"):
    os.makedirs("assets")

for name, asset_id in assets.items():
    print(f"Downloading {name}...")
    if name.startswith("tileset_"):
        url = f"https://api.pixellab.ai/mcp/tilesets/{asset_id}/image"
    else:
        url = f"https://api.pixellab.ai/mcp/map-objects/{asset_id}/download"
        
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(f"assets/{name}.png", 'wb') as out_file:
            out_file.write(response.read())
        print(f"✅ {name} downloaded.")
    except Exception as e:
        print(f"❌ Error downloading {name}: {e}")
