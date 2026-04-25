package broadcast

import "encoding/json"

type GameEvent struct {
	Type      string          `json:"type"`
	PlayerID  string          `json:"player_id,omitempty"`
	ZoneID    string          `json:"zone_id"`
	Payload   json.RawMessage `json:"payload"`
	Timestamp int64           `json:"ts"`
}

// Eventos específicos
type PlayerMovePayload struct {
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	AnimState string  `json:"anim_state"`
	FacingDir string  `json:"facing_dir"`
}

type SpellCastPayload struct {
	SpellID   string  `json:"spell_id"`
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	Direction string  `json:"direction"`
	TargetID  string  `json:"target_id,omitempty"`
}
