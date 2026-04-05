extends Node
## Global event bus - signal-based pub/sub system
## Port of src/engine/EventBus.js

# Combat
signal damage_dealt(attacker, defender, info: Dictionary)
signal entity_died(entity, position: Vector2)
signal player_died()
signal enemy_killed(enemy_data: Dictionary, position: Vector2)
signal status_applied(target, status_id: String, duration: float)
signal dot_tick(target, damage: int, type: String)
signal knockback_applied(target, direction: Vector2, force: float)

# Progression
signal player_leveled_up(new_level: int)
signal xp_gained(amount: int)
signal gold_gained(amount: int)
signal stat_changed()

# Loot
signal item_dropped(item_data: Dictionary, world_pos: Vector2)
signal item_picked_up(item_data: Dictionary)
signal gold_dropped(amount: int, world_pos: Vector2)
signal equipment_changed()
signal inventory_changed()

# Skills
signal skill_used(skill_id: String, source_pos: Vector2, target_pos: Vector2)
signal skill_cooldown_started(skill_id: String, duration: float)
signal buff_applied(target, buff_id: String, duration: float, value: float)
signal buff_expired(target, buff_id: String)
signal minion_spawned(minion, owner)
signal minion_died(minion)

# UI
signal floating_text(text: String, world_pos: Vector2, color: Color)
signal show_panel(panel_name: String)
signal hide_panel(panel_name: String)
signal toggle_panel(panel_name: String)
signal show_tooltip(item_data: Dictionary, screen_pos: Vector2)
signal hide_tooltip()
signal chat_message(text: String, color: Color)

# Game flow
signal zone_entered(zone_index: int)
signal zone_transition_requested(direction: int) # 1=down, -1=up
signal game_started(class_id: String, difficulty: int)
signal game_over()
signal victory()
signal difficulty_unlocked(difficulty: int)
signal rift_started(rift_level: int)

# Interaction
signal npc_interaction(npc_type: String)
signal chest_opened(position: Vector2)
signal portal_entered()

# Save
signal save_requested()
signal load_requested(slot: int)
signal save_completed()
