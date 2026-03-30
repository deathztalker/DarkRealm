class_name HUD
extends CanvasLayer
## In-game HUD - Diablo 2 style orbs, hotbar, floating text

var _player: PlayerEntity
var _hp_orb_clip: Control
var _hp_label: Label
var _mp_orb_clip: Control
var _mp_label: Label
var _xp_bar: ColorRect
var _xp_fill: ColorRect
var _xp_label: Label
var _zone_label: Label
var _level_label: Label
var _gold_label: Label
var _hotbar_slots: Array[Panel] = []
var _hotbar_labels: Array[Label] = []
var _potion_slots: Array[Panel] = []
var _buff_container: HBoxContainer
var _floating_texts: Array = []

const ORB_SIZE := 80
const ORB_Y := 610

func _ready() -> void:
	layer = 10
	_build_hud()
	EventBus.floating_text.connect(_on_floating_text)
	EventBus.player_leveled_up.connect(_on_level_up)
	EventBus.zone_entered.connect(_on_zone_entered)
	EventBus.skill_used.connect(_on_skill_used)

func set_player(player: PlayerEntity) -> void:
	_player = player

func _process(_delta: float) -> void:
	if _player and is_instance_valid(_player):
		_update_bars()
		_update_hotbar()
		_update_potions()
	_update_floating_texts(_delta)

