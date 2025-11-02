package app

import (
	"service/comments/internal/configuration"
	"service/comments/internal/model"
	"service/comments/internal/mongodb"
	"service/comments/internal/repositories"

	"github.com/gin-gonic/gin"
)

type Application struct {
}

func NewApplication() *Application {
	return &Application{}
}

func (app *Application) Run() {
	r := gin.Default()

	// Load configuration
	configuration.LoadConfig()
	// Connect to MongoDB
	mongodb.ConnectMongoDB()

	// Declare variables
	collection := mongodb.GetCollection("comments")

	commentRepo := repositories.NewCommentRepository()

	commentRepo.CreateComment(collection, model.User{ID: "1", Name: "John Doe", Age: 30})
	r.Run(":" + configuration.GetPort())
}
