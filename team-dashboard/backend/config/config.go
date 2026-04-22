package config

import (
	"log"
	"os"
)

type Config struct {
	DBType        string // "mysql", "postgres", "sqlite"
	DBDSN         string
	SessionSecret string
	Port          string
}

func Load() *Config {
	cfg := &Config{
		DBType:        getEnv("DB_TYPE", "sqlite"),
		DBDSN:         getEnv("DB_DSN", "new-api.db"),
		SessionSecret: getEnv("SESSION_SECRET", "changeme-set-in-production"),
		Port:          getEnv("PORT", "8080"),
	}
	if cfg.SessionSecret == "changeme-set-in-production" {
		log.Println("[WARNING] SESSION_SECRET is set to the default value. Set SESSION_SECRET env var before running in production.")
	}
	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
