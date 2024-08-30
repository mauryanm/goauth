package models

import (
	"github.com/goravel/framework/database/orm"
)

type User struct {
	orm.Model
	Name                string
	Email               string
	MobileNo            string
	Avatar              string
	Username            string
	InvalidAttemptCount int
	SessionId           string
	// orm.SoftDeletes
}
