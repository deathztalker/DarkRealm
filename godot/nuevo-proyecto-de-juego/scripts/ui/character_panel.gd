class_name CharacterPanel
extends Control
## Character stats panel

var _player: PlayerEntity
var _visible := false
var _stats_label: RichTextLabel
var _panel: Panel

func _ready() -> void:
	visible = false
	_build_panel()
	EventBus.toggle_panel.connect(_on_toggle)

func set_player(p: PlayerEntity) -> void:
	_player = p

func _build_panel() -> void:
	_panel = Panel.new()
	_panel.position = Vector2(750, 50)
	_panel.size = Vector2(300, 550)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.06, 0.1, 0.95)
	sb.border_width_bottom = 2; sb.border_width_top = 2
	sb.border_width_left = 2; sb.border_width_right = 2
	sb.border_color = Color(0.3, 0.3, 0.5)
	_panel.add_theme_stylebox_override("panel", sb)
	add_child(_panel)

	var title := Label.new()
	title.text = "Character"
	title.position = Vector2(10, 5)
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(0.9, 0.8, 0.5))
	_panel.add_child(title)

	var close := Button.new()
	close.text = "X"
	close.position = Vector2(265, 5)
	close.size = Vector2(25, 25)
	close.pressed.connect(_toggle_visible)
	_panel.add_child(close)

	_stats_label = RichTextLabel.new()
	_stats_label.position = Vector2(10, 35)
	_stats_label.size = Vector2(280, 500)
	_stats_label.bbcode_enabled = true
	_stats_label.add_theme_font_size_override("normal_font_size", 12)
	_stats_label.add_theme_color_override("default_color", Color(0.85, 0.85, 0.85))
	_panel.add_child(_stats_label)

func _refresh() -> void:
	if not _player or not is_instance_valid(_player): return
	var p := _player
	var t := ""
	t += "[b][color=#e0c878]%s[/color] - Level %d[/b]\n" % [p.class_id.capitalize(), p.level]
	t += "XP: %d / %d\n\n" % [p.xp, p.xp_to_next_level()]

	t += "[b][color=#cc5555]Strength:[/color][/b] %d\n" % p.base_stats.get("str", 0)
	t += "[b][color=#55cc55]Dexterity:[/color][/b] %d\n" % p.base_stats.get("dex", 0)
	t += "[b][color=#cc8833]Vitality:[/color][/b] %d\n" % p.base_stats.get("vit", 0)
	t += "[b][color=#5577ff]Intelligence:[/color][/b] %d\n\n" % p.base_stats.get("int", 0)

	t += "[b]HP:[/b] %d / %d\n" % [p.hp, p.max_hp]
	t += "[b]MP:[/b] %d / %d\n\n" % [p.mp, p.max_mp]

	t += "[b]Damage:[/b] %d - %d\n" % [p.min_dmg, p.max_dmg]
	t += "[b]Armor:[/b] %d\n" % p.armor
	t += "[b]Crit Chance:[/b] %.1f%%\n" % p.crit_chance
	t += "[b]Crit Multiplier:[/b] %.0f%%\n" % p.crit_multi
	t += "[b]Life Steal:[/b] %.1f%%\n" % p.life_steal
	t += "[b]Move Speed:[/b] +%.0f%%\n" % p.move_speed_pct
	t += "[b]Attack Speed:[/b] +%.0f%%\n\n" % p.attack_speed_pct

	t += "[b]Resistances:[/b]\n"
	t += "  [color=#ff6644]Fire:[/color] %d%%\n" % p.resists.get("fire", 0)
	t += "  [color=#44aaff]Cold:[/color] %d%%\n" % p.resists.get("cold", 0)
	t += "  [color=#ffff44]Lightning:[/color] %d%%\n" % p.resists.get("lightning", 0)
	t += "  [color=#44ff44]Poison:[/color] %d%%\n" % p.resists.get("poison", 0)
	t += "  [color=#aa44cc]Shadow:[/color] %d%%\n\n" % p.resists.get("shadow", 0)

	t += "[b]Magic Find:[/b] %.0f%%\n" % p.magic_find
	t += "[b]Gold Find:[/b] %.0f%%\n" % p.gold_find
	t += "[b]Gold:[/b] %d\n" % p.gold
	t += "[b]Talent Points:[/b] %d\n" % p.unspent_points

	_stats_label.text = t

func _toggle_visible() -> void:
	_visible = not _visible
	visible = _visible
	if _visible: _refresh()

func _on_toggle(panel_name: String) -> void:
	if panel_name == "character":
		_toggle_visible()
