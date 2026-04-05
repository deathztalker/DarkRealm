extends Node
## Complete game data - All 9 classes with talent trees, enemy pools
## Port of src/data/class_*.js, enemies from enemy.js

# ── Helper to build skill node ───────────────────────────────────
static func _s(id: String, row: int, col: int, type: String, name: String, maxPts: int = 20,
	mana: int = 0, cd: float = 0, dmgBase: float = 0, dmgPerLvl: float = 0,
	req: String = "", group: String = "", synergies: Array = []) -> Dictionary:
	var d := {"id": id, "row": row, "col": col, "type": type, "name": name, "maxPts": maxPts,
		"mana": mana, "cd": cd, "dmg_base": dmgBase, "dmg_per_lvl": dmgPerLvl, "req": req, "group": group}
	if not synergies.is_empty():
		d["synergies"] = synergies
	return d

# ── All classes ──────────────────────────────────────────────────
var classes: Dictionary = {}

func _ready() -> void:
	_init_classes()

func get_class_data(id: String) -> Dictionary:
	return classes.get(id, {})

func get_all_class_ids() -> Array:
	return classes.keys()

func _init_classes() -> void:
	# ═══════════════════════════════════════════════════════════════
	# WARRIOR
	# ═══════════════════════════════════════════════════════════════
	classes["warrior"] = {
		"id": "warrior", "name": "Warrior",
		"desc": "Master of steel and rage. Devastating melee AoE, iron defenses, war cries.",
		"stats": {"str": 8, "dex": 3, "vit": 7, "int": 2},
		"allowedWeapons": ["sword", "axe", "mace"],
		"allowedOffhand": ["shield"],
		"trees": [
			{"id": "arms", "name": "Arms", "nodes": [
				_s("bash", 0, 1, "active", "Bash", 20, 4, 0, 15, 8, "", "melee"),
				_s("double_swing", 1, 0, "active", "Double Swing", 20, 5, 0, 12, 6, "bash:1", "melee"),
				_s("rend", 1, 2, "active", "Rend", 20, 6, 0, 4, 3, "bash:3", "melee"),
				_s("whirlwind", 2, 1, "active", "Whirlwind", 20, 12, 8, 10, 7, "bash:5", "melee", [{"from":"bash","pctPerPt":3},{"from":"rend","pctPerPt":4}]),
				_s("combat_mastery", 2, 0, "passive", "Combat Mastery"),
				_s("berserk", 3, 0, "active", "Berserk", 20, 8, 20, 0, 4, "double_swing:5", "melee"),
				_s("cleave", 3, 2, "active", "Cleave", 20, 7, 4, 20, 10, "whirlwind:5", "melee"),
				_s("execute", 4, 1, "active", "Execute", 20, 15, 6, 50, 20, "berserk:10", "melee", [{"from":"combat_mastery","pctPerPt":3}]),
			]},
			{"id": "defense", "name": "Defense", "nodes": [
				_s("shield_bash", 0, 1, "active", "Shield Bash", 20, 6, 6, 18, 6),
				_s("iron_skin", 1, 0, "passive", "Iron Skin"),
				_s("block_mastery", 1, 2, "passive", "Block Mastery"),
				_s("revenge", 2, 0, "active", "Revenge", 20, 0, 2, 25, 10, "block_mastery:5", "melee"),
				_s("taunt", 2, 1, "active", "Taunt", 20, 5, 12, 0, 0, "iron_skin:3"),
				_s("fortify", 3, 0, "active", "Fortify", 20, 10, 30, 0, 0, "iron_skin:10"),
				_s("life_tap", 3, 2, "passive", "Life Tap", 20, 0, 0, 0, 0, "block_mastery:5"),
				_s("last_stand", 4, 1, "active", "Last Stand", 20, 0, 120, 0, 0, "fortify:10", "", [{"from":"iron_skin","pctPerPt":3}]),
			]},
			{"id": "battle", "name": "Battle", "nodes": [
				_s("warcry", 0, 1, "active", "Warcry", 20, 8, 60),
				_s("shout", 1, 0, "active", "Shout", 20, 8, 60),
				_s("leap_attack", 1, 2, "active", "Leap Attack", 20, 9, 8, 25, 12, "", "melee"),
				_s("battle_orders", 2, 1, "active", "Battle Orders", 20, 14, 60, 0, 0, "warcry:5"),
				_s("commanding_shout", 2, 0, "active", "Commanding Shout", 20, 12, 20, 0, 0, "shout:5"),
				_s("slam", 3, 0, "active", "Ground Slam", 20, 14, 10, 40, 18, "leap_attack:5", "melee", [{"from":"leap_attack","pctPerPt":4}]),
				_s("avatar_of_war", 3, 2, "active", "Avatar of War", 20, 20, 180, 0, 0, "battle_orders:10"),
				_s("war_syn", 4, 1, "synergy", "Warlord Synergy", 1),
			]},
		]
	}

	# ═══════════════════════════════════════════════════════════════
	# SORCERESS
	# ═══════════════════════════════════════════════════════════════
	classes["sorceress"] = {
		"id": "sorceress", "name": "Sorceress",
		"desc": "Elemental devastation. Fire, Cold, Lightning mastery with powerful AoE spells.",
		"stats": {"str": 2, "dex": 4, "vit": 3, "int": 9},
		"allowedWeapons": ["staff", "orb", "wand"],
		"allowedOffhand": ["source", "shield"],
		"trees": [
			{"id": "fire", "name": "Fire", "nodes": [
				_s("fire_bolt", 0, 1, "active", "Fire Bolt", 20, 3, 0, 5, 4, "", "fire"),
				_s("fireball", 1, 0, "active", "Fireball", 20, 9, 0, 12, 9, "", "fire", [{"from":"fire_bolt","pctPerPt":3},{"from":"immolate","pctPerPt":4}]),
				_s("immolate", 1, 2, "active", "Immolate", 20, 11, 0, 6, 4, "fireball:3", "fire"),
				_s("fire_mastery", 2, 0, "passive", "Fire Mastery"),
				_s("enchant", 2, 2, "active", "Enchant", 20, 20, 0, 15, 8, "fire_mastery:1", "fire"),
				_s("meteor", 3, 1, "active", "Meteor", 20, 20, 12, 60, 22, "fireball:10", "fire", [{"from":"fireball","pctPerPt":5},{"from":"fire_bolt","pctPerPt":3}]),
				_s("inferno", 3, 0, "active", "Inferno", 20, 6, 0, 8, 5, "immolate:5", "fire"),
				_s("fire_storm", 4, 1, "active", "Fire Storm", 20, 35, 45, 20, 10, "meteor:10", "fire", [{"from":"fire_mastery","pctPerPt":4}]),
			]},
			{"id": "cold", "name": "Cold", "nodes": [
				_s("ice_bolt", 0, 1, "active", "Ice Bolt", 20, 6, 0, 8, 6, "", "cold"),
				_s("frost_nova", 0, 0, "active", "Frost Nova", 20, 14, 8, 15, 8, "", "cold"),
				_s("frozen_armor", 1, 2, "active", "Frozen Armor", 20, 12, 0, 0, 0, "ice_bolt:1"),
				_s("blizzard", 2, 1, "active", "Blizzard", 20, 18, 12, 10, 7, "ice_bolt:5", "cold", [{"from":"ice_bolt","pctPerPt":5},{"from":"ice_blast","pctPerPt":4}]),
				_s("cold_mastery", 2, 0, "passive", "Cold Mastery"),
				_s("ice_blast", 3, 0, "active", "Ice Blast", 20, 15, 6, 30, 14, "ice_bolt:10", "cold"),
				_s("frozen_orb", 3, 2, "active", "Frozen Orb", 20, 22, 1, 8, 4, "blizzard:5", "cold"),
				_s("absolute_zero", 4, 1, "active", "Absolute Zero", 20, 40, 60, 40, 18, "ice_blast:10", "cold", [{"from":"cold_mastery","pctPerPt":5}]),
			]},
			{"id": "lightning", "name": "Lightning", "nodes": [
				_s("charged_bolt", 0, 1, "active", "Charged Bolt", 20, 7, 0, 6, 5, "", "lightning"),
				_s("static_field", 0, 0, "active", "Static Field", 20, 18, 12, 25, 1),
				_s("teleport", 1, 2, "active", "Teleport", 20, 15, 1, 0, 0, "charged_bolt:1"),
				_s("chain_lightning", 2, 1, "active", "Chain Lightning", 20, 14, 0, 15, 10, "charged_bolt:5", "lightning", [{"from":"charged_bolt","pctPerPt":5}]),
				_s("light_mastery", 2, 0, "passive", "Lightning Mastery"),
				_s("nova", 3, 0, "active", "Lightning Nova", 20, 16, 6, 25, 14, "chain_lightning:5", "lightning", [{"from":"chain_lightning","pctPerPt":4}]),
				_s("energy_shield", 3, 2, "active", "Energy Shield", 20, 20, 0, 0, 0, "teleport:5"),
				_s("thunder_storm", 4, 1, "active", "Thunder Storm", 20, 30, 60, 30, 15, "nova:10", "lightning", [{"from":"light_mastery","pctPerPt":5}]),
			]},
		]
	}

	# ═══════════════════════════════════════════════════════════════
	# ROGUE
	# ═══════════════════════════════════════════════════════════════
	classes["rogue"] = {
		"id": "rogue", "name": "Rogue",
		"desc": "Shadow assassin. Burst damage, evasion, deadly traps and poisons.",
		"stats": {"str": 4, "dex": 9, "vit": 4, "int": 3},
		"allowedWeapons": ["dagger", "sword", "bow"],
		"allowedOffhand": ["shield", "dagger"],
		"trees": [
			{"id": "assassination", "name": "Assassination", "nodes": [
				_s("shadow_strike", 0, 1, "active", "Shadow Strike", 20, 5, 0, 10, 6, "", "shadow"),
				_s("backstab", 1, 0, "active", "Backstab", 20, 8, 3, 20, 8, "", "melee"),
				_s("ambush", 1, 2, "active", "Ambush", 20, 12, 6, 15, 7, "backstab:3", "shadow"),
				_s("eviscerate", 2, 1, "active", "Eviscerate", 20, 10, 0, 30, 15, "backstab:5", "melee"),
				_s("lethality", 2, 0, "passive", "Lethality"),
				_s("vanish", 3, 0, "active", "Vanish", 20, 15, 30, 0, 0, "backstab:10"),
				_s("shadow_dance", 3, 2, "active", "Shadow Dance", 20, 14, 12, 15, 8, "eviscerate:5", "shadow"),
				_s("death_mark", 4, 1, "active", "Death Mark", 20, 8, 15, 0, 0, "vanish:5", "", [{"from":"lethality","pctPerPt":3}]),
			]},
			{"id": "poison", "name": "Poisons", "nodes": [
				_s("poison_blade", 0, 1, "active", "Poison Blade", 20, 8, 30, 5, 3),
				_s("venom", 1, 0, "passive", "Venom Mastery"),
				_s("envenom", 1, 2, "active", "Envenom", 20, 10, 0, 20, 10, "poison_blade:3", "poison"),
				_s("death_blossom", 2, 0, "active", "Death Blossom", 20, 10, 0, 0, 0, "envenom:5"),
				_s("plague", 2, 1, "active", "Plague", 20, 14, 15, 12, 6, "envenom:5", "poison"),
				_s("noxious_cloud", 3, 0, "active", "Noxious Cloud", 20, 16, 20, 10, 5, "plague:5", "poison"),
				_s("virulence", 3, 2, "active", "Virulence", 20, 12, 30, 0, 0, "venom:10"),
				_s("pandemic", 4, 1, "active", "Pandemic", 20, 30, 45, 0, 0, "noxious_cloud:10", "", [{"from":"venom","pctPerPt":5}]),
			]},
			{"id": "traps", "name": "Traps", "nodes": [
				_s("blade_trap", 0, 1, "active", "Blade Trap", 20, 9, 2, 8, 5, "", "melee"),
				_s("shock_trap", 1, 0, "active", "Shock Trap", 20, 10, 2, 10, 6, "blade_trap:3", "lightning"),
				_s("trap_mastery", 1, 2, "passive", "Trap Mastery"),
				_s("fire_trap", 2, 0, "active", "Fire Trap", 20, 12, 3, 20, 10, "blade_trap:5", "fire"),
				_s("shadow_mine", 2, 1, "active", "Shadow Mine", 20, 12, 5, 25, 12, "shock_trap:5", "shadow"),
				_s("death_sentry", 3, 1, "active", "Death Sentry", 20, 16, 15, 20, 12, "shadow_mine:5", "lightning", [{"from":"shock_trap","pctPerPt":4},{"from":"trap_mastery","pctPerPt":3}]),
				_s("chain_reaction", 3, 0, "passive", "Chain Reaction", 20, 0, 0, 0, 0, "fire_trap:5"),
				_s("fortress", 4, 1, "active", "Fortress", 20, 40, 120, 0, 0, "death_sentry:10", "", [{"from":"trap_mastery","pctPerPt":5}]),
			]},
		]
	}

	# ═══════════════════════════════════════════════════════════════
	# PALADIN
	# ═══════════════════════════════════════════════════════════════
	classes["paladin"] = {
		"id": "paladin", "name": "Paladin",
		"desc": "Holy knight. Auras, healing, conviction. Strong support and holy damage.",
		"stats": {"str": 7, "dex": 3, "vit": 6, "int": 4},
		"allowedWeapons": ["sword", "mace", "axe"],
		"allowedOffhand": ["shield"],
		"trees": [
			{"id": "holy", "name": "Holy", "nodes": [
				_s("holy_light", 0, 1, "active", "Holy Light", 20, 10, 0, 25, 12, "", "holy"),
				_s("holy_shock", 0, 0, "active", "Holy Shock", 20, 8, 0, 12, 7, "", "holy"),
				_s("consecration", 1, 1, "active", "Consecration", 20, 14, 0, 6, 4, "", "holy"),
				_s("holy_mastery", 1, 0, "passive", "Holy Mastery"),
				_s("cleansing", 2, 0, "active", "Cleansing", 20, 6, 0),
				_s("divine_shield", 2, 2, "active", "Divine Shield", 20, 12, 60, 0, 0, "holy_light:10"),
				_s("holy_smite", 3, 1, "active", "Holy Smite", 20, 18, 8, 35, 16, "consecration:5", "holy", [{"from":"consecration","pctPerPt":5}]),
				_s("judgment", 4, 1, "active", "Judgment", 20, 30, 45, 50, 22, "holy_smite:10", "holy", [{"from":"holy_mastery","pctPerPt":4}]),
			]},
			{"id": "auras", "name": "Auras", "nodes": [
				_s("might_aura", 0, 1, "active", "Might", 20, 0, 0),
				_s("prayer_aura", 0, 0, "active", "Prayer", 20, 0, 0),
				_s("holy_fire_aura", 1, 1, "active", "Holy Fire", 20, 0, 0, 3, 2, "", "fire"),
				_s("resist_all", 1, 0, "active", "Resist All", 20, 0, 0),
				_s("vigor", 2, 0, "active", "Vigor", 20, 0, 0),
				_s("fanaticism", 2, 2, "active", "Fanaticism", 20, 0, 0, 0, 0, "might_aura:10"),
				_s("conviction", 3, 1, "active", "Conviction", 20, 0, 0, 0, 0, "resist_all:10"),
				_s("aura_mastery", 3, 0, "passive", "Aura Mastery"),
			]},
			{"id": "combat", "name": "Combat", "nodes": [
				_s("zeal", 0, 1, "active", "Zeal", 20, 3, 0, 0, 0, "", "melee"),
				_s("charge", 0, 0, "active", "Charge", 20, 8, 6, 30, 12, "", "melee"),
				_s("vengeance", 1, 1, "active", "Vengeance", 20, 10, 0, 8, 4, "zeal:5", "melee"),
				_s("combat_mastery_p", 1, 0, "passive", "Combat Mastery"),
				_s("smite", 2, 0, "active", "Smite", 20, 4, 2, 15, 8, "", "melee"),
				_s("blessed_hammer", 2, 2, "active", "Blessed Hammer", 20, 14, 0, 25, 14, "zeal:10", "holy", [{"from":"zeal","pctPerPt":3},{"from":"smite","pctPerPt":4}]),
				_s("foh", 3, 1, "active", "Fist of the Heavens", 20, 16, 0, 40, 18, "vengeance:5", "holy"),
				_s("divine_storm", 4, 1, "active", "Divine Storm", 20, 30, 60, 20, 10, "blessed_hammer:10", "holy", [{"from":"blessed_hammer","pctPerPt":5}]),
			]},
		]
	}

	# ═══════════════════════════════════════════════════════════════
	# DRUID
	# ═══════════════════════════════════════════════════════════════
	classes["druid"] = {
		"id": "druid", "name": "Druid",
		"desc": "Nature's fury. Shapeshifting, elemental storms, animal companions.",
		"stats": {"str": 6, "dex": 4, "vit": 7, "int": 3},
		"allowedWeapons": ["mace", "staff", "axe"],
		"allowedOffhand": ["shield"],
		"trees": [
			{"id": "shapeshifting", "name": "Shapeshifting", "nodes": [
				_s("bear_form", 0, 0, "active", "Werebear Form", 20, 15, 30),
				_s("wolf_form", 0, 2, "active", "Werewolf Form", 20, 10, 20),
				_s("maul", 1, 0, "active", "Maul", 20, 8, 0, 25, 12, "bear_form:3", "melee"),
				_s("fury", 1, 2, "active", "Fury", 20, 12, 0, 12, 6, "wolf_form:3", "melee"),
				_s("feral_mastery", 2, 1, "passive", "Feral Mastery"),
				_s("rabies", 3, 2, "active", "Rabies", 20, 10, 0, 6, 4, "fury:5", "poison"),
				_s("bear_slam", 3, 0, "active", "Earth Slam", 20, 14, 10, 40, 16, "maul:10", "earth", [{"from":"maul","pctPerPt":4}]),
				_s("primal_rage", 4, 1, "active", "Primal Rage", 20, 25, 120, 0, 0, "feral_mastery:15"),
			]},
			{"id": "elemental_druid", "name": "Elemental", "nodes": [
				_s("tornado", 0, 1, "active", "Tornado", 20, 10, 0, 12, 8, "", "nature"),
				_s("fissure", 0, 0, "active", "Fissure", 20, 12, 4, 20, 10, "", "earth"),
				_s("cyclone_armor", 1, 2, "active", "Cyclone Armor", 20, 8, 0, 30, 12),
				_s("hurricane", 2, 1, "active", "Hurricane", 20, 18, 30, 8, 5, "tornado:10", "cold", [{"from":"tornado","pctPerPt":4}]),
				_s("nature_mastery", 2, 0, "passive", "Nature Mastery"),
				_s("volcano", 3, 0, "active", "Volcano", 20, 20, 15, 40, 18, "fissure:10", "fire"),
				_s("twister", 3, 2, "active", "Twister", 20, 4, 0, 5, 3, "hurricane:5", "nature"),
				_s("armageddon", 4, 1, "active", "Armageddon", 20, 28, 60, 15, 8, "hurricane:10", "fire", [{"from":"nature_mastery","pctPerPt":5}]),
			]},
			{"id": "summoning_druid", "name": "Summoning", "nodes": [
				_s("summon_wolf", 0, 1, "active", "Summon Dire Wolf", 20, 16, 5),
				_s("spirit_wolf", 1, 0, "passive", "Spirit Wolf"),
				_s("raven", 1, 2, "active", "Summon Raven", 20, 8, 3, 0, 0, "summon_wolf:1"),
				_s("oak_sage", 2, 0, "active", "Oak Sage", 20, 14, 60, 0, 0, "summon_wolf:5"),
				_s("heart_of_wolverine", 2, 2, "active", "Heart of Wolverine", 20, 14, 60, 0, 0, "oak_sage:3"),
				_s("vine", 3, 0, "active", "Spirit Vine", 20, 8, 6),
				_s("grizzly", 3, 2, "active", "Summon Grizzly", 20, 28, 60, 0, 0, "summon_wolf:10", "", [{"from":"spirit_wolf","pctPerPt":5}]),
				_s("stampede", 4, 1, "active", "Stampede", 20, 30, 60, 0, 0, "grizzly:10", "", [{"from":"spirit_wolf","pctPerPt":4}]),
			]},
		]
	}

	# ═══════════════════════════════════════════════════════════════
	# NECROMANCER
	# ═══════════════════════════════════════════════════════════════
	classes["necromancer"] = {
		"id": "necromancer", "name": "Necromancer",
		"desc": "Lord of the dead. Curses, bone magic, undead army.",
		"stats": {"str": 3, "dex": 4, "vit": 4, "int": 9},
		"allowedWeapons": ["wand", "staff"],
		"allowedOffhand": ["source", "shield"],
		"trees": [
			{"id": "summoning", "name": "Summoning", "nodes": [
				_s("summon_skeleton", 0, 1, "active", "Raise Skeleton", 20, 12, 2, 8, 5),
				_s("skeleton_mastery", 1, 0, "passive", "Skeleton Mastery"),
				_s("skeleton_mage", 1, 2, "active", "Skeleton Mage", 20, 14, 3, 10, 6, "summon_skeleton:3", "magic"),
				_s("golem", 2, 1, "active", "Clay Golem", 20, 22, 60, 0, 0, "summon_skeleton:5"),
				_s("revive", 2, 0, "active", "Revive", 20, 28, 5, 0, 0, "summon_skeleton:10"),
				_s("golem_mastery", 3, 0, "passive", "Golem Mastery", 20, 0, 0, 0, 0, "golem:3"),
				_s("summon_resist", 3, 2, "passive", "Summon Resist", 20, 0, 0, 0, 0, "revive:5"),
				_s("army_of_dead", 4, 1, "active", "Army of the Dead", 20, 40, 120, 0, 0, "skeleton_mastery:15", "", [{"from":"skeleton_mastery","pctPerPt":5}]),
			]},
			{"id": "curses", "name": "Curses", "nodes": [
				_s("amplify_damage", 0, 1, "active", "Amplify Damage", 20, 7, 0),
				_s("weaken", 0, 0, "active", "Weaken", 20, 5, 0),
				_s("iron_maiden", 1, 1, "active", "Iron Maiden", 20, 9, 0),
				_s("decrepify", 2, 1, "active", "Decrepify", 20, 10, 0, 0, 0, "weaken:5"),
				_s("life_tap_curse", 2, 0, "active", "Life Tap", 20, 8, 0, 0, 0, "decrepify:5"),
				_s("lower_resist", 3, 1, "active", "Lower Resist", 20, 9, 0, 0, 0, "decrepify:5"),
				_s("poison_nova", 3, 0, "active", "Poison Nova", 20, 18, 8, 20, 12, "lower_resist:3", "poison"),
				_s("mass_curse", 4, 1, "active", "Mass Curse", 20, 30, 60, 0, 0, "lower_resist:10", "", [{"from":"decrepify","pctPerPt":4}]),
			]},
			{"id": "bone", "name": "Bone & Poison", "nodes": [
				_s("teeth", 0, 1, "active", "Teeth", 20, 9, 0, 8, 4, "", "bone"),
				_s("bone_spear", 0, 0, "active", "Bone Spear", 20, 11, 0, 15, 10, "", "bone"),
				_s("bone_armor", 1, 1, "active", "Bone Armor", 20, 8, 0, 15, 12),
				_s("bone_wall", 1, 2, "active", "Bone Wall", 20, 10, 3, 0, 0, "bone_armor:3"),
				_s("bone_spirit", 2, 1, "active", "Bone Spirit", 20, 18, 0, 25, 14, "bone_spear:5", "bone", [{"from":"bone_spear","pctPerPt":5},{"from":"teeth","pctPerPt":3}]),
				_s("bone_mastery", 2, 0, "passive", "Bone Mastery"),
				_s("bone_prison", 3, 2, "active", "Bone Prison", 20, 14, 8, 0, 0, "bone_wall:5"),
				_s("bone_storm", 4, 1, "active", "Bone Storm", 20, 30, 45, 15, 8, "bone_spirit:10", "bone", [{"from":"bone_mastery","pctPerPt":4}]),
			]},
		]
	}

	# ═══════════════════════════════════════════════════════════════
	# SHAMAN
	# ═══════════════════════════════════════════════════════════════
	classes["shaman"] = {
		"id": "shaman", "name": "Shaman",
		"desc": "Spirit caller. Totems, restoration magic, ancestral power.",
		"stats": {"str": 4, "dex": 4, "vit": 5, "int": 8},
		"allowedWeapons": ["totem", "mace", "staff"],
		"allowedOffhand": ["shield", "source"],
		"trees": [
			{"id": "elemental", "name": "Elemental", "nodes": [
				_s("lightning_bolt", 0, 1, "active", "Lightning Bolt", 20, 8, 0, 12, 8, "", "lightning"),
				_s("static_field_s", 0, 0, "active", "Static Field", 20, 22, 12, 25, 1, "", "lightning"),
				_s("chain_lightning_s", 1, 1, "active", "Chain Lightning", 20, 14, 0, 18, 10, "lightning_bolt:3", "lightning", [{"from":"lightning_bolt","pctPerPt":5},{"from":"thunder_strike","pctPerPt":4}]),
				_s("thunder_strike", 1, 0, "active", "Thunder Strike", 20, 16, 8, 30, 14, "lightning_bolt:5", "lightning"),
				_s("elem_mastery", 2, 0, "passive", "Elemental Mastery"),
				_s("storm_caller", 3, 1, "active", "Storm Caller", 20, 28, 30, 40, 18, "chain_lightning_s:10", "lightning", [{"from":"chain_lightning_s","pctPerPt":6}]),
				_s("earthquake", 3, 0, "active", "Earthquake", 20, 20, 12, 50, 20, "thunder_strike:5", "earth"),
			]},
			{"id": "totems", "name": "Totems", "nodes": [
				_s("searing_totem", 0, 1, "active", "Searing Totem", 20, 10, 3, 8, 6, "", "totem"),
				_s("healing_stream", 0, 0, "active", "Healing Stream", 20, 12, 4, 8, 5, "", "totem"),
				_s("stoneskin_totem", 1, 1, "active", "Stoneskin Totem", 20, 12, 4, 0, 0, "searing_totem:3", "totem"),
				_s("totem_mastery", 1, 0, "passive", "Totem Mastery"),
				_s("windfury_totem", 2, 1, "active", "Windfury Totem", 20, 16, 25, 0, 0, "searing_totem:10", "totem"),
				_s("totemic_wrath", 3, 1, "active", "Totemic Wrath", 20, 22, 40, 0, 0, "totem_mastery:10"),
			]},
			{"id": "restoration", "name": "Restoration", "nodes": [
				_s("healing_wave", 0, 1, "active", "Healing Wave", 20, 12, 0, 30, 12, "", "holy", [{"from":"ancestral_spirit","pctPerPt":4}]),
				_s("earth_shield", 0, 0, "active", "Earth Shield", 20, 14, 15, 40, 16, "", "earth"),
				_s("ancestral_spirit", 1, 1, "active", "Ancestral Spirit", 20, 20, 45, 20, 10, "healing_wave:5"),
				_s("resto_mastery", 1, 0, "passive", "Restoration Mastery"),
				_s("nature_swiftness", 2, 1, "active", "Nature's Swiftness", 20, 6, 20, 0, 0, "healing_wave:10"),
				_s("mana_tide", 2, 0, "active", "Mana Tide Totem", 20, 18, 60, 0, 0, "ancestral_spirit:5", "totem"),
			]},
		]
	}

	# ═══════════════════════════════════════════════════════════════
	# RANGER
	# ═══════════════════════════════════════════════════════════════
	classes["ranger"] = {
		"id": "ranger", "name": "Ranger",
		"desc": "Master marksman. Precision shots, nature magic, loyal pet.",
		"stats": {"str": 4, "dex": 9, "vit": 4, "int": 3},
		"allowedWeapons": ["bow"],
		"allowedOffhand": [],
		"trees": [
			{"id": "marksmanship", "name": "Marksmanship", "nodes": [
				_s("power_shot", 0, 1, "active", "Power Shot", 20, 5, 0, 15, 8, "", "melee"),
				_s("multi_shot", 1, 0, "active", "Multi-Shot", 20, 8, 0, 8, 4, "power_shot:3", "melee", [{"from":"power_shot","pctPerPt":3}]),
				_s("guided_arrow", 1, 2, "active", "Guided Arrow", 20, 8, 0, 12, 7, "power_shot:5", "melee"),
				_s("bow_mastery", 2, 0, "passive", "Bow Mastery"),
				_s("immolation_arrow", 2, 2, "active", "Immolation Arrow", 20, 12, 4, 20, 10, "power_shot:5", "fire"),
				_s("strafe", 3, 0, "active", "Strafe", 20, 14, 8, 6, 4, "multi_shot:10", "melee", [{"from":"multi_shot","pctPerPt":4}]),
				_s("mark_death", 3, 2, "active", "Mark for Death", 20, 6, 15, 0, 0, "guided_arrow:5"),
				_s("rain_of_arrows", 4, 1, "active", "Rain of Arrows", 20, 25, 30, 12, 7, "strafe:10", "melee", [{"from":"bow_mastery","pctPerPt":5}]),
			]},
			{"id": "nature_ranger", "name": "Nature", "nodes": [
				_s("companion_hawk", 0, 1, "active", "Summon Hawk", 20, 20, 60),
				_s("ensnare", 0, 0, "active", "Ensnare", 20, 7, 3),
				_s("viper_arrow", 1, 1, "active", "Viper Arrow", 20, 9, 0, 5, 3, "", "poison"),
				_s("comp_mastery", 1, 0, "passive", "Companion Mastery"),
				_s("spirit_guide", 2, 1, "active", "Spirit Guide", 20, 14, 60, 0, 0, "companion_hawk:5"),
				_s("wolf_pack", 2, 0, "active", "Call Wolf Pack", 20, 22, 45, 0, 0, "ensnare:10"),
				_s("harmony", 3, 1, "active", "Nature's Harmony", 20, 16, 15, 0, 0, "spirit_guide:5"),
				_s("stampede_ranger", 4, 1, "active", "Stampede", 20, 30, 60, 0, 0, "wolf_pack:10", "", [{"from":"comp_mastery","pctPerPt":5}]),
			]},
			{"id": "traps_ranger", "name": "Traps", "nodes": [
				_s("spike_trap", 0, 1, "active", "Spike Trap", 20, 8, 3, 10, 5, "", "melee"),
				_s("ice_trap", 1, 0, "active", "Ice Trap", 20, 10, 3, 12, 6, "spike_trap:3", "cold"),
				_s("trap_mastery_r", 1, 2, "passive", "Trap Mastery"),
				_s("scatter_shot", 2, 0, "active", "Scatter Shot", 20, 12, 6, 15, 8, "", "melee"),
				_s("fire_trap_r", 2, 2, "active", "Fire Trap", 20, 12, 3, 18, 9, "spike_trap:5", "fire"),
				_s("explosive_trap", 3, 1, "active", "Explosive Trap", 20, 16, 8, 30, 15, "fire_trap_r:5", "fire", [{"from":"ice_trap","pctPerPt":4},{"from":"fire_trap_r","pctPerPt":3}]),
				_s("black_arrow", 3, 0, "active", "Black Arrow", 20, 14, 4, 20, 10, "scatter_shot:5", "shadow"),
				_s("minefield", 4, 1, "active", "Minefield", 20, 35, 45, 0, 0, "explosive_trap:10", "", [{"from":"trap_mastery_r","pctPerPt":5}]),
			]},
		]
	}

	# ═══════════════════════════════════════════════════════════════
	# WARLOCK
	# ═══════════════════════════════════════════════════════════════
	classes["warlock"] = {
		"id": "warlock", "name": "Warlock",
		"desc": "Dark pact. Demon summoning, curses, destructive shadow magic.",
		"stats": {"str": 3, "dex": 4, "vit": 4, "int": 9},
		"allowedWeapons": ["wand", "staff", "dagger"],
		"allowedOffhand": ["source"],
		"trees": [
			{"id": "destruction", "name": "Destruction", "nodes": [
				_s("shadow_bolt", 0, 1, "active", "Shadow Bolt", 20, 9, 0, 12, 8, "", "shadow"),
				_s("drain_life", 0, 0, "active", "Drain Life", 20, 4, 0, 5, 3),
				_s("soul_fire", 1, 1, "active", "Soul Fire", 20, 14, 4, 20, 12, "shadow_bolt:5", "shadow"),
				_s("shadow_mastery", 1, 0, "passive", "Shadow Mastery"),
				_s("chaos_bolt", 2, 1, "active", "Chaos Bolt", 20, 16, 8, 30, 16, "soul_fire:5", "shadow"),
				_s("seed", 2, 0, "active", "Seed of Corruption", 20, 20, 10, 40, 20, "shadow_bolt:10", "shadow", [{"from":"shadow_bolt","pctPerPt":4}]),
				_s("dark_pact", 3, 2, "active", "Dark Pact", 20, 0, 12, 0, 0, "shadow_mastery:10"),
				_s("rain_of_chaos", 4, 1, "active", "Rain of Chaos", 20, 35, 45, 25, 14, "seed:10", "shadow", [{"from":"shadow_mastery","pctPerPt":5}]),
			]},
			{"id": "affliction", "name": "Affliction", "nodes": [
				_s("corruption", 0, 1, "active", "Corruption", 20, 8, 0, 8, 4, "", "shadow"),
				_s("agony", 1, 0, "active", "Agony", 20, 6, 0, 2, 1, "corruption:3", "shadow"),
				_s("haunt", 1, 2, "active", "Haunt", 20, 12, 8, 10, 6, "corruption:5", "shadow"),
				_s("aff_mastery", 2, 0, "passive", "Affliction Mastery"),
				_s("siphon_life", 2, 2, "active", "Siphon Life", 20, 4, 0, 6, 3, "agony:5"),
				_s("unstable", 3, 1, "active", "Unstable Affliction", 20, 15, 0, 10, 5, "haunt:5", "shadow"),
				_s("dark_soul", 3, 0, "active", "Dark Soul", 20, 15, 60, 0, 0, "aff_mastery:10"),
				_s("doom", 4, 1, "active", "Curse of Doom", 20, 18, 60, 0, 0, "unstable:10", "", [{"from":"aff_mastery","pctPerPt":4}]),
			]},
			{"id": "demonology", "name": "Demonology", "nodes": [
				_s("imp", 0, 1, "active", "Summon Imp", 20, 20, 60, 6, 4, "", "fire"),
				_s("voidwalker", 1, 0, "active", "Voidwalker", 20, 25, 60, 0, 0, "imp:5"),
				_s("demon_armor", 1, 2, "passive", "Demon Armor"),
				_s("soul_link", 2, 0, "passive", "Soul Link", 20, 0, 0, 0, 0, "imp:5"),
				_s("succubus", 2, 2, "active", "Succubus", 20, 25, 60, 12, 6, "voidwalker:5", "shadow"),
				_s("infernal", 3, 1, "active", "Summon Infernal", 20, 30, 120, 50, 20, "succubus:5", "fire"),
				_s("demonfire_passive", 3, 0, "passive", "Demonfire", 20, 0, 0, 0, 0, "soul_link:5"),
				_s("metamorphosis", 4, 1, "active", "Metamorphosis", 20, 20, 120, 30, 14, "infernal:5", "shadow", [{"from":"demonfire_passive","pctPerPt":4}]),
			]},
		]
	}

