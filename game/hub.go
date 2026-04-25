package game

import (
	"sync"
)

type Hub struct {
	zones map[string]*Zone
	mu    sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		zones: make(map[string]*Zone),
	}
}

func (h *Hub) GetOrCreateZone(zoneID, zoneType string) *Zone {
	h.mu.Lock()
	defer h.mu.Unlock()

	if zone, ok := h.zones[zoneID]; ok {
		return zone
	}

	zone := NewZone(zoneID, zoneType)
	h.zones[zoneID] = zone
	go zone.Run()
	
	return zone
}
