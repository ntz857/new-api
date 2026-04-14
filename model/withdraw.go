package model

import (
	"errors"
	"fmt"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"gorm.io/gorm"
)

type WithdrawLog struct {
	Id          int     `json:"id" gorm:"primaryKey"`
	UserId      int     `json:"user_id" gorm:"index"`
	Amount      float64 `json:"amount"`
	AccountInfo string  `json:"account_info"`
	Status      int     `json:"status" gorm:"default:0"` // 0: 待审核, 1: 已打款, 2: 已驳回
	Remark      string  `json:"remark"`
	AuditBy     int     `json:"audit_by"`  // 审核管理员 ID
	AuditAt     int64   `json:"audit_at"`  // 审核时间
	CreatedAt   int64   `json:"created_at"`
	UpdatedAt   int64   `json:"updated_at"`
}

func CreateWithdrawLog(userId int, amount float64, accountInfo string) error {
	if amount <= 0 {
		return errors.New("提现金额必须大于0")
	}
	if minWithdraw := float64(operation_setting.MinWithdraw); amount < minWithdraw {
		return fmt.Errorf("提现金额不能低于 %.0f", minWithdraw)
	}

	// 校验余额是否充足（不扣款，仅校验）
	var user User
	if err := DB.Select("cash_balance").First(&user, userId).Error; err != nil {
		return err
	}
	if user.CashBalance < amount {
		return errors.New("可提现余额不足")
	}

	log := WithdrawLog{
		UserId:      userId,
		Amount:      amount,
		AccountInfo: accountInfo,
		Status:      0,
		CreatedAt:   common.GetTimestamp(),
		UpdatedAt:   common.GetTimestamp(),
	}
	return DB.Create(&log).Error
}

func AuditWithdrawLog(id int, adminId int, status int, remark string) error {
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var log WithdrawLog
	if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&log, id).Error; err != nil {
		tx.Rollback()
		return err
	}
	if log.Status != 0 {
		tx.Rollback()
		return errors.New("该申请已经处理过了")
	}

	now := common.GetTimestamp()
	log.Status = status
	log.Remark = remark
	log.AuditBy = adminId
	log.AuditAt = now
	log.UpdatedAt = now

	if err := tx.Save(&log).Error; err != nil {
		tx.Rollback()
		return err
	}

	if status == 1 {
		// 审核通过：扣余额并写流水
		var newBalance float64
		if err := tx.Model(&User{}).Where("id = ?", log.UserId).
			UpdateColumn("cash_balance", gorm.Expr("cash_balance - ?", log.Amount)).Error; err != nil {
			tx.Rollback()
			return err
		}
		// 查询变动后余额快照
		var updatedUser User
		if err := tx.Select("cash_balance").First(&updatedUser, log.UserId).Error; err != nil {
			tx.Rollback()
			return err
		}
		newBalance = updatedUser.CashBalance
		if err := addCashLedgerTx(tx, log.UserId, -log.Amount, newBalance, CashLedgerTypeWithdraw, log.Id, remark); err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func GetUserWithdrawLogs(userId int, startIdx int, num int) ([]*WithdrawLog, int64, error) {
	var logs []*WithdrawLog
	var total int64
	if err := DB.Model(&WithdrawLog{}).Where("user_id = ?", userId).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := DB.Where("user_id = ?", userId).Order("id desc").Limit(num).Offset(startIdx).Find(&logs).Error
	return logs, total, err
}

func GetAllWithdrawLogs(startIdx int, num int) ([]*WithdrawLog, int64, error) {
	var logs []*WithdrawLog
	var total int64
	if err := DB.Model(&WithdrawLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := DB.Order("id desc").Limit(num).Offset(startIdx).Find(&logs).Error
	return logs, total, err
}
