class_name PlayerEntity
extends CharacterBody2D
## Player entity - Port of src/entities/player.js
## Handles: movement, stats, equipment, skills, combat, inventory

# ── Constants ────────────────────────────────────────────────────
const TILE_SIZE := 16
const BASE_MOVE_SPEED := 100.0
const BASE_HP := 50
const HP_PER_VIT := 8
const HP_PER_LEVEL := 5
const BASE_MP := 30
const MP_PER_INT := 5
const MP_PER_LEVEL := 3
const BASE_CRIT := 5.0
const BASE_CRIT_MULTI := 150.0
const XP_BASE := 80.0
const XP_GROWTH := 1.18
const ATTACK_RANGE := 30.0
const AGGRO_CLICK_RANGE := 200.0
const HP_REGEN_RATE := 0.5
const MP_REGEN_RATE := 1.0
const INVENTORY_COLS := 8
const INVENTORY_ROWS := 5

# ── State ────────────────────────────────────────────────────────
var class_id := "warrior"
var class_data := {}
var level := 1
var xp := 0
var gold := 0

# Stats
var base_stats := {"str": 5, "dex": 5, "vit": 5, "int": 5}
var hp := 100
var mp := 50
var max_hp := 100
var max_mp := 50
var armor := 0
var resists := {"physical": 0, "fire": 0, "cold": 0, "lightning": 0, "poison": 0, "shadow": 0}
var min_dmg := 2
var max_dmg := 5
var crit_chance := BASE_CRIT
var crit_multi := BASE_CRIT_MULTI
var life_steal := 0.0
var move_speed_pct := 0.0
var attack_speed_pct := 0.0
var magic_find := 0.0
var gold_find := 0.0

# Equipment: slot_name -> item_data or null
var equipment := {
	"head": null, "chest": null, "gloves": null, "boots": null,
	"mainhand": null, "offhand": null, "ring1": null, "ring2": null,
	"belt": null, "amulet": null,
}
# Inventory: flat array
var inventory: Array = []
var potion_belt: Array = [null, null, null, null]
var stash: Array = []
var hotbar: Array = ["", "", "", "", ""]

# Talent points
var talent_points_spent := {}
var unspent_points := 0

# Combat state
var attack_target = null
var attack_cooldown := 0.0
var base_attack_cd := 1.0
var skill_cooldowns := {}

# Movement
var move_path: Array[Vector2] = []
var direction := 0  # 0=down, 1=left, 2=right, 3=up
var anim_state := "idle"
var anim_frame := 0
var anim_timer := 0.0

# Status effects
var status_effects := {}  # {name: {duration, value}}
var buffs := {}  # {name: {duration, value, ...}}

# Minions
var minions: Array = []
const MAX_MINIONS := 5

# Regen timer
var _regen_timer := 0.0
var _sprite: Sprite2D
var _collision: CollisionShape2D
var _camera: Camera2D
var _light: PointLight2D

# ── Setup ─────────────────────────────────────────────────────────
func _ready() -> void:
	add_to_group("player")
	z_index = 10

	# Sprite
	_sprite = Sprite2D.new()
	_sprite.name = "Sprite"
	add_child(_sprite)

	# Collision
	_collision = CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 4.0
	_collision.shape = shape
	_collision.name = "Collision"
	add_child(_collision)

	# Camera
	_camera = Camera2D.new()
	_camera.name = "Camera"
	_camera.zoom = Vector2(3.5, 3.5)
	_camera.position_smoothing_enabled = true
	_camera.position_smoothing_speed = 8.0
	add_child(_camera)

	# Darkness / Light
	_light = PointLight2D.new()
	_light.name = "Light"
	_light.energy = 1.0
	_light.texture = _create_light_texture()
	_light.texture_scale = 4.0
	_light.shadow_enabled = false
	add_child(_light)

	collision_layer = 1
	collision_mask = 2  # Collide with walls only