# ── Enemy data ───────────────────────────────────────────────────
const ENEMY_POOL := [
	{"type": "skeleton", "name": "Skeleton", "hp": 30, "dmg_min": 3, "dmg_max": 7, "speed": 45, "armor": 2, "xp": 12},
	{"type": "goblin", "name": "Goblin", "hp": 22, "dmg_min": 2, "dmg_max": 5, "speed": 65, "armor": 1, "xp": 10},
	{"type": "zombie", "name": "Zombie", "hp": 50, "dmg_min": 4, "dmg_max": 9, "speed": 30, "armor": 4, "xp": 15},
	{"type": "ghost", "name": "Ghost", "hp": 20, "dmg_min": 5, "dmg_max": 10, "speed": 55, "armor": 0, "xp": 18},
	{"type": "demon", "name": "Demon", "hp": 60, "dmg_min": 6, "dmg_max": 14, "speed": 50, "armor": 6, "xp": 25},
	{"type": "spider", "name": "Spider", "hp": 18, "dmg_min": 3, "dmg_max": 8, "speed": 70, "armor": 1, "xp": 11},
	{"type": "stone_golem", "name": "Stone Golem", "hp": 80, "dmg_min": 8, "dmg_max": 16, "speed": 25, "armor": 12, "xp": 30},
	{"type": "cultist", "name": "Cultist", "hp": 28, "dmg_min": 5, "dmg_max": 12, "speed": 40, "armor": 3, "xp": 20},
	{"type": "void_bat", "name": "Void Bat", "hp": 15, "dmg_min": 4, "dmg_max": 8, "speed": 75, "armor": 0, "xp": 13},
]

const BOSS_POOL := [
	{"type": "demon", "name": "Diremaw the Fleshweaver"},
	{"type": "ghost", "name": "Kha'thul the Unseen"},
	{"type": "skeleton", "name": "Bone Lord Varkath"},
	{"type": "demon", "name": "Infernal Sentinel"},
]

func get_random_enemy(zone: int) -> Dictionary:
	var pool := ENEMY_POOL.duplicate()
	# Higher zones have tougher enemies
	if zone >= 3:
		pool = pool.filter(func(e): return e["hp"] >= 25)
	var base: Dictionary = pool[randi() % pool.size()].duplicate()
	base["level"] = zone * 3 + randi_range(1, 3)
	return base

func get_boss(zone: int) -> Dictionary:
	var boss: Dictionary = BOSS_POOL[randi() % BOSS_POOL.size()].duplicate()
	var base := ENEMY_POOL.filter(func(e): return e["type"] == boss["type"])
	if base.size() > 0:
		boss.merge(base[0])
	boss["tier"] = "boss"
	boss["level"] = zone * 5 + 5
	return boss
