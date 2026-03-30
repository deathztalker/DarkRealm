class_name InventoryPanel
extends Control
## Inventory + Equipment panel - Port of inventory UI from main.js

var _player: PlayerEntity
var _visible := false
var _grid_slots: Array = []
var _equip_slots: Dictionary = {}
var _tooltip: Control
var _tooltip_label: RichTextLabel
var _gold_label: Label

const SLOT_SIZE := 46
const GRID_COLS := 8
const GRID_ROWS := 5

const EQUIP_POSITIONS := {
	"head": Vector2(190, 30),
	"amulet": Vector2(250, 30),
	"chest": Vector2(190, 86),
	"gloves": Vector2(120, 86),
	"belt": Vector2(190, 142),
	"boots": Vector2(190, 198),
	"mainhand": Vector2(120, 142),
	"offhand": Vector2(260, 142),
	"ring1": Vector2(120, 198),
	"ring2": Vector2(260, 198),
}

signal panel_closed()

func _ready() -> void:
	visible = false
	_build_panel()
	EventBus.toggle_panel.connect(_on_toggle)
	EventBus.inventory_changed.connect(_refresh)
	EventBus.equipment_changed.connect(_refresh)

func set_player(player: PlayerEntity) -> void:
	_player = player
	_refresh()

func _build_panel() -> void:
	# Background
	var bg := Panel.new()
	bg.position = Vector2(300, 30)
	bg.size = Vector2(430, 650)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.08, 0.06, 0.1, 0.95)
	sb.border_width_bottom = 2; sb.border_width_top = 2
	sb.border_width_left = 2; sb.border_width_right = 2
	sb.border_color = Color(0.4, 0.3, 0.2)
	sb.corner_radius_top_left = 4; sb.corner_radius_top_right = 4
	sb.corner_radius_bottom_left = 4; sb.corner_radius_bottom_right = 4
	bg.add_theme_stylebox_override("panel", sb)
	add_child(bg)

	# Title
	var title := Label.new()
	title.text = "Inventory"
	title.position = Vector2(10, 5)
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(0.9, 0.8, 0.5))
	bg.add_child(title)

	# Close button
	var close_btn := Button.new()
	close_btn.text = "X"
	close_btn.position = Vector2(395, 5)
	close_btn.size = Vector2(25, 25)
	close_btn.pressed.connect(_toggle_visible)
	bg.add_child(close_btn)

	# Equipment slots
	for slot_name in EQUIP_POSITIONS:
		var slot := Panel.new()
		slot.position = EQUIP_POSITIONS[slot_name]
		slot.size = Vector2(SLOT_SIZE, SLOT_SIZE)
		var s := StyleBoxFlat.new()
		s.bg_color = Color(0.12, 0.1, 0.15)
		s.border_width_bottom = 1; s.border_width_top = 1
		s.border_width_left = 1; s.border_width_right = 1
		s.border_color = Color(0.3, 0.3, 0.35)
		slot.add_theme_stylebox_override("panel", s)
		slot.clip_contents = true
		slot.mouse_filter = Control.MOUSE_FILTER_STOP
		slot.gui_input.connect(_on_equip_slot_input.bind(slot_name))
		slot.mouse_entered.connect(_on_equip_slot_hover.bind(slot_name))
		slot.mouse_exited.connect(_hide_tooltip)
		bg.add_child(slot)

		var lbl := Label.new()
		lbl.name = "SlotLabel"
		lbl.text = slot_name.substr(0, 2).to_upper()
		lbl.position = Vector2(2, 2)
		lbl.add_theme_font_size_override("font_size", 10)
		lbl.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4))
		slot.add_child(lbl)

		var icon := TextureRect.new()
		icon.name = "ItemIcon"
		icon.position = Vector2(3, 3)
		icon.size = Vector2(SLOT_SIZE - 6, SLOT_SIZE - 6)
		icon.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.visible = false
		slot.add_child(icon)

		var item_label := Label.new()
		item_label.name = "ItemName"
		item_label.position = Vector2(0, SLOT_SIZE - 14)
		item_label.size = Vector2(SLOT_SIZE, 14)
		item_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		item_label.add_theme_font_size_override("font_size", 8)
		slot.add_child(item_label)

		_equip_slots[slot_name] = slot

	# Inventory grid
	var grid_start := Vector2(15, 270)
	for row in GRID_ROWS:
		for col in GRID_COLS:
			var idx := row * GRID_COLS + col
			var slot := Panel.new()
			slot.position = grid_start + Vector2(col * (SLOT_SIZE + 2), row * (SLOT_SIZE + 2))
			slot.size = Vector2(SLOT_SIZE, SLOT_SIZE)
			var s := StyleBoxFlat.new()
			s.bg_color = Color(0.1, 0.1, 0.12)
			s.border_width_bottom = 1; s.border_width_top = 1
			s.border_width_left = 1; s.border_width_right = 1
			s.border_color = Color(0.25, 0.25, 0.3)
			slot.add_theme_stylebox_override("panel", s)
			slot.clip_contents = true
			slot.mouse_filter = Control.MOUSE_FILTER_STOP
			slot.gui_input.connect(_on_grid_slot_input.bind(idx))
			slot.mouse_entered.connect(_on_grid_slot_hover.bind(idx))
			slot.mouse_exited.connect(_hide_tooltip)
			bg.add_child(slot)

			var icon := TextureRect.new()
			icon.name = "ItemIcon"
			icon.position = Vector2(3, 3)
			icon.size = Vector2(SLOT_SIZE - 6, SLOT_SIZE - 6)
			icon.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
			icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			icon.visible = false
			slot.add_child(icon)

			var item_label := Label.new()
			item_label.name = "ItemName"
			item_label.position = Vector2(0, SLOT_SIZE - 14)
			item_label.size = Vector2(SLOT_SIZE, 14)
			item_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			item_label.add_theme_font_size_override("font_size", 8)
			item_label.autowrap_mode = TextServer.AUTOWRAP_WORD
			slot.add_child(item_label)

			_grid_slots.append(slot)

	# Gold display
	_gold_label = Label.new()
	_gold_label.position = Vector2(15, 530)
	_gold_label.add_theme_font_size_override("font_size", 14)
	_gold_label.add_theme_color_override("font_color", Color(1, 0.85, 0.2))
	bg.add_child(_gold_label)

	# Tooltip
	_tooltip = Panel.new()
	_tooltip.size = Vector2(250, 200)
	_tooltip.visible = false
	_tooltip.z_index = 50
	_tooltip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var tsb := StyleBoxFlat.new()
	tsb.bg_color = Color(0.04, 0.02, 0.06, 0.96)
	tsb.border_width_bottom = 2; tsb.border_width_top = 2
	tsb.border_width_left = 2; tsb.border_width_right = 2
	tsb.border_color = Color(0.5, 0.4, 0.3)
	tsb.corner_radius_top_left = 3; tsb.corner_radius_top_right = 3
	tsb.corner_radius_bottom_left = 3; tsb.corner_radius_bottom_right = 3
	_tooltip.add_theme_stylebox_override("panel", tsb)
	add_child(_tooltip)

	_tooltip_label = RichTextLabel.new()
	_tooltip_label.position = Vector2(10, 10)
	_tooltip_label.size = Vector2(230, 180)
	_tooltip_label.bbcode_enabled = true
	_tooltip_label.add_theme_font_size_override("normal_font_size", 11)
	_tooltip_label.add_theme_color_override("default_color", Color(0.85, 0.85, 0.85))
	_tooltip.add_child(_tooltip_label)

