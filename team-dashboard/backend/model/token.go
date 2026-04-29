package model

type Token struct {
	Id             int    `gorm:"column:id;primaryKey"   json:"id"`
	UserId         int    `gorm:"column:user_id"         json:"user_id"`
	Key            string `gorm:"column:key"             json:"key"`
	Status         int    `gorm:"column:status"          json:"status"`
	Name           string `gorm:"column:name"            json:"name"`
	CreatedTime    int64  `gorm:"column:created_time"    json:"created_time"`
	AccessedTime   int64  `gorm:"column:accessed_time"   json:"accessed_time"`
	ExpiredTime    int64  `gorm:"column:expired_time"    json:"expired_time"`
	RemainQuota    int64  `gorm:"column:remain_quota"    json:"remain_quota"`
	UnlimitedQuota bool   `gorm:"column:unlimited_quota" json:"unlimited_quota"`
	UsedQuota      int64  `gorm:"column:used_quota"      json:"used_quota"`
}

func (Token) TableName() string { return "tokens" }

// GetTokensByUserIDs returns all active tokens for the given user IDs.
func GetTokensByUserIDs(userIDs []int) ([]Token, error) {
	if len(userIDs) == 0 {
		return []Token{}, nil
	}
	var tokens []Token
	err := DB.Where("user_id IN ? AND deleted_at IS NULL", userIDs).
		Order("user_id, id").
		Find(&tokens).Error
	return tokens, err
}
