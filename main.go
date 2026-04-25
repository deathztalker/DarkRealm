package main

import (
	"log"
	"os"

	"dark-realm-server/api"
	"dark-realm-server/db"
	"dark-realm-server/game"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// 1. Configuración & DB
	// Nota: En producción usaríamos un paquete config para manejar .env
	if err := db.InitPostgres(); err != nil {
		log.Printf("Warning: Failed to connect to Postgres: %v", err)
	}
	
	// Redis es opcional según la guía si no está configurado
	if os.Getenv("REDIS_URL") != "" {
		if err := db.InitRedis(); err != nil {
			log.Printf("Warning: Failed to connect to Redis: %v", err)
		}
	}

	// 2. Inicializar Fiber
	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New())

	// Hub de juegos
	hub := game.NewHub()

	// 3. Rutas API REST
	api.SetupRoutes(app, hub)

	// 4. Iniciar Servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf(">>> GO MMO SERVER LIVE ON PORT %s <<<", port)
	log.Fatal(app.Listen(":" + port))
}
