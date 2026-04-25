package db

import (
	"context"
	"os"

	"github.com/redis/go-redis/v9"
)

var RDB *redis.Client

func InitRedis() error {
	opt, err := redis.ParseURL(os.Getenv("REDIS_URL"))
	if err != nil {
		return err
	}

	RDB = redis.NewClient(opt)
	return RDB.Ping(context.Background()).Err()
}
