package controllers

import (
	"fmt"
	"goravel/app/models"

	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/facades"
)

type AuthController struct {
	//Dependent services
}

func NewAuthController() *AuthController {
	return &AuthController{
		//Inject services
	}
}

func (r *AuthController) Index(ctx http.Context) http.Response {
	return ctx.Response().View().Make("auth/login.html")
}

func (r *AuthController) Login(ctx http.Context) http.Response {
	validator, err := ctx.Request().Validate(map[string]string{
		"username": "required|string|exists:users,username",
		"password": "required",
	})

	if err != nil {
		return ctx.Response().Success().Json(http.Json{
			"message": "Error",
			"data":    err.Error(),
			"type":    "error",
			"code":    1,
			"status":  false,
		})
	}

	if validator.Fails() {
		return ctx.Response().Success().Json(http.Json{
			"message": "Validation fails",
			"data":    validator.Errors().All(),
			"type":    "error",
			"code":    1,
			"status":  false,
		})
	} else {
		username := ctx.Request().Input("username")
		password := ctx.Request().Input("password")
		fmt.Println(username, password)
		var user models.User
		facades.Orm().Query().Find(&user, "username", username)
		facades.Log().Info(user)
		token, err := facades.Auth(ctx).Login(&user)
		return ctx.Response().Success().Json(http.Json{
			"message": token,
			"data":    err,
			"status":  false,
			"code":    0,
			"type":    user,
		})
	}
}
