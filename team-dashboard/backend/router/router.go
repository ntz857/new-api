package router

import (
	"team-dashboard/controller"
	"team-dashboard/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", controller.Login)
			auth.POST("/logout", controller.Logout)
		}

		team := api.Group("/team")
		team.Use(middleware.RequireLogin())
		{
			team.GET("/members", controller.Members)
			team.GET("/stats", controller.Stats)
		}
	}
}
