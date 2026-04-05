class_name TalentPanel
extends Control
## Talent tree panel - Port of src/systems/talentTree.js UI

var _player: PlayerEntity
var _visible := false
var _tree_tabs: Array[Button] = []
var _skill_buttons: Array = []
var _current_tree := 0
var _panel: Panel
var _points_label: Label
var _tree_title: Label
var _skill_info: RichTextLabel
var _reset_btn: Button

signal panel_closed()

func _ready() -> void:
	visible = false
	_build_panel()
	EventBus.toggle_panel.connect(_on_toggle)

func set_player(player: PlayerEntity) -> void:
	_player = player

func _build_panel() -> void:
	_panel = Panel.new()
	_panel.position = Vector2(200, 40)
	_panel.size = Vector2(500, 640)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.05, 0.1, 0.95)
	sb.border_width_bottom = 2; sb.border_width_top = 2
	sb.border_width_left = 2; sb.border_width_right = 2
	sb.border_color = Color(0.4, 0.3, 0.2)
	_panel.add_theme_stylebox_override("panel", sb)
	add_child(_panel)

	# Title
	var title := Label.new()
	title.text = "Talent Trees"
	title.position = Vector2(10, 5)
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(0.9, 0.8, 0.5))
	_panel.add_child(title)

	# Close
	var close := Button.new()
	close.text = "X"
	close.position = Vector2(465, 5)
	close.size = Vector2(25, 25)
	close.pressed.connect(_toggle_visible)
	_panel.add_child(close)

	# Points label
	_points_label = Label.new()
	_points_label.position = Vector2(200, 8)
	_points_label.add_theme_font_size_override("font_size", 14)
	_points_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.3))
	_panel.add_child(_points_label)

	# Tree tabs
	for i in 3:
		var tab := Button.new()
		tab.text = "Tree %d" % (i + 1)
		tab.position = Vector2(10 + i * 110, 35)
		tab.size = Vector2(100, 28)
		tab.pressed.connect(_select_tree.bind(i))
		_panel.add_child(tab)
		_tree_tabs.append(tab)

	# Tree title
	_tree_title = Label.new()
	_tree_title.position = Vector2(350, 38)
	_tree_title.add_theme_font_size_override("font_size", 14)
	_tree_title.add_theme_color_override("font_color", Color(0.8, 0.7, 0.5))
	_panel.add_child(_tree_title)

	# Skill info (bottom)
	_skill_info = RichTextLabel.new()
	_skill_info.position = Vector2(10, 480)
	_skill_info.size = Vector2(340, 110)
	_skill_info.bbcode_enabled = true
	_skill_info.add_theme_font_size_override("normal_font_size", 10)
	_panel.add_child(_skill_info)

	# Reset button
	_reset_btn = Button.new()
	_reset_btn.text = "Reset All (500g)"
	_reset_btn.position = Vector2(360, 490)
	_reset_btn.size = Vector2(120, 30)
	_reset_btn.pressed.connect(_on_reset)
	_panel.add_child(_reset_btn)

	# Assign to hotbar label
	var hotbar_hint := Label.new()
	hotbar_hint.text = "Right-click skill to assign to hotbar"
	hotbar_hint.position = Vector2(10, 600)
	hotbar_hint.add_theme_font_size_override("font_size", 9)
	hotbar_hint.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4))
	_panel.add_child(hotbar_hint)

