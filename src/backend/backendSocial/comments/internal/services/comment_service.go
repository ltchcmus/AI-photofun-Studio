package services

import (
	"service/comments/internal/model"
	"service/comments/internal/repositories"

	socketio "github.com/googollee/go-socket.io"
)

type CommentService struct {
	commentRepo  *repositories.CommentRepository
	socketServer *socketio.Server
}

func NewCommentService(commentRepo *repositories.CommentRepository, socketServer *socketio.Server) *CommentService {
	return &CommentService{
		commentRepo:  commentRepo,
		socketServer: socketServer,
	}
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

	// Broadcast comment to Socket.IO room
	if s.socketServer != nil {
		commentData := map[string]interface{}{
			"id":        createdComment.ID.Hex(),
			"postId":    createdComment.PostID,
			"userId":    createdComment.UserID,
			"userName":  createdComment.UserName,
			"content":   createdComment.Content,
			"createdAt": createdComment.CreatedAt,
		}
		s.socketServer.BroadcastToRoom("/", createdComment.PostID, "new_comment", commentData)
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

	// Broadcast update to Socket.IO room
	if s.socketServer != nil {
		updateData := map[string]interface{}{
			"id":        comment.ID.Hex(),
			"content":   comment.Content,
			"updatedAt": comment.UpdatedAt,
		}
		s.socketServer.BroadcastToRoom("/", comment.PostID, "update_comment", updateData)
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

	// Broadcast delete to Socket.IO room
	if s.socketServer != nil {
		deleteData := map[string]interface{}{
			"id": id,
		}
		s.socketServer.BroadcastToRoom("/", comment.PostID, "delete_comment", deleteData)
	}

	return nil
}
