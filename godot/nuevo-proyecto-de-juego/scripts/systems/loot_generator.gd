class_name LootGenerator
## Item generation system - Port of src/systems/lootSystem.js

# ── Drop chances by enemy tier ───────────────────────────────────
const DROP_CHANCES := {
	"normal": 0.20,
	"elite": 0.55,
	"rare": 0.75,
	"unique": 0.85,
	"boss": 1.0,
}

# Rarity weights (adjusted by magic find)
const BASE_RARITY_WEIGHTS := {
	"normal": 80.0,
	"magic": 15.0,
	"rare": 4.0,
	"unique": 1.0,
}

# ── Base item pools ──────────────────────────────────────────────
const WEAPON_BASES := [
	{"id": "short_sword", "name": "Short Sword", "type": "weapon", "subtype": "sword", "slot": "mainhand", "min_dmg": 3, "max_dmg": 7, "req_level": 1, "icon": "item_sword"},
	{"id": "broad_sword", "name": "Broad Sword", "type": "weapon", "subtype": "sword", "slot": "mainhand", "min_dmg": 8, "max_dmg": 15, "req_level": 8, "icon": "item_sword"},
	{"id": "great_sword", "name": "Great Sword", "type": "weapon", "subtype": "sword", "slot": "mainhand", "min_dmg": 15, "max_dmg": 28, "req_level": 18, "icon": "item_sword"},
	{"id": "mythical_blade", "name": "Mythical Blade", "type": "weapon", "subtype": "sword", "slot": "mainhand", "min_dmg": 25, "max_dmg": 45, "req_level": 30, "icon": "item_sword"},
	{"id": "hand_axe", "name": "Hand Axe", "type": "weapon", "subtype": "axe", "slot": "mainhand", "min_dmg": 4, "max_dmg": 9, "req_level": 1, "icon": "item_axe"},
	{"id": "battle_axe", "name": "Battle Axe", "type": "weapon", "subtype": "axe", "slot": "mainhand", "min_dmg": 12, "max_dmg": 22, "req_level": 12, "icon": "item_axe"},
	{"id": "war_axe", "name": "War Axe", "type": "weapon", "subtype": "axe", "slot": "mainhand", "min_dmg": 20, "max_dmg": 38, "req_level": 25, "icon": "item_axe"},
	{"id": "club", "name": "Club", "type": "weapon", "subtype": "mace", "slot": "mainhand", "min_dmg": 3, "max_dmg": 8, "req_level": 1, "icon": "item_mace"},
	{"id": "morning_star", "name": "Morning Star", "type": "weapon", "subtype": "mace", "slot": "mainhand", "min_dmg": 10, "max_dmg": 20, "req_level": 10, "icon": "item_mace"},
	{"id": "war_hammer", "name": "War Hammer", "type": "weapon", "subtype": "mace", "slot": "mainhand", "min_dmg": 18, "max_dmg": 35, "req_level": 22, "icon": "item_mace"},
	{"id": "short_staff", "name": "Short Staff", "type": "weapon", "subtype": "staff", "slot": "mainhand", "min_dmg": 2, "max_dmg": 6, "req_level": 1, "icon": "item_staff"},
	{"id": "battle_staff", "name": "Battle Staff", "type": "weapon", "subtype": "staff", "slot": "mainhand", "min_dmg": 8, "max_dmg": 16, "req_level": 10, "icon": "item_staff"},
	{"id": "arcane_staff", "name": "Arcane Staff", "type": "weapon", "subtype": "staff", "slot": "mainhand", "min_dmg": 14, "max_dmg": 30, "req_level": 22, "icon": "item_staff"},
	{"id": "dagger", "name": "Dagger", "type": "weapon", "subtype": "dagger", "slot": "mainhand", "min_dmg": 2, "max_dmg": 6, "req_level": 1, "icon": "item_dagger"},
	{"id": "kris", "name": "Kris", "type": "weapon", "subtype": "dagger", "slot": "mainhand", "min_dmg": 6, "max_dmg": 14, "req_level": 10, "icon": "item_dagger"},
	{"id": "short_bow", "name": "Short Bow", "type": "weapon", "subtype": "bow", "slot": "mainhand", "min_dmg": 2, "max_dmg": 7, "req_level": 1, "icon": "item_bow"},
	{"id": "long_bow", "name": "Long Bow", "type": "weapon", "subtype": "bow", "slot": "mainhand", "min_dmg": 6, "max_dmg": 16, "req_level": 10, "icon": "item_bow"},
	{"id": "war_bow", "name": "War Bow", "type": "weapon", "subtype": "bow", "slot": "mainhand", "min_dmg": 14, "max_dmg": 28, "req_level": 22, "icon": "item_bow"},
	{"id": "bone_wand", "name": "Bone Wand", "type": "weapon", "subtype": "wand", "slot": "mainhand", "min_dmg": 2, "max_dmg": 5, "req_level": 1, "icon": "item_wand"},
	{"id": "grim_wand", "name": "Grim Wand", "type": "weapon", "subtype": "wand", "slot": "mainhand", "min_dmg": 5, "max_dmg": 12, "req_level": 10, "icon": "item_wand"},
]