func _refresh() -> void:
	if not _player or not is_instance_valid(_player) or _player.class_data.is_empty():
		return

	_points_label.text = "Points: %d" % _player.unspent_points

	# Clear old skill buttons
	for btn in _skill_buttons:
		if is_instance_valid(btn):
			btn.queue_free()
	_skill_buttons.clear()

	var trees: Array = _player.class_data.get("trees", [])
	if _current_tree >= trees.size():
		return

	var tree: Dictionary = trees[_current_tree]
	_tree_title.text = tree.get("name", "")

	# Update tab highlights
	for i in _tree_tabs.size():
		if i < trees.size():
			_tree_tabs[i].text = trees[i].get("name", "Tree %d" % (i+1))
			if i == _current_tree:
				_tree_tabs[i].add_theme_color_override("font_color", Color(1, 0.85, 0.3))
			else:
				_tree_tabs[i].remove_theme_color_override("font_color")

	# Create skill buttons
	var nodes: Array = tree.get("nodes", [])
	for node in nodes:
		var row: int = node.get("row", 0)
		var col: int = node.get("col", 0)
		var skill_id: String = node.get("id", "")
		var pts: int = _player.talent_points_spent.get(skill_id, 0)
		var max_pts: int = node.get("maxPts", 20)
		var skill_type: String = node.get("type", "active")

		var btn := Button.new()
		btn.position = Vector2(30 + col * 140, 75 + row * 78)
		btn.size = Vector2(120, 68)
		btn.text = "%s\n%d/%d %s" % [node.get("name", ""), pts, max_pts, "[A]" if skill_type == "active" else "[P]"]

		# Color based on state
		if pts > 0:
			btn.add_theme_color_override("font_color", Color(0.3, 1, 0.3))
		elif _can_learn(node):
			btn.add_theme_color_override("font_color", Color(0.9, 0.9, 0.9))
		else:
			btn.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4))

		btn.pressed.connect(_on_skill_clicked.bind(skill_id))
		btn.mouse_entered.connect(_show_skill_info.bind(node))
		btn.gui_input.connect(_on_skill_gui_input.bind(skill_id))
		_panel.add_child(btn)
		_skill_buttons.append(btn)

func _can_learn(node: Dictionary) -> bool:
	if not _player or _player.unspent_points <= 0:
		return false
	var skill_id: String = node.get("id", "")
	var current: int = _player.talent_points_spent.get(skill_id, 0)
	if current >= int(node.get("maxPts", 20)):
		return false
	var req: String = node.get("req", "")
	if not req.is_empty():
		var parts := req.split(":")
		if parts.size() == 2:
			if _player.talent_points_spent.get(parts[0], 0) < int(parts[1]):
				return false
	return true

func _on_skill_clicked(skill_id: String) -> void:
	if _player and _player.spend_talent_point(skill_id):
		AudioManager.play_menu_click()
		_refresh()

func _on_skill_gui_input(event: InputEvent, skill_id: String) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_RIGHT:
		# Assign to first empty hotbar slot
		if _player:
			var skill := _player._get_skill_data(skill_id)
			if skill.get("type", "") == "active" and _player.talent_points_spent.get(skill_id, 0) > 0:
				for i in _player.hotbar.size():
					if _player.hotbar[i].is_empty():
						_player.hotbar[i] = skill_id
						AudioManager.play_equip()
						_refresh()
						return
				# Replace last slot
				_player.hotbar[4] = skill_id
				AudioManager.play_equip()
				_refresh()

func _show_skill_info(node: Dictionary) -> void:
	var skill_id: String = node.get("id", "")
	var pts: int = _player.talent_points_spent.get(skill_id, 0) if _player else 0
	var eff_lvl: int = _player._get_effective_skill_level(skill_id) if _player else pts

	var text := "[b]%s[/b]\n" % node.get("name", "")
	text += "[color=gray]%s[/color]\n" % node.get("type", "").capitalize()
	text += node.get("desc", "") + "\n"
	if node.has("mana"):
		text += "[color=#5577ff]Mana: %d[/color]  " % node["mana"]
	if node.has("cd") and int(node["cd"]) > 0:
		text += "[color=#ffaa55]CD: %ds[/color]  " % node["cd"]
	if pts > 0 and node.has("dmg_base"):
		var dmg := float(node.get("dmg_base", 0)) + float(node.get("dmg_per_lvl", 0)) * eff_lvl
		text += "\n[color=#ff5555]Damage: %d[/color]" % int(dmg)
	_skill_info.text = text

func _on_reset() -> void:
	if _player:
		_player.reset_talents()
		AudioManager.play_equip()
		_refresh()

func _select_tree(idx: int) -> void:
	_current_tree = idx
	AudioManager.play_menu_click()
	_refresh()

func _toggle_visible() -> void:
	_visible = not _visible
	visible = _visible
	if _visible:
		_refresh()

func _on_toggle(panel_name: String) -> void:
	if panel_name == "talents":
		_toggle_visible()
