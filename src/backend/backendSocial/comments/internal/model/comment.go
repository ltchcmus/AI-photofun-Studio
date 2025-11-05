package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Comment struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	PostID    string             `json:"postId" bson:"postId"`
	UserID    string             `json:"userId" bson:"userId"`
	UserName  string             `json:"userName" bson:"userName"`
	Content   string             `json:"content" bson:"content"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt" bson:"updatedAt"`
}

type CommentRequest struct {
	PostID   string `json:"postId" binding:"required"`
	UserID   string `json:"userId" binding:"required"`
	UserName string `json:"userName" binding:"required"`
	Content  string `json:"content" binding:"required"`
}

type CommentResponse struct {
	ID        string    `json:"id"`
	PostID    string    `json:"postId"`
	UserID    string    `json:"userId"`
	UserName  string    `json:"userName"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
