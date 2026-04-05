extends Node
## Combat system - damage calculation, status effects, DoTs
## Port of src/systems/combat.js

const MAX_RESISTANCE := 75.0
const MAX_ARMOR_REDUCTION := 0.75
const BASE_CRIT_CHANCE := 5.0
const BASE_CRIT_MULTI := 150.0

# Active DoTs: { target_id: [{ type, dmg_per_tick, ticks_left, timer, source }] }
var _active_dots: Dictionary = {}
var _dot_tick_interval := 1.0

func _process(delta: float) -> void:
	_process_dots(delta)

# ── Main damage calculation ──────────────────────────────────────
func calculate_damage(attacker: Dictionary, defender: Dictionary, skill_data: Dictionary = {}) -> Dictionary:
	var min_d := float(attacker.get("min_dmg", 1))
	var max_d := float(attacker.get("max_dmg", 3))
	var base_dmg := randf_range(min_d, max_d)
	var dmg_type: String = "physical"

	# Skill damage
	if not skill_data.is_empty():
		var slvl := int(skill_data.get("effective_level", 1))
		base_dmg += float(skill_data.get("dmg_base", 0)) + float(skill_data.get("dmg_per_lvl", 0)) * slvl
		dmg_type = skill_data.get("dmg_type", "physical")
		# Synergy bonus
		var syn_bonus := float(skill_data.get("synergy_bonus", 0.0))
		base_dmg *= (1.0 + syn_bonus)

	# Type percentage bonus from attacker
	var type_pct := float(attacker.get("pct_" + dmg_type, 0.0))
	base_dmg *= (1.0 + type_pct / 100.0)

	# Flat min damage bonus
	base_dmg += float(attacker.get("flat_min_dmg", 0))

	# Critical hit
	var is_crit := false
	var crit_chance := float(attacker.get("crit_chance", BASE_CRIT_CHANCE))
	if randf() * 100.0 < crit_chance:
		is_crit = true
		var crit_multi := float(attacker.get("crit_multi", BASE_CRIT_MULTI))
		base_dmg *= (crit_multi / 100.0)

	# Resistance (bypassed by magic and holy)
	if dmg_type != "magic" and dmg_type != "holy":
		var resist := minf(float(defender.get("resist_" + dmg_type, 0.0)), MAX_RESISTANCE)
		base_dmg *= (1.0 - resist / 100.0)

	# Armor reduction (physical only)
	if dmg_type == "physical":
		var armor := float(defender.get("armor", 0))
		var atk_level := float(attacker.get("level", 1))
		var divisor := armor + 5.0 * atk_level * 10.0
		if divisor > 0:
			var reduction := minf(armor / divisor, MAX_ARMOR_REDUCTION)
			base_dmg *= (1.0 - reduction)

	var final_dmg := maxi(1, int(base_dmg))

	return {
		"damage": final_dmg,
		"type": dmg_type,
		"is_crit": is_crit,
		"life_steal_pct": float(attacker.get("life_steal", 0.0)),
	}

# ── Apply damage to a target ────────────────────────────────────
func apply_damage(source, target, damage_info: Dictionary) -> void:
	if not is_instance_valid(target):
		return
	var dmg: int = damage_info.get("damage", 0)
	if target.has_method("take_damage"):
		target.take_damage(dmg, damage_info)

	# Floating text
	var color := Color.WHITE
	if damage_info.get("is_crit", false):
		color = Color.YELLOW
	else:
		match damage_info.get("type", "physical"):
			"fire": color = Color(1, 0.4, 0.1)
			"cold": color = Color(0.3, 0.7, 1.0)
			"lightning": color = Color(1, 1, 0.3)
			"poison": color = Color(0.3, 1, 0.3)
			"shadow": color = Color(0.6, 0.2, 0.8)
			"holy": color = Color(1, 1, 0.7)

	var text := str(dmg)
	if damage_info.get("is_crit", false):
		text += "!"
	if is_instance_valid(target):
		EventBus.floating_text.emit(text, target.global_position, color)

	# Life steal
	var ls_pct: float = damage_info.get("life_steal_pct", 0.0)
	if ls_pct > 0 and is_instance_valid(source) and source.has_method("heal"):
		var heal_amt := int(dmg * ls_pct / 100.0)
		if heal_amt > 0:
			source.heal(heal_amt)

	# Knockback on heavy hits
	if is_instance_valid(target) and is_instance_valid(source):
		if target.has_method("get_max_hp") and target.has_method("apply_knockback"):
			var max_hp: int = target.get_max_hp()
			if max_hp > 0 and dmg > max_hp * 0.1:
				var dir: Vector2 = (target.global_position - source.global_position).normalized()
				target.apply_knockback(dir * 80.0)

	# Emit event
	EventBus.damage_dealt.emit(source, target, damage_info)

# ── Status effects ───────────────────────────────────────────────
func apply_status(target, status: String, duration: float, value: float = 0.0) -> void:
	if not is_instance_valid(target):
		return
	if target.has_method("apply_status_effect"):
		target.apply_status_effect(status, duration, value)
		EventBus.status_applied.emit(target, status, duration)

# ── DoT management ───────────────────────────────────────────────
func apply_dot(source, target, dot_type: String, dmg_per_tick: int, total_ticks: int) -> void:
	if not is_instance_valid(target):
		return
	var tid: int = target.get_instance_id()
	if not _active_dots.has(tid):
		_active_dots[tid] = []
	_active_dots[tid].append({
		"type": dot_type,
		"dmg": dmg_per_tick,
		"ticks": total_ticks,
		"timer": 0.0,
		"source": source,
	})

func _process_dots(delta: float) -> void:
	var to_remove: Array = []
	for tid in _active_dots:
		var dots: Array = _active_dots[tid]
		var target = instance_from_id(tid) if tid is int else null
		if not is_instance_valid(target):
			to_remove.append(tid)
			continue
		var i := dots.size() - 1
		while i >= 0:
			var dot: Dictionary = dots[i]
			dot["timer"] += delta
			if dot["timer"] >= _dot_tick_interval:
				dot["timer"] -= _dot_tick_interval
				dot["ticks"] -= 1
				if target.has_method("take_damage"):
					target.take_damage(dot["dmg"], {"type": dot["type"], "is_crit": false, "damage": dot["dmg"]})
					EventBus.dot_tick.emit(target, dot["dmg"], dot["type"])
				if dot["ticks"] <= 0:
					dots.remove_at(i)
			i -= 1
		if dots.is_empty():
			to_remove.append(tid)
	for tid in to_remove:
		_active_dots.erase(tid)

func clear_dots_for(target) -> void:
	if is_instance_valid(target):
		_active_dots.erase(target.get_instance_id())

# ── Elemental status from damage type ───────────────────────────
func apply_elemental_status(source, target, dmg_type: String, damage: int) -> void:
	if not is_instance_valid(target):
		return
	match dmg_type:
		"fire":
			if randf() < 0.2:
				apply_dot(source, target, "fire", int(damage * 0.3), 3)
				apply_status(target, "burn", 3.0)
		"cold":
			if randf() < 0.25:
				apply_status(target, "chill", 3.0, 30.0)
		"lightning":
			if randf() < 0.1:
				apply_status(target, "stun", 0.5)
		"poison":
			if randf() < 0.3:
				apply_dot(source, target, "poison", int(damage * 0.2), 5)
