package service.communication.service;

import java.util.concurrent.locks.ReentrantLock;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import service.communication.DTOs.response.GetMessageCoupleResponse;
import service.communication.DTOs.response.PageResponse;
import service.communication.entity.Communication;
import service.communication.mapper.CommunicationMapper;
import service.communication.repository.CommunicationRepository;
import service.communication.utils.Utils;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CommunicationService {
  Utils utils;
  CommunicationRepository communicationRepository;
  CommunicationMapper communicationMapper;

  @NonFinal ReentrantLock lock = new ReentrantLock();

  @PreAuthorize("isAuthenticated()")
  public PageResponse<GetMessageCoupleResponse>
  getPageMessage(String receiverId, int page, int size) {

    String userId =
        SecurityContextHolder.getContext().getAuthentication().getName();
    String conversationId = utils.generateMongoId(userId, receiverId);
    Sort sort = Sort.by("timestamp").descending();
    Pageable pageable = PageRequest.of(page - 1, size, sort);

    Page<Communication> pageCommunication =
        communicationRepository.findByConversationId(conversationId, pageable);

    if (pageCommunication.isEmpty()) {
      return PageResponse.<GetMessageCoupleResponse>builder()
          .currentPage(page)
          .totalItems(0)
          .totalPages(0)
          .items(null)
          .build();
    }

    return PageResponse.<GetMessageCoupleResponse>builder()
        .currentPage(page)
        .totalItems(pageCommunication.getTotalElements())
        .totalPages(pageCommunication.getTotalPages())
        .items(pageCommunication.getContent()
                   .stream()
                   .map((communication) -> {
                     GetMessageCoupleResponse response =
                         communicationMapper.toGetMessageCoupleResponse(
                             communication);
                     response.setTimestamp(
                         utils.formatTimestamp(communication.getTimestamp()));
                     return response;
                   })
                   .toList())
        .build();
  }

  @PreAuthorize("hasRole('ADMIN')")
  public void deleteAllCommunications() {
    communicationRepository.deleteAll();
  }

  public void addCommunication(Communication communication) {
    lock.lock();
    try {
      communicationRepository.save(communication);
    } finally {
      lock.unlock();
    }
  }
}
