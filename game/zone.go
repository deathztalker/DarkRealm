package game

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"dark-realm-server/broadcast"
)

type ZoneEventType int

const (
	EventRegister ZoneEventType = iota
	EventUnregister
	EventMessage
)

type ZoneEvent struct {
	Type   ZoneEventType
	Client *Client
	Data   []byte
}

type Zone struct {
	ID         string
	Type       string
	Seed       int
	HostID     string
	Hub        *Hub
	clients    map[*Client]bool
	players    map[string]interface{} // player_id -> playerData
	Inbox      chan ZoneEvent
	mu         sync.RWMutex
}

func NewZone(id, zoneType string, hub *Hub) *Zone {
	return &Zone{
		ID:         id,
		Type:       zoneType,
		Hub:        hub,
		clients:    make(map[*Client]bool),
		players:    make(map[string]interface{}),
		Inbox:      make(chan ZoneEvent, 1024),
	}
}

func (z *Zone) Run() {
	ticker := time.NewTicker(33 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case event := <-z.Inbox:
			z.handleEvent(event)

		case <-ticker.C:
			z.tick()
		}
	}
}

func (z *Zone) handleEvent(event ZoneEvent) {
	switch event.Type {
	case EventRegister:
		z.mu.Lock()
		z.clients[event.Client] = true
		
		// Auto-assign host if none exists
		if z.HostID == "" && event.Client.PlayerID != "" {
			z.HostID = event.Client.PlayerID
			log.Printf("[Zone %s] Player %s assigned as HOST", z.ID, z.HostID)
			z.sendToClientLocked(z.HostID, "host_assignment", true)
		} else {
			z.sendToClientLocked(event.Client.PlayerID, "host_assignment", false)
		}
		z.mu.Unlock()
		log.Printf("[Zone %s] Client registered: %s", z.ID, event.Client.PlayerID)

	case EventUnregister:
		z.mu.Lock()
		if _, ok := z.clients[event.Client]; ok {
			delete(z.clients, event.Client)
			pID := event.Client.PlayerID
			if pID != "" {
				delete(z.players, pID)
				z.broadcastPlayerLeftLocked(pID)
				
				// If host left, pick a new one
				if z.HostID == pID {
					z.HostID = ""
					for c := range z.clients {
						if c.PlayerID != "" {
							z.HostID = c.PlayerID
							log.Printf("[Zone %s] Host migrated to %s", z.ID, z.HostID)
							z.sendToClientLocked(z.HostID, "host_assignment", true)
							break
						}
					}
				}
			}
			log.Printf("[Zone %s] Client unregistered: %s", z.ID, pID)
		}
		z.mu.Unlock()

	case EventMessage:
		z.handleMessage(event.Data)
	}
}

