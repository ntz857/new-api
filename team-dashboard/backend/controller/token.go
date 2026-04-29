package controller

import (
	"net/http"
	"team-dashboard/model"

	"github.com/gin-gonic/gin"
)

// ListTokens returns all tokens for the leader's members.
func ListTokens(c *gin.Context) {
	leaderID := c.GetInt("user_id")

	members, err := model.GetMembersByLeaderID(leaderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "查询失败"})
		return
	}
	memberIDs := make([]int, 0, len(members))
	for _, m := range members {
		memberIDs = append(memberIDs, m.Id)
	}

	tokens, err := model.GetTokensByUserIDs(memberIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "令牌查询失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": tokens})
}
