package service.communication.service;

import java.util.List;
import java.util.concurrent.locks.ReentrantLock;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import service.communication.DTOs.request.GetUserSummaryRequest;
import service.communication.DTOs.response.UserSummaryResponse;
import service.communication.entity.Conversation;
import service.communication.exception.AppException;
import service.communication.exception.ErrorCode;
import service.communication.repository.ConversationRepository;
import service.communication.repository.http.IdentityClient;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ConversationService {
  ConversationRepository conversationRepository;
  private ReentrantLock lock = new ReentrantLock();
  IdentityClient identityClient;

  @PreAuthorize("isAuthenticated()")
  public void addConversation(String receiverId) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    lock.lock();
    try {
      String userIdA = userId.compareTo(receiverId) < 0 ? userId : receiverId;
      String userIdB = userId.compareTo(receiverId) < 0 ? receiverId : userId;

      // Check if conversation already exists
      if (conversationRepository.findByUserIds(userIdA, userIdB).isPresent()) {
        log.info("Conversation already exists between {} and {}", userId,
                 receiverId);
        return; // Already exists, no need to add
      }

      conversationRepository.save(
          Conversation.builder().userIdA(userIdA).userIdB(userIdB).build());
    } catch (Exception e) {
      log.error("Error adding conversation between {} and {}: {}", userId,
                receiverId, e.getMessage());
      throw new AppException(ErrorCode.DONT_ADD_CONVERSATION);
    } catch (Throwable t) {
      log.error("Unexpected error adding conversation between {} and {}: {}",
                userId, receiverId, t.getMessage());
      throw new AppException(ErrorCode.DONT_ADD_CONVERSATION);
    } finally {
      lock.unlock();
    }
  }

  // Internal method for auto-creating conversation (no auth required)
  public void autoAddConversation(String userId, String receiverId) {
    lock.lock();
    try {
      String userIdA = userId.compareTo(receiverId) < 0 ? userId : receiverId;
      String userIdB = userId.compareTo(receiverId) < 0 ? receiverId : userId;

      // Check if conversation already exists
      if (conversationRepository.findByUserIds(userIdA, userIdB).isPresent()) {
        log.debug("Conversation already exists between {} and {}", userId,
                  receiverId);
        return; // Already exists, no need to add
      }

      conversationRepository.save(
          Conversation.builder().userIdA(userIdA).userIdB(userIdB).build());
      log.info("Auto-created conversation between {} and {}", userId,
               receiverId);
    } catch (Exception e) {
      log.error("Error auto-adding conversation between {} and {}: {}", userId,
                receiverId, e.getMessage());
      // Don't throw exception, just log the error
    } finally {
      lock.unlock();
    }
  }

  @PreAuthorize("isAuthenticated()")
  public void deleteConversation(String receiverId) {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    lock.lock();
    try {
      conversationRepository.deleteByUserIds(userId, receiverId);
    } catch (Exception e) {
      log.error("Error deleting conversation between {} and {}: {}", userId,
                receiverId, e.getMessage());
      throw new AppException(ErrorCode.DONT_DELETE_CONVERSATION);
    } catch (Throwable t) {
      log.error("Unexpected error deleting conversation between {} and {}: {}",
                userId, receiverId, t.getMessage());
      throw new AppException(ErrorCode.DONT_DELETE_CONVERSATION);
    } finally {
      lock.unlock();
    }
  }

  @PreAuthorize("isAuthenticated()")
  public List<UserSummaryResponse> getUserConversations() {
    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    try {
      List<Conversation> conversations =
          conversationRepository.findByUserId(userId);

      // If no conversations, return empty list
      if (conversations.isEmpty()) {
        log.info("No conversations found for user {}", userId);
        return List.of();
      }

      List<String> userIds =
          conversations.stream()
              .map(conversation -> {
                if (conversation.getUserIdA().equals(userId)) {
                  return conversation.getUserIdB();
                } else {
                  return conversation.getUserIdA();
                }
              })
              .toList();

      log.info("Fetching summaries for {} users in conversations",
               userIds.size());

      try {
        var response = identityClient.getUserStatistics(
            GetUserSummaryRequest.builder().userIds(userIds).build());

        log.info("Identity service response code: {}", response.getCode());

        if (response.getCode() != 1000) {
          log.error("Identity service returned error code {} when retrieving "
                        + "user summaries for conversations of user {}",
                    response.getCode(), userId);
          throw new AppException(ErrorCode.DONT_RETRIEVE_CONVERSATIONS);
        } else {
          return response.getResult();
        }

      } catch (AppException ae) {
        throw ae;
      } catch (Exception e) {
        log.error(
            "Error calling identity service for user summaries: {}, Stack: {}",
            e.getMessage(), e.getClass().getName());
        e.printStackTrace();
        throw new AppException(ErrorCode.DONT_RETRIEVE_CONVERSATIONS);
      }

    } catch (AppException ae) {
      throw ae;
    } catch (Exception e) {
      log.error("Error retrieving conversations for user {}: {}", userId,
                e.getMessage());
      throw new AppException(ErrorCode.DONT_RETRIEVE_CONVERSATIONS);
    } catch (Throwable t) {
      log.error("Unexpected error retrieving conversations for user {}: {}",
                userId, t.getMessage());
      throw new AppException(ErrorCode.DONT_RETRIEVE_CONVERSATIONS);
    }
  }
}
