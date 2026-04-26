package game

import (
	"log"
	"sync"
)

type Hub struct {
	zones   map[string]*Zone
	clients map[string]*Client // player_id -> Client
	mu      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		zones:   make(map[string]*Zone),
		clients: make(map[string]*Client),
	}
}

func (h *Hub) GetOrCreateZone(zoneID, zoneType string) *Zone {
	h.mu.Lock()
	defer h.mu.Unlock()

	if zone, ok := h.zones[zoneID]; ok {
		return zone
	}

	zone := NewZone(zoneID, zoneType, h)
	h.zones[zoneID] = zone
	go zone.Run()
	
	return zone
}

func (h *Hub) RegisterClient(client *Client) {
	h.mu.Lock()
	h.clients[client.PlayerID] = client
	h.mu.Unlock()
}

func (h *Hub) UnregisterClient(playerID string) {
	h.mu.Lock()
	delete(h.clients, playerID)
	h.mu.Unlock()
}

func (h *Hub) MoveClient(playerID string, newZoneID string, currentZone *Zone, originalMsg []byte) {
	h.mu.RLock()
	client, ok := h.clients[playerID]
	h.mu.RUnlock()

	if !ok {
		log.Printf("[Hub] Client %s not found for move", playerID)
		return
	}

	// 1. Salir de la zona actual
	if currentZone != nil {
		currentZone.unregister <- client
	}

	// 2. Obtener o crear la nueva zona
	newZone := h.GetOrCreateZone(newZoneID, "dungeon")

	// 3. Actualizar referencia en el cliente
	client.Zone = newZone

	// 4. Entrar en la nueva zona
	newZone.register <- client
	
	// 5. Re-enviar el mensaje original para que la nueva zona lo procese
	if originalMsg != nil {
		newZone.broadcast <- originalMsg
	}
	
	log.Printf("[Hub] Player %s moved to room %s", playerID, newZoneID)
}
