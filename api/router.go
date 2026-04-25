package api

import (
	"dark-realm-server/game"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func SetupRoutes(app *fiber.App, hub *game.Hub) {
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// Middleware de Upgrade para WebSockets nativo de Fiber
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// Handler de WebSocket nativo de Fiber
	app.Get("/ws/:playerID/:zoneID", websocket.New(func(c *websocket.Conn) {
		playerID := c.Params("playerID")
		zoneID := c.Params("zoneID")
		zoneType := c.Query("type", "dungeon")

		zone := hub.GetOrCreateZone(zoneID, zoneType)

		// Llamamos a un handler adaptado a Fiber
		game.HandleFiberConnection(zone, c, playerID)
	}))
}
