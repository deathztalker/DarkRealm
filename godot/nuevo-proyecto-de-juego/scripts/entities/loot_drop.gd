class_name LootDrop
extends Area2D
## Loot drop on ground - picks up on player contact

var item_data := {}
var _label: Label
var _glow: Sprite2D
var _bob_timer := 0.0
var _initial_y := 0.0
var _pickup_range := 20.0

func _ready() -> void:
	add_to_group("loot_drops")
	z_index = 4
	collision_layer = 8
	collision_mask = 1  # Player

	var coll := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = _pickup_range
	coll.shape = shape
	add_child(coll)

	_label = Label.new()
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.position = Vector2(-40, -16)
	_label.size = Vector2(80, 20)
	_label.add_theme_font_size_override("font_size", 8)
	add_child(_label)

	_glow = Sprite2D.new()
	add_child(_glow)

	body_entered.connect(_on_body_entered)

func initialize(data: Dictionary) -> void:
	item_data = data
	# Capture position AFTER global_position has been set by the spawner
	_initial_y = global_position.y
	_update_display()

func _physics_process(delta: float) -> void:
	_bob_timer += delta
	global_position.y = _initial_y + sin(_bob_timer * 3.0) * 2.0

func _update_display() -> void:
	if not _label: return
	var rarity: String = item_data.get("rarity", "normal")
	var item_name: String = item_data.get("name", "Item")
	var item_type: String = item_data.get("type", "")

	if item_type == "gold":
		_label.text = "%d Gold" % item_data.get("amount", 0)
		_label.add_theme_color_override("font_color", Color(1, 0.85, 0.2))
		_draw_icon(Color(1, 0.85, 0.2))
		return

	_label.text = item_name
	var color: Color
	match rarity:
		"normal": color = Color(0.7, 0.7, 0.7)
		"magic": color = Color(0.3, 0.5, 1.0)
		"rare": color = Color(1, 1, 0.3)
		"set": color = Color(0.2, 0.9, 0.2)
		"unique": color = Color(0.8, 0.6, 0.2)
		_: color = Color(0.7, 0.7, 0.7)
	_label.add_theme_color_override("font_color", color)
	_draw_icon(color)

func _draw_icon(color: Color) -> void:
	# Try to load actual item icon
	var icon_name: String = item_data.get("icon", "")
	if not icon_name.is_empty():
		var tex_path := "res://assets/%s.png" % icon_name
		if ResourceLoader.exists(tex_path):
			var tex: Texture2D = load(tex_path)
			if tex != null:
				_glow.texture = tex
				var tex_h := float(tex.get_height())
				var icon_scale: float = 14.0 / maxf(tex_h, 1.0)
				_glow.scale = Vector2(icon_scale, icon_scale)
				_glow.position.y = -4
				return

	# Fallback: colored square with type letter
	var sz := 10
	var img := Image.create(sz, sz, false, Image.FORMAT_RGBA8)
	for y in sz:
		for x in sz:
			var is_border: bool = x == 0 or x == sz - 1 or y == 0 or y == sz - 1
			if is_border:
				img.set_pixel(x, y, Color(color.r * 0.6, color.g * 0.6, color.b * 0.6, 0.9))
			else:
				img.set_pixel(x, y, Color(color.r * 0.3, color.g * 0.3, color.b * 0.3, 0.8))
	_glow.texture = ImageTexture.create_from_image(img)

func _on_body_entered(body: Node2D) -> void:
	if body is PlayerEntity:
		if body.pickup_item(item_data):
			EventBus.item_picked_up.emit(item_data)
			queue_free()
