class_name DungeonGenerator
## BSP dungeon generation - Port of src/world/dungeon.js

const TILE_SIZE := 16
const MAP_W := 80
const MAP_H := 60
const MAX_DEPTH := 6
const MIN_ROOM := 6
const MAX_ROOM := 16

enum Tile { FLOOR, WALL, DOOR, STAIRS_DOWN, STAIRS_UP, GRASS, PATH, WATER, TREE, BRIDGE }

const TILE_COLORS := {
	Tile.FLOOR: Color(0.165, 0.165, 0.165),
	Tile.WALL: Color(0.102, 0.102, 0.102),
	Tile.DOOR: Color(0.29, 0.227, 0.165),
	Tile.STAIRS_DOWN: Color(0.227, 0.227, 0.353),
	Tile.STAIRS_UP: Color(0.227, 0.353, 0.227),
	Tile.GRASS: Color(0.102, 0.227, 0.102),
	Tile.PATH: Color(0.227, 0.227, 0.165),
	Tile.WATER: Color(0.102, 0.165, 0.251),
	Tile.TREE: Color(0.039, 0.165, 0.039),
	Tile.BRIDGE: Color(0.29, 0.227, 0.165),
}

var grid: Array[Array] = []
var rooms: Array[Rect2i] = []
var spawn_point := Vector2i.ZERO
var exit_point := Vector2i.ZERO
var enemy_spawns: Array[Dictionary] = []
var chest_spawns: Array[Dictionary] = []
var npc_spawns: Array[Dictionary] = []

# ── BSP Node ─────────────────────────────────────────────────────
class BSPNode:
	var x: int; var y: int; var w: int; var h: int
	var left: BSPNode = null
	var right: BSPNode = null
	var room := Rect2i()
	func _init(px: int, py: int, pw: int, ph: int):
		x = px; y = py; w = pw; h = ph
	func is_leaf() -> bool:
		return left == null and right == null

# ── Main generation entry ────────────────────────────────────────
func generate(zone: int, difficulty: int = 0) -> Dictionary:
	grid.clear(); rooms.clear()
	enemy_spawns.clear(); chest_spawns.clear(); npc_spawns.clear()
	# Init all walls
	for gy in MAP_H:
		var row: Array[int] = []
		row.resize(MAP_W)
		row.fill(Tile.WALL)
		grid.append(row)

	if zone == 0:
		_generate_town()
	elif zone >= 5:
		_generate_boss_arena(zone, difficulty)
	else:
		_generate_dungeon(zone, difficulty)

	return {
		"grid": grid, "rooms": rooms,
		"spawn": spawn_point, "exit": exit_point,
		"enemies": enemy_spawns, "chests": chest_spawns, "npcs": npc_spawns,
		"w": MAP_W, "h": MAP_H, "tile_size": TILE_SIZE,
	}

# ── Dungeon (zones 1-4) ─────────────────────────────────────────
func _generate_dungeon(zone: int, _diff: int) -> void:
	var root := BSPNode.new(1, 1, MAP_W - 2, MAP_H - 2)
	_split(root, 0)
	_carve_rooms(root)
	_connect(root)
	# Stairs
	if rooms.size() >= 2:
		var r0 := rooms[0]
		spawn_point = Vector2i(r0.position.x + r0.size.x / 2, r0.position.y + r0.size.y / 2)
		set_tile(spawn_point.x, spawn_point.y, Tile.STAIRS_UP)
		var rN := rooms[rooms.size() - 1]
		exit_point = Vector2i(rN.position.x + rN.size.x / 2, rN.position.y + rN.size.y / 2)
		set_tile(exit_point.x, exit_point.y, Tile.STAIRS_DOWN)
	# Enemies per room
	var per_room := 2 + zone
	for room in rooms:
		for _i in randi_range(2, per_room):
			var ex := randi_range(room.position.x + 1, room.end.x - 2)
			var ey := randi_range(room.position.y + 1, room.end.y - 2)
			if get_tile(ex, ey) == Tile.FLOOR:
				enemy_spawns.append({"x": ex, "y": ey, "elite": randf() < 0.15, "boss": false})
		# 30% chest
		if randf() < 0.3:
			var cx := randi_range(room.position.x + 1, room.end.x - 2)
			var cy := randi_range(room.position.y + 1, room.end.y - 2)
			if get_tile(cx, cy) == Tile.FLOOR:
				chest_spawns.append({"x": cx, "y": cy})