func _build_hud() -> void:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	# ── Bottom bar background ──────────────────
	var bottom_bar := ColorRect.new()
	bottom_bar.position = Vector2(0, 680)
	bottom_bar.size = Vector2(1280, 40)
	bottom_bar.color = Color(0.05, 0.03, 0.08, 0.9)
	root.add_child(bottom_bar)

	# ── HP Orb (left) - Diablo 2 style ────────
	_build_orb(root, Vector2(10, ORB_Y), Color(0.08, 0.0, 0.0), Color(0.75, 0.08, 0.08), true)

	# ── MP Orb (right) ────────────────────────
	_build_orb(root, Vector2(1280 - ORB_SIZE - 10, ORB_Y), Color(0.0, 0.0, 0.1), Color(0.1, 0.1, 0.75), false)

	# ── XP Bar (very bottom) ──────────────────
	_xp_bar = ColorRect.new()
	_xp_bar.position = Vector2(ORB_SIZE + 20, 710)
	_xp_bar.size = Vector2(1280 - ORB_SIZE * 2 - 40, 8)
	_xp_bar.color = Color(0.08, 0.08, 0.08)
	root.add_child(_xp_bar)

	_xp_fill = ColorRect.new()
	_xp_fill.position = Vector2(ORB_SIZE + 20, 710)
	_xp_fill.size = Vector2(0, 8)
	_xp_fill.color = Color(0.3, 0.75, 0.3)
	root.add_child(_xp_fill)

	_xp_label = Label.new()
	_xp_label.position = Vector2(ORB_SIZE + 20, 710)
	_xp_label.size = Vector2(1280 - ORB_SIZE * 2 - 40, 8)
	_xp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_xp_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_xp_label.add_theme_font_size_override("font_size", 7)
	root.add_child(_xp_label)

	# ── Hotbar (5 skill slots - center) ────────
	var hotbar_x := 490
	for i in 5:
		var slot := Panel.new()
		slot.position = Vector2(hotbar_x + i * 48, 685)
		slot.size = Vector2(42, 30)
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0.1, 0.08, 0.14)
		sb.border_width_bottom = 1; sb.border_width_top = 1
		sb.border_width_left = 1; sb.border_width_right = 1
		sb.border_color = Color(0.35, 0.25, 0.4)
		sb.corner_radius_top_left = 2; sb.corner_radius_top_right = 2
		sb.corner_radius_bottom_left = 2; sb.corner_radius_bottom_right = 2
		slot.add_theme_stylebox_override("panel", sb)
		root.add_child(slot)
		_hotbar_slots.append(slot)

		var lbl := Label.new()
		lbl.text = str(i + 1)
		lbl.position = Vector2(1, 0)
		lbl.add_theme_font_size_override("font_size", 8)
		lbl.add_theme_color_override("font_color", Color(0.45, 0.45, 0.45))
		slot.add_child(lbl)

		var skill_lbl := Label.new()
		skill_lbl.name = "SkillName"
		skill_lbl.position = Vector2(0, 10)
		skill_lbl.size = Vector2(42, 18)
		skill_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		skill_lbl.add_theme_font_size_override("font_size", 8)
		slot.add_child(skill_lbl)
		_hotbar_labels.append(skill_lbl)

	# ── Potion Belt (4 slots - left of hotbar) ─
	for i in 4:
		var slot := Panel.new()
		slot.position = Vector2(350 + i * 32, 688)
		slot.size = Vector2(26, 26)
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0.08, 0.06, 0.04)
		sb.border_width_bottom = 1; sb.border_width_top = 1
		sb.border_width_left = 1; sb.border_width_right = 1
		sb.border_color = Color(0.3, 0.2, 0.1)
		slot.add_theme_stylebox_override("panel", sb)
		root.add_child(slot)
		_potion_slots.append(slot)

		var key_label := Label.new()
		var keys := ["Q", "E", "R", "F"]
		key_label.text = keys[i]
		key_label.position = Vector2(8, 4)
		key_label.add_theme_font_size_override("font_size", 9)
		key_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		slot.add_child(key_label)

	# ── Zone Label ─────────────────────────────
	_zone_label = Label.new()
	_zone_label.position = Vector2(0, 5)
	_zone_label.size = Vector2(1280, 24)
	_zone_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_zone_label.add_theme_font_size_override("font_size", 14)
	_zone_label.add_theme_color_override("font_color", Color(0.85, 0.7, 0.5))
	root.add_child(_zone_label)

	# ── Level + Gold ───────────────────────────
	_level_label = Label.new()
	_level_label.position = Vector2(ORB_SIZE + 15, ORB_Y + 5)
	_level_label.add_theme_font_size_override("font_size", 12)
	_level_label.add_theme_color_override("font_color", Color(0.9, 0.9, 0.9))
	root.add_child(_level_label)

	_gold_label = Label.new()
	_gold_label.position = Vector2(1280 - ORB_SIZE - 170, ORB_Y + 5)
	_gold_label.size = Vector2(160, 20)
	_gold_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_gold_label.add_theme_font_size_override("font_size", 12)
	_gold_label.add_theme_color_override("font_color", Color(1, 0.85, 0.2))
	root.add_child(_gold_label)

	# ── Buff bar ───────────────────────────────
	_buff_container = HBoxContainer.new()
	_buff_container.position = Vector2(500, 30)
	_buff_container.size = Vector2(280, 24)
	root.add_child(_buff_container)

	# ── Controls hint ──────────────────────────
	var hint := Label.new()
	hint.text = "WASD:Move  1-5:Skills  Q/E/R/F:Potions  I:Inventory  T:Talents  C:Character"
	hint.position = Vector2(ORB_SIZE + 20, 695)
	hint.size = Vector2(300, 12)
	hint.add_theme_font_size_override("font_size", 7)
	hint.add_theme_color_override("font_color", Color(0.3, 0.3, 0.3))
	root.add_child(hint)

func _create_circle_texture(size: int, color: Color) -> ImageTexture:
	var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var center := Vector2(size / 2.0, size / 2.0)
	var radius := size / 2.0 - 1.0
	for py in size:
		for px in size:
			var dist := Vector2(px + 0.5, py + 0.5).distance_to(center)
			if dist <= radius - 0.5:
				img.set_pixel(px, py, color)
			elif dist <= radius + 0.5:
				var alpha := clampf(radius + 0.5 - dist, 0.0, 1.0)
				img.set_pixel(px, py, Color(color.r, color.g, color.b, color.a * alpha))
	return ImageTexture.create_from_image(img)

func _create_ring_texture(size: int, color: Color, thickness: float = 2.0) -> ImageTexture:
	var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var center := Vector2(size / 2.0, size / 2.0)
	var radius := size / 2.0 - 1.0
	for py in size:
		for px in size:
			var dist := Vector2(px + 0.5, py + 0.5).distance_to(center)
			if dist >= radius - thickness and dist <= radius + 0.5:
				var alpha := 1.0
				if dist > radius - 0.5:
					alpha = clampf(radius + 0.5 - dist, 0.0, 1.0)
				if dist < radius - thickness + 1.0:
					alpha *= clampf(dist - (radius - thickness), 0.0, 1.0)
				img.set_pixel(px, py, Color(color.r, color.g, color.b, alpha))
	return ImageTexture.create_from_image(img)

