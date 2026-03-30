class_name ProjectileEntity
extends Area2D
## Projectile entity - Port of src/entities/projectile.js

var direction := Vector2.RIGHT
var speed := 200.0
var damage := 10.0
var dmg_type := "fire"
var source = null
var piercing := false
var bounces := 0
var max_bounces := 0
var lifetime := 3.0
var aoe_radius := 0.0
var skill_data := {}
var _hit_targets: Array = []

var _sprite: Sprite2D
var _trail_timer := 0.0

func _ready() -> void:
	add_to_group("projectiles")
	z_index = 8
	collision_layer = 0
	collision_mask = 6  # Walls (2) + Enemies (4)

	# Collision shape
	var coll := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 4.0
	coll.shape = shape
	add_child(coll)

	# Visual
	_sprite = Sprite2D.new()
	add_child(_sprite)
	_draw_projectile()

	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)

func initialize(pos: Vector2, dir: Vector2, dmg: float, type: String, src, p_skill: Dictionary = {}) -> void:
	global_position = pos
	direction = dir.normalized()
	damage = dmg
	dmg_type = type
	source = src
	skill_data = p_skill
	speed = float(p_skill.get("proj_speed", 200))
	piercing = p_skill.get("piercing", false)
	max_bounces = int(p_skill.get("bounces", 0))
	aoe_radius = float(p_skill.get("aoe_radius", 0))
	rotation = direction.angle()

func _physics_process(delta: float) -> void:
	lifetime -= delta
	if lifetime <= 0:
		if aoe_radius > 0:
			_explode()
		queue_free()
		return

	global_position += direction * speed * delta
	_trail_timer += delta

	# Check bounds
	if global_position.x < 0 or global_position.x > 1280 or global_position.y < 0 or global_position.y > 960:
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	# Wall collision
	if body.collision_layer & 2:
		if aoe_radius > 0:
			_explode()
		queue_free()
		return

	# Enemy collision
	if body is EnemyEntity and body != source:
		if body in _hit_targets:
			return
		_hit_targets.append(body)
		_deal_damage(body)
		if not piercing:
			if bounces < max_bounces:
				bounces += 1
				_bounce(body)
			else:
				if aoe_radius > 0:
					_explode()
				queue_free()

func _on_area_entered(_area: Area2D) -> void:
	pass

func _deal_damage(target) -> void:
	if not is_instance_valid(target) or not is_instance_valid(source):
		return
	var atk: Dictionary = source.get_combat_stats() if source.has_method("get_combat_stats") else {}
	var def: Dictionary = target.get_combat_stats() if target.has_method("get_combat_stats") else {}
	var sk := {"dmg_base": damage, "dmg_per_lvl": 0, "effective_level": 0, "dmg_type": dmg_type, "synergy_bonus": 0.0}
	var result := Combat.calculate_damage(atk, def, sk)
	result["source"] = source
	Combat.apply_damage(source, target, result)
	Combat.apply_elemental_status(source, target, dmg_type, result["damage"])

func _bounce(last_hit) -> void:
	var nearest = null
	var nearest_dist := 200.0
	for e in get_tree().get_nodes_in_group("enemies"):
		if e == last_hit or e in _hit_targets:
			continue
		if not is_instance_valid(e) or e.is_dead():
			continue
		var d := global_position.distance_to(e.global_position)
		if d < nearest_dist:
			nearest_dist = d
			nearest = e
	if nearest:
		direction = (nearest.global_position - global_position).normalized()
		rotation = direction.angle()
	else:
		queue_free()

func _explode() -> void:
	var enemies := get_tree().get_nodes_in_group("enemies")
	for e in enemies:
		if not is_instance_valid(e) or e.is_dead():
			continue
		if e.global_position.distance_to(global_position) <= aoe_radius:
			_deal_damage(e)

func _draw_projectile() -> void:
	var img := Image.create(8, 8, false, Image.FORMAT_RGBA8)
	var color: Color
	match dmg_type:
		"fire": color = Color(1, 0.4, 0.1)
		"cold": color = Color(0.3, 0.7, 1.0)
		"lightning": color = Color(1, 1, 0.3)
		"poison": color = Color(0.3, 1, 0.3)
		"shadow": color = Color(0.6, 0.2, 0.8)
		"holy": color = Color(1, 1, 0.7)
		_: color = Color(0.8, 0.8, 0.8)
	for y in 8:
		for x in 8:
			var dist := Vector2(x, y).distance_to(Vector2(4, 4))
			if dist < 3.5:
				var alpha := 1.0 - dist / 3.5
				img.set_pixel(x, y, Color(color.r, color.g, color.b, alpha))
	_sprite.texture = ImageTexture.create_from_image(img)
