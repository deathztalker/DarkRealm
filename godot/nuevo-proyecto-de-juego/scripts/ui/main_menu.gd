class_name MainMenuUI
extends Control
## Main menu with class selection - Port of main.js menu system

const CLASS_LIST := ["warrior", "sorceress", "rogue", "paladin", "druid", "necromancer", "shaman", "ranger", "warlock"]

const CLASS_DESCRIPTIONS := {
	"warrior": "Master of steel and rage. Devastating melee AoE, iron defenses, war cries.",
	"sorceress": "Elemental devastation. Fire, Cold, Lightning mastery with powerful AoE spells.",
	"rogue": "Shadow assassin. Burst damage, evasion, deadly traps and poisons.",
	"paladin": "Holy knight. Auras, healing, conviction. Strong support and holy damage.",
	"druid": "Nature's fury. Shapeshifting, elemental storms, animal companions.",
	"necromancer": "Lord of the dead. Curses, bone magic, undead army.",
	"shaman": "Spirit caller. Totems, restoration magic, ancestral power.",
	"ranger": "Master marksman. Precision shots, nature magic, loyal pet.",
	"warlock": "Dark pact. Demon summoning, curses, destructive shadow magic.",
}

const CLASS_STATS := {
	"warrior": {"str": 8, "dex": 3, "vit": 7, "int": 2},
	"sorceress": {"str": 2, "dex": 4, "vit": 3, "int": 10},
	"rogue": {"str": 3, "dex": 9, "vit": 4, "int": 3},
	"paladin": {"str": 6, "dex": 3, "vit": 6, "int": 5},
	"druid": {"str": 5, "dex": 4, "vit": 5, "int": 6},
	"necromancer": {"str": 2, "dex": 3, "vit": 4, "int": 9},
	"shaman": {"str": 4, "dex": 3, "vit": 5, "int": 7},
	"ranger": {"str": 4, "dex": 8, "vit": 4, "int": 4},
	"warlock": {"str": 3, "dex": 3, "vit": 4, "int": 8},
}

var selected_class := "warrior"
var _class_buttons: Array[Button] = []
var _desc_label: RichTextLabel
var _stats_container: VBoxContainer
var _class_icon: TextureRect
var _start_btn: Button
var _title_label: Label

signal game_start_requested(class_id: String)

func _ready() -> void:
	_build_ui()
	_select_class("warrior")

func _build_ui() -> void:
	# Full screen dark background
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.03, 0.08)
	bg.set_anchors_preset(PRESET_FULL_RECT)
	add_child(bg)

	# Title
	_title_label = Label.new()
	_title_label.text = "DARK REALM"
	_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title_label.add_theme_font_size_override("font_size", 48)
	_title_label.add_theme_color_override("font_color", Color(0.8, 0.2, 0.2))
	_title_label.position = Vector2(0, 30)
	_title_label.size = Vector2(1280, 60)
	add_child(_title_label)

	var subtitle := Label.new()
	subtitle.text = "Action RPG - Choose Your Class"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 16)
	subtitle.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
	subtitle.position = Vector2(0, 85)
	subtitle.size = Vector2(1280, 30)
	add_child(subtitle)

	# Class selection panel (left side)
	var class_panel := VBoxContainer.new()
	class_panel.position = Vector2(50, 130)
	class_panel.size = Vector2(250, 500)
	add_child(class_panel)

	var class_title := Label.new()
	class_title.text = "Classes"
	class_title.add_theme_font_size_override("font_size", 20)
	class_title.add_theme_color_override("font_color", Color(0.9, 0.8, 0.5))
	class_panel.add_child(class_title)

	for cls in CLASS_LIST:
		var btn := Button.new()
		btn.text = cls.capitalize()
		btn.custom_minimum_size = Vector2(230, 36)
		btn.add_theme_font_size_override("font_size", 14)
		btn.pressed.connect(_select_class.bind(cls))
		class_panel.add_child(btn)
		_class_buttons.append(btn)

	# Class icon (center)
	_class_icon = TextureRect.new()
	_class_icon.position = Vector2(400, 140)
	_class_icon.size = Vector2(200, 200)
	_class_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	add_child(_class_icon)

	# Stats panel (center-right)
	_stats_container = VBoxContainer.new()
	_stats_container.position = Vector2(650, 140)
	_stats_container.size = Vector2(250, 200)
	add_child(_stats_container)

	var stats_title := Label.new()
	stats_title.text = "Base Stats"
	stats_title.add_theme_font_size_override("font_size", 18)
	stats_title.add_theme_color_override("font_color", Color(0.9, 0.8, 0.5))
	_stats_container.add_child(stats_title)

	# Description (bottom)
	_desc_label = RichTextLabel.new()
	_desc_label.position = Vector2(350, 360)
	_desc_label.size = Vector2(580, 120)
	_desc_label.bbcode_enabled = true
	_desc_label.add_theme_font_size_override("normal_font_size", 14)
	_desc_label.add_theme_color_override("default_color", Color(0.8, 0.8, 0.8))
	add_child(_desc_label)

	# Start button
	_start_btn = Button.new()
	_start_btn.text = "START GAME"
	_start_btn.position = Vector2(490, 520)
	_start_btn.size = Vector2(300, 50)
	_start_btn.add_theme_font_size_override("font_size", 22)
	_start_btn.pressed.connect(_on_start_pressed)
	add_child(_start_btn)

	# Version
	var ver := Label.new()
	ver.text = "Dark Realm v1.0 - Godot Port"
	ver.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ver.add_theme_font_size_override("font_size", 10)
	ver.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4))
	ver.position = Vector2(0, 690)
	ver.size = Vector2(1280, 20)
	add_child(ver)

