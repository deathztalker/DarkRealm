package models

type Enemy struct {
	ID        string  `json:"id"`
	Type      string  `json:"type"`
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	HP        int     `json:"hp"`
	MaxHP     int     `json:"max_hp"`
	State     string  `json:"state"` // idle, chasing, attacking
	TargetID  string  `json:"target_id,omitempty"`
	FacingDir string  `json:"facing_dir"`
}