func initialize(p_class_id: String, p_class_data: Dictionary) -> void:
	class_id = p_class_id
	class_data = p_class_data
	base_stats = p_class_data.get("stats", {"str": 5, "dex": 5, "vit": 5, "int": 5}).duplicate()
	level = 1; xp = 0; gold = 100
	talent_points_spent.clear()
	unspent_points = 1
	hotbar = ["", "", "", "", ""]
	inventory.clear()
	equipment = {"head": null, "chest": null, "gloves": null, "boots": null, "mainhand": null, "offhand": null, "ring1": null, "ring2": null, "belt": null, "amulet": null}
	potion_belt = [null, null, null, null]
	stash.clear()

	# Give starting potions
	for i in 4:
		potion_belt[i] = {"id": "health_potion", "name": "Health Potion", "type": "potion", "subtype": "health", "heal": 50, "icon": "item_potion_hp"}

	# Load sprite with proper scaling
	_load_spritesheet()

	recalculate_stats()
	hp = max_hp
	mp = max_mp

# ── Sprite Loading ───────────────────────────────────────────────
func _load_spritesheet() -> void:
	var tex_path := "res://assets/class_%s.png" % class_id
	if ResourceLoader.exists(tex_path):
		var texture = load(tex_path)
		if texture == null:
			push_warning("Failed to load class texture: %s" % tex_path)
			return
		_sprite.texture = texture

		# Detect grid layout from image dimensions (64x64 frames)
		var frame_w := 64
		var frame_h := 64
		var cols: int = maxi(1, texture.get_width() / frame_w)
		var rows: int = maxi(1, texture.get_height() / frame_h)
		_sprite.hframes = cols
		_sprite.vframes = rows

		# Start at idle facing down (row 4, frame 0)
		var idle_row := mini(4, rows - 1)
		_sprite.frame = idle_row * cols

		# Scale sprite so character is ~1.5 tiles tall
		var target_height := float(TILE_SIZE) * 1.5
		var scale_factor: float = target_height / float(frame_h)
		_sprite.scale = Vector2(scale_factor, scale_factor)

		# Offset sprite so feet are at origin
		_sprite.position = Vector2(0, -float(frame_h) * scale_factor * 0.3)
	else:
		push_warning("Class texture not found: %s" % tex_path)

# ── Process ─────────────────────────────────────────────────────
func _physics_process(delta: float) -> void:
	_process_status_effects(delta)
	_process_regen(delta)
	_process_cooldowns(delta)
	_process_buffs(delta)
	_process_movement(delta)
	_process_combat(delta)
	_process_animation(delta)

# ── Movement ─────────────────────────────────────────────────────
func _process_movement(delta: float) -> void:
	if _is_stunned():
		velocity = Vector2.ZERO
		move_and_slide()
		return

	var speed := BASE_MOVE_SPEED * (1.0 + move_speed_pct / 100.0)
	if status_effects.has("chill"):
		speed *= (1.0 - status_effects["chill"].get("value", 30.0) / 100.0)

	var input_dir := Vector2.ZERO
	if Input.is_action_pressed("move_up"): input_dir.y -= 1
	if Input.is_action_pressed("move_down"): input_dir.y += 1
	if Input.is_action_pressed("move_left"): input_dir.x -= 1
	if Input.is_action_pressed("move_right"): input_dir.x += 1

	if input_dir != Vector2.ZERO:
		move_path.clear()
		velocity = input_dir.normalized() * speed
		_update_direction(velocity)
		anim_state = "walk"
	elif move_path.size() > 0:
		var target_pos := move_path[0]
		var diff := target_pos - global_position
		if diff.length() < 4.0:
			move_path.remove_at(0)
			if move_path.is_empty():
				velocity = Vector2.ZERO
				anim_state = "idle"
		else:
			velocity = diff.normalized() * speed
			_update_direction(velocity)
			anim_state = "walk"
	else:
		velocity = Vector2.ZERO
		if attack_target == null:
			anim_state = "idle"

	move_and_slide()

func _update_direction(vel: Vector2) -> void:
	if abs(vel.x) > abs(vel.y):
		direction = 1 if vel.x < 0 else 2
	else:
		direction = 3 if vel.y < 0 else 0

func move_to(world_pos: Vector2) -> void:
	# Get path from A* grid
	var game_world = get_tree().get_first_node_in_group("game_world")
	if game_world and game_world.has_method("find_path"):
		move_path = game_world.find_path(global_position, world_pos)
	else:
		move_path = [world_pos]
	attack_target = null