# ── Town (zone 0) ───────────────────────────────────────────────
func _generate_town() -> void:
	# Open grass area
	for gy in range(5, MAP_H - 5):
		for gx in range(5, MAP_W - 5):
			set_tile(gx, gy, Tile.GRASS)
	# Main paths
	var mid_y := MAP_H / 2
	var mid_x := MAP_W / 2
	for gx in range(10, MAP_W - 10):
		for dy in range(-1, 2):
			set_tile(gx, mid_y + dy, Tile.PATH)
	for gy in range(10, MAP_H - 10):
		for dx in range(-1, 2):
			set_tile(mid_x + dx, gy, Tile.PATH)
	# River
	var river_x := mid_x + 12
	for gy in range(5, MAP_H - 5):
		for dx in range(-2, 3):
			var rx := river_x + dx + int(sin(gy * 0.3) * 2)
			if rx > 0 and rx < MAP_W:
				set_tile(rx, gy, Tile.WATER)
	# Bridge
	for dx in range(-3, 4):
		var bx := river_x + dx
		if bx > 0 and bx < MAP_W:
			for dy in range(-1, 2):
				set_tile(bx, mid_y + dy, Tile.BRIDGE)
	# Buildings
	var buildings := [
		Rect2i(15, 15, 8, 6), # Merchant
		Rect2i(15, 35, 8, 6), # Elder
		Rect2i(55, 15, 8, 6), # Stash
	]
	for b in buildings:
		for gy in range(b.position.y, b.end.y):
			for gx in range(b.position.x, b.end.x):
				var is_edge: bool = gx == b.position.x or gx == b.end.x - 1 or gy == b.position.y or gy == b.end.y - 1
				set_tile(gx, gy, Tile.WALL if is_edge else Tile.FLOOR)
		set_tile(b.position.x + b.size.x / 2, b.end.y - 1, Tile.DOOR)
	# Dungeon entrance
	exit_point = Vector2i(MAP_W - 15, mid_y)
	set_tile(exit_point.x, exit_point.y, Tile.STAIRS_DOWN)
	spawn_point = Vector2i(20, mid_y)
	# NPCs
	npc_spawns.append({"x": 19, "y": 17, "type": "merchant"})
	npc_spawns.append({"x": 19, "y": 37, "type": "elder"})
	npc_spawns.append({"x": 59, "y": 17, "type": "stash"})
	# Trees scattered
	for _i in 30:
		var tx := randi_range(6, MAP_W - 6)
		var ty := randi_range(6, MAP_H - 6)
		if get_tile(tx, ty) == Tile.GRASS:
			set_tile(tx, ty, Tile.TREE)
	rooms.append(Rect2i(5, 5, MAP_W - 10, MAP_H - 10))

# ── Boss arena (zone 5+) ────────────────────────────────────────
func _generate_boss_arena(_zone: int, _diff: int) -> void:
	var room := Rect2i(10, 10, MAP_W - 20, MAP_H - 20)
	for gy in range(room.position.y, room.end.y):
		for gx in range(room.position.x, room.end.x):
			var is_edge := gx == room.position.x or gx == room.end.x - 1 or gy == room.position.y or gy == room.end.y - 1
			set_tile(gx, gy, Tile.WALL if is_edge else Tile.FLOOR)
	rooms.append(room)
	spawn_point = Vector2i(room.position.x + 3, room.position.y + room.size.y / 2)
	set_tile(spawn_point.x, spawn_point.y, Tile.STAIRS_UP)
	# Boss center
	var boss_x := room.position.x + room.size.x / 2
	var boss_y := room.position.y + room.size.y / 2
	enemy_spawns.append({"x": boss_x, "y": boss_y, "boss": true, "elite": false})
	# Exit
	exit_point = Vector2i(room.end.x - 3, room.position.y + room.size.y / 2)

