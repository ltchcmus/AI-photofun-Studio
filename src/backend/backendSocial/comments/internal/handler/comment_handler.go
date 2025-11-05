package handler

import (
	"net/http"
	"service/comments/internal/model"
	"service/comments/internal/services"

	"github.com/gin-gonic/gin"
)

type CommentHandler struct {
	commentService *services.CommentService
}

func NewCommentHandler(commentService *services.CommentService) *CommentHandler {
	return &CommentHandler{
		commentService: commentService,
	}
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	var req model.CommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	comment, err := h.commentService.CreateComment(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create comment",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Comment created successfully",
		"data":    comment,
	})
}

func (h *CommentHandler) GetCommentsByPostID(c *gin.Context) {
	postID := c.Param("postId")

	comments, err := h.commentService.GetCommentsByPostID(postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get comments",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    1000,
		"message": "Comments retrieved successfully",
		"result":  comments,
	})
}

func (h *CommentHandler) GetCommentByID(c *gin.Context) {
	id := c.Param("id")

	comment, err := h.commentService.GetCommentByID(id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "comment not found" || err.Error() == "invalid comment id" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, gin.H{
			"error":   "Failed to get comment",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    1000,
		"message": "Comment retrieved successfully",
		"data":    comment,
	})
}

func (h *CommentHandler) UpdateComment(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	comment, err := h.commentService.UpdateComment(id, req.Content)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "comment not found" || err.Error() == "invalid comment id" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, gin.H{
			"error":   "Failed to update comment",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    1000,
		"message": "Comment updated successfully",
		"data":    comment,
	})
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
	id := c.Param("id")

	err := h.commentService.DeleteComment(id)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "comment not found" || err.Error() == "invalid comment id" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, gin.H{
			"error":   "Failed to delete comment",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    1000,
		"message": "Comment deleted successfully",
	})
}
