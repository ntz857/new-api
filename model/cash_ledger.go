package model

import (
	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	CashLedgerTypeCommission     = 1 // 佣金收入
	CashLedgerTypeWithdraw       = 2 // 提现扣款
	CashLedgerTypeWithdrawRefund = 3 // 提现驳回退款
)

type CashLedger struct {
	Id        int     `json:"id" gorm:"primaryKey"`
	UserId    int     `json:"user_id" gorm:"index"`
	Amount    float64 `json:"amount"`  // 正数=收入，负数=支出
	Balance   float64 `json:"balance"` // 变动后余额快照
	Type      int     `json:"type"`
	RefId     int     `json:"ref_id"` // 关联 commission_log.id 或 withdraw_log.id
	Remark    string  `json:"remark"`
	CreatedAt int64   `json:"created_at"`
}

// addCashLedgerTx 在事务内写流水，balance 为变动后的余额快照
func addCashLedgerTx(tx *gorm.DB, userId int, amount float64, balance float64, ledgerType int, refId int, remark string) error {
	entry := CashLedger{
		UserId:    userId,
		Amount:    amount,
		Balance:   balance,
		Type:      ledgerType,
		RefId:     refId,
		Remark:    remark,
		CreatedAt: common.GetTimestamp(),
	}
	return tx.Create(&entry).Error
}

func GetUserCashLedger(userId int, startIdx int, num int) ([]*CashLedger, int64, error) {
	var entries []*CashLedger
	var total int64
	if err := DB.Model(&CashLedger{}).Where("user_id = ?", userId).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := DB.Where("user_id = ?", userId).Order("id desc").Limit(num).Offset(startIdx).Find(&entries).Error
	return entries, total, err
}
