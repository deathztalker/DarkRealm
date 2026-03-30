class_name EnemyEntity
extends CharacterBody2D
## Enemy entity with AI - Port of src/entities/enemy.js

const TILE_SIZE := 16
const AGGRO_RANGE := 150.0
const ATTACK_RANGE := 25.0
const PATROL_RANGE := 60.0
const BASE_ATTACK_CD := 1.2

# ── Tier multipliers ─────────────────────────────────────────────
const TIER_DATA := {
	"normal": {"hp_mult": 1.0, "dmg_mult": 1.0, "xp_mult": 1.0, "affix_count": 0},
	"elite": {"hp_mult": 2.0, "dmg_mult": 1.4, "xp_mult": 2.5, "affix_count": 2},
	"rare": {"hp_mult": 3.5, "dmg_mult": 1.8, "xp_mult": 4.0, "affix_count": 3},
	"unique": {"hp_mult": 4.0, "dmg_mult": 2.0, "xp_mult": 5.0, "affix_count": 3},
	"boss": {"hp_mult": 10.0, "dmg_mult": 3.0, "xp_mult": 15.0, "affix_count": 0},
}

const DIFFICULTY_MULT := {0: 1.0, 1: 2.5, 2: 5.0}

const ELITE_AFFIXES := [
	"champion", "berserker", "spectral", "frozen",
	"electrified", "vampiric", "teleporter", "extra_fast",
]

const BOSS_NAMES := [
	"Diremaw the Fleshweaver", "Kha'thul the Unseen",
	"Bone Lord Varkath", "Infernal Sentinel",
]

# ── Properties ───────────────────────────────────────────────────
var enemy_type := "skeleton"
var enemy_name := "Skeleton"
var tier := "normal"
var enemy_level := 1
var zone := 1
var difficulty := 0

var hp := 50
var max_hp := 50
var base_dmg_min := 3
var base_dmg_max := 8
var armor := 0
var move_speed := 50.0
var xp_reward := 20
var gold_min := 1
var gold_max := 5

var affixes: Array[String] = []
var status_effects := {}
var _dead := false

# AI
enum AIState { IDLE, PATROL, CHASE, ATTACK }
var ai_state := AIState.IDLE
var _ai_timer := 0.0
var _patrol_target := Vector2.ZERO
var _attack_cd := 0.0
var _los_lost_timer := 0.0  # Time since last seeing player
var _player_ref: WeakRef = WeakRef.new()

# Visuals
var _sprite: Sprite2D
var _hp_bar_bg: ColorRect
var _hp_bar: ColorRect
var _name_label: Label

func _ready() -> void:
	add_to_group("enemies")
	z_index = 5

	_sprite = Sprite2D.new()
	_sprite.name = "Sprite"
	add_child(_sprite)

	var coll := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 4.0
	coll.shape = shape
	coll.name = "Collision"
	add_child(coll)

	collision_layer = 4  # Enemy layer
	collision_mask = 2   # Walls only

	_create_hp_bar()

