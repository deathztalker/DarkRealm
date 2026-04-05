class_name GameWorld
extends Node2D
## Game world - manages dungeon, entities, pathfinding, zones
## Port of the world management from main.js

const TILE_SIZE := 16

var current_zone := 0
var current_difficulty := 0  # 0=Normal, 1=Nightmare, 2=Hell
var _dungeon := DungeonGenerator.new()
var _dungeon_data := {}
var _tile_map: TileMapLayer
var _tile_set: TileSet
var _entities_node: Node2D
var _projectiles_node: Node2D
var _loot_node: Node2D
var _astar: AStarGrid2D
var _player: PlayerEntity
var _loot_gen := LootGenerator.new()
var _darkness: CanvasModulate
var _explored: Dictionary = {}  # Vector2i -> bool
var _portal_cooldown := 0.0  # Prevents instant re-trigger after zone load

func _ready() -> void:
	add_to_group("game_world")
	z_index = 0

	# Create child containers
	_entities_node = Node2D.new()
	_entities_node.name = "Entities"
	_entities_node.z_index = 5
	add_child(_entities_node)

	_projectiles_node = Node2D.new()
	_projectiles_node.name = "Projectiles"
	_projectiles_node.z_index = 8
	add_child(_projectiles_node)

	_loot_node = Node2D.new()
	_loot_node.name = "Loot"
	_loot_node.z_index = 3
	add_child(_loot_node)

	# Darkness overlay
	_darkness = CanvasModulate.new()
	_darkness.name = "Darkness"
	_darkness.color = Color(0.15, 0.12, 0.2)
	add_child(_darkness)

	# Setup tileset
	_setup_tileset()

	# Setup tilemap
	_tile_map = TileMapLayer.new()
	_tile_map.name = "TileMap"
	_tile_map.tile_set = _tile_set
	_tile_map.z_index = 0
	_tile_map.collision_enabled = true
	add_child(_tile_map)
	move_child(_tile_map, 0)

	# Setup pathfinding
	_astar = AStarGrid2D.new()
	_astar.region = Rect2i(0, 0, DungeonGenerator.MAP_W, DungeonGenerator.MAP_H)
	_astar.cell_size = Vector2i(TILE_SIZE, TILE_SIZE)
	_astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_ONLY_IF_NO_OBSTACLES
	_astar.update()

	# Connect events
	EventBus.enemy_killed.connect(_on_enemy_killed)
	EventBus.zone_transition_requested.connect(_on_zone_transition)
	EventBus.chest_opened.connect(_on_chest_opened)

func _process(delta: float) -> void:
	if _portal_cooldown > 0:
		_portal_cooldown -= delta

