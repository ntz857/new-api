package controller

import (
	"net/http"
	"team-dashboard/model"
	"time"

	"github.com/gin-gonic/gin"
)

func Members(c *gin.Context) {
	leaderID := c.GetInt("user_id")

	members, err := model.GetMembersByLeaderID(leaderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "查询失败"})
		return
	}

	type memberDTO struct {
		ID          int    `json:"id"`
		Username    string `json:"username"`
		DisplayName string `json:"display_name"`
	}
	dtos := make([]memberDTO, 0, len(members))
	for _, m := range members {
		dtos = append(dtos, memberDTO{
			ID:          m.Id,
			Username:    m.Username,
			DisplayName: m.DisplayName,
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": dtos})
}

func Stats(c *gin.Context) {
	leaderID := c.GetInt("user_id")

	startStr := c.DefaultQuery("start", time.Now().AddDate(0, 0, -6).Format("2006-01-02"))
	endStr := c.DefaultQuery("end", time.Now().Format("2006-01-02"))

	const layout = "2006-01-02"
	start, err := time.Parse(layout, startStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "start 日期格式错误，应为 YYYY-MM-DD"})
		return
	}
	end, err := time.Parse(layout, endStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "end 日期格式错误，应为 YYYY-MM-DD"})
		return
	}
	if end.Before(start) {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "end 不能早于 start"})
		return
	}

	// Fetch members first to build the allowed ID set (prevents cross-leader data leakage)
	members, err := model.GetMembersByLeaderID(leaderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "查询失败"})
		return
	}
	memberIDs := make([]int, 0, len(members))
	for _, m := range members {
		memberIDs = append(memberIDs, m.Id)
	}

	stats, err := model.GetDailyStats(memberIDs, start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "统计查询失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
}
