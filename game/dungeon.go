package game

import (
	"math/rand"
	"time"
)

type DungeonSeed struct {
	ZoneID    string    `json:"zone_id"`
	Seed      int64     `json:"seed"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"created_at"`
}

type DungeonLayout struct {
	Rooms     []Room `json:"rooms"`
	Corridors []Rect `json:"corridors"`
}

type Room struct {
	X      int    `json:"x"`
	Y      int    `json:"y"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Type   string `json:"type"`
}

type Rect struct {
	X1, Y1, X2, Y2 int
}

// GenerateDungeon es DETERMINISTA: misma seed = mismo mapa siempre
func GenerateDungeon(seed int64, level int) *DungeonLayout {
	rng := rand.New(rand.NewSource(seed))
	
	layout := &DungeonLayout{
		Rooms:     make([]Room, 0),
		Corridors: make([]Rect, 0),
	}

	// Lógica básica de generación (ejemplo para que sea funcional)
	numRooms := rng.Intn(5) + 5
	for i := 0; i < numRooms; i++ {
		room := Room{
			X:      rng.Intn(50),
			Y:      rng.Intn(50),
			Width:  rng.Intn(10) + 5,
			Height: rng.Intn(10) + 5,
			Type:   "normal",
		}
		layout.Rooms = append(layout.Rooms, room)
	}

	return layout
}
