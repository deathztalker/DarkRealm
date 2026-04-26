package game

import (
	"log"

	"github.com/gofiber/websocket/v2"
)

type Client struct {
	PlayerID string
	Hub      *Hub
	Zone     *Zone
	fconn    *websocket.Conn
	send     chan []byte
}

func (c *Client) readPump() {
	defer func() {
		if c.Zone != nil {
			c.Zone.unregister <- c
		}
		c.Hub.UnregisterClient(c.PlayerID)
	}()
	for {
		_, message, err := c.fconn.ReadMessage()
		if err != nil {
			log.Printf("read error: %v", err)
			break
		}
		if c.Zone != nil {
			c.Zone.broadcast <- message
		}
	}
}

func (c *Client) writePump() {
	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.fconn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.fconn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		}
	}
}

func HandleFiberConnection(hub *Hub, zone *Zone, conn *websocket.Conn, playerID string) {
	client := &Client{
		PlayerID: playerID, 
		Hub:      hub,
		Zone:     zone,
		fconn:    conn, 
		send:     make(chan []byte, 256),
	}
	hub.RegisterClient(client)
	
	if zone != nil {
		zone.register <- client
	}

	go client.writePump()
	client.readPump()
}
