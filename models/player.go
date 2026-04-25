package models

import "time"

type Player struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	ClassID   string    `json:"class_id"`
	X         float64   `json:"x"`
	Y         float64   `json:"y"`
	HP        int       `json:"hp"`
	MaxHP     int       `json:"max_hp"`
	MP        int       `json:"mp"`
	MaxMP     int       `json:"max_mp"`
	AnimState string    `json:"anim_state"`
	FacingDir string    `json:"facing_dir"`
	ZoneID    string    `json:"zone_id"`
	UpdatedAt time.Time `json:"updated_at"`
}
