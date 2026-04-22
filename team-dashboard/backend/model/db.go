package model

import (
	"fmt"
	"log"
	"team-dashboard/config"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB
var DBType string

func InitDB(cfg *config.Config) error {
	var dialector gorm.Dialector
	DBType = cfg.DBType
	switch cfg.DBType {
	case "mysql":
		dialector = mysql.Open(cfg.DBDSN)
	case "postgres":
		dialector = postgres.Open(cfg.DBDSN)
	default:
		dialector = sqlite.Open(cfg.DBDSN)
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	DB = db
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get sql.DB: %w", err)
	}
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}
	if cfg.DBType == "sqlite" || cfg.DBType == "" {
		sqlDB.SetMaxOpenConns(1)
		if err := db.Exec("PRAGMA journal_mode=WAL").Error; err != nil {
			log.Printf("[WARNING] Failed to set WAL mode: %v", err)
		}
	}
	return nil
}