const ARMOR_BASES := [
	{"id": "cap", "name": "Cap", "type": "armor", "slot": "head", "armor": 3, "req_level": 1, "icon": "item_helm"},
	{"id": "full_helm", "name": "Full Helm", "type": "armor", "slot": "head", "armor": 10, "req_level": 10, "icon": "item_helm"},
	{"id": "great_helm", "name": "Great Helm", "type": "armor", "slot": "head", "armor": 22, "req_level": 22, "icon": "item_helm"},
	{"id": "quilted_armor", "name": "Quilted Armor", "type": "armor", "slot": "chest", "armor": 5, "req_level": 1, "icon": "item_chest"},
	{"id": "chain_mail", "name": "Chain Mail", "type": "armor", "slot": "chest", "armor": 15, "req_level": 10, "icon": "item_chest"},
	{"id": "plate_mail", "name": "Plate Mail", "type": "armor", "slot": "chest", "armor": 30, "req_level": 22, "icon": "item_chest"},
	{"id": "sacred_armor", "name": "Sacred Armor", "type": "armor", "slot": "chest", "armor": 50, "req_level": 35, "icon": "item_chest"},
	{"id": "leather_gloves", "name": "Leather Gloves", "type": "armor", "slot": "gloves", "armor": 2, "req_level": 1, "icon": "item_gloves"},
	{"id": "chain_gloves", "name": "Chain Gloves", "type": "armor", "slot": "gloves", "armor": 7, "req_level": 10, "icon": "item_gloves"},
	{"id": "war_gauntlets", "name": "War Gauntlets", "type": "armor", "slot": "gloves", "armor": 15, "req_level": 22, "icon": "item_gloves"},
	{"id": "leather_boots", "name": "Leather Boots", "type": "armor", "slot": "boots", "armor": 2, "req_level": 1, "icon": "item_boots"},
	{"id": "chain_boots", "name": "Chain Boots", "type": "armor", "slot": "boots", "armor": 7, "req_level": 10, "icon": "item_boots"},
	{"id": "war_boots", "name": "War Boots", "type": "armor", "slot": "boots", "armor": 15, "req_level": 22, "icon": "item_boots"},
	{"id": "sash", "name": "Sash", "type": "armor", "slot": "belt", "armor": 1, "req_level": 1, "icon": "item_belt"},
	{"id": "heavy_belt", "name": "Heavy Belt", "type": "armor", "slot": "belt", "armor": 5, "req_level": 10, "icon": "item_belt"},
	{"id": "war_belt", "name": "War Belt", "type": "armor", "slot": "belt", "armor": 12, "req_level": 22, "icon": "item_belt"},
	{"id": "buckler", "name": "Buckler", "type": "armor", "slot": "offhand", "armor": 4, "req_level": 1, "icon": "item_shield"},
	{"id": "kite_shield", "name": "Kite Shield", "type": "armor", "slot": "offhand", "armor": 14, "req_level": 12, "icon": "item_shield"},
	{"id": "tower_shield", "name": "Tower Shield", "type": "armor", "slot": "offhand", "armor": 28, "req_level": 24, "icon": "item_shield"},
]