func _setup_tileset() -> void:
	_tile_set = TileSet.new()
	_tile_set.tile_size = Vector2i(TILE_SIZE, TILE_SIZE)

	# Brighter tile colors for visibility with CanvasModulate
	var tile_colors := {
		DungeonGenerator.Tile.FLOOR: Color(0.3, 0.27, 0.24),
		DungeonGenerator.Tile.WALL: Color(0.2, 0.18, 0.17),
		DungeonGenerator.Tile.DOOR: Color(0.5, 0.38, 0.22),
		DungeonGenerator.Tile.STAIRS_DOWN: Color(0.45, 0.35, 0.75),
		DungeonGenerator.Tile.STAIRS_UP: Color(0.35, 0.65, 0.35),
		DungeonGenerator.Tile.GRASS: Color(0.18, 0.4, 0.15),
		DungeonGenerator.Tile.PATH: Color(0.4, 0.35, 0.22),
		DungeonGenerator.Tile.WATER: Color(0.12, 0.25, 0.5),
		DungeonGenerator.Tile.TREE: Color(0.1, 0.3, 0.1),
		DungeonGenerator.Tile.BRIDGE: Color(0.45, 0.35, 0.18),
	}

	var num_tiles := tile_colors.size()
	var img := Image.create(TILE_SIZE * num_tiles, TILE_SIZE, false, Image.FORMAT_RGBA8)

	for tile_type in tile_colors:
		var color: Color = tile_colors[tile_type]
		var x_offset: int = tile_type * TILE_SIZE
		for y in TILE_SIZE:
			for x in TILE_SIZE:
				var noise_val := randf_range(-0.025, 0.025)
				# Add edge lines for walls and trees
				var edge := 0.0
				if tile_type == DungeonGenerator.Tile.WALL:
					if y == 0 or y == TILE_SIZE - 1 or x == 0 or x == TILE_SIZE - 1:
						edge = -0.04
					if y == TILE_SIZE / 2:
						edge = -0.03
				elif tile_type == DungeonGenerator.Tile.WATER:
					if y == TILE_SIZE / 3 or y == TILE_SIZE * 2 / 3:
						noise_val += 0.06
				elif tile_type == DungeonGenerator.Tile.TREE:
					var cx := x - TILE_SIZE / 2
					var cy := y - TILE_SIZE / 2
					if cx * cx + cy * cy < (TILE_SIZE / 3) * (TILE_SIZE / 3):
						edge = 0.05
				var c := Color(
					clampf(color.r + noise_val + edge, 0.0, 1.0),
					clampf(color.g + noise_val + edge, 0.0, 1.0),
					clampf(color.b + noise_val + edge, 0.0, 1.0),
					1.0)
				img.set_pixel(x_offset + x, y, c)

	# Add physics layer for wall collisions (collision layer 2)
	_tile_set.add_physics_layer()
	_tile_set.set_physics_layer_collision_layer(0, 2)  # Layer 2 = walls
	_tile_set.set_physics_layer_collision_mask(0, 0)

	var tex := ImageTexture.create_from_image(img)
	var source := TileSetAtlasSource.new()
	source.texture = tex
	source.texture_region_size = Vector2i(TILE_SIZE, TILE_SIZE)

	# Create all tiles first
	for tile_type in tile_colors:
		source.create_tile(Vector2i(tile_type, 0))

	# Add source to TileSet BEFORE setting collision data
	# (TileData needs to know about physics layers from the TileSet)
	_tile_set.add_source(source)

	# Now add collision shapes to solid tiles
	var solid_tiles := [DungeonGenerator.Tile.WALL, DungeonGenerator.Tile.WATER, DungeonGenerator.Tile.TREE]
	var half := TILE_SIZE / 2.0
	var collision_polygon := PackedVector2Array([
		Vector2(-half, -half), Vector2(half, -half),
		Vector2(half, half), Vector2(-half, half)
	])
	for tile_type in solid_tiles:
		var td: TileData = source.get_tile_data(Vector2i(tile_type, 0), 0)
		td.add_collision_polygon(0)
		td.set_collision_polygon_points(0, 0, collision_polygon)

# ── Zone loading ─────────────────────────────────────────────────
func load_zone(zone: int, difficulty: int = 0) -> void:
	current_zone = zone
	current_difficulty = difficulty
	_portal_cooldown = 1.5  # Prevent instant re-trigger

	# Clear existing
	_clear_entities()
	_explored.clear()

	# Generate dungeon
	_dungeon_data = _dungeon.generate(zone, difficulty)
	_render_tilemap()
	_setup_pathfinding()

	# Spawn player at spawn point
	var spawn: Vector2i = _dungeon_data["spawn"]
	if _player and is_instance_valid(_player):
		_player.global_position = Vector2(spawn.x * TILE_SIZE + TILE_SIZE / 2.0, spawn.y * TILE_SIZE + TILE_SIZE / 2.0)

	# Spawn enemies
	var enemies: Array = _dungeon_data.get("enemies", [])
	for edata in enemies:
		_spawn_enemy(edata)

	# Spawn NPCs (town only)
	var npcs: Array = _dungeon_data.get("npcs", [])
	for ndata in npcs:
		_spawn_npc(ndata)

	# Spawn chests
	var chests: Array = _dungeon_data.get("chests", [])
	for cdata in chests:
		_spawn_chest(cdata)

	# Adjust darkness based on zone (town is brighter)
	if zone == 0:
		_darkness.color = Color(0.7, 0.65, 0.8)  # Daylight town
	else:
		_darkness.color = Color(0.2, 0.17, 0.25)  # Dark dungeon

	# Spawn zone markers (dungeon entrance, stairs labels)
	_spawn_zone_markers()

	EventBus.zone_entered.emit(zone)

