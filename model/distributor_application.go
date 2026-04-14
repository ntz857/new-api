package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"
)

const (
	DistributorApplicationPending  = 0
	DistributorApplicationApproved = 1
	DistributorApplicationRejected = 2
)

type DistributorApplication struct {
	Id        int    `json:"id" gorm:"primaryKey"`
	UserId    int    `json:"user_id" gorm:"index"`
	Reason    string `json:"reason"`
	Status    int    `json:"status" gorm:"default:0"` // 0:待审核 1:通过 2:拒绝
	Remark    string `json:"remark"`   // 管理员备注
	AuditBy   int    `json:"audit_by"` // 审核人ID
	AuditAt   int64  `json:"audit_at"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

func CreateDistributorApplication(userId int, reason string) error {
	// 检查是否已有待审核申请
	var count int64
	if err := DB.Model(&DistributorApplication{}).
		Where("user_id = ? AND status = ?", userId, DistributorApplicationPending).
		Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("您已有待审核的申请，请耐心等待")
	}
	// 检查是否已是分销员
	var user User
	if err := DB.Select("is_distributor").First(&user, userId).Error; err != nil {
		return err
	}
	if user.IsDistributor {
		return errors.New("您已是分销员")
	}
	now := common.GetTimestamp()
	app := DistributorApplication{
		UserId:    userId,
		Reason:    reason,
		Status:    DistributorApplicationPending,
		CreatedAt: now,
		UpdatedAt: now,
	}
	return DB.Create(&app).Error
}

func AuditDistributorApplication(id int, adminId int, status int, remark string, ratio float64) error {
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var app DistributorApplication
	if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&app, id).Error; err != nil {
		tx.Rollback()
		return err
	}
	if app.Status != DistributorApplicationPending {
		tx.Rollback()
		return errors.New("该申请已处理")
	}

	now := common.GetTimestamp()
	app.Status = status
	app.Remark = remark
	app.AuditBy = adminId
	app.AuditAt = now
	app.UpdatedAt = now
	if err := tx.Save(&app).Error; err != nil {
		tx.Rollback()
		return err
	}

	if status == DistributorApplicationApproved {
		if err := tx.Model(&User{}).Where("id = ?", app.UserId).Updates(map[string]interface{}{
			"is_distributor":    true,
			"distributor_ratio": ratio,
		}).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func GetAllDistributorApplications(startIdx int, num int) ([]*DistributorApplication, int64, error) {
	var apps []*DistributorApplication
	var total int64
	if err := DB.Model(&DistributorApplication{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := DB.Order("status asc, id desc").Limit(num).Offset(startIdx).Find(&apps).Error
	return apps, total, err
}
