package game

import (
	"log"

	"github.com/gofiber/websocket/v2"
)

type Client struct {
	PlayerID string
	Zone     *Zone
	fconn    *websocket.Conn
	send     chan []byte
}

func (c *Client) readPump() {
	defer func() {
		c.Zone.unregister <- c
	}()
	for {
		_, message, err := c.fconn.ReadMessage()
		if err != nil {
			log.Printf("read error: %v", err)
			break
		}
		c.Zone.broadcast <- message
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

func HandleFiberConnection(zone *Zone, conn *websocket.Conn, playerID string) {
	client := &Client{
		PlayerID: playerID, 
		Zone: zone, 
		fconn: conn, 
		send: make(chan []byte, 256),
	}
	client.Zone.register <- client

	// En Fiber websocket, el loop de lectura debe ser el principal
	go client.writePump()
	client.readPump()
}