# ── BSP split ────────────────────────────────────────────────────
func _split(node: BSPNode, depth: int) -> void:
	if depth >= MAX_DEPTH:
		return
	if node.w < MIN_ROOM * 2 + 2 and node.h < MIN_ROOM * 2 + 2:
		return
	var horiz := randf() < 0.5
	if node.w > node.h * 1.5: horiz = false
	elif node.h > node.w * 1.5: horiz = true
	if horiz:
		if node.h < MIN_ROOM * 2 + 2: return
		var s := randi_range(MIN_ROOM + 1, node.h - MIN_ROOM - 1)
		node.left = BSPNode.new(node.x, node.y, node.w, s)
		node.right = BSPNode.new(node.x, node.y + s, node.w, node.h - s)
	else:
		if node.w < MIN_ROOM * 2 + 2: return
		var s := randi_range(MIN_ROOM + 1, node.w - MIN_ROOM - 1)
		node.left = BSPNode.new(node.x, node.y, s, node.h)
		node.right = BSPNode.new(node.x + s, node.y, node.w - s, node.h)
	_split(node.left, depth + 1)
	_split(node.right, depth + 1)

func _carve_rooms(node: BSPNode) -> void:
	if node.is_leaf():
		var rw := randi_range(MIN_ROOM, mini(MAX_ROOM, node.w - 2))
		var rh := randi_range(MIN_ROOM, mini(MAX_ROOM, node.h - 2))
		var rx := randi_range(node.x + 1, maxi(node.x + 1, node.x + node.w - rw - 1))
		var ry := randi_range(node.y + 1, maxi(node.y + 1, node.y + node.h - rh - 1))
		node.room = Rect2i(rx, ry, rw, rh)
		rooms.append(node.room)
		for gy in range(ry, ry + rh):
			for gx in range(rx, rx + rw):
				set_tile(gx, gy, Tile.FLOOR)
	else:
		if node.left: _carve_rooms(node.left)
		if node.right: _carve_rooms(node.right)

func _connect(node: BSPNode) -> void:
	if node.is_leaf(): return
	if node.left: _connect(node.left)
	if node.right: _connect(node.right)
	if node.left and node.right:
		var c1 := _center_of(node.left)
		var c2 := _center_of(node.right)
		_corridor(c1, c2)

func _center_of(node: BSPNode) -> Vector2i:
	if node.is_leaf() and node.room.size.x > 0:
		return Vector2i(node.room.position.x + node.room.size.x / 2, node.room.position.y + node.room.size.y / 2)
	if node.left: return _center_of(node.left)
	if node.right: return _center_of(node.right)
	return Vector2i(node.x + node.w / 2, node.y + node.h / 2)

func _corridor(from: Vector2i, to: Vector2i) -> void:
	var x := from.x; var y := from.y
	while x != to.x:
		set_tile(x, y, Tile.FLOOR)
		x += 1 if to.x > x else -1
	while y != to.y:
		set_tile(x, y, Tile.FLOOR)
		y += 1 if to.y > y else -1
	set_tile(x, y, Tile.FLOOR)

# ── Tile helpers ─────────────────────────────────────────────────
func set_tile(x: int, y: int, tile: int) -> void:
	if x >= 0 and x < MAP_W and y >= 0 and y < MAP_H:
		grid[y][x] = tile

func get_tile(x: int, y: int) -> int:
	if x >= 0 and x < MAP_W and y >= 0 and y < MAP_H:
		return grid[y][x]
	return Tile.WALL

func is_walkable(x: int, y: int) -> bool:
	var t := get_tile(x, y)
	return t == Tile.FLOOR or t == Tile.DOOR or t == Tile.STAIRS_DOWN or t == Tile.STAIRS_UP or t == Tile.GRASS or t == Tile.PATH or t == Tile.BRIDGE

func world_to_tile(world_pos: Vector2) -> Vector2i:
	return Vector2i(int(world_pos.x) / TILE_SIZE, int(world_pos.y) / TILE_SIZE)

func tile_to_world(tile_pos: Vector2i) -> Vector2:
	return Vector2(tile_pos.x * TILE_SIZE + TILE_SIZE * 0.5, tile_pos.y * TILE_SIZE + TILE_SIZE * 0.5)
