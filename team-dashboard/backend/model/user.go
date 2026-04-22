package model

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserDisabled       = errors.New("user is disabled")
)

// User mirrors the relevant columns from new-api's users table.
// We never write to this table — GORM is used read-only.
type User struct {
	Id          int    `gorm:"column:id"`
	Username    string `gorm:"column:username"`
	Password    string `gorm:"column:password"`
	DisplayName string `gorm:"column:display_name"`
	Role        int    `gorm:"column:role"`
	Status      int    `gorm:"column:status"`
	InviterId   int    `gorm:"column:inviter_id"`
}

func (User) TableName() string { return "users" }

// ValidateLogin checks username+password against the users table.
// Returns the user (without password) on success.
func ValidateLogin(username, password string) (*User, error) {
	var user User
	err := DB.Where("username = ? OR email = ?", username, username).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	if user.Status != 1 { // 1 = enabled
		return nil, ErrUserDisabled
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	user.Password = "" // never return hashed password
	return &user, nil
}

// GetMembersByLeaderID returns all users whose inviter_id equals leaderID.
func GetMembersByLeaderID(leaderID int) ([]User, error) {
	var members []User
	err := DB.Select("id, username, display_name, role, status, inviter_id").
		Where("inviter_id = ? AND deleted_at IS NULL", leaderID).
		Find(&members).Error
	return members, err
}
