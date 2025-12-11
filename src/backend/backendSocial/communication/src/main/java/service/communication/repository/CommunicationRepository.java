package service.communication.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import service.communication.entity.Communication;

@RequestMapping
public interface CommunicationRepository
    extends MongoRepository<Communication, String> {
  Page<Communication> findByConversationId(String conversationId,
                                           Pageable pageable);
}
