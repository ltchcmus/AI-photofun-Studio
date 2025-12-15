package services

import (
	"bytes"
	"fmt"
	"net/http"
	"service/comments/internal/configuration"
	"service/comments/internal/model"
	"service/comments/internal/repositories"
	"service/comments/internal/websocket"
)

type CommentService struct {
	commentRepo *repositories.CommentRepository
}

func NewCommentService(commentRepo *repositories.CommentRepository) *CommentService {
	return &CommentService{
		commentRepo: commentRepo,
	}
}

func (s *CommentService) updatePostCommentCount(postID string, number int) error {
	postServiceURL := configuration.GetPostServiceURL()
	url := fmt.Sprintf("%s/update-comment-count?postId=%s&number=%d", postServiceURL, postID, number)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer([]byte{}))
	if err != nil {
		return fmt.Errorf("failed to update post comment count: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("post service returned status %d", resp.StatusCode)
	}

	return nil
}

func (s *CommentService) CreateComment(req *model.CommentRequest) (*model.CommentResponse, error) {
	comment := &model.Comment{
		PostID:   req.PostID,
		UserID:   req.UserID,
		UserName: req.UserName,
		Content:  req.Content,
	}

	createdComment, err := s.commentRepo.CreateComment(comment)
	if err != nil {
		return nil, err
	}

	// Update post comment count (+1)
	if err := s.updatePostCommentCount(createdComment.PostID, 1); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Warning: Failed to update post comment count: %v\n", err)
	}

	// Broadcast comment via WebSocket
	hub := websocket.GetHub()
	if hub != nil {
		commentData := map[string]interface{}{
			"id":        createdComment.ID.Hex(),
			"postId":    createdComment.PostID,
			"userId":    createdComment.UserID,
			"userName":  createdComment.UserName,
			"content":   createdComment.Content,
			"createdAt": createdComment.CreatedAt,
		}

		hub.BroadcastToRoom(createdComment.PostID, "new_comment", commentData)
	}

	return &model.CommentResponse{
		ID:        createdComment.ID.Hex(),
		PostID:    createdComment.PostID,
		UserID:    createdComment.UserID,
		UserName:  createdComment.UserName,
		Content:   createdComment.Content,
		CreatedAt: createdComment.CreatedAt,
		UpdatedAt: createdComment.UpdatedAt,
	}, nil
}

func (s *CommentService) GetCommentsByPostID(postID string) ([]model.CommentResponse, error) {
	comments, err := s.commentRepo.GetCommentsByPostID(postID)
	if err != nil {
		return nil, err
	}

	var commentResponses []model.CommentResponse
	for _, comment := range comments {
		commentResponses = append(commentResponses, model.CommentResponse{
			ID:        comment.ID.Hex(),
			PostID:    comment.PostID,
			UserID:    comment.UserID,
			UserName:  comment.UserName,
			Content:   comment.Content,
			CreatedAt: comment.CreatedAt,
			UpdatedAt: comment.UpdatedAt,
		})
	}

	return commentResponses, nil
}

func (s *CommentService) GetCommentByID(id string) (*model.CommentResponse, error) {
	comment, err := s.commentRepo.GetCommentByID(id)
	if err != nil {
		return nil, err
	}

	return &model.CommentResponse{
		ID:        comment.ID.Hex(),
		PostID:    comment.PostID,
		UserID:    comment.UserID,
		UserName:  comment.UserName,
		Content:   comment.Content,
		CreatedAt: comment.CreatedAt,
		UpdatedAt: comment.UpdatedAt,
	}, nil
}

func (s *CommentService) UpdateComment(id string, content string) (*model.CommentResponse, error) {
	comment, err := s.commentRepo.UpdateComment(id, content)
	if err != nil {
		return nil, err
	}

	// Broadcast update via WebSocket
	hub := websocket.GetHub()
	if hub != nil {
		updateData := map[string]interface{}{
			"id":        comment.ID.Hex(),
			"content":   comment.Content,
			"updatedAt": comment.UpdatedAt,
		}

		hub.BroadcastToRoom(comment.PostID, "update_comment", updateData)
	}

	return &model.CommentResponse{
		ID:        comment.ID.Hex(),
		PostID:    comment.PostID,
		UserID:    comment.UserID,
		UserName:  comment.UserName,
		Content:   comment.Content,
		CreatedAt: comment.CreatedAt,
		UpdatedAt: comment.UpdatedAt,
	}, nil
}

func (s *CommentService) DeleteComment(id string) error {
	comment, err := s.commentRepo.GetCommentByID(id)
	if err != nil {
		return err
	}

	err = s.commentRepo.DeleteComment(id)
	if err != nil {
		return err
	}

	// Update post comment count (-1)
	if err := s.updatePostCommentCount(comment.PostID, -1); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Warning: Failed to update post comment count: %v\n", err)
	}

	// Broadcast delete via WebSocket
	hub := websocket.GetHub()
	if hub != nil {
		deleteData := map[string]interface{}{
			"id": id,
		}

		hub.BroadcastToRoom(comment.PostID, "delete_comment", deleteData)
	}

	return nil
}
