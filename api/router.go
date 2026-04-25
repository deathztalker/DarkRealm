package api

import (
	"net/http"

	"dark-realm-server/game"
	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp/fasthttpadaptor"
)

func SetupRoutes(app *fiber.App, hub *game.Hub) {
	// Health Check
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// WebSocket Endpoint usando Gorilla vía adaptador
	app.Get("/ws/:playerID/:zoneID", func(c *fiber.Ctx) error {
		playerID := c.Params("playerID")
		zoneID := c.Params("zoneID")
		zoneType := c.Query("type", "dungeon")

		zone := hub.GetOrCreateZone(zoneID, zoneType)

		// Adaptamos el handler de net/http para fasthttp (Fiber)
		fasthttpadaptor.NewFastHTTPHandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			game.ServeWs(zone, w, r, playerID)
		})(c.Context())

		return nil
	})
}
