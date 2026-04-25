package api

import (
	"dark-realm-server/game"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func SetupRoutes(app *fiber.App, hub *game.Hub) {
	// Health Check
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// WebSocket Upgrade Middleware
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// WebSocket Endpoint
	app.Get("/ws/:playerID/:zoneID", websocket.New(func(c *websocket.Conn) {
		playerID := c.Params("playerID")
		zoneID := c.Params("zoneID")
		zoneType := c.Query("type", "dungeon")

		zone := hub.GetOrCreateZone(zoneID, zoneType)

		game.HandleConnection(zone, c, playerID)
	}))
}
