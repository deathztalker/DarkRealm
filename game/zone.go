package game

import (
	"encoding/json"
	"sync"
	"time"
)

type Zone struct {
	ID         string
	Type       string
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewZone(id, zoneType string) *Zone {
	return &Zone{
		ID:         id,
		Type:       zoneType,
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (z *Zone) Run() {
	ticker := time.NewTicker(33 * time.Millisecond) // 30 ticks/seg
	defer ticker.Stop()

	for {
		select {
		case client := <-z.register:
			z.mu.Lock()
			z.clients[client] = true
			z.mu.Unlock()
			// Enviar estado completo al nuevo jugador
			z.sendFullState(client)

		case client := <-z.unregister:
			z.mu.Lock()
			if _, ok := z.clients[client]; ok {
				delete(z.clients, client)
				close(client.send)
				z.broadcastPlayerLeft(client.PlayerID)
			}
			z.mu.Unlock()

		case message := <-z.broadcast:
			z.broadcastToAll(message)

		case <-ticker.C:
			z.tick()
		}
	}
}

func (z *Zone) broadcastToAll(message []byte) {
	z.mu.RLock()
	defer z.mu.RUnlock()
	for client := range z.clients {
		select {
		case client.send <- message:
		default:
			// Si el canal está lleno, desconectar cliente lento
			close(client.send)
			delete(z.clients, client)
		}
	}
}

func (z *Zone) tick() {
	// Lógica de IA, colisiones, etc.
}

func (z *Zone) sendFullState(client *Client) {
	// Enviar estado inicial de la zona
}

func (z *Zone) broadcastPlayerLeft(playerID string) {
	event := map[string]interface{}{
		"type":      "player_left",
		"player_id": playerID,
		"ts":        time.Now().UnixMilli(),
	}
	msg, _ := json.Marshal(event)
	z.broadcast <- msg
}