func initialize(data: Dictionary, p_zone: int, p_difficulty: int) -> void:
	enemy_type = data.get("type", "skeleton")
	enemy_name = data.get("name", enemy_type.capitalize())
	tier = data.get("tier", "normal")
	enemy_level = data.get("level", p_zone * 3 + p_difficulty * 10 + randi_range(1, 3))
	zone = p_zone
	difficulty = p_difficulty

	var base_hp := int(data.get("hp", 30 + enemy_level * 8))
	var tier_d: Dictionary = TIER_DATA.get(tier, TIER_DATA["normal"])
	var diff_mult: float = DIFFICULTY_MULT.get(difficulty, 1.0)

	max_hp = int(base_hp * tier_d["hp_mult"] * diff_mult)
	hp = max_hp

	base_dmg_min = int(data.get("dmg_min", 2 + enemy_level * 2) * tier_d["dmg_mult"] * diff_mult)
	base_dmg_max = int(data.get("dmg_max", 5 + enemy_level * 3) * tier_d["dmg_mult"] * diff_mult)
	armor = int(data.get("armor", enemy_level * 2) * diff_mult)
	move_speed = data.get("speed", 50.0)
	xp_reward = int(data.get("xp", 10 + enemy_level * 5) * tier_d["xp_mult"])
	gold_min = 1 + enemy_level
	gold_max = 3 + enemy_level * 2

	# Affixes
	affixes.clear()
	var affix_count: int = tier_d["affix_count"]
	if affix_count > 0:
		var pool := ELITE_AFFIXES.duplicate()
		pool.shuffle()
		for i in mini(affix_count, pool.size()):
			affixes.append(pool[i])
		_apply_affixes()

	# Boss names
	if tier == "boss":
		if randf() < 0.25:
			enemy_name = "The Butcher"
			max_hp = int(max_hp * 1.5)
			hp = max_hp
			base_dmg_min = int(base_dmg_min * 1.3)
			base_dmg_max = int(base_dmg_max * 1.3)
		else:
			enemy_name = BOSS_NAMES[randi() % BOSS_NAMES.size()]

	# Load sprite with proper scaling
	_load_spritesheet()

	# Update name label
	_update_display()

# Map enemy types to actual sprite filenames
const SPRITE_ALIASES := {
	"stone_golem": "golem",
	"void_bat": "bat",
}

func _load_spritesheet() -> void:
	var sprite_name: String = SPRITE_ALIASES.get(enemy_type, enemy_type)
	var tex_path := "res://assets/enemy_%s.png" % sprite_name
	if ResourceLoader.exists(tex_path):
		var texture = load(tex_path)
		if texture == null:
			_create_fallback_sprite()
			return
		_sprite.texture = texture
		_sprite.hframes = 1
		_sprite.vframes = 1
		_sprite.frame = 0

		# Scale to ~1.5 tiles tall
		var tex_height: float = float(texture.get_height())
		var target_height := float(TILE_SIZE) * 1.5
		var scale_factor: float = target_height / tex_height
		_sprite.scale = Vector2(scale_factor, scale_factor)
		_sprite.position = Vector2(0, -tex_height * scale_factor * 0.4)
	else:
		_create_fallback_sprite()

func _create_fallback_sprite() -> void:
	# Red circle fallback so enemy is always visible
	var sz := 16
	var img := Image.create(sz, sz, false, Image.FORMAT_RGBA8)
	var center := Vector2(sz / 2.0, sz / 2.0)
	for py in sz:
		for px in sz:
			if Vector2(px, py).distance_to(center) < sz / 2.0 - 1:
				img.set_pixel(px, py, Color(0.8, 0.2, 0.2, 0.9))
	_sprite.texture = ImageTexture.create_from_image(img)
	_sprite.position = Vector2(0, -8)

func _apply_affixes() -> void:
	for af in affixes:
		match af:
			"champion": max_hp = int(max_hp * 1.3); hp = max_hp
			"berserker": base_dmg_min = int(base_dmg_min * 1.5); base_dmg_max = int(base_dmg_max * 1.5)
			"extra_fast": move_speed *= 1.5
			"vampiric": pass  # Handled in combat
			"frozen": pass    # Handled in combat
			"electrified": pass
			"spectral": armor = int(armor * 0.5)  # Less armor but phases
			"teleporter": pass  # Handled in AI

# ── Process ──────────────────────────────────────────────────────
func _physics_process(delta: float) -> void:
	if _dead: return
	_process_status_effects(delta)
	_process_ai(delta)
	_update_hp_bar()