const JEWELRY_BASES := [
	{"id": "ring", "name": "Ring", "type": "jewelry", "slot": "ring1", "req_level": 1, "icon": "item_ring"},
	{"id": "amulet", "name": "Amulet", "type": "jewelry", "slot": "amulet", "req_level": 1, "icon": "item_amulet"},
]

# ── Affix pools ──────────────────────────────────────────────────
const PREFIXES := [
	{"id": "sturdy", "name": "Sturdy", "stat": "armor", "min": 5, "max": 20, "tier": 1},
	{"id": "strong", "name": "Strong", "stat": "str", "min": 2, "max": 8, "tier": 1},
	{"id": "nimble", "name": "Nimble", "stat": "dex", "min": 2, "max": 8, "tier": 1},
	{"id": "stout", "name": "Stout", "stat": "vit", "min": 2, "max": 8, "tier": 1},
	{"id": "wise", "name": "Wise", "stat": "int", "min": 2, "max": 8, "tier": 1},
	{"id": "jagged", "name": "Jagged", "stat": "min_dmg", "min": 1, "max": 5, "tier": 1},
	{"id": "deadly", "name": "Deadly", "stat": "max_dmg", "min": 3, "max": 12, "tier": 1},
	{"id": "fiery", "name": "Fiery", "stat": "pct_fire", "min": 5, "max": 20, "tier": 2},
	{"id": "frozen", "name": "Frozen", "stat": "pct_cold", "min": 5, "max": 20, "tier": 2},
	{"id": "shocking", "name": "Shocking", "stat": "pct_lightning", "min": 5, "max": 20, "tier": 2},
	{"id": "venomous", "name": "Venomous", "stat": "pct_poison", "min": 5, "max": 20, "tier": 2},
	{"id": "vampiric", "name": "Vampiric", "stat": "life_steal", "min": 1, "max": 5, "tier": 3},
	{"id": "champions", "name": "Champion's", "stat": "flat_hp", "min": 10, "max": 40, "tier": 2},
	{"id": "arcane", "name": "Arcane", "stat": "flat_mp", "min": 8, "max": 30, "tier": 2},
	{"id": "fortified", "name": "Fortified", "stat": "pct_armor", "min": 10, "max": 30, "tier": 2},
	{"id": "cruel", "name": "Cruel", "stat": "crit_chance", "min": 2, "max": 8, "tier": 3},
	{"id": "merciless", "name": "Merciless", "stat": "crit_multi", "min": 10, "max": 40, "tier": 3},
]

const SUFFIXES := [
	{"id": "of_health", "name": "of Health", "stat": "flat_hp", "min": 5, "max": 25, "tier": 1},
	{"id": "of_mana", "name": "of Mana", "stat": "flat_mp", "min": 5, "max": 20, "tier": 1},
	{"id": "of_haste", "name": "of Haste", "stat": "attack_speed", "min": 5, "max": 15, "tier": 2},
	{"id": "of_speed", "name": "of Speed", "stat": "move_speed", "min": 5, "max": 15, "tier": 2},
	{"id": "of_fire_res", "name": "of Fire Resistance", "stat": "resist_fire", "min": 5, "max": 20, "tier": 1},
	{"id": "of_cold_res", "name": "of Cold Resistance", "stat": "resist_cold", "min": 5, "max": 20, "tier": 1},
	{"id": "of_light_res", "name": "of Lightning Resistance", "stat": "resist_lightning", "min": 5, "max": 20, "tier": 1},
	{"id": "of_poison_res", "name": "of Poison Resistance", "stat": "resist_poison", "min": 5, "max": 20, "tier": 1},
	{"id": "of_the_zodiac", "name": "of the Zodiac", "stat": "resist_all", "min": 3, "max": 10, "tier": 3},
	{"id": "of_fortune", "name": "of Fortune", "stat": "magic_find", "min": 5, "max": 25, "tier": 2},
	{"id": "of_greed", "name": "of Greed", "stat": "gold_find", "min": 10, "max": 40, "tier": 1},
	{"id": "of_the_leech", "name": "of the Leech", "stat": "life_steal", "min": 1, "max": 4, "tier": 3},
]