func _build_orb(root: Control, pos: Vector2, bg_color: Color, fill_color: Color, is_hp: bool) -> void:
	var container := Control.new()
	container.position = pos
	container.size = Vector2(ORB_SIZE, ORB_SIZE)
	root.add_child(container)

	# Background circle
	var bg_tex := _create_circle_texture(ORB_SIZE, bg_color)
	var bg := TextureRect.new()
	bg.texture = bg_tex
	bg.size = Vector2(ORB_SIZE, ORB_SIZE)
	container.add_child(bg)

	# Clip container - clips the fill circle to show only bottom portion
	var clip := Control.new()
	clip.clip_contents = true
	clip.position = Vector2(0, ORB_SIZE)
	clip.size = Vector2(ORB_SIZE, 0)
	container.add_child(clip)

	# Fill circle inside clip (offset so it aligns with background)
	var fill_tex := _create_circle_texture(ORB_SIZE, fill_color)
	var fill := TextureRect.new()
	fill.texture = fill_tex
	fill.size = Vector2(ORB_SIZE, ORB_SIZE)
	fill.position = Vector2(0, -ORB_SIZE)
	clip.add_child(fill)

	# Border ring
	var ring_tex := _create_ring_texture(ORB_SIZE, Color(0.45, 0.35, 0.2, 0.9), 2.5)
	var ring := TextureRect.new()
	ring.texture = ring_tex
	ring.size = Vector2(ORB_SIZE, ORB_SIZE)
	container.add_child(ring)

	# Label
	var lbl := Label.new()
	lbl.size = Vector2(ORB_SIZE, ORB_SIZE)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 11)
	lbl.add_theme_color_override("font_color", Color(1, 1, 1))
	lbl.add_theme_color_override("font_outline_color", Color(0, 0, 0))
	lbl.add_theme_constant_override("outline_size", 2)
	container.add_child(lbl)

	if is_hp:
		_hp_orb_clip = clip
		_hp_label = lbl
	else:
		_mp_orb_clip = clip
		_mp_label = lbl

func _update_bars() -> void:
	# HP Orb - adjust clip container to reveal fill from bottom
	var hp_ratio := float(_player.hp) / maxi(_player.max_hp, 1)
	var hp_h: float = ORB_SIZE * hp_ratio
	_hp_orb_clip.position.y = ORB_SIZE - hp_h
	_hp_orb_clip.size.y = hp_h
	if _hp_orb_clip.get_child_count() > 0:
		_hp_orb_clip.get_child(0).position.y = -(ORB_SIZE - hp_h)
	_hp_label.text = "%d / %d" % [_player.hp, _player.max_hp]

	# MP Orb
	var mp_ratio := float(_player.mp) / maxi(_player.max_mp, 1)
	var mp_h: float = ORB_SIZE * mp_ratio
	_mp_orb_clip.position.y = ORB_SIZE - mp_h
	_mp_orb_clip.size.y = mp_h
	if _mp_orb_clip.get_child_count() > 0:
		_mp_orb_clip.get_child(0).position.y = -(ORB_SIZE - mp_h)
	_mp_label.text = "%d / %d" % [_player.mp, _player.max_mp]

	# XP
	var xp_needed := _player.xp_to_next_level()
	var xp_ratio := float(_player.xp) / maxi(xp_needed, 1)
	_xp_fill.size.x = (1280.0 - ORB_SIZE * 2.0 - 40.0) * xp_ratio
	_xp_label.text = "Level %d  -  XP: %d / %d" % [_player.level, _player.xp, xp_needed]

	# Level + Gold
	_level_label.text = "Lv.%d %s" % [_player.level, _player.class_id.capitalize()]
	_gold_label.text = "%d Gold" % _player.gold