func _render_tilemap() -> void:
	_tile_map.clear()
	var grid: Array = _dungeon_data.get("grid", [])
	for y in grid.size():
		var row: Array = grid[y]
		for x in row.size():
			var tile_type: int = row[x]
			_tile_map.set_cell(Vector2i(x, y), 0, Vector2i(tile_type, 0))

func _setup_pathfinding() -> void:
	_astar.update()
	var grid: Array = _dungeon_data.get("grid", [])
	for y in grid.size():
		var row: Array = grid[y]
		for x in row.size():
			_astar.set_point_solid(Vector2i(x, y), not _dungeon.is_walkable(x, y))

# ── Entity spawning ──────────────────────────────────────────────
func set_player(player: PlayerEntity) -> void:
	_player = player
	_entities_node.add_child(player)

func _spawn_enemy(data: Dictionary) -> void:
	var enemy := EnemyEntity.new()
	_entities_node.add_child(enemy)
	enemy.global_position = Vector2(int(data["x"]) * TILE_SIZE + TILE_SIZE / 2.0, int(data["y"]) * TILE_SIZE + TILE_SIZE / 2.0)

	var is_boss: bool = data.get("boss", false)
	var is_elite: bool = data.get("elite", false)

	var enemy_base: Dictionary
	if is_boss:
		enemy_base = GameData.get_boss(current_zone)
	else:
		enemy_base = GameData.get_random_enemy(current_zone)
		if is_elite:
			enemy_base["tier"] = ["elite", "rare"][randi() % 2] if randf() < 0.3 else "elite"
		else:
			enemy_base["tier"] = "normal"

	enemy.initialize(enemy_base, current_zone, current_difficulty)

func _spawn_npc(data: Dictionary) -> void:
	var npc := StaticBody2D.new()
	npc.global_position = Vector2(int(data["x"]) * TILE_SIZE + TILE_SIZE / 2.0, int(data["y"]) * TILE_SIZE + TILE_SIZE / 2.0)
	npc.collision_layer = 16
	npc.collision_mask = 0

	var coll := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 6.0
	coll.shape = shape
	npc.add_child(coll)

	# Sprite
	var sprite := Sprite2D.new()
	var npc_type: String = data.get("type", "elder")
	var tex_path := "res://assets/npc_%s.png" % npc_type
	var has_texture := false
	if ResourceLoader.exists(tex_path):
		var texture: Texture2D = load(tex_path)
		if texture != null:
			sprite.texture = texture
			sprite.hframes = 1
			sprite.vframes = 1
			sprite.frame = 0
			# Scale NPC to ~3 tiles tall for visibility
			var tex_height: float = float(texture.get_height())
			var target_height: float = float(TILE_SIZE) * 3.0
			var scale_factor: float = target_height / tex_height
			sprite.scale = Vector2(scale_factor, scale_factor)
			sprite.position = Vector2(0, -target_height * 0.45)
			has_texture = true

	if not has_texture:
		# Fallback: colored rectangle icon
		var npc_colors := {"merchant": Color(0.8, 0.6, 0.2), "elder": Color(0.3, 0.5, 0.9), "stash": Color(0.6, 0.4, 0.2)}
		var npc_color: Color = npc_colors.get(npc_type, Color(0.5, 0.8, 0.3))
		var icon_size := 12
		var icon_img := Image.create(icon_size, icon_size * 2, false, Image.FORMAT_RGBA8)
		for py in icon_size * 2:
			for px in icon_size:
				if py < icon_size:
					# Head (circle-ish)
					var cx := px - icon_size / 2
					var cy := py - icon_size / 2
					if cx * cx + cy * cy <= (icon_size / 2) * (icon_size / 2):
						icon_img.set_pixel(px, py, npc_color)
				else:
					# Body (rectangle)
					if px >= 2 and px < icon_size - 2:
						icon_img.set_pixel(px, py, npc_color * 0.8)
		sprite.texture = ImageTexture.create_from_image(icon_img)
		sprite.position = Vector2(0, -12)
	npc.add_child(sprite)

	# Label
	var label := Label.new()
	label.text = npc_type.capitalize()
	label.position = Vector2(-30, -30)
	label.size = Vector2(60, 16)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 9)
	label.add_theme_color_override("font_color", Color(0.4, 1, 0.4))
	npc.add_child(label)

	npc.set_meta("npc_type", npc_type)
	npc.add_to_group("npcs")
	_entities_node.add_child(npc)

