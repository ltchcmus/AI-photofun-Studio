package repositories

import (
	"context"
	"errors"
	"service/comments/internal/model"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CommentRepository struct {
	collection *mongo.Collection
	ctx        context.Context
}

func NewCommentRepository(collection *mongo.Collection) *CommentRepository {
	return &CommentRepository{
		collection: collection,
		ctx:        context.Background(),
	}
}

func (repo *CommentRepository) CreateComment(comment *model.Comment) (*model.Comment, error) {
	comment.ID = primitive.NewObjectID()
	comment.CreatedAt = time.Now()
	comment.UpdatedAt = time.Now()

	_, err := repo.collection.InsertOne(repo.ctx, comment)
	if err != nil {
		return nil, err
	}

	return comment, nil
}

func (repo *CommentRepository) GetCommentsByPostID(postID string) ([]model.Comment, error) {
	filter := bson.M{"postId": postID}
	cursor, err := repo.collection.Find(repo.ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(repo.ctx)

	var comments []model.Comment
	if err = cursor.All(repo.ctx, &comments); err != nil {
		return nil, err
	}

	return comments, nil
}

func (repo *CommentRepository) GetCommentByID(id string) (*model.Comment, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid comment id")
	}

	filter := bson.M{"_id": objectID}
	var comment model.Comment
	err = repo.collection.FindOne(repo.ctx, filter).Decode(&comment)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("comment not found")
		}
		return nil, err
	}

	return &comment, nil
}

func (repo *CommentRepository) UpdateComment(id string, content string) (*model.Comment, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid comment id")
	}

	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"content":   content,
			"updatedAt": time.Now(),
		},
	}

	var comment model.Comment
	err = repo.collection.FindOneAndUpdate(repo.ctx, filter, update).Decode(&comment)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("comment not found")
		}
		return nil, err
	}

	// Get updated comment
	return repo.GetCommentByID(id)
}

func (repo *CommentRepository) DeleteComment(id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid comment id")
	}

	filter := bson.M{"_id": objectID}
	result, err := repo.collection.DeleteOne(repo.ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("comment not found")
	}

	return nil
}