func _update_hotbar() -> void:
	for i in 5:
		if i < _player.hotbar.size():
			var skill_id: String = _player.hotbar[i]
			if skill_id.is_empty():
				_hotbar_labels[i].text = ""
			else:
				_hotbar_labels[i].text = skill_id.substr(0, 5)
				if _player.skill_cooldowns.has(skill_id) and _player.skill_cooldowns[skill_id] > 0:
					_hotbar_labels[i].add_theme_color_override("font_color", Color(0.5, 0.3, 0.3))
				else:
					_hotbar_labels[i].add_theme_color_override("font_color", Color(0.9, 0.9, 0.9))

func _update_potions() -> void:
	for i in 4:
		if i < _player.potion_belt.size() and _player.potion_belt[i] != null:
			var pot = _player.potion_belt[i]
			var sb: StyleBoxFlat = _potion_slots[i].get_theme_stylebox("panel")
			match pot.get("subtype", ""):
				"health": sb.bg_color = Color(0.35, 0.05, 0.05)
				"mana": sb.bg_color = Color(0.05, 0.05, 0.35)
				"rejuv": sb.bg_color = Color(0.25, 0.05, 0.25)
		else:
			var sb: StyleBoxFlat = _potion_slots[i].get_theme_stylebox("panel")
			sb.bg_color = Color(0.08, 0.06, 0.04)

# ── Floating combat text ────────────────────────────────────────
func _on_floating_text(text: String, world_pos: Vector2, color: Color) -> void:
	var lbl := Label.new()
	lbl.text = text
	var is_crit := "!" in text
	lbl.add_theme_font_size_override("font_size", 16 if is_crit else 11)
	lbl.add_theme_color_override("font_color", color)
	if is_crit:
		lbl.add_theme_color_override("font_outline_color", Color(0, 0, 0))
		lbl.add_theme_constant_override("outline_size", 2)
	lbl.z_index = 100
	var cam := get_viewport().get_camera_2d()
	if cam:
		var screen_pos := world_pos - cam.get_screen_center_position() + get_viewport().get_visible_rect().size / 2.0
		lbl.position = screen_pos + Vector2(randf_range(-15, 15), -20)
	else:
		lbl.position = Vector2(640, 360)
	add_child(lbl)
	_floating_texts.append({"label": lbl, "life": 1.5, "vy": -50.0})

func _update_floating_texts(delta: float) -> void:
	var i := _floating_texts.size() - 1
	while i >= 0:
		var ft: Dictionary = _floating_texts[i]
		ft["life"] -= delta
		if ft["life"] <= 0:
			ft["label"].queue_free()
			_floating_texts.remove_at(i)
		else:
			ft["label"].position.y += ft["vy"] * delta
			ft["label"].modulate.a = clampf(ft["life"] / 0.5, 0.0, 1.0)
		i -= 1

func _on_level_up(new_level: int) -> void:
	_on_floating_text("LEVEL UP! (%d)" % new_level, _player.global_position if _player else Vector2(640, 300), Color(1, 1, 0.3))

func _on_zone_entered(zone: int) -> void:
	var zone_names := {0: "Town", 1: "Dark Forest", 2: "Cursed Catacombs", 3: "Infernal Depths", 4: "Shadow Realm", 5: "Boss Arena"}
	_zone_label.text = zone_names.get(zone, "Zone %d" % zone)

# ── Visual attack effects ──────────────────────────────────────
func _on_skill_used(skill_id: String, from_pos: Vector2, to_pos: Vector2) -> void:
	# Show a quick visual slash/effect at the skill target
	var cam := get_viewport().get_camera_2d()
	if not cam:
		return
	var screen_from := from_pos - cam.get_screen_center_position() + get_viewport().get_visible_rect().size / 2.0
	var screen_to := to_pos - cam.get_screen_center_position() + get_viewport().get_visible_rect().size / 2.0

	# Create a temporary visual effect
	var effect := Label.new()
	effect.text = "✦"
	effect.add_theme_font_size_override("font_size", 24)
	effect.add_theme_color_override("font_color", Color(1, 0.8, 0.3, 0.9))
	effect.position = screen_to + Vector2(-8, -12)
	effect.z_index = 90
	add_child(effect)
	_floating_texts.append({"label": effect, "life": 0.4, "vy": -20.0})
