package game

import (
	"log"

	"github.com/gofiber/websocket/v2"
)

type Client struct {
	PlayerID string
	Zone     *Zone
	conn     *websocket.Conn
	send     chan []byte
}

func (c *Client) readPump() {
	defer func() {
		c.Zone.unregister <- c
		c.conn.Close()
	}()
	
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("read error: %v", err)
			break
		}
		c.Zone.broadcast <- message
	}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		}
	}
}

func HandleConnection(zone *Zone, conn *websocket.Conn, playerID string) {
	client := &Client{
		PlayerID: playerID,
		Zone:     zone,
		conn:     conn,
		send:     make(chan []byte, 256),
	}
	client.Zone.register <- client

	// En Fiber websocket, podemos manejar el loop aquí o usar goroutines
	// Pero el handler de websocket.New se cierra cuando la función retorna.
	// Así que debemos esperar aquí.
	
	go client.writePump()
	client.readPump()
}