func _refresh() -> void:
	if not _player or not is_instance_valid(_player): return

	# Equipment
	for slot_name in _equip_slots:
		var slot: Panel = _equip_slots[slot_name]
		var item_label: Label = slot.get_node("ItemName")
		var icon: TextureRect = slot.get_node("ItemIcon")
		var slot_label: Label = slot.get_node("SlotLabel")
		var item = _player.equipment.get(slot_name)
		if item != null:
			item_label.text = item.get("name", "?").substr(0, 6)
			var color := _rarity_color(item.get("rarity", "normal"))
			item_label.add_theme_color_override("font_color", color)
			_load_item_icon(icon, item)
			slot_label.visible = false
		else:
			item_label.text = ""
			icon.visible = false
			icon.texture = null
			slot_label.visible = true

	# Grid
	for i in _grid_slots.size():
		var slot: Panel = _grid_slots[i]
		var item_label: Label = slot.get_node("ItemName")
		var icon: TextureRect = slot.get_node("ItemIcon")
		if i < _player.inventory.size() and _player.inventory[i] != null:
			var item: Dictionary = _player.inventory[i]
			item_label.text = item.get("name", "?").substr(0, 6)
			item_label.add_theme_color_override("font_color", _rarity_color(item.get("rarity", "normal")))
			_load_item_icon(icon, item)
		else:
			item_label.text = ""
			icon.visible = false
			icon.texture = null

	# Gold
	if _gold_label:
		_gold_label.text = "Gold: %d" % _player.gold