func _select_class(cls: String) -> void:
	selected_class = cls
	AudioManager.play_menu_click()

	# Update button highlights
	for i in _class_buttons.size():
		var btn := _class_buttons[i]
		if CLASS_LIST[i] == cls:
			btn.add_theme_color_override("font_color", Color(1, 0.85, 0.3))
		else:
			btn.remove_theme_color_override("font_color")

	# Update icon
	var tex_path := "res://assets/class_%s.png" % cls
	if ResourceLoader.exists(tex_path):
		_class_icon.texture = load(tex_path)
	else:
		_class_icon.texture = null

	# Update description
	_desc_label.text = CLASS_DESCRIPTIONS.get(cls, "")

	# Update stats
	_update_stats_display(cls)

func _update_stats_display(cls: String) -> void:
	# Remove old stat bars (keep title)
	while _stats_container.get_child_count() > 1:
		var child := _stats_container.get_child(_stats_container.get_child_count() - 1)
		_stats_container.remove_child(child)
		child.queue_free()

	var stats: Dictionary = CLASS_STATS.get(cls, {})
	var stat_colors := {"str": Color(0.9, 0.3, 0.3), "dex": Color(0.3, 0.9, 0.3), "vit": Color(0.9, 0.6, 0.2), "int": Color(0.3, 0.5, 1.0)}
	var stat_names := {"str": "Strength", "dex": "Dexterity", "vit": "Vitality", "int": "Intelligence"}

	for stat_key in ["str", "dex", "vit", "int"]:
		var row := HBoxContainer.new()
		row.custom_minimum_size.y = 24

		var lbl := Label.new()
		lbl.text = stat_names[stat_key]
		lbl.custom_minimum_size.x = 100
		lbl.add_theme_font_size_override("font_size", 12)
		lbl.add_theme_color_override("font_color", stat_colors[stat_key])
		row.add_child(lbl)

		# Bar background
		var bar_bg := ColorRect.new()
		bar_bg.custom_minimum_size = Vector2(100, 14)
		bar_bg.color = Color(0.15, 0.15, 0.15)
		row.add_child(bar_bg)

		# Bar fill (overlaid via offset)
		var bar := ColorRect.new()
		var val: int = stats.get(stat_key, 5)
		bar.custom_minimum_size = Vector2(val * 10, 14)
		bar.color = stat_colors[stat_key]
		bar.position = Vector2(0, 0)
		bar_bg.add_child(bar)

		var val_label := Label.new()
		val_label.text = " %d" % val
		val_label.add_theme_font_size_override("font_size", 12)
		row.add_child(val_label)

		_stats_container.add_child(row)

func _on_start_pressed() -> void:
	AudioManager.play_menu_click()
	game_start_requested.emit(selected_class)
