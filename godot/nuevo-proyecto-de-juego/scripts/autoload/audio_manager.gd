extends Node
## Procedural audio system - synthesized sounds via AudioStreamWAV
## Port of src/engine/audio.js (Web Audio API → Godot AudioStreamWAV)

var _players: Array[AudioStreamPlayer] = []
const MAX_PLAYERS := 12
const SAMPLE_RATE := 22050
var _master_volume := 0.5

func _ready() -> void:
	for i in MAX_PLAYERS:
		var p := AudioStreamPlayer.new()
		p.bus = &"Master"
		p.volume_db = linear_to_db(_master_volume)
		add_child(p)
		_players.append(p)

func set_volume(vol: float) -> void:
	_master_volume = clampf(vol, 0.0, 1.0)
	for p in _players:
		p.volume_db = linear_to_db(_master_volume)

func _get_free_player() -> AudioStreamPlayer:
	for p in _players:
		if not p.playing:
			return p
	return _players[0]

# ── Waveform generation ──────────────────────────────────────────
func _generate_tone(freq: float, duration: float, wave: String = "sine", vol: float = 0.3, freq_end: float = -1.0) -> AudioStreamWAV:
	var num_frames := int(SAMPLE_RATE * duration)
	var audio := AudioStreamWAV.new()
	audio.format = AudioStreamWAV.FORMAT_16_BITS
	audio.mix_rate = SAMPLE_RATE
	audio.stereo = false
	var data := PackedByteArray()
	data.resize(num_frames * 2)
	var use_sweep := freq_end > 0
	for i in num_frames:
		var t := float(i) / SAMPLE_RATE
		var env := 1.0 - (t / duration)
		env = env * env  # Quadratic decay
		var f := freq
		if use_sweep:
			f = lerpf(freq, freq_end, t / duration)
		var sample := 0.0
		match wave:
			"sine":
				sample = sin(TAU * f * t)
			"square":
				sample = 1.0 if fmod(f * t, 1.0) < 0.5 else -1.0
			"sawtooth":
				sample = 2.0 * fmod(f * t, 1.0) - 1.0
			"noise":
				sample = randf_range(-1.0, 1.0)
		sample *= vol * env
		var val := clampi(int(sample * 32767), -32768, 32767)
		data[i * 2] = val & 0xFF
		data[i * 2 + 1] = (val >> 8) & 0xFF
	audio.data = data
	return audio

func _play(stream: AudioStreamWAV) -> void:
	var p := _get_free_player()
	p.stream = stream
	p.play()

# ── Sound effects ────────────────────────────────────────────────
func play_hit(is_crit: bool = false) -> void:
	if is_crit:
		_play(_generate_tone(350.0, 0.15, "square", 0.25, 200.0))
	else:
		_play(_generate_tone(220.0, 0.1, "sawtooth", 0.2, 120.0))

func play_player_hit() -> void:
	_play(_generate_tone(120.0, 0.18, "sawtooth", 0.25, 60.0))

func play_cast(element: String = "fire") -> void:
	match element:
		"fire":
			_play(_generate_tone(600.0, 0.2, "sine", 0.2, 300.0))
		"cold":
			_play(_generate_tone(400.0, 0.25, "sine", 0.18, 200.0))
		"lightning":
			_play(_generate_tone(800.0, 0.12, "square", 0.2, 400.0))
		"poison":
			_play(_generate_tone(200.0, 0.3, "sawtooth", 0.15, 100.0))
		"shadow":
			_play(_generate_tone(100.0, 0.3, "sine", 0.2, 50.0))
		"holy":
			_play(_generate_tone(700.0, 0.2, "sine", 0.2, 500.0))
		"physical":
			_play(_generate_tone(250.0, 0.1, "sawtooth", 0.2, 150.0))
		_:
			_play(_generate_tone(500.0, 0.15, "sine", 0.18))

func play_level_up() -> void:
	_play(_generate_tone(440.0, 0.5, "sine", 0.3, 880.0))

func play_loot_pickup() -> void:
	_play(_generate_tone(800.0, 0.08, "sine", 0.15, 1200.0))

func play_gold_pickup() -> void:
	_play(_generate_tone(1000.0, 0.06, "sine", 0.12, 1400.0))

func play_potion() -> void:
	_play(_generate_tone(500.0, 0.15, "sine", 0.2, 700.0))

func play_death() -> void:
	_play(_generate_tone(150.0, 0.6, "sawtooth", 0.3, 40.0))

func play_enemy_death() -> void:
	_play(_generate_tone(180.0, 0.25, "sawtooth", 0.2, 60.0))

func play_zone_transition() -> void:
	_play(_generate_tone(330.0, 0.4, "sine", 0.25, 660.0))

func play_menu_click() -> void:
	_play(_generate_tone(600.0, 0.05, "sine", 0.15, 800.0))

func play_equip() -> void:
	_play(_generate_tone(300.0, 0.12, "noise", 0.15, 150.0))

func play_error() -> void:
	_play(_generate_tone(200.0, 0.15, "square", 0.2, 100.0))

func play_boss_spawn() -> void:
	_play(_generate_tone(80.0, 0.8, "sawtooth", 0.35, 200.0))

func play_victory() -> void:
	_play(_generate_tone(523.0, 0.6, "sine", 0.3, 1046.0))
