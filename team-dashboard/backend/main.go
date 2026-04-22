package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"team-dashboard/config"
	"team-dashboard/model"
	"team-dashboard/router"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	if err := model.InitDB(cfg); err != nil {
		log.Fatalf("DB init failed: %v", err)
	}

	r := gin.Default()

	// CORS: allow the frontend origin
	allowedOrigins := strings.Split(cfg.CORSOrigins, ",")
	for i := range allowedOrigins {
		allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: true,
	}))

	// Session store (same mechanism as new-api)
	store := cookie.NewStore([]byte(cfg.SessionSecret))
	store.Options(sessions.Options{
		Path:     "/",
		MaxAge:   2592000, // 30 days
		HttpOnly: true,
		Secure:   cfg.Secure,
		SameSite: http.SameSiteLaxMode,
	})
	r.Use(sessions.Sessions("td_session", store))

	router.SetupRoutes(r)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Team Dashboard backend listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