# ── Unique items ─────────────────────────────────────────────────
const UNIQUES := [
	{"id": "shako", "name": "Harlequin Crest (Shako)", "type": "armor", "slot": "head", "armor": 25, "req_level": 20, "icon": "item_helm", "rarity": "unique", "affixes": [{"stat": "flat_hp", "value": 50}, {"stat": "flat_mp", "value": 50}, {"stat": "magic_find", "value": 30}, {"stat": "vit", "value": 10}]},
	{"id": "enigma", "name": "Enigma Robe", "type": "armor", "slot": "chest", "armor": 45, "req_level": 28, "icon": "item_chest", "rarity": "unique", "affixes": [{"stat": "str", "value": 12}, {"stat": "move_speed", "value": 20}, {"stat": "flat_hp", "value": 60}, {"stat": "magic_find", "value": 20}]},
	{"id": "doombringer", "name": "Doombringer", "type": "weapon", "slot": "mainhand", "min_dmg": 30, "max_dmg": 55, "req_level": 30, "icon": "item_sword", "rarity": "unique", "affixes": [{"stat": "life_steal", "value": 8}, {"stat": "crit_chance", "value": 10}, {"stat": "str", "value": 15}]},
	{"id": "spirit_ancestors", "name": "Spirit of Ancestors", "type": "armor", "slot": "offhand", "armor": 35, "req_level": 25, "icon": "item_shield", "rarity": "unique", "affixes": [{"stat": "resist_all", "value": 15}, {"stat": "flat_hp", "value": 80}, {"stat": "vit", "value": 12}]},
	{"id": "shaft_anguish", "name": "Shaft of Anguish", "type": "weapon", "slot": "mainhand", "min_dmg": 22, "max_dmg": 42, "req_level": 25, "icon": "item_staff", "rarity": "unique", "affixes": [{"stat": "pct_fire", "value": 30}, {"stat": "pct_cold", "value": 30}, {"stat": "flat_mp", "value": 50}, {"stat": "int", "value": 12}]},
]

# ── Potion definitions ───────────────────────────────────────────
const POTIONS := [
	{"id": "health_potion", "name": "Health Potion", "type": "potion", "subtype": "health", "heal": 50, "icon": "item_potion_hp"},
	{"id": "mana_potion", "name": "Mana Potion", "type": "potion", "subtype": "mana", "restore": 40, "icon": "item_potion_mp"},
	{"id": "rejuv_potion", "name": "Rejuvenation Potion", "type": "potion", "subtype": "rejuv", "heal": 35, "restore": 35, "icon": "item_potion_hp"},
]

# ── Main drop generation ─────────────────────────────────────────
func generate_drops(enemy_level: int, enemy_tier: String, world_pos: Vector2, magic_find: float = 0.0) -> Array[Dictionary]:
	var drops: Array[Dictionary] = []

	# Gold always drops
	var gold_base := randi_range(1 + enemy_level, 3 + enemy_level * 2)
	if enemy_tier == "boss": gold_base *= 5
	elif enemy_tier == "rare" or enemy_tier == "unique": gold_base *= 3
	elif enemy_tier == "elite": gold_base *= 2
	drops.append({"type": "gold", "amount": gold_base, "name": "Gold"})

	# Item drop chance
	var drop_chance: float = DROP_CHANCES.get(enemy_tier, 0.2)
	if randf() < drop_chance:
		var item := generate_item(enemy_level, magic_find)
		if not item.is_empty():
			drops.append(item)

	# Boss guaranteed extra drop
	if enemy_tier == "boss":
		drops.append(generate_item(enemy_level, magic_find + 50))

	# Potion chance
	if randf() < 0.3:
		drops.append(POTIONS[randi() % POTIONS.size()].duplicate())

	return drops

