package app

import (
	"fmt"
	"log"
	"service/comments/internal/configuration"
	"service/comments/internal/handler"
	"service/comments/internal/mongodb"
	"service/comments/internal/repositories"
	"service/comments/internal/routes"
	"service/comments/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Application struct {
}

func NewApplication() *Application {
	return &Application{}
}

func (app *Application) Run() {
	// Load configuration
	configuration.LoadConfig()

	// Connect to MongoDB
	mongodb.ConnectMongoDB()

	// Initialize Gin router
	r := gin.Default()

	// Setup CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Setup Socket.IO
	socketServer := handler.SetupSocketIO()
	defer socketServer.Close()

	// Initialize layers
	collection := mongodb.GetCollection("comments")
	commentRepo := repositories.NewCommentRepository(collection)
	commentService := services.NewCommentService(commentRepo, socketServer)
	commentHandler := handler.NewCommentHandler(commentService)

	// Setup routes with context path
	api := r.Group("/comments")
	routes.SetupRoutes(api, commentHandler, socketServer)

	// Start server
	port := configuration.GetPort()
	addr := fmt.Sprintf(":%s", port)
	log.Fatal(r.Run(addr))
}