# ── AI ───────────────────────────────────────────────────────────
func _process_ai(delta: float) -> void:
	if _is_stunned():
		velocity = Vector2.ZERO
		move_and_slide()
		return

	_attack_cd -= delta
	_ai_timer += delta

	var player := _find_player()
	if not player:
		_do_idle(delta)
		return

	var dist := global_position.distance_to(player.global_position)

	match ai_state:
		AIState.IDLE:
			if dist < AGGRO_RANGE and _has_line_of_sight(player):
				ai_state = AIState.CHASE
			elif _ai_timer > 3.0:
				_ai_timer = 0.0
				ai_state = AIState.PATROL
				_patrol_target = global_position + Vector2(randf_range(-PATROL_RANGE, PATROL_RANGE), randf_range(-PATROL_RANGE, PATROL_RANGE))

		AIState.PATROL:
			if dist < AGGRO_RANGE and _has_line_of_sight(player):
				ai_state = AIState.CHASE
			else:
				var to_target := _patrol_target - global_position
				if to_target.length() < 4.0 or _ai_timer > 4.0:
					ai_state = AIState.IDLE
					_ai_timer = 0.0
					velocity = Vector2.ZERO
				else:
					velocity = to_target.normalized() * move_speed * 0.5
					move_and_slide()

		AIState.CHASE:
			if not _has_line_of_sight(player):
				_los_lost_timer += delta
				if _los_lost_timer > 3.0:
					ai_state = AIState.IDLE
					_los_lost_timer = 0.0
					velocity = Vector2.ZERO
					return
			else:
				_los_lost_timer = 0.0
			if dist > AGGRO_RANGE * 2:
				ai_state = AIState.IDLE
				velocity = Vector2.ZERO
			elif dist <= ATTACK_RANGE:
				ai_state = AIState.ATTACK
				velocity = Vector2.ZERO
			else:
				var dir: Vector2 = (player.global_position - global_position).normalized()
				var spd := move_speed
				if status_effects.has("chill"):
					spd *= (1.0 - status_effects["chill"].get("value", 30.0) / 100.0)
				velocity = dir * spd
				move_and_slide()
				# Teleporter affix
				if "teleporter" in affixes and _ai_timer > 3.0 and dist > 80:
					_ai_timer = 0.0
					global_position = player.global_position + Vector2(randf_range(-40, 40), randf_range(-40, 40))

		AIState.ATTACK:
			if not is_instance_valid(player) or player.is_dead():
				ai_state = AIState.IDLE
				return
			if dist > ATTACK_RANGE * 1.5:
				ai_state = AIState.CHASE
			elif _attack_cd <= 0:
				_do_attack(player)

func _do_attack(player) -> void:
	var cd := BASE_ATTACK_CD
	if "extra_fast" in affixes: cd *= 0.7
	_attack_cd = cd

	var atk_stats := get_combat_stats()
	var def_stats: Dictionary = player.get_combat_stats()
	var result := Combat.calculate_damage(atk_stats, def_stats)
	result["source"] = self
	Combat.apply_damage(self, player, result)

	# Affix effects on hit
	if "frozen" in affixes and randf() < 0.15:
		Combat.apply_status(player, "chill", 3.0, 40.0)
	if "electrified" in affixes and randf() < 0.1:
		Combat.apply_status(player, "stun", 0.3)
	if "vampiric" in affixes:
		var heal_amt := int(result["damage"] * 0.15)
		heal(heal_amt)

func _has_line_of_sight(target: Node2D) -> bool:
	var space := get_world_2d().direct_space_state
	if space == null:
		return false
	var query := PhysicsRayQueryParameters2D.create(global_position, target.global_position, 2)  # mask 2 = walls
	query.exclude = [get_rid()]
	var result := space.intersect_ray(query)
	return result.is_empty()  # No wall hit = can see player

func _do_idle(_delta: float) -> void:
	velocity = Vector2.ZERO

func _find_player() -> Node:
	var p: Variant = _player_ref.get_ref()
	if is_instance_valid(p):
		return p
	var players := get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		_player_ref = weakref(players[0])
		return players[0]
	return null

# ── Combat Interface ─────────────────────────────────────────────
func get_combat_stats() -> Dictionary:
	return {
		"min_dmg": base_dmg_min, "max_dmg": base_dmg_max,
		"level": enemy_level, "armor": armor,
		"crit_chance": 5.0, "crit_multi": 150.0,
		"life_steal": 0.0, "flat_min_dmg": 0,
		"resist_physical": 0, "resist_fire": 0, "resist_cold": 0,
		"resist_lightning": 0, "resist_poison": 0, "resist_shadow": 0,
	}