# ── Combat ───────────────────────────────────────────────────────
func _process_combat(delta: float) -> void:
	if attack_cooldown > 0:
		attack_cooldown -= delta

	if attack_target != null:
		if not is_instance_valid(attack_target) or (attack_target.has_method("is_dead") and attack_target.is_dead()):
			attack_target = null
			anim_state = "idle"
			return
		var dist := global_position.distance_to(attack_target.global_position)
		if dist > ATTACK_RANGE:
			var dir: Vector2 = (attack_target.global_position - global_position).normalized()
			var speed := BASE_MOVE_SPEED * (1.0 + move_speed_pct / 100.0)
			velocity = dir * speed
			_update_direction(velocity)
			anim_state = "walk"
			move_and_slide()
		elif attack_cooldown <= 0:
			_do_attack()

func _do_attack() -> void:
	if not is_instance_valid(attack_target):
		return
	anim_state = "attack"
	anim_timer = 0.0
	var cd := base_attack_cd / (1.0 + attack_speed_pct / 100.0)
	attack_cooldown = cd

	var atk_stats := get_combat_stats()
	var def_stats: Dictionary = attack_target.get_combat_stats() if attack_target.has_method("get_combat_stats") else {}
	var result := Combat.calculate_damage(atk_stats, def_stats)
	result["source"] = self
	Combat.apply_damage(self, attack_target, result)
	AudioManager.play_hit(result.get("is_crit", false))

func set_attack_target(target) -> void:
	attack_target = target
	move_path.clear()

# ── Skills ───────────────────────────────────────────────────────
func use_skill(slot: int) -> void:
	if slot < 0 or slot >= hotbar.size():
		return
	var skill_id: String = hotbar[slot]
	if skill_id.is_empty():
		return
	if skill_cooldowns.has(skill_id) and skill_cooldowns[skill_id] > 0:
		return

	var skill := _get_skill_data(skill_id)
	if skill.is_empty():
		return

	var mana_cost := int(skill.get("mana", 0))
	if mp < mana_cost:
		EventBus.floating_text.emit("No Mana", global_position, Color(0.3, 0.5, 1.0))
		return

	mp -= mana_cost
	var cd := float(skill.get("cd", 0))
	if cd > 0:
		skill_cooldowns[skill_id] = cd
		EventBus.skill_cooldown_started.emit(skill_id, cd)

	_execute_skill(skill)
	anim_state = "cast"
	anim_timer = 0.0
	EventBus.skill_used.emit(skill_id, global_position, get_global_mouse_position())

func _execute_skill(skill: Dictionary) -> void:
	var dmg_base := float(skill.get("dmg_base", 0))
	var dmg_per := float(skill.get("dmg_per_lvl", 0))
	var eff_level := _get_effective_skill_level(skill.get("id", ""))
	var total_dmg := dmg_base + dmg_per * eff_level
	var dmg_type: String = skill.get("dmg_type", "physical")
	var group: String = skill.get("group", "")
	var mouse_pos := get_global_mouse_position()

	AudioManager.play_cast(dmg_type)

	if group == "melee" or skill.get("type", "") == "active" and dmg_base > 0:
		# Melee skill - hit target or nearby enemies
		if is_instance_valid(attack_target):
			var atk := get_combat_stats()
			var def: Dictionary = attack_target.get_combat_stats() if attack_target.has_method("get_combat_stats") else {}
			var skill_info := {"dmg_base": dmg_base, "dmg_per_lvl": dmg_per, "effective_level": eff_level, "dmg_type": dmg_type, "synergy_bonus": _get_synergy_bonus(skill)}
			var result := Combat.calculate_damage(atk, def, skill_info)
			result["source"] = self
			Combat.apply_damage(self, attack_target, result)
		elif total_dmg > 0:
			# AoE around player
			_aoe_damage(global_position, 60.0, total_dmg, dmg_type, skill)

	if skill.get("projectile", false) or group == "projectile":
		_spawn_projectile(skill, mouse_pos)

