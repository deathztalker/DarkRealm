class_name DeathScreen
extends Control
## Death / Victory overlay screens

var _panel: Panel
var _title: Label
var _stats_label: RichTextLabel
var _restart_btn: Button
var _menu_btn: Button

signal restart_requested()
signal menu_requested()

func _ready() -> void:
	visible = false
	mouse_filter = MOUSE_FILTER_STOP
	_build_ui()

func _build_ui() -> void:
	# Darken background
	var overlay := ColorRect.new()
	overlay.set_anchors_preset(PRESET_FULL_RECT)
	overlay.color = Color(0, 0, 0, 0.75)
	add_child(overlay)

	_panel = Panel.new()
	_panel.position = Vector2(340, 150)
	_panel.size = Vector2(600, 420)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.08, 0.04, 0.04, 0.95)
	sb.border_width_bottom = 2; sb.border_width_top = 2
	sb.border_width_left = 2; sb.border_width_right = 2
	sb.border_color = Color(0.6, 0.15, 0.15)
	sb.corner_radius_top_left = 8; sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8; sb.corner_radius_bottom_right = 8
	_panel.add_theme_stylebox_override("panel", sb)
	add_child(_panel)

	_title = Label.new()
	_title.text = "YOU HAVE DIED"
	_title.position = Vector2(0, 20)
	_title.size = Vector2(600, 50)
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title.add_theme_font_size_override("font_size", 36)
	_title.add_theme_color_override("font_color", Color(0.8, 0.15, 0.15))
	_panel.add_child(_title)

	_stats_label = RichTextLabel.new()
	_stats_label.position = Vector2(50, 90)
	_stats_label.size = Vector2(500, 220)
	_stats_label.bbcode_enabled = true
	_stats_label.add_theme_font_size_override("normal_font_size", 14)
	_stats_label.add_theme_color_override("default_color", Color(0.8, 0.8, 0.8))
	_panel.add_child(_stats_label)

	_restart_btn = Button.new()
	_restart_btn.text = "Restart"
	_restart_btn.position = Vector2(120, 340)
	_restart_btn.size = Vector2(150, 45)
	_restart_btn.add_theme_font_size_override("font_size", 18)
	_restart_btn.pressed.connect(func(): restart_requested.emit())
	_panel.add_child(_restart_btn)

	_menu_btn = Button.new()
	_menu_btn.text = "Main Menu"
	_menu_btn.position = Vector2(330, 340)
	_menu_btn.size = Vector2(150, 45)
	_menu_btn.add_theme_font_size_override("font_size", 18)
	_menu_btn.pressed.connect(func(): menu_requested.emit())
	_panel.add_child(_menu_btn)

func show_death(player: PlayerEntity) -> void:
	visible = true
	_title.text = "YOU HAVE DIED"
	_title.add_theme_color_override("font_color", Color(0.8, 0.15, 0.15))
	var sb: StyleBoxFlat = _panel.get_theme_stylebox("panel")
	sb.border_color = Color(0.6, 0.15, 0.15)
	sb.bg_color = Color(0.08, 0.04, 0.04, 0.95)
	_restart_btn.text = "Revive"
	_update_stats(player)

func show_victory(player: PlayerEntity) -> void:
	visible = true
	_title.text = "VICTORY!"
	_title.add_theme_color_override("font_color", Color(1, 0.85, 0.2))
	var sb: StyleBoxFlat = _panel.get_theme_stylebox("panel")
	sb.border_color = Color(0.6, 0.5, 0.2)
	sb.bg_color = Color(0.08, 0.06, 0.02, 0.95)
	_restart_btn.text = "Continue (Rifts)"
	_update_stats(player)

func _update_stats(player: PlayerEntity) -> void:
	if not player or not is_instance_valid(player):
		_stats_label.text = ""
		return
	var text := ""
	text += "[center][b]%s[/b] - Level %d[/center]\n\n" % [player.class_id.capitalize(), player.level]
	text += "Experience: %d\n" % player.xp
	text += "Gold: %d\n" % player.gold
	text += "HP: %d / %d\n" % [player.hp, player.max_hp]
	text += "Damage: %d - %d\n" % [player.min_dmg, player.max_dmg]
	text += "Armor: %d\n" % player.armor
	text += "Crit: %.1f%% (x%.0f%%)\n" % [player.crit_chance, player.crit_multi]
	_stats_label.text = text

func hide_screen() -> void:
	visible = false