func _load_item_icon(icon: TextureRect, item: Dictionary) -> void:
	var icon_name: String = item.get("icon", "")
	if not icon_name.is_empty():
		var tex_path := "res://assets/%s.png" % icon_name
		if ResourceLoader.exists(tex_path):
			var tex: Texture2D = load(tex_path)
			if tex != null:
				icon.texture = tex
				icon.visible = true
				# Tint by rarity
				var rarity: String = item.get("rarity", "normal")
				if rarity != "normal":
					icon.modulate = _rarity_color(rarity)
				else:
					icon.modulate = Color.WHITE
				return
	icon.visible = false

func _rarity_color(rarity: String) -> Color:
	match rarity:
		"magic": return Color(0.3, 0.5, 1.0)
		"rare": return Color(1, 1, 0.3)
		"set": return Color(0.2, 0.9, 0.2)
		"unique": return Color(0.8, 0.6, 0.2)
		_: return Color(0.7, 0.7, 0.7)

func _toggle_visible() -> void:
	_visible = not _visible
	visible = _visible
	if _visible:
		_refresh()
	else:
		_hide_tooltip()

func _on_toggle(panel_name: String) -> void:
	if panel_name == "inventory":
		_toggle_visible()

func _input(event: InputEvent) -> void:
	if not visible or not _tooltip.visible:
		return
	if event is InputEventMouseMotion:
		_tooltip.position = event.position + Vector2(15, 15)

func _on_grid_slot_input(event: InputEvent, slot_idx: int) -> void:
	if not event is InputEventMouseButton or not event.pressed:
		return
	if not _player or not is_instance_valid(_player):
		return
	if slot_idx >= _player.inventory.size() or _player.inventory[slot_idx] == null:
		return

	var item: Dictionary = _player.inventory[slot_idx]

	if event.button_index == MOUSE_BUTTON_RIGHT:
		# Right-click: equip item
		var item_type: String = item.get("type", "")
		var slot_name: String = item.get("slot", "")
		if item_type == "weapon" or item_type == "armor" or item_type == "jewelry":
			if slot_name == "ring1":
				if _player.equipment.get("ring1") != null and _player.equipment.get("ring2") == null:
					slot_name = "ring2"
			if not slot_name.is_empty() and slot_name in _player.equipment:
				_player.inventory[slot_idx] = null
				_player.equip_item(item, slot_name)
				_hide_tooltip()
				_refresh()
		elif item_type == "potion":
			for i in _player.potion_belt.size():
				if _player.potion_belt[i] == null:
					_player.potion_belt[i] = item
					_player.inventory[slot_idx] = null
					EventBus.inventory_changed.emit()
					_hide_tooltip()
					_refresh()
					break

	elif event.button_index == MOUSE_BUTTON_LEFT:
		# Left-click: drop item on ground
		_player.inventory[slot_idx] = null
		_drop_item_on_ground(item)
		_hide_tooltip()
		_refresh()

func _on_equip_slot_input(event: InputEvent, slot_name: String) -> void:
	if not event is InputEventMouseButton or not event.pressed:
		return
	if not _player or not is_instance_valid(_player):
		return
	var item = _player.equipment.get(slot_name)
	if item == null:
		return

	if event.button_index == MOUSE_BUTTON_RIGHT or event.button_index == MOUSE_BUTTON_LEFT:
		# Unequip to inventory
		_player.equipment[slot_name] = null
		_player.pickup_item(item)
		_player.recalculate_stats()
		EventBus.equipment_changed.emit()
		_hide_tooltip()
		_refresh()

func _drop_item_on_ground(item: Dictionary) -> void:
	var game_world = get_tree().get_first_node_in_group("game_world")
	var player = get_tree().get_first_node_in_group("player")
	if game_world and player and game_world.has_method("_spawn_loot"):
		var drop_pos: Vector2 = player.global_position + Vector2(randf_range(-20, 20), randf_range(-20, 20))
		game_world._spawn_loot(item, drop_pos)
	EventBus.inventory_changed.emit()

# ── Tooltip ──────────────────────────────────────────────────────
func _on_grid_slot_hover(slot_idx: int) -> void:
	if not _player or not is_instance_valid(_player):
		return
	if slot_idx >= _player.inventory.size() or _player.inventory[slot_idx] == null:
		_hide_tooltip()
		return
	_show_item_tooltip(_player.inventory[slot_idx])

func _on_equip_slot_hover(slot_name: String) -> void:
	if not _player or not is_instance_valid(_player):
		return
	var item = _player.equipment.get(slot_name)
	if item == null:
		_hide_tooltip()
		return
	_show_item_tooltip(item)

