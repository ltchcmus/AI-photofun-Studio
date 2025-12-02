package routes

import (
	"net/http"
	"service/comments/internal/handler"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.RouterGroup, commentHandler *handler.CommentHandler) {
	// Health check
	router.HEAD("/check", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// REST API routes
	router.POST("", commentHandler.CreateComment)
	router.GET("/post/:postId", commentHandler.GetCommentsByPostID)
	router.GET("/:id", commentHandler.GetCommentByID)
	router.PUT("/:id", commentHandler.UpdateComment)
	router.DELETE("/:id", commentHandler.DeleteComment)
}