func (z *Zone) handleMessage(msg []byte) {
	var event broadcast.GameEvent
	if err := json.Unmarshal(msg, &event); err != nil {
		log.Printf("[Zone %s] Error unmarshaling event: %v", z.ID, err)
		return
	}

	playerID := event.PlayerID
	if playerID == "" {
		log.Printf("[Zone %s] Received event type %s with empty player_id", z.ID, event.Type)
		return
	}

	switch event.Type {
	case "join_zone":
		var payload struct {
			PlayerData map[string]interface{} `json:"playerData"`
			Seed       int                    `json:"seed"`
			RoomName   string                 `json:"roomName"`
		}
		json.Unmarshal(event.Payload, &payload)
		
		roomName := payload.RoomName
		if roomName == "" {
			roomName = z.ID
		}

		// Si el roomName es diferente al ID de esta zona, mover al cliente
		if roomName != z.ID && z.Hub != nil {
			log.Printf("[Zone %s] Moving player %s to room %s", z.ID, playerID, roomName)
			z.Hub.MoveClient(playerID, roomName, z, msg)
			return
		}

		z.mu.Lock()
		log.Printf("[Zone %s] Player %s joining room", z.ID, playerID)
		// Server-Authoritative Seed Logic
		if z.Seed == 0 {
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
		z.sendToClientLocked(playerID, "current_players", z.players)

		// 1.5 Enviar semilla del dungeon (AUTORITATIVA)
		z.sendToClientLocked(playerID, "dungeon_init", map[string]interface{}{"seed": z.Seed})
		
		// 1.7 Confirmar Host status
		z.sendToClientLocked(playerID, "host_assignment", z.HostID == playerID)

		// 2. Notificar a los demás que alguien entró
		z.broadcastToOthersLocked(playerID, "player_joined", pData)
		z.mu.Unlock()

	case "ping":
		z.sendToClientLocked(playerID, "pong", event.Payload)

	case "move":
		z.mu.Lock()
		if p, ok := z.players[playerID].(map[string]interface{}); ok {
			var moveData map[string]interface{}
			json.Unmarshal(event.Payload, &moveData)
			for k, v := range moveData {
				p[k] = v
			}
			// log.Printf("[Zone %s] Player %s moved to %.1f, %.1f", z.ID, playerID, p["x"], p["y"])
			z.broadcastToOthersLocked(playerID, "player_moved", p)
		} else {
			log.Printf("[Zone %s] Player %s moved but not found in z.players", z.ID, playerID)
		}
		z.mu.Unlock()

	case "chat_message":
		z.mu.RLock()
		var text string
		json.Unmarshal(event.Payload, &text)
		
		senderName := playerID
		if p, ok := z.players[playerID].(map[string]interface{}); ok {
			if name, ok := p["charName"].(string); ok {
				senderName = name
			}
		}

		log.Printf("[Zone %s] Chat from %s: %s", z.ID, senderName, text)

		chatPayload := map[string]interface{}{
			"id":     time.Now().UnixMilli(),
			"sender": senderName,
			"text":   text,
			"time":   time.Now().Format("15:04"),
		}
		z.mu.RUnlock()
		z.broadcastToAllRaw("chat_message", chatPayload)

	case "projectile_fire":
		var projData interface{}
		json.Unmarshal(event.Payload, &projData)
		z.broadcastToOthers(playerID, "projectile_spawn", projData)

	case "skill_use":
		var skillData interface{}
		json.Unmarshal(event.Payload, &skillData)
		if sMap, ok := skillData.(map[string]interface{}); ok {
			sMap["id"] = playerID
			z.broadcastToOthers(playerID, "player_skill", sMap)
		}

	case "enemy_damaged":
		var payload interface{}
		json.Unmarshal(event.Payload, &payload)
		z.mu.RLock()
		hostID := z.HostID
		z.mu.RUnlock()
		
		if playerID != hostID && hostID != "" {
			z.sendToClient(hostID, "enemy_damaged", payload)
		}
		z.broadcastToOthers(playerID, "enemy_damaged", payload)

	case "enemy_death":
		z.mu.RLock()
		isHost := (playerID == z.HostID)
		z.mu.RUnlock()
		
		var payload interface{}
		json.Unmarshal(event.Payload, &payload)
		
		if isHost {
			z.broadcastToOthers(playerID, "enemy_death", payload)
		} else if z.HostID != "" {
			z.sendToClient(z.HostID, "enemy_damaged", map[string]interface{}{
				"enemyId": payload, 
				"damage": 999999, 
			})
		}

	case "loot_spawn", "loot_pickup", "gold_spawn", "gold_pickup":
		var payload interface{}
		json.Unmarshal(event.Payload, &payload)
		z.broadcastToOthers(playerID, event.Type, payload)

	case "enemy_sync", "npc_sync", "portal_spawn", "object_update":
		var payload interface{}
		json.Unmarshal(event.Payload, &payload)
		z.broadcastToOthers(playerID, event.Type, payload)

	default:
		var payload interface{}
		json.Unmarshal(event.Payload, &payload)
		z.broadcastToOthers(playerID, event.Type, payload)
	}
}

func (z *Zone) sendToClient(playerID string, eventType string, payload interface{}) {
	z.mu.RLock()
	defer z.mu.RUnlock()
	z.sendToClientLocked(playerID, eventType, payload)
}

func (z *Zone) sendToClientLocked(playerID string, eventType string, payload interface{}) {
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
	z.mu.RLock()
	defer z.mu.RUnlock()
	z.broadcastToOthersLocked(senderID, eventType, payload)
}

func (z *Zone) broadcastToOthersLocked(senderID string, eventType string, payload interface{}) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    eventType,
		"payload": payload,
	})
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

func (z *Zone) broadcastPlayerLeftLocked(playerID string) {
	z.broadcastToOthersLocked(playerID, "player_left", playerID)
}
