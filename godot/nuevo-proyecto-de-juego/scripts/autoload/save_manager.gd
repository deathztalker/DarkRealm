extends Node
## Save/Load system using Godot's FileAccess + JSON
## Port of src/systems/saveSystem.js

const SAVE_DIR := "user://saves/"
const AUTO_SAVE_INTERVAL := 30.0
const MAX_SLOTS := 5

var _auto_save_timer := 0.0
var _auto_save_enabled := false

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)
	EventBus.save_requested.connect(_on_save_requested)

func _process(delta: float) -> void:
	if _auto_save_enabled:
		_auto_save_timer += delta
		if _auto_save_timer >= AUTO_SAVE_INTERVAL:
			_auto_save_timer = 0.0
			EventBus.save_requested.emit()

func enable_auto_save(enabled: bool = true) -> void:
	_auto_save_enabled = enabled
	_auto_save_timer = 0.0

# ── Save ─────────────────────────────────────────────────────────
func save_game(slot: int, player_data: Dictionary, world_data: Dictionary = {}) -> bool:
	var save_data := {
		"version": 1,
		"timestamp": Time.get_unix_time_from_system(),
		"player": player_data,
		"world": world_data,
	}
	var path := SAVE_DIR + "save_%d.json" % slot
	var json_str := JSON.stringify(save_data, "\t")
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file:
		file.store_string(json_str)
		file.close()
		EventBus.save_completed.emit()
		return true
	push_warning("SaveManager: Failed to write save file: %s" % path)
	return false

# ── Load ─────────────────────────────────────────────────────────
func load_game(slot: int) -> Dictionary:
	var path := SAVE_DIR + "save_%d.json" % slot
	if not FileAccess.file_exists(path):
		return {}
	var file := FileAccess.open(path, FileAccess.READ)
	if not file:
		return {}
	var text := file.get_as_text()
	file.close()
	var json := JSON.new()
	if json.parse(text) == OK and json.data is Dictionary:
		return json.data as Dictionary
	push_warning("SaveManager: Failed to parse save file: %s" % path)
	return {}

# ── Utilities ────────────────────────────────────────────────────
func has_save(slot: int) -> bool:
	return FileAccess.file_exists(SAVE_DIR + "save_%d.json" % slot)

func delete_save(slot: int) -> void:
	var path := SAVE_DIR + "save_%d.json" % slot
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)

func get_save_info(slot: int) -> Dictionary:
	var data := load_game(slot)
	if data.is_empty():
		return {}
	var player := data.get("player", {}) as Dictionary
	return {
		"slot": slot,
		"timestamp": data.get("timestamp", 0),
		"class_id": player.get("class_id", ""),
		"level": player.get("level", 1),
		"zone": data.get("world", {}).get("zone", 0),
		"difficulty": data.get("world", {}).get("difficulty", 0),
	}

func get_all_saves() -> Array[Dictionary]:
	var saves: Array[Dictionary] = []
	for i in MAX_SLOTS:
		var info := get_save_info(i)
		if not info.is_empty():
			saves.append(info)
	return saves

# ── Serialize player for saving ──────────────────────────────────
func serialize_player(player) -> Dictionary:
	if not is_instance_valid(player):
		return {}
	return {
		"class_id": player.class_id,
		"level": player.level,
		"xp": player.xp,
		"gold": player.gold,
		"hp": player.hp,
		"mp": player.mp,
		"base_stats": player.base_stats.duplicate(),
		"equipment": player.equipment.duplicate(true),
		"inventory": player.inventory.duplicate(true),
		"potion_belt": player.potion_belt.duplicate(true),
		"hotbar": player.hotbar.duplicate(),
		"talent_points_spent": player.talent_points_spent.duplicate(true),
		"stash": player.stash.duplicate(true),
	}

func deserialize_player(player, data: Dictionary) -> void:
	if data.is_empty() or not is_instance_valid(player):
		return
	player.class_id = data.get("class_id", player.class_id)
	player.level = int(data.get("level", 1))
	player.xp = int(data.get("xp", 0))
	player.gold = int(data.get("gold", 0))
	player.base_stats = data.get("base_stats", player.base_stats)
	player.equipment = data.get("equipment", player.equipment)
	player.inventory = data.get("inventory", player.inventory)
	player.potion_belt = data.get("potion_belt", player.potion_belt)
	player.hotbar = data.get("hotbar", player.hotbar)
	player.talent_points_spent = data.get("talent_points_spent", player.talent_points_spent)
	player.stash = data.get("stash", player.stash)
	player.recalculate_stats()
	player.hp = int(data.get("hp", player.max_hp))
	player.mp = int(data.get("mp", player.max_mp))

func _on_save_requested() -> void:
	# Auto-save to slot 0
	var game_world = get_tree().get_first_node_in_group("game_world")
	var player = get_tree().get_first_node_in_group("player")
	if game_world and player:
		var pd := serialize_player(player)
		var wd := {"zone": game_world.current_zone, "difficulty": game_world.current_difficulty}
		save_game(0, pd, wd)
