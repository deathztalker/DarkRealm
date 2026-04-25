package game

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"dark-realm-server/broadcast"
)

type Zone struct {
	ID         string
	Type       string
	clients    map[*Client]bool
	players    map[string]interface{} // player_id -> playerData
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
		players:    make(map[string]interface{}),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (z *Zone) Run() {
	ticker := time.NewTicker(33 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case client := <-z.register:
			z.mu.Lock()
			z.clients[client] = true
			z.mu.Unlock()
			log.Printf("[Zone %s] Client registered", z.ID)

		case client := <-z.unregister:
			z.mu.Lock()
			if _, ok := z.clients[client]; ok {
				delete(z.clients, client)
				if client.PlayerID != "" {
					delete(z.players, client.PlayerID)
					z.broadcastPlayerLeft(client.PlayerID)
				}
				// Cerrar conexión de Fiber
				client.fconn.Close()
				close(client.send)
				log.Printf("[Zone %s] Client unregistered", z.ID)
			}
			z.mu.Unlock()

		case message := <-z.broadcast:
			z.handleMessage(message)

		case <-ticker.C:
			z.tick()
		}
	}
}

func (z *Zone) handleMessage(msg []byte) {
	var event broadcast.GameEvent
	if err := json.Unmarshal(msg, &event); err != nil {
		log.Printf("Error unmarshaling event: %v", err)
		return
	}

	switch event.Type {
	case "join_zone":
		var payload struct {
			PlayerData interface{} `json:"playerData"`
		}
		json.Unmarshal(event.Payload, &payload)
		
		z.mu.Lock()
		// Guardar jugador en la zona
		z.players[event.PlayerID] = payload.PlayerData
		
		// 1. Enviar lista de jugadores actuales al que entra
		currentPlayersEvent := map[string]interface{}{
			"type":    "current_players",
			"payload": z.players,
		}
		z.sendToClient(event.PlayerID, currentPlayersEvent)
		
		// 2. Notificar a los demás que alguien entró
		playerJoinedEvent := map[string]interface{}{
			"type":    "player_joined",
			"payload": payload.PlayerData,
		}
		z.broadcastToOthers(event.PlayerID, playerJoinedEvent)
		z.mu.Unlock()

	default:
		// Relay standard events (move, skill_use, etc.)
		z.broadcastToAll(msg)
	}
}

func (z *Zone) sendToClient(playerID string, event interface{}) {
	msg, _ := json.Marshal(event)
	for client := range z.clients {
		if client.PlayerID == playerID {
			client.send <- msg
			break
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
			// Client slow, skip or unregister handled in Run
		}
	}
}

func (z *Zone) broadcastToOthers(senderID string, event interface{}) {
	msg, _ := json.Marshal(event)
	for client := range z.clients {
		if client.PlayerID != senderID {
			select {
			case client.send <- msg:
			default:
			}
		}
	}
}

func (z *Zone) tick() {}

func (z *Zone) broadcastPlayerLeft(playerID string) {
	event := map[string]interface{}{
		"type": "player_left",
		"payload": map[string]string{
			"id": playerID,
		},
		"ts": time.Now().UnixMilli(),
	}
	msg, _ := json.Marshal(event)
	z.broadcastToAll(msg)
}