func _aoe_damage(center: Vector2, radius: float, base_dmg: float, dmg_type: String, skill: Dictionary) -> void:
	var enemies := get_tree().get_nodes_in_group("enemies")
	for e in enemies:
		if is_instance_valid(e) and e.global_position.distance_to(center) <= radius:
			if e.has_method("is_dead") and e.is_dead():
				continue
			var atk := get_combat_stats()
			var def: Dictionary = e.get_combat_stats() if e.has_method("get_combat_stats") else {}
			var skill_info := {"dmg_base": skill.get("dmg_base", 0), "dmg_per_lvl": skill.get("dmg_per_lvl", 0), "effective_level": _get_effective_skill_level(skill.get("id", "")), "dmg_type": dmg_type, "synergy_bonus": _get_synergy_bonus(skill)}
			var result := Combat.calculate_damage(atk, def, skill_info)
			result["source"] = self
			Combat.apply_damage(self, e, result)

func _spawn_projectile(skill: Dictionary, target_pos: Vector2) -> void:
	var game_world = get_tree().get_first_node_in_group("game_world")
	if game_world and game_world.has_method("spawn_projectile"):
		var dir := (target_pos - global_position).normalized()
		var eff_lvl := _get_effective_skill_level(skill.get("id", ""))
		var dmg := float(skill.get("dmg_base", 0)) + float(skill.get("dmg_per_lvl", 0)) * eff_lvl
		game_world.spawn_projectile(global_position, dir, dmg, skill.get("dmg_type", "fire"), self, skill)

func _get_skill_data(skill_id: String) -> Dictionary:
	if class_data.is_empty():
		return {}
	var trees: Array = class_data.get("trees", [])
	for tree in trees:
		var nodes: Array = tree.get("nodes", [])
		for node in nodes:
			if node.get("id", "") == skill_id:
				return node
	return {}

func _get_effective_skill_level(skill_id: String) -> int:
	var base_pts: int = talent_points_spent.get(skill_id, 0)
	# Add item bonuses (gear with +skill)
	var item_bonus := 0
	for slot in equipment:
		var item = equipment[slot]
		if item != null:
			var affixes: Array = item.get("affixes", [])
			for affix in affixes:
				if affix.get("bonus_skill", "") == skill_id:
					item_bonus += int(affix.get("value", 0))
				if affix.get("id", "") == "all_skills":
					item_bonus += int(affix.get("value", 0))
	return base_pts + item_bonus

func _get_synergy_bonus(skill: Dictionary) -> float:
	var synergies: Array = skill.get("synergies", [])
	var bonus := 0.0
	for syn in synergies:
		var from_id: String = syn.get("from", "")
		var pct_per_pt := float(syn.get("pctPerPt", 0))
		var pts: int = talent_points_spent.get(from_id, 0)
		bonus += (pct_per_pt / 100.0) * pts
	return bonus

func _process_cooldowns(delta: float) -> void:
	var to_remove: Array = []
	for sk_id in skill_cooldowns:
		skill_cooldowns[sk_id] -= delta
		if skill_cooldowns[sk_id] <= 0:
			to_remove.append(sk_id)
	for sk_id in to_remove:
		skill_cooldowns.erase(sk_id)

