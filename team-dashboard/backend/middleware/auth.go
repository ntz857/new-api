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
		userIDRaw := session.Get("user_id")
		usernameRaw := session.Get("username")
		if userIDRaw == nil || usernameRaw == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "未登录"})
			c.Abort()
			return
		}
		userID, ok1 := userIDRaw.(int)
		username, ok2 := usernameRaw.(string)
		if !ok1 || !ok2 {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "session 数据异常，请重新登录"})
			c.Abort()
			return
		}
		c.Set("user_id", userID)
		c.Set("username", username)
		c.Next()
	}
}
