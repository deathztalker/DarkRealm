package db

import (
	"context"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func InitPostgres() error {
	ctx := context.Background()
	connStr := os.Getenv("SUPABASE_DB_URL")
	
	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return err
	}

	config.MaxConns = 20
	config.MinConns = 5
	config.MaxConnLifetime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return err
	}

	Pool = pool
	return nil
}