# ── Stats ────────────────────────────────────────────────────────
func recalculate_stats() -> void:
	var str_total: int = base_stats.get("str", 5)
	var dex_total: int = base_stats.get("dex", 5)
	var vit_total: int = base_stats.get("vit", 5)
	var int_total: int = base_stats.get("int", 5)
	var flat_hp := 0
	var flat_mp := 0
	var pct_armor := 0.0
	armor = 0; life_steal = 0.0; crit_chance = BASE_CRIT; crit_multi = BASE_CRIT_MULTI
	move_speed_pct = 0.0; attack_speed_pct = 0.0; magic_find = 0.0; gold_find = 0.0
	min_dmg = 2; max_dmg = 5
	for r in resists: resists[r] = 0

	# Gear bonuses
	for slot_key in equipment:
		var item = equipment[slot_key]
		if item == null: continue
		armor += int(item.get("armor", 0))
		if item.has("min_dmg"): min_dmg = int(item["min_dmg"])
		if item.has("max_dmg"): max_dmg = int(item["max_dmg"])
		var gear_affixes: Array = item.get("affixes", [])
		for af in gear_affixes:
			var stat_id: String = af.get("stat", af.get("id", ""))
			var val = af.get("value", 0)
			match stat_id:
				"str": str_total += int(val)
				"dex": dex_total += int(val)
				"vit": vit_total += int(val)
				"int": int_total += int(val)
				"flat_hp": flat_hp += int(val)
				"flat_mp": flat_mp += int(val)
				"armor": armor += int(val)
				"pct_armor": pct_armor += float(val)
				"life_steal": life_steal += float(val)
				"crit_chance": crit_chance += float(val)
				"crit_multi": crit_multi += float(val)
				"move_speed": move_speed_pct += float(val)
				"attack_speed": attack_speed_pct += float(val)
				"magic_find": magic_find += float(val)
				"gold_find": gold_find += float(val)
				"min_dmg": min_dmg += int(val)
				"max_dmg": max_dmg += int(val)
				"resist_fire": resists["fire"] += int(val)
				"resist_cold": resists["cold"] += int(val)
				"resist_lightning": resists["lightning"] += int(val)
				"resist_poison": resists["poison"] += int(val)
				"resist_all":
					for rk in resists: resists[rk] += int(val)

	# Charm bonuses from inventory
	for inv_item in inventory:
		if inv_item != null and inv_item.get("type", "") == "charm":
			var charm_affixes: Array = inv_item.get("affixes", [])
			for af in charm_affixes:
				if af.has("stat") and af.has("value"):
					match af["stat"]:
						"str": str_total += int(af["value"])
						"dex": dex_total += int(af["value"])
						"vit": vit_total += int(af["value"])
						"int": int_total += int(af["value"])

	# Passive talent bonuses
	_apply_passive_bonuses()

	# Apply armor percentage
	armor = int(armor * (1.0 + pct_armor / 100.0))

	# Calculate derived stats
	max_hp = BASE_HP + vit_total * HP_PER_VIT + level * HP_PER_LEVEL + flat_hp
	max_mp = BASE_MP + int_total * MP_PER_INT + level * MP_PER_LEVEL + flat_mp

	# Buff: Battle Orders
	if buffs.has("battle_orders"):
		var bo_pct: float = buffs["battle_orders"].get("value", 0.0)
		max_hp = int(max_hp * (1.0 + bo_pct / 100.0))
		max_mp = int(max_mp * (1.0 + bo_pct / 100.0))

	hp = mini(hp, max_hp)
	mp = mini(mp, max_mp)
	if max_dmg < min_dmg: max_dmg = min_dmg + 1

	EventBus.stat_changed.emit()


func _apply_passive_bonuses() -> void:
	# Apply passive talent bonuses
	for skill_id in talent_points_spent:
		var skill := _get_skill_data(skill_id)
		if skill.get("type", "") == "passive":
			var pts: int = talent_points_spent[skill_id]
			match skill_id:
				"combat_mastery":
					crit_chance += pts * 2.0
				"iron_skin":
					armor = int(armor * (1.0 + pts * 8.0 / 100.0))
				"block_mastery":
					pass  # Block handled separately
				"life_tap":
					life_steal += pts * 0.5

func get_combat_stats() -> Dictionary:
	return {
		"min_dmg": min_dmg, "max_dmg": max_dmg,
		"level": level, "armor": armor,
		"crit_chance": crit_chance, "crit_multi": crit_multi,
		"life_steal": life_steal,
		"pct_physical": 0, "pct_fire": 0, "pct_cold": 0,
		"pct_lightning": 0, "pct_poison": 0, "pct_shadow": 0,
		"flat_min_dmg": 0,
		"resist_physical": resists.get("physical", 0),
		"resist_fire": resists.get("fire", 0),
		"resist_cold": resists.get("cold", 0),
		"resist_lightning": resists.get("lightning", 0),
		"resist_poison": resists.get("poison", 0),
		"resist_shadow": resists.get("shadow", 0),
	}

func get_max_hp() -> int: return max_hp

# ── Damage / Heal ────────────────────────────────────────────────
func take_damage(amount: int, info: Dictionary = {}) -> void:
	hp -= amount
	AudioManager.play_player_hit()
	if hp <= 0:
		hp = 0
		_die()

func heal(amount: int) -> void:
	hp = mini(hp + amount, max_hp)
	EventBus.floating_text.emit("+%d" % amount, global_position, Color(0.2, 1.0, 0.2))