func _spawn_chest(data: Dictionary) -> void:
	var chest := Area2D.new()
	chest.global_position = Vector2(int(data["x"]) * TILE_SIZE + TILE_SIZE / 2.0, int(data["y"]) * TILE_SIZE + TILE_SIZE / 2.0)
	chest.collision_layer = 32
	chest.collision_mask = 1

	var coll := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 12.0
	coll.shape = shape
	chest.add_child(coll)

	# Visual
	var sprite := Sprite2D.new()
	var img := Image.create(12, 10, false, Image.FORMAT_RGBA8)
	for y in 10:
		for x in 12:
			img.set_pixel(x, y, Color(0.5, 0.35, 0.15) if y < 8 else Color(0.6, 0.5, 0.2))
	sprite.texture = ImageTexture.create_from_image(img)
	chest.add_child(sprite)

	var label := Label.new()
	label.text = "Chest"
	label.position = Vector2(-18, -14)
	label.size = Vector2(36, 12)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 7)
	label.add_theme_color_override("font_color", Color(0.8, 0.7, 0.3))
	chest.add_child(label)

	chest.add_to_group("chests")
	chest.body_entered.connect(_on_chest_body_entered.bind(chest))
	_entities_node.add_child(chest)

func _on_chest_body_entered(body: Node2D, chest: Area2D) -> void:
	if body is PlayerEntity:
		EventBus.chest_opened.emit(chest.global_position)
		var pos := chest.global_position
		var drops := _loot_gen.generate_drops(_player.level, "elite", pos, _player.magic_find)
		# Defer to avoid physics flushing errors
		call_deferred("_spawn_chest_loot", drops, pos)
		chest.queue_free()

func _spawn_chest_loot(drops: Array, pos: Vector2) -> void:
	for item in drops:
		_spawn_loot(item, pos + Vector2(randf_range(-15, 15), randf_range(-15, 15)))

# ── Loot spawning ────────────────────────────────────────────────
func _on_enemy_killed(enemy_data: Dictionary, pos: Vector2) -> void:
	var drops := _loot_gen.generate_drops(
		int(enemy_data.get("enemy_level", 1)),
		enemy_data.get("tier", "normal"),
		pos,
		_player.magic_find if _player else 0.0
	)
	for item in drops:
		_spawn_loot(item, pos + Vector2(randf_range(-12, 12), randf_range(-12, 12)))

func _spawn_loot(item_data: Dictionary, pos: Vector2) -> void:
	var drop := LootDrop.new()
	_loot_node.add_child(drop)
	drop.global_position = pos
	drop.initialize(item_data)

# ── Projectile spawning ─────────────────────────────────────────
func spawn_projectile(pos: Vector2, dir: Vector2, dmg: float, type: String, source, skill: Dictionary = {}) -> void:
	var proj := ProjectileEntity.new()
	_projectiles_node.add_child(proj)
	proj.initialize(pos, dir, dmg, type, source, skill)

