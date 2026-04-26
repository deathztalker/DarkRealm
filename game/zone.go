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
	Seed       int
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

	playerID := event.PlayerID

	switch event.Type {
	case "join_zone":
		var payload struct {
			PlayerData map[string]interface{} `json:"playerData"`
			Seed       int                    `json:"seed"`
		}
		json.Unmarshal(event.Payload, &payload)
		
		z.mu.Lock()
		// Server-Authoritative Seed Logic
		if len(z.players) == 0 && z.Seed == 0 {
			if payload.Seed != 0 {
				z.Seed = payload.Seed
			} else {
				z.Seed = int(time.Now().UnixNano() % 1000000)
			}
			log.Printf("[Zone %s] Initialized authoritative seed: %d", z.ID, z.Seed)
		}

		// Asegurar que el objeto tiene el ID correcto
		pData := payload.PlayerData
		if pData == nil { pData = make(map[string]interface{}) }
		pData["id"] = playerID
		
		z.players[playerID] = pData
		
		// 1. Enviar lista de jugadores actuales al que entra
		z.sendToClient(playerID, "current_players", z.players)

		// 1.5 Enviar semilla del dungeon (AUTORITATIVA)
		z.sendToClient(playerID, "dungeon_init", map[string]interface{}{"seed": z.Seed})
		
		// 2. Notificar a los demás que alguien entró
		z.broadcastToOthers(playerID, "player_joined", pData)
		z.mu.Unlock()

	case "move":
		z.mu.Lock()
		if p, ok := z.players[playerID].(map[string]interface{}); ok {
			var moveData map[string]interface{}
			json.Unmarshal(event.Payload, &moveData)
			for k, v := range moveData {
				p[k] = v
			}
			z.broadcastToOthers(playerID, "player_moved", p)
		}
		z.mu.Unlock()

	case "chat_message":
		z.mu.RLock()
		if p, ok := z.players[playerID].(map[string]interface{}); ok {
			var text string
			json.Unmarshal(event.Payload, &text)
			chatPayload := map[string]interface{}{
				"id":     time.Now().UnixMilli(),
				"sender": p["name"],
				"text":   text,
				"time":   time.Now().Format("15:04"),
			}
			z.broadcastToAllRaw("chat_message", chatPayload)
		}
		z.mu.RUnlock()

	case "projectile_fire":
		var projData interface{}
		json.Unmarshal(event.Payload, &projData)
		z.broadcastToOthers(playerID, "projectile_spawn", projData)

	case "skill_use":
		var skillData interface{}
		json.Unmarshal(event.Payload, &skillData)
		// El cliente espera 'player_skill' con el ID del que la usó
		if sMap, ok := skillData.(map[string]interface{}); ok {
			sMap["id"] = playerID
			z.broadcastToOthers(playerID, "player_skill", sMap)
		}

	case "enemy_damaged", "enemy_death", "enemy_sync", "npc_sync", "portal_spawn":
		// Relays simples manteniendo el mismo tipo
		var payload interface{}
		json.Unmarshal(event.Payload, &payload)
		z.broadcastToOthers(playerID, event.Type, payload)

	default:
		// Relay genérico para cualquier otro evento (trade, party, etc.)
		var payload interface{}
		json.Unmarshal(event.Payload, &payload)
		z.broadcastToOthers(playerID, event.Type, payload)
	}
}

func (z *Zone) sendToClient(playerID string, eventType string, payload interface{}) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    eventType,
		"payload": payload,
	})
	for client := range z.clients {
		if client.PlayerID == playerID {
			select {
			case client.send <- msg:
			default:
			}
			break
		}
	}
}

func (z *Zone) broadcastToAllRaw(eventType string, payload interface{}) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    eventType,
		"payload": payload,
	})
	z.mu.RLock()
	defer z.mu.RUnlock()
	for client := range z.clients {
		select {
		case client.send <- msg:
		default:
		}
	}
}

func (z *Zone) broadcastToOthers(senderID string, eventType string, payload interface{}) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    eventType,
		"payload": payload,
	})
	z.mu.RLock()
	defer z.mu.RUnlock()
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
	z.broadcastToOthers(playerID, "player_left", playerID)
}