func restore_mana(amount: int) -> void:
	mp = mini(mp + amount, max_mp)
	EventBus.floating_text.emit("+%d MP" % amount, global_position, Color(0.3, 0.5, 1.0))

func is_dead() -> bool:
	return hp <= 0

func _die() -> void:
	AudioManager.play_death()
	EventBus.player_died.emit()
	EventBus.game_over.emit()

# ── Status Effects ───────────────────────────────────────────────
func apply_status_effect(status: String, duration: float, value: float = 0.0) -> void:
	status_effects[status] = {"duration": duration, "value": value}

func apply_knockback(force: Vector2) -> void:
	global_position += force * 0.016

func _process_status_effects(delta: float) -> void:
	var to_remove: Array = []
	for s in status_effects:
		status_effects[s]["duration"] -= delta
		if status_effects[s]["duration"] <= 0:
			to_remove.append(s)
	for s in to_remove:
		status_effects.erase(s)

func _process_buffs(delta: float) -> void:
	var to_remove: Array = []
	for b in buffs:
		buffs[b]["duration"] -= delta
		if buffs[b]["duration"] <= 0:
			to_remove.append(b)
	for b in to_remove:
		buffs.erase(b)
		EventBus.buff_expired.emit(self, b)
		recalculate_stats()

func _is_stunned() -> bool:
	return status_effects.has("stun") or status_effects.has("frozen")

# ── Regen ────────────────────────────────────────────────────────
func _process_regen(delta: float) -> void:
	_regen_timer += delta
	if _regen_timer >= 1.0:
		_regen_timer -= 1.0
		if hp < max_hp and hp > 0:
			hp = mini(hp + int(HP_REGEN_RATE + max_hp * 0.01), max_hp)
		if mp < max_mp:
			mp = mini(mp + int(MP_REGEN_RATE + max_mp * 0.02), max_mp)

# ── XP / Leveling ───────────────────────────────────────────────
func gain_xp(amount: int) -> void:
	xp += amount
	EventBus.xp_gained.emit(amount)
	var needed := xp_to_next_level()
	while xp >= needed and needed > 0:
		xp -= needed
		level += 1
		unspent_points += 1
		recalculate_stats()
		hp = max_hp
		mp = max_mp
		EventBus.player_leveled_up.emit(level)
		AudioManager.play_level_up()
		needed = xp_to_next_level()

func xp_to_next_level() -> int:
	return int(XP_BASE * pow(XP_GROWTH, level))

# ── Inventory ────────────────────────────────────────────────────
func pickup_item(item_data: Dictionary) -> bool:
	if item_data.get("type", "") == "gold":
		var amt := int(item_data.get("amount", 0))
		amt = int(amt * (1.0 + gold_find / 100.0))
		gold += amt
		EventBus.gold_gained.emit(amt)
		AudioManager.play_gold_pickup()
		return true

	if item_data.get("type", "") == "potion":
		for i in potion_belt.size():
			if potion_belt[i] == null:
				potion_belt[i] = item_data
				EventBus.inventory_changed.emit()
				AudioManager.play_loot_pickup()
				return true

	# Find empty inventory slot
	for i in INVENTORY_COLS * INVENTORY_ROWS:
		if i >= inventory.size():
			inventory.resize(INVENTORY_COLS * INVENTORY_ROWS)
		if inventory[i] == null:
			inventory[i] = item_data
			EventBus.inventory_changed.emit()
			AudioManager.play_loot_pickup()
			return true
	return false  # Full

func equip_item(item_data: Dictionary, slot: String) -> void:
	var old = equipment[slot]
	equipment[slot] = item_data
	if old != null:
		pickup_item(old)
	recalculate_stats()
	EventBus.equipment_changed.emit()
	AudioManager.play_equip()

func use_potion(slot: int) -> void:
	if slot < 0 or slot >= potion_belt.size(): return
	var pot = potion_belt[slot]
	if pot == null: return
	match pot.get("subtype", ""):
		"health":
			heal(int(pot.get("heal", 50)))
		"mana":
			restore_mana(int(pot.get("restore", 40)))
		"rejuv":
			heal(int(pot.get("heal", 35)))
			restore_mana(int(pot.get("restore", 35)))
	potion_belt[slot] = null
	EventBus.inventory_changed.emit()
	AudioManager.play_potion()