# ── Pathfinding ──────────────────────────────────────────────────
func find_path(from: Vector2, to: Vector2) -> Array[Vector2]:
	var from_tile := Vector2i(int(from.x) / TILE_SIZE, int(from.y) / TILE_SIZE)
	var to_tile := Vector2i(int(to.x) / TILE_SIZE, int(to.y) / TILE_SIZE)
	from_tile = from_tile.clamp(Vector2i.ZERO, Vector2i(DungeonGenerator.MAP_W - 1, DungeonGenerator.MAP_H - 1))
	to_tile = to_tile.clamp(Vector2i.ZERO, Vector2i(DungeonGenerator.MAP_W - 1, DungeonGenerator.MAP_H - 1))

	if _astar.is_point_solid(from_tile):
		from_tile = _find_nearest_walkable(from_tile)
	if _astar.is_point_solid(to_tile):
		to_tile = _find_nearest_walkable(to_tile)

	var path := _astar.get_point_path(from_tile, to_tile)
	var world_path: Array[Vector2] = []
	for p in path:
		world_path.append(p)  # Already in world coords (cell_size applied by AStarGrid2D)
	return world_path

func _find_nearest_walkable(tile: Vector2i) -> Vector2i:
	for r in range(1, 5):
		for dy in range(-r, r + 1):
			for dx in range(-r, r + 1):
				var check := tile + Vector2i(dx, dy)
				if check.x >= 0 and check.x < DungeonGenerator.MAP_W and check.y >= 0 and check.y < DungeonGenerator.MAP_H:
					if not _astar.is_point_solid(check):
						return check
	return tile

# ── Zone markers ─────────────────────────────────────────────────
func _spawn_zone_markers() -> void:
	var exit_pos: Vector2i = _dungeon_data.get("exit", Vector2i.ZERO)
	if exit_pos == Vector2i.ZERO:
		return
	var world_pos := Vector2(exit_pos.x * TILE_SIZE + TILE_SIZE / 2.0, exit_pos.y * TILE_SIZE + TILE_SIZE / 2.0)

	# Portal as Area2D - triggers zone transition on walk-in
	var portal := Area2D.new()
	portal.global_position = world_pos
	portal.z_index = 4
	portal.collision_layer = 0
	portal.collision_mask = 1  # Detect player (layer 1)

	var pcoll := CollisionShape2D.new()
	var pshape := CircleShape2D.new()
	pshape.radius = float(TILE_SIZE)
	pcoll.shape = pshape
	portal.add_child(pcoll)

	# Glowing portal sprite
	var portal_sprite := Sprite2D.new()
	var ps := TILE_SIZE * 3
	var portal_img := Image.create(ps, ps, false, Image.FORMAT_RGBA8)
	var center := Vector2(ps / 2.0, ps / 2.0)
	var is_town: bool = current_zone == 0
	for py in ps:
		for px in ps:
			var dist: float = Vector2(px, py).distance_to(center)
			var max_dist: float = float(ps) / 2.0
			if dist < max_dist:
				var t: float = 1.0 - dist / max_dist
				var alpha: float = t * t * 0.85
				if is_town:
					portal_img.set_pixel(px, py, Color(0.5, 0.2, 0.9, alpha))
				else:
					portal_img.set_pixel(px, py, Color(0.2, 0.8, 0.3, alpha))
	portal_sprite.texture = ImageTexture.create_from_image(portal_img)
	portal.add_child(portal_sprite)

	# Label
	var label := Label.new()
	label.text = ">> Dungeon <<" if is_town else ">> Next Level <<"
	label.position = Vector2(-40, -float(ps) * 0.6)
	label.size = Vector2(80, 16)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 9)
	var label_color := Color(0.7, 0.4, 1.0) if is_town else Color(0.3, 1.0, 0.5)
	label.add_theme_color_override("font_color", label_color)
	portal.add_child(label)

	portal.body_entered.connect(_on_portal_body_entered)
	portal.add_to_group("zone_markers")
	_entities_node.add_child(portal)

	# Also spawn return portal in dungeons
	if current_zone > 0:
		var spawn_pos: Vector2i = _dungeon_data.get("spawn", Vector2i.ZERO)
		if spawn_pos != Vector2i.ZERO:
			var ret_world := Vector2(spawn_pos.x * TILE_SIZE + TILE_SIZE / 2.0, spawn_pos.y * TILE_SIZE + TILE_SIZE / 2.0)

			var ret_portal := Area2D.new()
			ret_portal.global_position = ret_world
			ret_portal.z_index = 4
			ret_portal.collision_layer = 0
			ret_portal.collision_mask = 1

			var rcoll := CollisionShape2D.new()
			var rshape := CircleShape2D.new()
			rshape.radius = float(TILE_SIZE)
			rcoll.shape = rshape
			ret_portal.add_child(rcoll)

			# Blue return portal glow
			var rps := TILE_SIZE * 3
			var ret_img := Image.create(rps, rps, false, Image.FORMAT_RGBA8)
			var rcenter := Vector2(rps / 2.0, rps / 2.0)
			for py in rps:
				for px in rps:
					var rdist: float = Vector2(px, py).distance_to(rcenter)
					var rmax: float = float(rps) / 2.0
					if rdist < rmax:
						var rt: float = 1.0 - rdist / rmax
						ret_img.set_pixel(px, py, Color(0.2, 0.5, 0.9, rt * rt * 0.85))
			var ret_sprite := Sprite2D.new()
			ret_sprite.texture = ImageTexture.create_from_image(ret_img)
			ret_portal.add_child(ret_sprite)

			var ret_label := Label.new()
			ret_label.text = "<< Back <<"
			ret_label.position = Vector2(-40, -float(rps) * 0.6)
			ret_label.size = Vector2(80, 16)
			ret_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			ret_label.add_theme_font_size_override("font_size", 9)
			ret_label.add_theme_color_override("font_color", Color(0.3, 0.8, 1.0))
			ret_portal.add_child(ret_label)

			ret_portal.body_entered.connect(_on_return_portal_body_entered)
			ret_portal.add_to_group("zone_markers")
			_entities_node.add_child(ret_portal)

