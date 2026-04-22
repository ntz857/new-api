package controller

import (
	"errors"
	"net/http"
	"team-dashboard/model"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}

	user, err := model.ValidateLogin(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, model.ErrInvalidCredentials) || errors.Is(err, model.ErrUserDisabled) {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "用户名或密码错误"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "服务器错误"})
		return
	}

	session := sessions.Default(c)
	session.Set("user_id", user.Id)
	session.Set("username", user.Username)
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "session 保存失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "ok",
		"data": gin.H{
			"id":           user.Id,
			"username":     user.Username,
			"display_name": user.DisplayName,
		},
	})
}

func Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	_ = session.Save()
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "已退出登录"})
}