# ── Talent Points ────────────────────────────────────────────────
func spend_talent_point(skill_id: String) -> bool:
	if unspent_points <= 0:
		return false
	var skill := _get_skill_data(skill_id)
	if skill.is_empty():
		return false
	var current: int = talent_points_spent.get(skill_id, 0)
	if current >= int(skill.get("maxPts", 20)):
		return false
	# Check requirement
	var req: String = skill.get("req", "")
	if not req.is_empty():
		var parts := req.split(":")
		if parts.size() == 2:
			var req_skill := parts[0]
			var req_pts := int(parts[1])
			if talent_points_spent.get(req_skill, 0) < req_pts:
				return false
	talent_points_spent[skill_id] = current + 1
	unspent_points -= 1
	recalculate_stats()
	return true

func reset_talents() -> void:
	if gold < 500: return
	gold -= 500
	unspent_points += _total_spent_points()
	talent_points_spent.clear()
	hotbar = ["", "", "", "", ""]
	recalculate_stats()

func _total_spent_points() -> int:
	var total := 0
	for sk in talent_points_spent:
		total += talent_points_spent[sk]
	return total

# ── Animation ────────────────────────────────────────────────────
func _process_animation(delta: float) -> void:
	anim_timer += delta
	var anim_speed := 0.15
	if anim_state == "attack": anim_speed = 0.1
	if anim_state == "cast": anim_speed = 0.12
	if anim_timer >= anim_speed:
		anim_timer -= anim_speed
		anim_frame = (anim_frame + 1) % 4
	# Map state+direction to spritesheet row
	# Spritesheet row order per group: up, left, down, right (0,1,2,3)
	# Direction values: 0=down, 1=left, 2=right, 3=up
	const DIR_TO_ROW := [2, 1, 3, 0]  # down→2, left→1, right→3, up→0
	var dir_row: int = DIR_TO_ROW[direction]
	var row := 0
	match anim_state:
		"cast": row = dir_row
		"idle": row = 4 + dir_row
		"walk": row = 8 + dir_row
		"attack": row = 12 + dir_row
	if _sprite and _sprite.texture:
		var cols: int = _sprite.hframes
		var max_frame: int = cols * _sprite.vframes
		var target_frame: int = row * cols + anim_frame
		if target_frame < max_frame:
			_sprite.frame = target_frame
	# Return to idle after attack/cast animation
	if (anim_state == "attack" or anim_state == "cast") and anim_frame >= 3:
		anim_state = "idle"

# ── Utilities ────────────────────────────────────────────────────
func _create_light_texture() -> Texture2D:
	var img := Image.create(128, 128, false, Image.FORMAT_RGBA8)
	var center := Vector2(64, 64)
	for y in 128:
		for x in 128:
			var dist := Vector2(x, y).distance_to(center)
			var alpha := clampf(1.0 - dist / 64.0, 0.0, 1.0)
			alpha = alpha * alpha
			img.set_pixel(x, y, Color(1, 1, 1, alpha))
	return ImageTexture.create_from_image(img)

func _unhandled_input(event: InputEvent) -> void:
	# Potion keys
	if event.is_action_pressed("potion_1"): use_potion(0)
	elif event.is_action_pressed("potion_2"): use_potion(1)
	elif event.is_action_pressed("potion_3"): use_potion(2)
	elif event.is_action_pressed("potion_4"): use_potion(3)
	# Skill keys
	elif event.is_action_pressed("skill_1"): use_skill(0)
	elif event.is_action_pressed("skill_2"): use_skill(1)
	elif event.is_action_pressed("skill_3"): use_skill(2)
	elif event.is_action_pressed("skill_4"): use_skill(3)
	elif event.is_action_pressed("skill_5"): use_skill(4)
	# Panel toggles
	elif event.is_action_pressed("toggle_inventory"): EventBus.toggle_panel.emit("inventory")
	elif event.is_action_pressed("toggle_talents"): EventBus.toggle_panel.emit("talents")
	elif event.is_action_pressed("toggle_character"): EventBus.toggle_panel.emit("character")
	elif event.is_action_pressed("toggle_map"): EventBus.toggle_panel.emit("map")