func _on_portal_body_entered(body: Node2D) -> void:
	if body is PlayerEntity and _portal_cooldown <= 0:
		call_deferred("_do_zone_transition", 1)

func _on_return_portal_body_entered(body: Node2D) -> void:
	if body is PlayerEntity and _portal_cooldown <= 0:
		call_deferred("_do_zone_transition", -1)

func _do_zone_transition(direction: int) -> void:
	EventBus.zone_transition_requested.emit(direction)

# ── Zone transitions ─────────────────────────────────────────────
func _on_zone_transition(direction: int) -> void:
	if direction > 0:
		if current_zone >= 5:
			EventBus.victory.emit()
		else:
			load_zone(current_zone + 1, current_difficulty)
	else:
		if current_zone > 0:
			load_zone(current_zone - 1, current_difficulty)

func _on_chest_opened(_pos: Vector2) -> void:
	AudioManager.play_loot_pickup()

func _clear_entities() -> void:
	for child in _entities_node.get_children():
		if child != _player:
			child.queue_free()
	for child in _projectiles_node.get_children():
		child.queue_free()
	for child in _loot_node.get_children():
		child.queue_free()

# ── Input handling (click to move/attack) ────────────────────────
func _unhandled_input(event: InputEvent) -> void:
	if not _player or not is_instance_valid(_player):
		return

	if event is InputEventMouseButton and event.pressed:
		var world_pos := get_global_mouse_position()

		if event.button_index == MOUSE_BUTTON_LEFT:
			# Check for enemy click
			var nearest_enemy = null
			var nearest_dist := 200.0
			for e in get_tree().get_nodes_in_group("enemies"):
				if not is_instance_valid(e) or e.is_dead():
					continue
				var d := world_pos.distance_to(e.global_position)
				if d < nearest_dist and d < 30.0:
					nearest_dist = d
					nearest_enemy = e

			if nearest_enemy:
				_player.set_attack_target(nearest_enemy)
			else:
				# Check for NPC click (increased range for visibility)
				var clicked_npc = false
				for npc in get_tree().get_nodes_in_group("npcs"):
					if world_pos.distance_to(npc.global_position) < 40.0:
						EventBus.npc_interaction.emit(npc.get_meta("npc_type", "elder"))
						clicked_npc = true
						break

				if not clicked_npc:
					_player.move_to(world_pos)

		elif event.button_index == MOUSE_BUTTON_RIGHT:
			_player.move_to(world_pos)
