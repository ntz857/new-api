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

	// Serve frontend static files
	r.Static("/assets", cfg.StaticDir+"/assets")
	r.StaticFile("/favicon.ico", cfg.StaticDir+"/favicon.ico")
	r.NoRoute(func(c *gin.Context) {
		// Let /api 404s fall through as JSON, not HTML
		if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
			c.JSON(404, gin.H{"message": "not found"})
			return
		}
		c.File(cfg.StaticDir + "/index.html")
	})

	router.SetupRoutes(r)

	addr := fmt.Sprintf("0.0.0.0:%s", cfg.Port)
	log.Printf("Team Dashboard backend listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