func _show_item_tooltip(item: Dictionary) -> void:
	var text := ""
	var rarity: String = item.get("rarity", "normal")
	var rcolor := _rarity_color_hex(rarity)

	# Name
	text += "[color=%s][b]%s[/b][/color]\n" % [rcolor, item.get("name", "Unknown")]

	# Rarity + Type
	if rarity != "normal":
		text += "[color=%s]%s[/color] " % [rcolor, rarity.capitalize()]
	var item_type: String = item.get("type", "")
	if not item_type.is_empty():
		text += item_type.capitalize()
	text += "\n"

	# Base stats
	if item.has("min_dmg") and item.has("max_dmg"):
		text += "[color=#dddddd]Damage: %d - %d[/color]\n" % [item["min_dmg"], item["max_dmg"]]
	if item.has("armor") and int(item["armor"]) > 0:
		text += "[color=#dddddd]Armor: %d[/color]\n" % item["armor"]
	if item.has("heal"):
		text += "[color=#66dd66]Heals %d HP[/color]\n" % item["heal"]
	if item.has("restore"):
		text += "[color=#6688ff]Restores %d MP[/color]\n" % item["restore"]

	# Affixes
	var affixes: Array = item.get("affixes", [])
	if affixes.size() > 0:
		text += "\n"
		for af in affixes:
			var stat_id: String = af.get("stat", af.get("id", ""))
			var val = af.get("value", 0)
			var af_text := _format_affix(stat_id, val)
			if not af_text.is_empty():
				text += "[color=#8888ff]%s[/color]\n" % af_text

	# Level requirement
	if item.has("level_req") and int(item["level_req"]) > 0:
		text += "\n[color=#888888]Requires Level %d[/color]\n" % item["level_req"]

	# Slot hint
	var slot_name: String = item.get("slot", "")
	if not slot_name.is_empty():
		text += "[color=#666666]Slot: %s[/color]\n" % slot_name.capitalize()

	# Action hints
	if item_type == "weapon" or item_type == "armor" or item_type == "jewelry":
		text += "\n[color=#555555]Right-click: Equip[/color]"
	elif item_type == "potion":
		text += "\n[color=#555555]Right-click: Belt[/color]"
	text += "\n[color=#555555]Left-click: Drop[/color]"

	_tooltip_label.text = text
	# Auto-resize tooltip height
	_tooltip_label.size.y = 400
	_tooltip.size.y = _tooltip_label.get_content_height() + 20
	_tooltip_label.size.y = _tooltip.size.y - 20
	_tooltip.visible = true

func _hide_tooltip() -> void:
	_tooltip.visible = false

func _format_affix(stat_id: String, value) -> String:
	match stat_id:
		"str": return "+%d Strength" % int(value)
		"dex": return "+%d Dexterity" % int(value)
		"vit": return "+%d Vitality" % int(value)
		"int": return "+%d Intelligence" % int(value)
		"flat_hp": return "+%d Life" % int(value)
		"flat_mp": return "+%d Mana" % int(value)
		"armor": return "+%d Armor" % int(value)
		"pct_armor": return "+%d%% Armor" % int(value)
		"life_steal": return "+%.1f%% Life Steal" % float(value)
		"crit_chance": return "+%.1f%% Critical Chance" % float(value)
		"crit_multi": return "+%.0f%% Critical Damage" % float(value)
		"move_speed": return "+%d%% Move Speed" % int(value)
		"attack_speed": return "+%d%% Attack Speed" % int(value)
		"magic_find": return "+%d%% Magic Find" % int(value)
		"gold_find": return "+%d%% Gold Find" % int(value)
		"min_dmg": return "+%d Min Damage" % int(value)
		"max_dmg": return "+%d Max Damage" % int(value)
		"resist_fire": return "+%d Fire Resist" % int(value)
		"resist_cold": return "+%d Cold Resist" % int(value)
		"resist_lightning": return "+%d Lightning Resist" % int(value)
		"resist_poison": return "+%d Poison Resist" % int(value)
		"resist_all": return "+%d All Resistances" % int(value)
		"all_skills": return "+%d All Skills" % int(value)
		_: return "+%s %s" % [str(value), stat_id.capitalize()]

func _rarity_color_hex(rarity: String) -> String:
	match rarity:
		"magic": return "#4d80ff"
		"rare": return "#ffff4d"
		"set": return "#33e633"
		"unique": return "#cc9933"
		_: return "#b3b3b3"
