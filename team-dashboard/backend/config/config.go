package config

import "os"

type Config struct {
	DBType        string // "mysql", "postgres", "sqlite"
	DBDSN         string
	SessionSecret string
	Port          string
}

func Load() *Config {
	return &Config{
		DBType:        getEnv("DB_TYPE", "sqlite"),
		DBDSN:         getEnv("DB_DSN", "new-api.db"),
		SessionSecret: getEnv("SESSION_SECRET", "changeme-set-in-production"),
		Port:          getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
