package model

import (
	"fmt"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

type CommissionLog struct {
	Id                 int     `json:"id" gorm:"primaryKey"`
	UserId             int     `json:"user_id" gorm:"index"`
	InviteeId          int     `json:"invitee_id" gorm:"index"`
	TopUpId            int     `json:"top_up_id"`
	TopUpAmount        float64 `json:"topUp_amount"`
	Ratio              float64 `json:"ratio"`
	Amount             float64 `json:"amount"`
	CreatedAt          int64   `json:"created_at"`
	InviteeDisplayName string  `json:"invitee_display_name" gorm:"-"`
}

// ProcessTopUpCommission validates whether the top-up triggers a commission and updates accordingly.
func ProcessTopUpCommission(topUp *TopUp) error {
	// 1. Get user who topped up
	user, err := GetUserById(topUp.UserId, true)
	if err != nil || user.InviterId == 0 {
		return nil
	}

	// 2. Get inviter
	inviter, err := GetUserById(user.InviterId, true)
	if err != nil || !inviter.IsDistributor || inviter.DistributorRatio <= 0 {
		return nil
	}

	// 3. Calculate cash commission
	commissionAmount := float64(topUp.Amount) * inviter.DistributorRatio

	// 4. Update CashBalance and add CommissionLog
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if err = tx.Model(&User{}).Where("id = ?", inviter.Id).
		UpdateColumn("cash_balance", gorm.Expr("cash_balance + ?", commissionAmount)).Error; err != nil {
		tx.Rollback()
		return err
	}

	var updatedInviter User
	if err = tx.Select("cash_balance").First(&updatedInviter, inviter.Id).Error; err != nil {
		tx.Rollback()
		return err
	}

	log := CommissionLog{
		UserId:      inviter.Id,
		InviteeId:   user.Id,
		TopUpId:     topUp.Id,
		TopUpAmount: float64(topUp.Amount),
		Ratio:       inviter.DistributorRatio,
		Amount:      commissionAmount,
		CreatedAt:   common.GetTimestamp(),
	}

	if err := tx.Create(&log).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := addCashLedgerTx(tx, inviter.Id, commissionAmount, updatedInviter.CashBalance, CashLedgerTypeCommission, log.Id, fmt.Sprintf("邀请用户(ID:%d)充值提成", user.Id)); err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	// 记录系统日志
	RecordLog(inviter.Id, LogTypeSystem, fmt.Sprintf("邀请用户(ID: %d)充值提成收入 $%.2f", user.Id, commissionAmount))

	return nil
}

func GetUserCommissionLogs(userId int, startIdx int, num int) ([]*CommissionLog, int64, error) {
	var logs []*CommissionLog
	var total int64
	if err := DB.Model(&CommissionLog{}).Where("user_id = ?", userId).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := DB.Table("commission_logs").
		Select("commission_logs.*, COALESCE(users.display_name, users.username, '') as invitee_display_name").
		Joins("LEFT JOIN users ON users.id = commission_logs.invitee_id").
		Where("commission_logs.user_id = ?", userId).
		Order("commission_logs.id desc").Limit(num).Offset(startIdx).
		Find(&logs).Error
	return logs, total, err
}

func GetAllCommissionLogs(startIdx int, num int) ([]*CommissionLog, int64, error) {
	var logs []*CommissionLog
	var total int64
	if err := DB.Model(&CommissionLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := DB.Table("commission_logs").
		Select("commission_logs.*, COALESCE(users.display_name, users.username, '') as invitee_display_name").
		Joins("LEFT JOIN users ON users.id = commission_logs.invitee_id").
		Order("commission_logs.id desc").Limit(num).Offset(startIdx).
		Find(&logs).Error
	return logs, total, err
}