func generate_item(item_level: int, magic_find: float = 0.0) -> Dictionary:
	# Pick random base
	var all_bases := []
	all_bases.append_array(WEAPON_BASES)
	all_bases.append_array(ARMOR_BASES)
	all_bases.append_array(JEWELRY_BASES)

	# Filter by level
	var valid: Array = []
	for base in all_bases:
		if int(base.get("req_level", 1)) <= item_level + 5:
			valid.append(base)
	if valid.is_empty():
		valid = all_bases.slice(0, 5)

	var base: Dictionary = valid[randi() % valid.size()].duplicate(true)

	# Unique chance
	if randf() * 100.0 < 1.0 + magic_find * 0.01:
		var valid_uniques := UNIQUES.filter(func(u): return int(u.get("req_level", 1)) <= item_level + 5)
		if valid_uniques.size() > 0:
			return valid_uniques[randi() % valid_uniques.size()].duplicate(true)

	# Determine rarity
	var rarity := _roll_rarity(magic_find)
	base["rarity"] = rarity

	# Add affixes based on rarity
	match rarity:
		"magic":
			var num_affixes := randi_range(1, 2)
			base["affixes"] = _roll_affixes(num_affixes, item_level)
			var prefix = base["affixes"][0] if base["affixes"].size() > 0 else null
			if prefix:
				base["name"] = prefix.get("prefix_name", "") + " " + base["name"]
		"rare":
			var num_affixes := randi_range(3, 5)
			base["affixes"] = _roll_affixes(num_affixes, item_level)
			base["name"] = _generate_rare_name() + " " + base["name"]
		_:
			base["affixes"] = []

	return base

func _roll_rarity(magic_find: float) -> String:
	var weights := BASE_RARITY_WEIGHTS.duplicate()
	weights["magic"] += magic_find * 0.5
	weights["rare"] += magic_find * 0.2
	weights["unique"] += magic_find * 0.05
	var total := 0.0
	for w in weights.values(): total += w
	var roll := randf() * total
	var acc := 0.0
	for rarity in ["unique", "rare", "magic", "normal"]:
		acc += weights[rarity]
		if roll < acc:
			return rarity
	return "normal"

func _roll_affixes(count: int, item_level: int) -> Array:
	var result: Array = []
	var used_ids: Array = []
	var pool := PREFIXES + SUFFIXES
	pool = pool.filter(func(a): return int(a.get("tier", 1)) <= 1 + item_level / 10)
	pool.shuffle()
	for af in pool:
		if result.size() >= count: break
		if af["id"] in used_ids: continue
		used_ids.append(af["id"])
		var rolled: Dictionary = af.duplicate()
		rolled["value"] = randi_range(int(af["min"]), int(af["max"]))
		if af in PREFIXES:
			rolled["prefix_name"] = af["name"]
		result.append(rolled)
	return result

const RARE_NAMES := ["Grim", "Shadow", "Storm", "Blood", "Doom", "Dark", "Soul", "Death", "Wrath", "Skull", "Rune", "Void"]
const RARE_SUFFIXES := ["Fang", "Bane", "Mark", "Edge", "Star", "Song", "Thorn", "Grasp", "Eye", "Heart"]

func _generate_rare_name() -> String:
	return RARE_NAMES[randi() % RARE_NAMES.size()] + RARE_SUFFIXES[randi() % RARE_SUFFIXES.size()]
