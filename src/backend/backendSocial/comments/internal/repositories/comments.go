package repositories

import (
	"service/comments/internal/model"
)

type CommentRepository struct {
}

func NewCommentRepository() *CommentRepository {
	return &CommentRepository{}
}

func (repo *CommentRepository) CreateComment(collection interface{}, user model.User) {
	// Implementation for creating a comment in the MongoDB collection
}
