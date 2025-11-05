package routes

import (
	"service/comments/internal/handler"

	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
)

func SetupRoutes(router *gin.RouterGroup, commentHandler *handler.CommentHandler, socketServer *socketio.Server) {
	// REST API routes
	router.POST("", commentHandler.CreateComment)
	router.GET("/post/:postId", commentHandler.GetCommentsByPostID)
	router.GET("/:id", commentHandler.GetCommentByID)
	router.PUT("/:id", commentHandler.UpdateComment)
	router.DELETE("/:id", commentHandler.DeleteComment)

	// Socket.IO endpoint
	router.GET("/socket.io/*any", gin.WrapH(socketServer))
	router.POST("/socket.io/*any", gin.WrapH(socketServer))
}