func get_max_hp() -> int: return max_hp
func is_dead() -> bool: return _dead

func take_damage(amount: int, info: Dictionary = {}) -> void:
	if _dead: return
	hp -= amount
	if ai_state == AIState.IDLE or ai_state == AIState.PATROL:
		ai_state = AIState.CHASE
	if hp <= 0:
		hp = 0
		_die()

func heal(amount: int) -> void:
	hp = mini(hp + amount, max_hp)

func apply_status_effect(status: String, duration: float, value: float = 0.0) -> void:
	status_effects[status] = {"duration": duration, "value": value}

func apply_knockback(force: Vector2) -> void:
	if tier == "boss": return  # Bosses immune
	global_position += force * 0.016

func _process_status_effects(delta: float) -> void:
	var to_remove: Array = []
	for s in status_effects:
		status_effects[s]["duration"] -= delta
		if status_effects[s]["duration"] <= 0:
			to_remove.append(s)
	for s in to_remove:
		status_effects.erase(s)

func _is_stunned() -> bool:
	return status_effects.has("stun") or status_effects.has("frozen")

# ── Death ────────────────────────────────────────────────────────
func _die() -> void:
	_dead = true
	AudioManager.play_enemy_death()

	# Give XP to player
	var player := _find_player()
	if is_instance_valid(player) and player.has_method("gain_xp"):
		player.gain_xp(xp_reward)

	# Drop loot
	var drop_data := {
		"enemy_level": enemy_level,
		"tier": tier,
		"position": global_position,
		"gold_min": gold_min,
		"gold_max": gold_max,
	}
	EventBus.enemy_killed.emit(drop_data, global_position)

	# Death visual - fade out
	var tween := create_tween()
	tween.tween_property(_sprite, "modulate:a", 0.0, 0.3)
	tween.tween_callback(queue_free)

# ── HP Bar ───────────────────────────────────────────────────────
func _create_hp_bar() -> void:
	_hp_bar_bg = ColorRect.new()
	_hp_bar_bg.size = Vector2(24, 3)
	_hp_bar_bg.position = Vector2(-12, -20)
	_hp_bar_bg.color = Color(0.2, 0.0, 0.0)
	add_child(_hp_bar_bg)

	_hp_bar = ColorRect.new()
	_hp_bar.size = Vector2(24, 3)
	_hp_bar.position = Vector2(-12, -20)
	add_child(_hp_bar)

	_name_label = Label.new()
	_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_name_label.position = Vector2(-30, -30)
	_name_label.size = Vector2(60, 14)
	_name_label.add_theme_font_size_override("font_size", 8)
	add_child(_name_label)

func _update_display() -> void:
	if _name_label:
		_name_label.text = enemy_name
		match tier:
			"elite": _name_label.add_theme_color_override("font_color", Color(0.3, 0.5, 1.0))
			"rare": _name_label.add_theme_color_override("font_color", Color(1.0, 1.0, 0.3))
			"unique": _name_label.add_theme_color_override("font_color", Color(0.8, 0.6, 0.2))
			"boss":
				_name_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
				_name_label.add_theme_font_size_override("font_size", 10)
			_: _name_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))

func _update_hp_bar() -> void:
	if _hp_bar and max_hp > 0:
		var ratio := float(hp) / max_hp
		_hp_bar.size.x = 24.0 * ratio
		match tier:
			"boss": _hp_bar.color = Color(1.0, 0.2, 0.2)
			"rare", "unique": _hp_bar.color = Color(1.0, 0.8, 0.2)
			"elite": _hp_bar.color = Color(0.3, 0.5, 1.0)
			_: _hp_bar.color = Color(0.8, 0.1, 0.1)
		_hp_bar_bg.visible = ratio < 1.0
		_hp_bar.visible = ratio < 1.0
