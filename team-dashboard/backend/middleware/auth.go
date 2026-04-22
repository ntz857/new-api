package middleware

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// RequireLogin rejects requests that have no valid session.
// On success it sets "user_id" and "username" in the Gin context.
func RequireLogin() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		userID := session.Get("user_id")
		username := session.Get("username")
		if userID == nil || username == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "未登录"})
			c.Abort()
			return
		}
		c.Set("user_id", userID.(int))
		c.Set("username", username.(string))
		c.Next()
	}
}
