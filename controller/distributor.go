package controller

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

func GetCommissionLogs(c *gin.Context) {
	userId := c.GetInt("id")
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	logs, total, err := model.GetUserCommissionLogs(userId, p*common.ItemsPerPage, common.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": gin.H{"items": logs, "total": total}})
}

func GetWithdrawLogs(c *gin.Context) {
	userId := c.GetInt("id")
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	logs, total, err := model.GetUserWithdrawLogs(userId, p*common.ItemsPerPage, common.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": gin.H{"items": logs, "total": total}})
}

func GetCashLedger(c *gin.Context) {
	userId := c.GetInt("id")
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	entries, total, err := model.GetUserCashLedger(userId, p*common.ItemsPerPage, common.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": gin.H{"items": entries, "total": total}})
}

type WithdrawRequest struct {
	Amount      float64 `json:"amount"`
	AccountInfo string  `json:"account_info"`
}

func ApplyWithdraw(c *gin.Context) {
	userId := c.GetInt("id")
	var req WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}
	if req.Amount <= 0 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "提现金额必须大于0"})
		return
	}
	if req.AccountInfo == "" {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请提供收款账户信息"})
		return
	}
	if err := model.CreateWithdrawLog(userId, req.Amount, req.AccountInfo); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": fmt.Sprintf("提交提现申请失败: %s", err.Error())})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "提现申请提交成功，请等待管理员审核"})
}

// Admin APIs

func GetAllWithdrawLogs(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	logs, total, err := model.GetAllWithdrawLogs(p*common.ItemsPerPage, common.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": gin.H{"items": logs, "total": total}})
}

type AuditWithdrawRequest struct {
	Id     int    `json:"id"`
	Status int    `json:"status"` // 1: 已打款, 2: 驳回
	Remark string `json:"remark"`
}

func AdminAuditWithdraw(c *gin.Context) {
	adminId := c.GetInt("id")
	var req AuditWithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}
	if req.Status != 1 && req.Status != 2 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "非法的审核状态"})
		return
	}
	if err := model.AuditWithdrawLog(req.Id, adminId, req.Status, req.Remark); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": fmt.Sprintf("审核失败: %s", err.Error())})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "审核成功"})
}

func GetAllCommissionLogs(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	logs, total, err := model.GetAllCommissionLogs(p*common.ItemsPerPage, common.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": gin.H{"items": logs, "total": total}})
}

func GetDistributors(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	users, total, err := model.GetDistributors(p*common.ItemsPerPage, common.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": gin.H{"items": users, "total": total}})
}

type SetDistributorRequest struct {
	UserId        int     `json:"user_id"`
	IsDistributor bool    `json:"is_distributor"`
	Ratio         float64 `json:"ratio"`
}

func AdminSetDistributor(c *gin.Context) {
	var req SetDistributorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}
	if req.IsDistributor && (req.Ratio <= 0 || req.Ratio > 1) {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "分佣比例必须在 0~1 之间"})
		return
	}
	if err := model.SetDistributor(req.UserId, req.IsDistributor, req.Ratio); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "设置成功"})
}

// 用户申请成为分销员
type ApplyDistributorRequest struct {
	Reason string `json:"reason"`
}

func ApplyDistributor(c *gin.Context) {
	userId := c.GetInt("id")
	var req ApplyDistributorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}
	if err := model.CreateDistributorApplication(userId, req.Reason); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "申请已提交，请等待管理员审核"})
}

// 管理员获取申请列表
func GetDistributorApplications(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	apps, total, err := model.GetAllDistributorApplications(p*common.ItemsPerPage, common.ItemsPerPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": gin.H{"items": apps, "total": total}})
}

// 管理员审核申请
type AuditApplicationRequest struct {
	Id     int     `json:"id"`
	Status int     `json:"status"` // 1:通过 2:拒绝
	Remark string  `json:"remark"`
	Ratio  float64 `json:"ratio"` // 通过时设置分佣比例
}

func AdminAuditDistributorApplication(c *gin.Context) {
	adminId := c.GetInt("id")
	var req AuditApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}
	if req.Status != 1 && req.Status != 2 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "非法状态"})
		return
	}
	if req.Status == 1 && (req.Ratio <= 0 || req.Ratio > 1) {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请设置有效的分佣比例（0~1）"})
		return
	}
	if err := model.AuditDistributorApplication(req.Id, adminId, req.Status, req.Remark, req.Ratio); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "审核完成"})
}
