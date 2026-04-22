package model

import (
	"time"
)

// Log mirrors the relevant columns from new-api's logs table (read-only).
type Log struct {
	UserId           int   `gorm:"column:user_id"`
	CreatedAt        int64 `gorm:"column:created_at"`
	PromptTokens     int   `gorm:"column:prompt_tokens"`
	CompletionTokens int   `gorm:"column:completion_tokens"`
	Quota            int   `gorm:"column:quota"`
}

func (Log) TableName() string { return "logs" }

// DailyStat represents aggregated token consumption for one user on one day.
type DailyStat struct {
	UserID           int    `json:"user_id"`
	Date             string `json:"date"` // "YYYY-MM-DD"
	PromptTokens     int64  `json:"prompt_tokens"`
	CompletionTokens int64  `json:"completion_tokens"`
	TotalTokens      int64  `json:"total_tokens"`
	Quota            int64  `json:"quota"`
}

// GetDailyStats returns per-user per-day token stats for the given member IDs
// within [start, end] (inclusive). memberIDs must be pre-validated as belonging
// to the requesting leader — this function does NOT re-check ownership.
func GetDailyStats(memberIDs []int, start, end time.Time) ([]DailyStat, error) {
	if len(memberIDs) == 0 {
		return []DailyStat{}, nil
	}

	startTs := start.Unix()
	endTs := end.Add(24*time.Hour - time.Second).Unix() // end of day

	type rawRow struct {
		UserID           int
		DateStr          string
		PromptTokens     int64
		CompletionTokens int64
		Quota            int64
	}

	var rows []rawRow

	var dateExpr string
	switch DBType {
	case "postgres":
		dateExpr = "TO_CHAR(TO_TIMESTAMP(created_at), 'YYYY-MM-DD') as date_str"
	case "mysql":
		dateExpr = "DATE(FROM_UNIXTIME(created_at)) as date_str"
	default: // sqlite
		dateExpr = "DATE(datetime(created_at, 'unixepoch')) as date_str"
	}

	err := DB.Model(&Log{}).
		Select("user_id, "+dateExpr+", "+
			"SUM(prompt_tokens) as prompt_tokens, "+
			"SUM(completion_tokens) as completion_tokens, "+
			"SUM(quota) as quota").
		Where("user_id IN ? AND created_at >= ? AND created_at <= ?", memberIDs, startTs, endTs).
		Group("user_id, date_str").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	stats := make([]DailyStat, 0, len(rows))
	for _, r := range rows {
		stats = append(stats, DailyStat{
			UserID:           r.UserID,
			Date:             r.DateStr,
			PromptTokens:     r.PromptTokens,
			CompletionTokens: r.CompletionTokens,
			TotalTokens:      r.PromptTokens + r.CompletionTokens,
			Quota:            r.Quota,
		})
	}
	return stats, nil
}
