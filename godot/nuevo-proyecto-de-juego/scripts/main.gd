extends Node
## Main game controller - State machine, scene creation
## Port of src/main.js game flow

enum State { MENU, PLAYING, PAUSED, DEAD, VICTORY }

var _state := State.MENU
var _main_menu: MainMenuUI
var _game_world: GameWorld
var _hud: HUD
var _inventory: InventoryPanel
var _talents: TalentPanel
var _character: CharacterPanel
var _death_screen: DeathScreen
var _player: PlayerEntity
var _ui_layer: CanvasLayer
var _current_class := "warrior"
var _current_difficulty := 0

func _ready() -> void:
	# Connect global events
	EventBus.game_over.connect(_on_game_over)
	EventBus.victory.connect(_on_victory)
	EventBus.game_started.connect(_on_game_started)

	# Set window properties
	get_window().title = "Dark Realm - ARPG"

	# Show main menu
	_show_menu()

func _process(_delta: float) -> void:
	if _state == State.PLAYING and _player and is_instance_valid(_player):
		# Check stairs proximity for zone label hint
		pass

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and _state == State.PLAYING:
		# ESC closes panels first, then pauses
		var any_panel_open := false
		if _inventory and _inventory.visible:
			_inventory.visible = false
			any_panel_open = true
		if _talents and _talents.visible:
			_talents.visible = false
			any_panel_open = true
		if _character and _character.visible:
			_character.visible = false
			any_panel_open = true
		if not any_panel_open:
			_toggle_pause()

# ── State management ─────────────────────────────────────────────
func _show_menu() -> void:
	_state = State.MENU
	_cleanup_game()

	_main_menu = MainMenuUI.new()
	_main_menu.name = "MainMenu"
	_main_menu.game_start_requested.connect(_start_game)
	add_child(_main_menu)

func _start_game(class_id: String) -> void:
	_current_class = class_id
	EventBus.game_started.emit(class_id, _current_difficulty)

func _on_game_started(class_id: String, difficulty: int = 0) -> void:
	_current_class = class_id
	_current_difficulty = difficulty

	# Remove menu
	if _main_menu and is_instance_valid(_main_menu):
		_main_menu.queue_free()
		_main_menu = null

	_state = State.PLAYING

	# Check if there's a save for this class to continue
	var save_data := SaveManager.load_game(0)
	if not save_data.is_empty() and save_data.get("player", {}).get("class_id", "") == class_id:
		var player_data: Dictionary = save_data.get("player", {})
		var world_data: Dictionary = save_data.get("world", {})
		_setup_game()
		if _player and not player_data.is_empty():
			SaveManager.deserialize_player(_player, player_data)
		var saved_zone: int = int(world_data.get("zone", 0))
		var saved_diff: int = int(world_data.get("difficulty", 0))
		if saved_zone > 0:
			_game_world.load_zone(saved_zone, saved_diff)
	else:
		_setup_game()

func _setup_game() -> void:
	# Create game world
	_game_world = GameWorld.new()
	_game_world.name = "GameWorld"
	add_child(_game_world)

	# Create player
	_player = PlayerEntity.new()
	_player.name = "Player"
	var class_data := GameData.get_class_data(_current_class)
	_game_world.set_player(_player)
	_player.initialize(_current_class, class_data)

	# Auto-assign first active skill to hotbar
	_auto_assign_hotbar(class_data)

	# Create UI layer
	_ui_layer = CanvasLayer.new()
	_ui_layer.name = "UILayer"
	_ui_layer.layer = 10
	add_child(_ui_layer)

	# Create HUD
	_hud = HUD.new()
	_hud.name = "HUD"
	add_child(_hud)
	_hud.set_player(_player)

	# Create panels
	_inventory = InventoryPanel.new()
	_inventory.name = "InventoryPanel"
	_ui_layer.add_child(_inventory)
	_inventory.set_player(_player)

	_talents = TalentPanel.new()
	_talents.name = "TalentPanel"
	_ui_layer.add_child(_talents)
	_talents.set_player(_player)

	_character = CharacterPanel.new()
	_character.name = "CharacterPanel"
	_ui_layer.add_child(_character)
	_character.set_player(_player)

	# Create death/victory screen
	_death_screen = DeathScreen.new()
	_death_screen.name = "DeathScreen"
	_death_screen.restart_requested.connect(_on_restart)
	_death_screen.menu_requested.connect(_on_return_to_menu)
	_ui_layer.add_child(_death_screen)

	# Load town (zone 0)
	_game_world.load_zone(0, _current_difficulty)

	# Enable auto-save
	SaveManager.enable_auto_save(true)

func _auto_assign_hotbar(class_data: Dictionary) -> void:
	if not _player or class_data.is_empty():
		return
	var trees: Array = class_data.get("trees", [])
	var slot := 0
	for tree in trees:
		var nodes: Array = tree.get("nodes", [])
		for node in nodes:
			if node.get("type", "") == "active" and slot < 5:
				var skill_id: String = node.get("id", "")
				_player.hotbar[slot] = skill_id
				# Give 1 point to first skill for immediate use
				if slot == 0 and _player.unspent_points > 0:
					_player.spend_talent_point(skill_id)
				slot += 1
				if slot >= 5:
					break
		if slot >= 5:
			break

func _on_game_over() -> void:
	_state = State.DEAD
	SaveManager.enable_auto_save(false)
	if _death_screen:
		_death_screen.show_death(_player)

func _on_victory() -> void:
	_state = State.VICTORY
	AudioManager.play_victory()
	if _death_screen:
		_death_screen.show_victory(_player)

func _on_restart() -> void:
	if _death_screen:
		_death_screen.hide_screen()
	_cleanup_game()
	_state = State.PLAYING
	# Try to load the auto-save (slot 0) to preserve progress
	var save_data := SaveManager.load_game(0)
	if not save_data.is_empty():
		var player_data: Dictionary = save_data.get("player", {})
		var world_data: Dictionary = save_data.get("world", {})
		_current_class = player_data.get("class_id", _current_class)
		_setup_game()
		# Restore player state from save
		if _player and not player_data.is_empty():
			SaveManager.deserialize_player(_player, player_data)
			_player.hp = _player.max_hp  # Revive with full HP
			_player.mp = _player.max_mp
		# Load the saved zone
		var saved_zone: int = int(world_data.get("zone", 0))
		var saved_diff: int = int(world_data.get("difficulty", 0))
		if saved_zone > 0:
			_game_world.load_zone(saved_zone, saved_diff)
	else:
		_setup_game()

func _on_return_to_menu() -> void:
	_cleanup_game()
	_show_menu()

func _toggle_pause() -> void:
	if _state == State.PLAYING:
		_state = State.PAUSED
		get_tree().paused = true
	elif _state == State.PAUSED:
		_state = State.PLAYING
		get_tree().paused = false

func _cleanup_game() -> void:
	SaveManager.enable_auto_save(false)
	if _game_world and is_instance_valid(_game_world):
		_game_world.queue_free()
		_game_world = null
	if _hud and is_instance_valid(_hud):
		_hud.queue_free()
		_hud = null
	if _ui_layer and is_instance_valid(_ui_layer):
		_ui_layer.queue_free()
		_ui_layer = null
	_player = null
	_inventory = null
	_talents = null
	_character = null
	_death_screen = null
